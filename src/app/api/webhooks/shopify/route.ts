import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Verify Shopify HMAC signature
function verifyShopifySignature(rawBody: string, hmacHeader: string, apiSecret: string) {
    if (!hmacHeader || !apiSecret) return false;
    const hash = crypto
        .createHmac('sha256', apiSecret)
        .update(rawBody, 'utf8')
        .digest('base64');
    const hashBuffer = Buffer.from(hash);
    const headerBuffer = Buffer.from(hmacHeader);
    return hashBuffer.length === headerBuffer.length &&
        crypto.timingSafeEqual(hashBuffer, headerBuffer);
}

export async function POST(req: Request) {
    try {
        const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
        const topic = req.headers.get('x-shopify-topic'); // e.g., orders/create
        const shopDomain = req.headers.get('x-shopify-shop-domain');

        // Read raw body
        const rawBody = await req.text();
        const payload = JSON.parse(rawBody);

        if (!hmacHeader) {
            return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
        }

        // Get a Service Role Supabase Client
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Webhook processing is not configured' }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 1. Find the store associated with this webhook
        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('store_id');

        if (!storeId) {
            return NextResponse.json({ error: 'Missing store_id in webhook URL' }, { status: 400 });
        }

        // 2. Fetch the Store and Check if active
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('user_id, consumer_secret, is_active, store_url')
            .eq('id', storeId)
            .single();

        if (storeError || !store || !store.is_active) {
            return NextResponse.json({ error: 'Store not found or inactive' }, { status: 404 });
        }

        if (!store.consumer_secret) {
            return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
        }

        const isValid = verifyShopifySignature(rawBody, hmacHeader, store.consumer_secret);
        if (!isValid) {
            console.error(`[Shopify Webhook] Invalid signature for store ${storeId}`);
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }

        // 4. Determine Event Type
        const eventType = topic; // Shopify uses formats like 'orders/create'

        // 5. Fetch Rules for this event
        const { data: rules } = await supabase
            .from('notification_rules')
            .select('*')
            .eq('store_id', storeId)
            .eq('event_type', eventType)
            .eq('is_active', true);

        if (!rules || rules.length === 0) {
            return NextResponse.json({ message: `Event ${eventType} received, no active rules matched` });
        }

        // 6. Check WhatsApp Connection
        const { data: wpConnection } = await supabase
            .from('whatsapp_connections')
            .select('status')
            .eq('user_id', store.user_id)
            .eq('status', 'CONNECTED')
            .single();

        if (!wpConnection) {

            return NextResponse.json({ message: 'No active WhatsApp connection' });
        }

        // 7. Extract Phone Number (Shopify structure: payload.customer.phone or payload.billing_address.phone)
        const rawPhone = payload.phone || payload.customer?.phone || payload.billing_address?.phone || payload.shipping_address?.phone;

        if (!rawPhone) {

            return NextResponse.json({ message: 'No phone number found, skipped' });
        }

        // Clean phone number
        let customerPhone = rawPhone.replace(/[^\d]/g, '');
        if (customerPhone.startsWith('00')) {
            customerPhone = customerPhone.substring(2);
        }



        // --- Data Extraction for Templates ---
        const customerName = payload.customer?.first_name || payload.billing_address?.first_name || 'العميل';
        // Use the already defined customerPhone
        const productList = payload.line_items?.map((item: any) => `- ${item.title} (x${item.quantity})`).join('\n') || 'لا يوجد منتجات';
        const shippingAddress = [
            payload.shipping_address?.address1,
            payload.shipping_address?.city,
            payload.shipping_address?.province,
            payload.shipping_address?.country
        ].filter(Boolean).join(', ') || [
            payload.billing_address?.address1,
            payload.billing_address?.city,
            payload.billing_address?.province,
            payload.billing_address?.country
        ].filter(Boolean).join(', ') || 'غير محدد';

        const orderStatus = payload.financial_status || payload.fulfillment_status || 'unknown';
        const paymentMethod = payload.payment_gateway_names?.[0] || 'غير محدد';
        const itemsCount = payload.line_items?.length?.toString() || '0';
        const currency = payload.currency || 'USD';
        const storeName = store?.store_url || 'متجرك';

        const replacements = {
            '{customer_name}': customerName,
            '{customer_phone}': customerPhone,
            '{order_number}': payload.order_number || payload.id,
            '{order_total}': payload.total_price || payload.total || '0',
            '{order_status}': orderStatus,
            '{payment_method}': paymentMethod,
            '{items_count}': itemsCount,
            '{currency}': currency,
            '{store_name}': storeName,
            '{product_list}': productList,
            '{shipping_address}': shippingAddress
        };

        const applyReplacements = (template: string) => {
            let result = template;
            for (const [key, value] of Object.entries(replacements)) {
                result = result.replace(new RegExp(key, 'g'), value?.toString() || '');
            }
            return result;
        };

        // 8. Queue Messages
        let messagesToInsert = rules.map(rule => {
            const messageBody = applyReplacements(rule.message_template);

            return {
                user_id: store.user_id,
                store_id: storeId,
                recipient_phone: customerPhone,
                message_body: messageBody,
                status: 'PENDING',
                external_id: `shopify_${payload.id}_${eventType}`
            }
        });

        // --- Owner Alert ---
        const { data: adminSettings } = await supabase
            .from('admin_alert_settings')
            .select('*')
            .eq('store_id', storeId)
            .maybeSingle();

        if (adminSettings?.is_enabled && adminSettings?.alert_phone && adminSettings?.enabled_events) {
            const isEventEnabled = Array.isArray(adminSettings.enabled_events) &&
                (adminSettings.enabled_events.includes(eventType));

            if (isEventEnabled) {
                let adminPhone = adminSettings.alert_phone.replace(/[^\d]/g, '');
                if (adminPhone.startsWith('00')) adminPhone = adminPhone.substring(2);

                const customerName = payload.customer?.first_name || payload.billing_address?.first_name || 'العميل';
                const customTemplate = eventType && adminSettings.event_templates?.[eventType];
                let adminMessageBody: string;

                if (customTemplate) {
                    adminMessageBody = applyReplacements(customTemplate);
                } else {
                    adminMessageBody = `🛍️ *طلب جديد من متجرك!*\n\n` +
                        `👤 *العميل:* {customer_name}\n` +
                        `📞 *الهاتف:* {customer_phone}\n` +
                        `💰 *الإجمالي:* {order_total} {currency}\n` +
                        `💳 *الدفع:* {payment_method}\n\n` +
                        `📦 *المنتجات:*\n{product_list}\n\n` +
                        `📍 *العنوان:*\n{shipping_address}\n\n` +
                        `🚀 *بنجو - تجارة أذكى، تواصل أسرع*`;
                    
                    adminMessageBody = applyReplacements(adminMessageBody);
                }

                messagesToInsert.push({
                    user_id: store.user_id,
                    store_id: storeId,
                    recipient_phone: adminPhone,
                    message_body: adminMessageBody,
                    status: 'PENDING',
                    external_id: `shopifyadmin_${payload.id}_${eventType}`
                });
            }
        }

        // --- Run Deduplication Check ---
        if (messagesToInsert.length > 0) {
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
            const bodiesToCheck = [...new Set(messagesToInsert.map(m => m.message_body))];
            
            if (bodiesToCheck.length > 0) {
                const { data: recentMessages, error: checkError } = await supabase
                    .from('message_logs')
                    .select('recipient_phone, message_body')
                    .eq('store_id', storeId)
                    .gte('created_at', oneHourAgo)
                    .in('message_body', bodiesToCheck);
                
                if (!checkError && recentMessages && recentMessages.length > 0) {
                    messagesToInsert = messagesToInsert.filter(m => {
                        return !recentMessages.some(rm => 
                            rm.recipient_phone === m.recipient_phone && rm.message_body === m.message_body
                        );
                    });
                }
            }
        }

        if (messagesToInsert.length > 0) {
            const { error: insertError } = await supabase.from('message_logs').insert(messagesToInsert);
            if (insertError) {
                console.error("[Shopify Webhook] Error inserting message logs:", insertError);
            }
        }

        // --- 9. Upsert Contact ---
        if (customerPhone) {
            const { error: contactError } = await supabase
                .from('contacts')
                .upsert({
                    user_id: store.user_id,
                    phone_number: customerPhone,
                    name: `${payload.customer?.first_name || payload.billing_address?.first_name || ''} ${payload.customer?.last_name || payload.billing_address?.last_name || ''}`.trim() || 'العميل'
                }, { onConflict: 'user_id,phone_number' });
            
            if (contactError) {
                console.error("[Shopify Webhook] Error upserting contact:", contactError);
            }
        }

        return NextResponse.json({ success: true, queued: messagesToInsert.length });

    } catch (error: any) {
        console.error('Shopify Webhook Error:', error);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
