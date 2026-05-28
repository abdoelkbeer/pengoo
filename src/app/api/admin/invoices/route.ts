import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        let query = supabase
            .from('invoices')
            .select(`
                *,
                plans (name),
                user_profiles:user_id (full_name, email:id)
            `)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Note: user_profiles join might need email handling from auth.users if profiles doesn't have it
        // Since we are using createAdminClient, we can fetch emails separately if needed.

        return NextResponse.json({ invoices: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = createAdminClient();
        const { action, invoiceId, data } = await req.json();

        if (action === 'create') {
            const { userId, planId, amount, currency, billingCycle, dueDate } = data;

            // Get the last invoice number to increment it
            const { data: lastInvoice } = await supabase
                .from('invoices')
                .select('invoice_number')
                .order('invoice_number', { ascending: false })
                .limit(1)
                .maybeSingle();

            const nextInvoiceNumber = (lastInvoice?.invoice_number || 0) + 1;

            const { data: newInvoice, error: createError } = await supabase
                .from('invoices')
                .insert({
                    user_id: userId,
                    plan_id: planId,
                    amount,
                    currency,
                    billing_cycle: billingCycle,
                    due_date: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default 7 days
                    status: 'pending',
                    invoice_number: nextInvoiceNumber,
                    period_start: new Date().toISOString(),
                    period_end: billingCycle === 'yearly'
                        ? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
                        : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;

            return NextResponse.json({ success: true, invoice: newInvoice });
        }

        if (action === 'mark_paid') {
            // Update invoice
            const { error: invError } = await supabase
                .from('invoices')
                .update({
                    status: 'paid',
                    paid_at: new Date().toISOString()
                })
                .eq('id', invoiceId);

            if (invError) throw invError;

            // Find invoice to get context
            const { data: invoice } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', invoiceId)
                .single();

            if (invoice) {
                // Update subscription
                const { data: sub } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', invoice.user_id)
                    .eq('status', 'active')
                    .maybeSingle();

                if (sub) {
                    const endsAt = new Date(sub.ends_at);
                    if (invoice.billing_cycle === 'yearly') {
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
                        .eq('id', sub.id);
                }
            }

            return NextResponse.json({ success: true });
        }

        if (action === 'cancel') {
            await supabase
                .from('invoices')
                .update({ status: 'cancelled' })
                .eq('id', invoiceId);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
