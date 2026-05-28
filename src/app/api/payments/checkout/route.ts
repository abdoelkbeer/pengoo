import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        let { planId, billingCycle, paymentMethodId, couponCode } = await req.json();
        // Force yearly cycle as requested
        billingCycle = 'yearly';
        const supabase = await createClient();
        const admin = createAdminClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get plan details, settings, and base data in parallel
        const [planRes, settingsRes] = await Promise.all([
            admin.from('plans').select('*').eq('id', planId).single(),
            admin.from('platform_settings').select('*').single()
        ]);

        const { data: plan, error: planError } = planRes;
        const { data: settings, error: settingsError } = settingsRes;

        if (planError || !plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
        }

        if (settingsError || !settings) {
            return NextResponse.json({ error: 'Platform settings not found' }, { status: 500 });
        }

        const activeGateway = settings.active_payment_gateway || 'fawaterk';
        const currency = settings.currency || 'EGP';

        // 3. Determine base price (Check for introductory pricing)
        let basePrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
        let isIntroPrice = false;
        // Check if user qualifies for intro pricing
        const introPrice = billingCycle === 'yearly' ? plan.intro_price_yearly : plan.intro_price_monthly;
        
        if (introPrice !== null && introPrice !== undefined && introPrice > 0 && plan.intro_period_months > 0) {
            // Only skip intro price if user had a PAID invoice (amount > 0) for this exact plan
            const { data: pastPaidInvoices, error: pastInvoicesError } = await admin
                .from('invoices')
                .select('id')
                .eq('user_id', user.id)
                .eq('plan_id', planId)
                .eq('status', 'paid')
                .gt('amount', 0)
                .limit(1);

            // Check if there are no past genuinely PAID invoices
            if (!pastPaidInvoices || pastPaidInvoices.length === 0) {
                basePrice = introPrice;
                isIntroPrice = true;
            }
        }


        // 4. Apply Coupon if provided
        let discountAmount = 0;
        let couponId = null;
        if (couponCode) {
            const { data: coupon, error: couponError } = await admin
                .from('coupons')
                .select('*')
                .eq('code', couponCode.toUpperCase())
                .eq('is_active', true)
                .maybeSingle();

            if (coupon) {
                // Check expiry
                if (!coupon.expires_at || new Date(coupon.expires_at) > new Date()) {
                    // Check usage limit
                    if (!coupon.max_usages || coupon.used_count < coupon.max_usages) {
                        couponId = coupon.id;
                        if (coupon.discount_type === 'percentage') {
                            discountAmount = (basePrice * coupon.discount_value) / 100;
                        } else {
                            discountAmount = Math.min(coupon.discount_value, basePrice);
                        }
                    }
                }
            }
        }

        const finalPrice = Math.max(0, basePrice - discountAmount);
        console.log('[Checkout] Plan:', plan.name, '| Base:', plan.price_yearly, '| Intro:', plan.intro_price_yearly, '| introPrice var:', introPrice, '| isIntro:', isIntroPrice, '| Final:', finalPrice);

        if (activeGateway === 'stripe') {
            if (!settings.stripe_secret_key) {
                return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
            }

            // Stripe Checkout (using direct REST API to avoid dependency issues)
            const stripeUrl = 'https://api.stripe.com/v1/checkout/sessions';
            const params = new URLSearchParams();
            params.append('payment_method_types[0]', 'card');
            params.append('line_items[0][price_data][currency]', currency.toLowerCase());
            params.append('line_items[0][price_data][product_data][name]', plan.name);
            params.append('line_items[0][price_data][unit_amount]', Math.round(finalPrice * 100).toString());
            params.append('line_items[0][quantity]', '1');
            params.append('mode', 'subscription');
            // If they haven't used trial (even if Stripe supports it, but we handle it manually above so we don't need Stripe trials here, 
            // but keep for fallback just in case or if gateway handles trial differently)
            
            params.append('success_url', `${req.headers.get('origin')}/dashboard/plans?success=true`);
            params.append('cancel_url', `${req.headers.get('origin')}/dashboard/plans?canceled=true`);
            params.append('customer_email', user.email!);
            params.append('metadata[user_id]', user.id);
            params.append('metadata[plan_id]', plan.id);
            params.append('metadata[billing_cycle]', billingCycle);
            params.append('metadata[coupon_id]', couponId || '');
            params.append('metadata[is_intro]', isIntroPrice ? 'true' : 'false');

            const response = await fetch(stripeUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${settings.stripe_secret_key}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: params.toString()
            });

            const session = await response.json();
            if (response.ok) {
                return NextResponse.json({ url: session.url });
            } else {
                return NextResponse.json({ error: session.error.message }, { status: 500 });
            }

        } else if (activeGateway === 'fawaterk') {
            // paymentMethodId is already extracted from the initial req.json() call above

            if (!settings.fawaterk_api_key) {
                return NextResponse.json({ error: 'Fawaterk is not configured' }, { status: 500 });
            }

            // Force use of standard invoice link to ensure stable redirect flow
            const fawaterkUrl = 'https://app.fawaterk.com/api/v2/createInvoiceLink';

            const body = {
                cartTotal: finalPrice,
                currency: currency.toUpperCase(),
                customer: {
                    first_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
                    last_name: user.user_metadata?.last_name || '.',
                    email: user.email,
                },
                cartItems: [
                    {
                        name: plan.name,
                        price: finalPrice,
                        quantity: 1
                    }
                ],
                redirectionUrls: {
                    successUrl: `${req.headers.get('origin')}/dashboard/plans/success`,
                    failUrl: `${req.headers.get('origin')}/dashboard/plans?canceled=true`,
                },
                payLoad: {
                    user_id: user.id,
                    plan_id: plan.id,
                    billing_cycle: billingCycle,
                    is_subscription: true,
                    coupon_id: couponId,
                    is_intro: isIntroPrice
                },
                ...(paymentMethodId ? { payment_method_id: paymentMethodId } : {})
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


            if (response.ok && (result.status === 'success' || result.data)) {
                const data = result.data || result;
                const finalUrl = data.redirectTo || data.url || data.payment_url;
                if (finalUrl) {
                    return NextResponse.json({ url: finalUrl });
                } else {
                    console.error('Fawaterk: No URL in response:', result);
                    return NextResponse.json({ error: 'لم يتم استلام رابط الدفع من بوابة فواتيرك' }, { status: 500 });
                }
            } else {
                console.error('Fawaterk Error:', result);
                return NextResponse.json({
                    error: typeof result.message === 'string' ? result.message :
                        typeof result.error === 'string' ? result.error :
                            JSON.stringify(result.message || result.errors || result) || 'Fawaterk error'
                }, { status: 500 });
            }
        }

        return NextResponse.json({ error: 'Unsupported gateway' }, { status: 400 });

    } catch (error: any) {
        console.error('Checkout API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
