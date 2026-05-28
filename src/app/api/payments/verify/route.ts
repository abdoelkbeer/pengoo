import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const { invoice_id } = await req.json();

        if (!invoice_id) {
            return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = createAdminClient();

        // 1. Fetch Fawaterk API Key
        const { data: settings } = await admin
            .from('platform_settings')
            .select('fawaterk_api_key')
            .single();

        if (!settings?.fawaterk_api_key) {
            return NextResponse.json({ error: 'Fawaterk API key not configured' }, { status: 500 });
        }

        // 2. Fetch Invoice from Fawaterk
        const response = await fetch(`https://app.fawaterk.com/api/v2/getInvoiceData/${invoice_id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${settings.fawaterk_api_key}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        const result = await response.json();

        if (!response.ok || (result.status !== 'success' && result.code !== 200)) {
            return NextResponse.json({ error: 'Failed to verify invoice with Fawaterk' }, { status: 500 });
        }

        const invoiceData = result.data;

        // 3. Verify Payment Status
        if (invoiceData.status_text !== 'paid' && invoiceData.status !== 1) {
            return NextResponse.json({ error: 'Invoice not paid yet', status: 'pending' }, { status: 400 });
        }

        // 4. Extract MetaData (payLoad)
        let parsedMetadata = null;
        try {
            if (invoiceData.pay_load) {
                parsedMetadata = JSON.parse(invoiceData.pay_load);
            } else if (invoiceData.customParam) {
                parsedMetadata = JSON.parse(invoiceData.customParam);
            }
        } catch (e) {
            console.error('Could not parse metadata', e);
        }

        if (!parsedMetadata) {
            return NextResponse.json({ error: 'No associated plan data found' }, { status: 400 });
        }

        const userId = parsedMetadata.user_id || parsedMetadata.userId;
        const planId = parsedMetadata.plan_id || parsedMetadata.planId;
        const billingCycle = parsedMetadata.billing_cycle || parsedMetadata.billingCycle;
        const isSubscription = parsedMetadata.is_subscription;
        const couponId = parsedMetadata.coupon_id;
        const isIntro = parsedMetadata.is_intro;

        if (userId !== user.id) {
            return NextResponse.json({ error: 'Invoice belongs to another user' }, { status: 403 });
        }

        // 5. Upgrade logic

        // Let's handle both one-time new subs and recurring invoices. 
        // We'll also check if we already upgraded this via the gateway_subscription_id to prevent duplicates.
        const { data: existingSub } = await admin
            .from('subscriptions')
            .select('*')
            .eq('gateway_subscription_id', invoice_id.toString())
            .maybeSingle();

        if (existingSub) {
            return NextResponse.json({ status: 'success', message: 'Already processed' });
        }

        if (parsedMetadata.invoice_id) {
            // Mark manual generated invoice as paid
            await admin
                .from('invoices')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString(),
                    gateway_invoice_id: invoice_id.toString()
                })
                .eq('id', parsedMetadata.invoice_id);

            // Find current valid sub
            const { data: currentSub } = await admin
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

                await admin
                    .from('subscriptions')
                    .update({
                        ends_at: endsAt.toISOString(),
                        messages_used: 0,
                        gateway_subscription_id: invoice_id.toString() // Use this to track latest successful payment ID
                    })
                    .eq('id', currentSub.id);
            }
        } else {
            // New Plan Checkout
            const endsAt = new Date();
            if (billingCycle === 'yearly') {
                endsAt.setFullYear(endsAt.getFullYear() + 1);
            } else {
                endsAt.setMonth(endsAt.getMonth() + 1);
            }

            // Expire older ones
            await admin
                .from('subscriptions')
                .update({ status: 'expired' })
                .eq('user_id', userId)
                .eq('status', 'active');

            // Create New Sub
            const { error: subError } = await admin
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan_id: planId,
                    status: 'active',
                    starts_at: new Date().toISOString(),
                    ends_at: endsAt.toISOString(),
                    billing_cycle: billingCycle,
                    payment_gateway: 'fawaterk',
                    gateway_subscription_id: invoice_id.toString(),
                    coupon_id: couponId || null,
                    period_number: 1
                });

            // Increment coupon usage if applied
            if (couponId) {
                await admin.rpc('increment_coupon_usage', { coupon_id: couponId });
                // Fallback if RPC not available
                await admin.from('coupons').update({ used_count: admin.rpc('increment', { row_id: couponId }) as any }).eq('id', couponId);
                // Actually, let's just use a simple increment if the above fails or just do it directly:
                const { data: c } = await admin.from('coupons').select('used_count').eq('id', couponId).single();
                if (c) {
                    await admin.from('coupons').update({ used_count: (c.used_count || 0) + 1 }).eq('id', couponId);
                }
            }

            if (subError) throw subError;
        }

        return NextResponse.json({ status: 'success' });

    } catch (err: any) {
        console.error('Verify Payment API error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
