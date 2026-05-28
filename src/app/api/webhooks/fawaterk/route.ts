import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import crypto from 'crypto';

function verifyFawaterkSignature(rawBody: string, signature: string | undefined, secret: string) {
    if (!signature || !secret) return false;
    const expectedHex = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
    const expectedBase64 = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('base64');
    const expected = [expectedHex, expectedBase64];

    return expected.some((candidate) => {
        const candidateBuffer = Buffer.from(candidate);
        const signatureBuffer = Buffer.from(signature);
        return candidateBuffer.length === signatureBuffer.length &&
            crypto.timingSafeEqual(candidateBuffer, signatureBuffer);
    });
}

export async function POST(req: Request) {
    const supabase = createAdminClient();
    try {
        const rawBody = await req.text();
        const body = JSON.parse(rawBody);
        const signature = body.hashKey || req.headers.get('x-fawaterk-signature') || undefined;

        if (!signature) {
            return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
        }

        // 1. Fetch Webhook Secret
        const { data: settings } = await supabase
            .from('platform_settings')
            .select('fawaterk_webhook_secret')
            .single();

        const secret = settings?.fawaterk_webhook_secret;



        if (!secret) {
            return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
        }

        if (!verifyFawaterkSignature(rawBody, signature, secret)) {
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }

        const { invoice_id, invoice_status, metadata, customParam } = body;

        // Fawaterk typically returns metadata inside a 'customParam' string if passed during createInvoiceLink
        let parsedMetadata = metadata;

        if (!parsedMetadata && customParam && typeof customParam === 'string') {
            try {
                parsedMetadata = JSON.parse(customParam);

            } catch (e) {
                console.error('Failed to parse customParam:', customParam);
            }
        }





        if (invoice_status === 'paid' && parsedMetadata) {
            const userId = parsedMetadata.user_id || parsedMetadata.userId;
            const planId = parsedMetadata.plan_id || parsedMetadata.planId;
            const billingCycle = parsedMetadata.billing_cycle || parsedMetadata.billingCycle;
            const invoiceId = parsedMetadata.invoice_id || parsedMetadata.invoiceId; // Added this

            if (!userId || !planId) {
                console.error('Webhook Error: Missing userId or planId in metadata', parsedMetadata);
                return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
            }

            // 1. If it's an invoice payment (the new system)
            if (invoiceId) {
                // Mark invoice as paid
                const { error: invError } = await supabase
                    .from('invoices')
                    .update({
                        status: 'paid',
                        paid_at: new Date().toISOString(),
                        gateway_invoice_id: invoice_id.toString()
                    })
                    .eq('id', invoiceId);

                if (invError) console.error('Error updating invoice:', invError);

                // Update existing active subscription
                const { data: currentSub } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', userId)
                    .eq('status', 'active')
                    .maybeSingle();

                if (currentSub) {
                    const endsAt = new Date(currentSub.ends_at);
                    if (billingCycle === 'yearly') {
                        endsAt.setFullYear(endsAt.getFullYear() + 1);
                    } else {
                        endsAt.setMonth(endsAt.getMonth() + 1);
                    }

                    await supabase
                        .from('subscriptions')
                        .update({
                            ends_at: endsAt.toISOString(),
                            messages_used: 0
                        })
                        .eq('id', currentSub.id);
                }
            } else {
                // 2. Original legacy checkout flow (one-time payment)
                const endsAt = new Date();
                if (billingCycle === 'yearly') {
                    endsAt.setFullYear(endsAt.getFullYear() + 1);
                } else {
                    endsAt.setMonth(endsAt.getMonth() + 1);
                }

                // Deactivate old subscriptions
                await supabase
                    .from('subscriptions')
                    .update({ status: 'expired' })
                    .eq('user_id', userId)
                    .eq('status', 'active');

                // Create new subscription
                const { data: newSub, error: subError } = await supabase
                    .from('subscriptions')
                    .insert({
                        user_id: userId,
                        plan_id: planId,
                        status: 'active',
                        starts_at: new Date().toISOString(),
                        ends_at: endsAt.toISOString(),
                        billing_cycle: billingCycle,
                        payment_gateway: 'fawaterk',
                        gateway_subscription_id: invoice_id.toString()
                    })
                    .select()
                    .single();

                if (subError) {
                    console.error('Error creating subscription:', subError);
                    return NextResponse.json({ error: 'DB error' }, { status: 500 });
                }

                // 3. Create a corresponding invoice for this payment
                const { data: lastInvoice } = await supabase
                    .from('invoices')
                    .select('invoice_number')
                    .order('invoice_number', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const nextNumber = (lastInvoice?.invoice_number || 1000) + 1;

                // Fetch plan to get amount if not available (ideally should be passed in metadata, but legacy might not have it)
                // For now, use a default or fetch if needed. 
                // Since this is legacy, we might need to fetch the plan again to get the price.
                const { data: plan } = await supabase.from('plans').select('*').eq('id', planId).single();
                const amount = billingCycle === 'yearly' ? plan?.price_yearly : plan?.price_monthly;

                await supabase
                    .from('invoices')
                    .insert({
                        user_id: userId,
                        plan_id: planId,
                        invoice_number: nextNumber,
                        amount: amount || 0,
                        currency: 'EGP', // Default for fawaterk in this setup
                        status: 'paid',
                        paid_at: new Date().toISOString(),
                        due_date: new Date().toISOString(),
                        period_start: new Date().toISOString(),
                        period_end: endsAt.toISOString(),
                        gateway_invoice_id: invoice_id.toString()
                    });
            }
        } else if (invoice_status === 'paid' && !parsedMetadata) {
            console.error('Webhook Error: Invoice paid but no metadata found to process an upgrade.');
        }


        return NextResponse.json({ status: 'success' });
    } catch (err: any) {
        console.error('Fawaterk Webhook Error:', err.message);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
    }
}
