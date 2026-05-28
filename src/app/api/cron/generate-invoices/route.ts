import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * This route should be protected by a CRON_SECRET header
 * It will run daily to generate invoices for subscriptions expiring soon.
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();

        // 1. Find active subscriptions ending in the next 7 days
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const { data: expiringSubs, error: subsError } = await supabase
            .from('subscriptions')
            .select(`
                *,
                plans (*)
            `)
            .eq('status', 'active')
            .lte('ends_at', sevenDaysFromNow.toISOString());

        if (subsError) throw subsError;

        const results = [];

        for (const sub of (expiringSubs || [])) {
            // Check if an invoice already exists for the next period
            const { data: existingInvoice } = await supabase
                .from('invoices')
                .select('id')
                .eq('subscription_id', sub.id)
                .eq('period_start', sub.ends_at)
                .maybeSingle();

            if (!existingInvoice) {
                // Generate new invoice
                let amount = sub.billing_cycle === 'yearly' ? sub.plans.price_yearly : sub.plans.price_monthly;
                const nextPeriodNumber = (sub.period_number || 1) + 1;

                // Check for Intro Pricing
                if (sub.billing_cycle === 'monthly' && sub.plans.intro_period_months >= nextPeriodNumber) {
                    if (sub.plans.intro_price_monthly !== null) {
                        amount = sub.plans.intro_price_monthly;
                    }
                } else if (sub.billing_cycle === 'yearly' && sub.plans.intro_period_months >= nextPeriodNumber) {
                    if (sub.plans.intro_price_yearly !== null) {
                        amount = sub.plans.intro_price_yearly;
                    }
                }

                // Apply Coupon if applicable (assuming coupons are recurring for now, or we can add a flag)
                if (sub.coupon_id) {
                    const { data: coupon } = await supabase.from('coupons').select('*').eq('id', sub.coupon_id).single();
                    if (coupon && (coupon.is_active && (!coupon.expires_at || new Date(coupon.expires_at) > new Date()))) {
                        if (coupon.discount_type === 'percentage') {
                            amount = amount * (1 - (coupon.discount_value / 100));
                        } else {
                            amount = Math.max(0, amount - coupon.discount_value);
                        }
                    }
                }

                const periodStart = new Date(sub.ends_at);
                const periodEnd = new Date(periodStart);
                if (sub.billing_cycle === 'yearly') {
                    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                } else {
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                }

                const { data: newInvoice, error: invError } = await supabase
                    .from('invoices')
                    .insert({
                        user_id: sub.user_id,
                        subscription_id: sub.id,
                        plan_id: sub.plan_id,
                        amount: amount,
                        currency: 'EGP', // Default currency
                        billing_cycle: sub.billing_cycle,
                        status: 'pending',
                        due_date: sub.ends_at,
                        period_start: periodStart.toISOString(),
                        period_end: periodEnd.toISOString()
                    })
                    .select()
                    .single();

                if (invError) {
                    console.error(`Failed to create invoice for sub ${sub.id}:`, invError);
                } else {
                    results.push(newInvoice);
                }
            }
        }

        return NextResponse.json({
            processed: expiringSubs?.length || 0,
            generated: results.length,
            invoices: results
        });

    } catch (error: any) {
        console.error('Cron: generate-invoices error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
