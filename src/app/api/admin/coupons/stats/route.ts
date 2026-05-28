import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(req: Request) {
    try {
        const supabase = createAdminClient();

        // Get all coupons to map them
        const { data: coupons, error: couponsError } = await supabase
            .from('coupons')
            .select('id, code, discount_type, discount_value');
        if (couponsError || !coupons) throw couponsError || new Error("Failed to fetch coupons");

        // Get all active subscriptions that use a coupon
        const { data: subscriptions, error: subError } = await supabase
            .from('subscriptions')
            .select('id, user_id, coupon_id, plan_id, status, current_period_end')
            .eq('status', 'active')
            .not('coupon_id', 'is', null);
        if (subError) throw subError;

        // Get all paid invoices to calculate total revenue generated per coupon
        // Since invoices might not have coupon_id directly if it wasn't added yet, we will map them via subscription_id
        // But the best is to just fetch invoices and calculate
        const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('id, amount, status, subscription_id')
            .eq('status', 'paid');
        if (invError) throw invError;

        // Also get plans to know the base price for MRR calculation
        const { data: plans, error: plansError } = await supabase
            .from('plans')
            .select('id, price');
        if (plansError) throw plansError;

        const planPriceMap = new Map(plans?.map(p => [p.id, p.price || 0]));

        // Calculate stats per coupon
        const statsMap: Record<string, { active_users: number; mrr: number; total_revenue: number }> = {};
        for (const c of coupons) {
            statsMap[c.id] = { active_users: 0, mrr: 0, total_revenue: 0 };
        }

        // Active Users & MRR
        for (const sub of subscriptions || []) {
            if (statsMap[sub.coupon_id]) {
                statsMap[sub.coupon_id].active_users += 1;

                // Calculate MRR for this subscription based on its plan and coupon
                const basePrice = planPriceMap.get(sub.plan_id) || 0;
                const coupon = coupons.find(c => c.id === sub.coupon_id);
                if (coupon) {
                    let discountedPrice = basePrice;
                    if (coupon.discount_type === 'percentage') {
                        discountedPrice = Math.max(0, basePrice * (1 - coupon.discount_value / 100));
                    } else if (coupon.discount_type === 'fixed') {
                        discountedPrice = Math.max(0, basePrice - coupon.discount_value);
                    }
                    statsMap[sub.coupon_id].mrr += discountedPrice;
                }
            }
        }

        // Total Revenue via Invoices
        // Map subscriptions by ID to know their coupon_id
        // Notice: Past invoices might be for subscriptions that changed coupons, but it's an okay approximation 
        // if invoice table doesn't have coupon_id natively
        const subToCoupon = new Map(
            subscriptions?.map(s => [s.id, s.coupon_id]) // This only has active subs, wait.
        );
        // Let's get ALL subscriptions to map invoices correctly for total revenue
        const { data: allSubs } = await supabase
            .from('subscriptions')
            .select('id, coupon_id');
        
        const fullSubToCoupon = new Map(
            allSubs?.filter(s => s.coupon_id).map(s => [s.id, s.coupon_id])
        );

        for (const inv of invoices || []) {
            if (inv.subscription_id && fullSubToCoupon.has(inv.subscription_id)) {
                const cId = fullSubToCoupon.get(inv.subscription_id)!;
                if (statsMap[cId]) {
                    statsMap[cId].total_revenue += Number(inv.amount || 0);
                }
            }
        }

        return NextResponse.json({ success: true, stats: statsMap });
    } catch (error: any) {
        console.error('Coupons Stats API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
