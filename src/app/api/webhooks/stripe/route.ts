import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import crypto from 'crypto';

function verifyStripeSignature(payload: string, signatureHeader: string | null, secret: string) {
    if (!signatureHeader || !secret) return false;

    const values = Object.fromEntries(
        signatureHeader.split(',').map((part) => {
            const [key, ...value] = part.split('=');
            return [key, value.join('=')];
        })
    );
    const timestamp = values.t;
    const signature = values.v1;
    if (!timestamp || !signature) return false;

    const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;

    const expected = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payload}`, 'utf8')
        .digest('hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    const expectedBuffer = Buffer.from(expected, 'hex');

    return signatureBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export async function POST(req: Request) {
    const supabase = createAdminClient();
    const payload = await req.text();
    const sig = req.headers.get('stripe-signature');

    try {
        if (!sig) {
            return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
        }

        // 1. Get stripe webhook secret from platform settings
        const { data: settings } = await supabase
            .from('platform_settings')
            .select('stripe_webhook_secret')
            .single();

        if (!settings?.stripe_webhook_secret) {
            console.error('Stripe webhook secret not configured');
            return NextResponse.json({ error: 'Config error' }, { status: 500 });
        }

        if (!verifyStripeSignature(payload, sig, settings.stripe_webhook_secret)) {
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }

        const event = JSON.parse(payload);

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata.user_id;
            const planId = session.metadata.plan_id;
            const billingCycle = session.metadata.billing_cycle;

            // Update user subscription
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
            const { error: subError } = await supabase
                .from('subscriptions')
                .insert({
                    user_id: userId,
                    plan_id: planId,
                    status: 'active',
                    starts_at: new Date().toISOString(),
                    ends_at: endsAt.toISOString(),
                    billing_cycle: billingCycle,
                    payment_gateway: 'stripe',
                    gateway_subscription_id: session.subscription || session.id
                });

            if (subError) {
                console.error('Error creating subscription:', subError);
                return NextResponse.json({ error: 'DB error' }, { status: 500 });
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('Webhook Error:', err.message);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 400 });
    }
}
