import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Create a new store
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { store_url, consumer_key, consumer_secret, store_type = 'woocommerce', name: providedName } = body;

        if (!store_url) {
            return NextResponse.json({ error: 'store_url is required' }, { status: 400 });
        }

        // Derive name if not provided
        const storeName = providedName || store_url.replace(/^https?:\/\//, '').split('/')[0];

        // Generate a random webhook secret
        const webhookSecret = crypto.randomUUID();

        const { data, error } = await supabase
            .from('stores')
            .insert({
                user_id: user.id,
                store_url,
                consumer_key: consumer_key || null,
                consumer_secret: consumer_secret || null,
                webhook_secret: webhookSecret,
                store_type,
                name: storeName,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Register Webhooks in WooCommerce if CK/CS are provided
        if (store_type === 'woocommerce' && consumer_key && consumer_secret) {
            const cleanUrl = store_url.replace(/\/$/, '');
            const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/woocommerce?store_id=${data.id}`;

            const events = [
                { name: 'Order Created', topic: 'order.created' },
                { name: 'Order Updated', topic: 'order.updated' }
            ];

            for (const event of events) {
                try {
                    await fetch(`${cleanUrl}/wp-json/wc/v3/webhooks`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Basic ' + Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64')
                        },
                        body: JSON.stringify({
                            name: `Bingo - ${event.name}`,
                            topic: event.topic,
                            delivery_url: webhookUrl,
                            secret: webhookSecret,
                            status: 'active'
                        })
                    });
                } catch (wcError) {
                    console.error(`Failed to register webhook ${event.topic}:`, wcError);
                }
            }
        }

        // Register Webhooks in Shopify if Access Token is provided
        if (store_type === 'shopify' && consumer_key) {
            const cleanUrl = store_url.replace(/\/$/, '').replace(/^https?:\/\//, '');
            const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/shopify?store_id=${data.id}`;

            const topics = [
                'orders/create',
                'orders/updated',
                'customers/create'
            ];

            for (const topic of topics) {
                try {
                    await fetch(`https://${cleanUrl}/admin/api/2024-01/webhooks.json`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Shopify-Access-Token': consumer_key
                        },
                        body: JSON.stringify({
                            webhook: {
                                topic: topic,
                                address: webhookUrl,
                                format: 'json'
                            }
                        })
                    });
                } catch (shopifyError) {
                    console.error(`Failed to register Shopify webhook ${topic}:`, shopifyError);
                }
            }
        }

        return NextResponse.json({ success: true, store: data });
    } catch (error: any) {
        console.error('Store Creation Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Update a store
export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, store_url, consumer_key, consumer_secret, is_active, store_type, name } = body;

        if (!id) {
            return NextResponse.json({ error: 'Store id is required' }, { status: 400 });
        }

        const updateData: any = { updated_at: new Date().toISOString() };
        if (store_url !== undefined) updateData.store_url = store_url;
        if (consumer_key !== undefined) updateData.consumer_key = consumer_key;
        if (consumer_secret !== undefined) updateData.consumer_secret = consumer_secret;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (store_type !== undefined) updateData.store_type = store_type;
        if (name !== undefined) updateData.name = name;
        else if (store_url !== undefined) updateData.name = store_url.replace(/^https?:\/\//, '').split('/')[0];

        const { error } = await supabase
            .from('stores')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Delete a store
export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Store id is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('stores')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
