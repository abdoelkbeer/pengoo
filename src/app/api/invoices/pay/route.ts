import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        const { invoiceId, paymentMethodId } = await req.json();
        const supabase = await createClient();
        const admin = createAdminClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get invoice details
        const { data: invoice, error: invError } = await admin
            .from('invoices')
            .select(`
                *,
                plans (name)
            `)
            .eq('id', invoiceId)
            .eq('user_id', user.id)
            .single();

        if (invError || !invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (invoice.status === 'paid') {
            return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
        }

        // 2. Get Fawaterk settings
        const { data: settings } = await admin
            .from('platform_settings')
            .select('*')
            .single();

        if (!settings?.fawaterk_api_key) {
            return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 });
        }

        // paymentMethodId is already extracted from the initial req.json() call above

        // The frontend sends the correct Fawaterk native IDs directly:
        // 2 = Card (Visa/MC/Meeza), 3 = Fawry, 4 = Wallets, 11 = Aman
        const isNative = !!paymentMethodId;
        const fawaterkUrl = isNative
            ? 'https://app.fawaterk.com/api/v2/invoiceInitPay'
            : 'https://app.fawaterk.com/api/v2/createInvoiceLink';

        const body = {
            cartTotal: invoice.amount,
            currency: invoice.currency.toUpperCase(),
            customer: {
                first_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                email: user.email,
            },
            cartItems: [
                {
                    name: `تجديد اشتراك: ${invoice.plans?.name || 'باقة'}`,
                    price: invoice.amount,
                    quantity: 1
                }
            ],
            redirectionUrls: {
                successUrl: `${req.headers.get('origin')}/dashboard/plans/success`,
                failUrl: `${req.headers.get('origin')}/dashboard/invoices?canceled=true`,
            },
            payLoad: {
                user_id: user.id,
                invoice_id: invoice.id,
                plan_id: invoice.plan_id,
                billing_cycle: invoice.billing_cycle
            },
            ...(isNative ? { payment_method_id: paymentMethodId } : {})
        };

        const response = await fetch(fawaterkUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.fawaterk_api_key}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const result = await response.json();
        if (response.ok && result.status === 'success') {
            const finalUrl = isNative ? (result.data.redirectTo || result.data.url) : result.data.url;

            // Update invoice with gateway details
            await admin
                .from('invoices')
                .update({
                    payment_url: finalUrl,
                    gateway_invoice_id: (result.data.invoice_id || result.data.payment_id)?.toString()
                })
                .eq('id', invoiceId);

            return NextResponse.json({ url: finalUrl });
        } else {
            console.error('Fawaterk Error:', result);
            return NextResponse.json({ error: result.message || 'Fawaterk error' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('Invoice Payment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
