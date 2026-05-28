import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * Server-side proxy for exchanging keys with the WordPress plugin.
 * This avoids CORS issues from the browser trying to call the WP REST API directly.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { store_url, temp_token, return_url, site_language } = body;

        if (!store_url || !temp_token) {
            return NextResponse.json(
                { error: 'Missing required parameters: store_url, temp_token' },
                { status: 400 }
            );
        }

        // Step 1: Exchange keys with the WordPress plugin (server-to-server, no CORS)
        const cleanUrl = store_url.replace(/\/$/, '');
        const endpoint = `${cleanUrl}/wp-json/pengoo/v1/exchange-keys`;

        const wpResponse = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temp_token }),
            signal: AbortSignal.timeout(15000),
        });

        const wpData = await wpResponse.json();

        if (!wpResponse.ok) {
            console.error('[Exchange Keys] WordPress error:', wpData);
            return NextResponse.json(
                { error: wpData.message || 'Failed to authenticate with the store.' },
                { status: wpResponse.status }
            );
        }

        // Step 2: Save to database via the manual-connect route logic
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        let storeId = null;

        if (user) {
            const webhookSecret = crypto.randomUUID();
            const storeName = cleanUrl.replace(/^https?:\/\//, '').split('/')[0];

            // Check if store already exists
            const { data: existingStores } = await supabase
                .from('stores')
                .select('id')
                .eq('user_id', user.id)
                .eq('store_url', cleanUrl);

            if (existingStores && existingStores.length > 0) {
                storeId = existingStores[0].id;
                await supabase
                    .from('stores')
                    .update({
                        consumer_key: wpData.consumer_key,
                        consumer_secret: wpData.consumer_secret,
                        webhook_secret: webhookSecret,
                        is_active: true,
                        name: storeName,
                        site_language: wpData.site_language || site_language || 'ar',
                        store_languages: wpData.store_languages || [],
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', storeId);
            } else {
                const { data: newStore } = await supabase
                    .from('stores')
                    .insert({
                        user_id: user.id,
                        store_url: cleanUrl,
                        consumer_key: wpData.consumer_key,
                        consumer_secret: wpData.consumer_secret,
                        webhook_secret: webhookSecret,
                        is_active: true,
                        name: storeName,
                        site_language: wpData.site_language || site_language || 'ar',
                        store_languages: wpData.store_languages || []
                    })
                    .select('id')
                    .single();

                if (newStore) storeId = newStore.id;
            }

            // Auto-setup webhooks
            if (storeId) {
                const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3002';
                const pengooWebhookUrl = `${origin}/api/webhooks/woocommerce?store_id=${storeId}`;
                try {
                    const authHeader = 'Basic ' + Buffer.from(`${wpData.consumer_key}:${wpData.consumer_secret}`).toString('base64');
                    const webhooks = [
                        { name: 'Pengoo - Order Created', topic: 'order.created', delivery_url: pengooWebhookUrl, secret: webhookSecret },
                        { name: 'Pengoo - Order Updated', topic: 'order.updated', delivery_url: pengooWebhookUrl, secret: webhookSecret }
                    ];
                    for (const webhook of webhooks) {
                        await fetch(`${cleanUrl}/wp-json/wc/v3/webhooks`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
                            body: JSON.stringify(webhook)
                        }).catch(() => {});
                    }
                } catch (e) {
                    console.error('[Exchange Keys] Webhook setup error:', e);
                }
            }
        }

        return NextResponse.json({
            success: true,
            store_url: cleanUrl,
            store_id: storeId,
            consumer_key: wpData.consumer_key,
            site_language: wpData.site_language,
            store_languages: wpData.store_languages,
            return_url,
        });
    } catch (error: any) {
        console.error('[Exchange Keys] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to connect to the store. Make sure the Pengoo plugin is installed and activated.' },
            { status: 502 }
        );
    }
}
