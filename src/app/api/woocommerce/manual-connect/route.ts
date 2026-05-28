import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

async function createWooCommerceWebhooks(storeUrl: string, consumerKey: string, consumerSecret: string, webhookDeliveryUrl: string, webhookSecret: string) {
    const cleanUrl = storeUrl.replace(/\/$/, '');
    const webhooks = [
        { name: 'Pengoo Auto - Order Created', topic: 'order.created', delivery_url: webhookDeliveryUrl, secret: webhookSecret },
        { name: 'Pengoo Auto - Order Updated', topic: 'order.updated', delivery_url: webhookDeliveryUrl, secret: webhookSecret }
    ];

    const authHeader = 'Basic ' + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const results = [];

    for (const webhook of webhooks) {
        try {
            const res = await fetch(`${cleanUrl}/wp-json/wc/v3/webhooks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                },
                body: JSON.stringify(webhook)
            });
            const data = await res.json();
            results.push({ topic: webhook.topic, status: res.status, id: data.id });
        } catch (e: any) {
            console.error(`[WooCommerce Connect] Failed to create webhook ${webhook.topic}:`, e.message);
            results.push({ topic: webhook.topic, error: e.message });
        }
    }
    return results;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { store_url, consumer_key, consumer_secret, token, site_language, store_languages, name: providedName } = body;

        if (!store_url || !consumer_key || !consumer_secret) {
            return NextResponse.json({ error: 'Missing required fields: store_url, consumer_key, consumer_secret' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let storeId = null;
        const webhookSecret = crypto.randomUUID();

        if (user) {
            const cleanUrl = store_url.replace(/\/$/, '');
            const storeName = providedName || cleanUrl.replace(/^https?:\/\//, '').split('/')[0];

            // Check if store already exists for this user //
            const { data: existingStores, error: checkError } = await supabase
                .from('stores')
                .select('id')
                .eq('user_id', user.id)
                .eq('store_url', cleanUrl);

            if (checkError) console.error('[WooCommerce Connect] DB Check Error:', checkError.message);

            if (existingStores && existingStores.length > 0) {
                storeId = existingStores[0].id;
                const { error: updateError } = await supabase
                    .from('stores')
                    .update({
                        consumer_key,
                        consumer_secret,
                        webhook_secret: webhookSecret,
                        is_active: true,
                        name: storeName,
                        site_language: site_language || 'ar',
                        store_languages: store_languages || [],
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', storeId);

                if (updateError) console.error('[WooCommerce Connect] DB Update Error:', updateError.message);
            } else {
                const { data: newStore, error: insertError } = await supabase
                    .from('stores')
                    .insert({
                        user_id: user.id,
                        store_url: cleanUrl,
                        consumer_key,
                        consumer_secret,
                        webhook_secret: webhookSecret,
                        is_active: true,
                        name: storeName,
                        site_language: site_language || 'ar',
                        store_languages: store_languages || []
                    })
                    .select('id')
                    .single();

                if (insertError) {
                    console.error('[WooCommerce Connect] DB Insert Error:', insertError.message);
                } else if (newStore) {
                    storeId = newStore.id;
                }
            }

            // Auto-setup webhooks if we have a store ID
            if (storeId) {
                const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
                const pengooWebhookUrl = `${origin}/api/webhooks/woocommerce?store_id=${storeId}`;
                await createWooCommerceWebhooks(cleanUrl, consumer_key, consumer_secret, pengooWebhookUrl, webhookSecret);
                console.log(`[WooCommerce Connect] Webhooks registered for store ${storeId}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'WooCommerce store connected successfully.',
            store_url,
            store_id: storeId,
        });
    } catch (error: any) {
        console.error('[WooCommerce Connect] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('stores')
        .select('store_url, created_at, is_active')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ stores: data || [] });
}
