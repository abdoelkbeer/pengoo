import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function verifySallaSignature(payload: string, signature: string, secret: string) {
    if (!secret || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(signature);
    return expectedBuffer.length === signatureBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export async function POST(req: Request) {
    try {
        const rawBody = await req.text();
        const payload = JSON.parse(rawBody);
        const { event, merchant } = payload;

        const signature = req.headers.get('x-salla-signature');
        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        // Extract storeId if passed via query params (custom app), else rely on merchant ID
        const url = new URL(req.url);
        const urlStoreId = url.searchParams.get('store_id');

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Webhook processing is not configured' }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        let storeQuery = supabase.from('stores').select('*, store_url').eq('is_active', true);

        if (urlStoreId) {
            storeQuery = storeQuery.eq('id', urlStoreId);
        } else {
            // Assume merchant ID is saved in consumer_key for Salla
            storeQuery = storeQuery.eq('consumer_key', merchant);
        }

        const { data: store, error: storeError } = await storeQuery.limit(1).single();

        if (storeError || !store) {

            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        if (!store.webhook_secret) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        const isValid = verifySallaSignature(rawBody, signature, store.webhook_secret);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Fetch Rule
        const { data: rule } = await supabase
            .from('notification_rules')
            .select('*')
            .eq('store_id', store.id)
            .eq('event_type', event)
            .eq('is_active', true)
            .single();

        if (!rule) {
            return NextResponse.json({ message: `No active rule for event ${event}` });
        }

        // Check limits
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('messages_used, status, plans(max_messages)')
            .eq('user_id', store.user_id)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const maxMessages = (subscription?.plans as any)?.max_messages || 0;
        const messagesUsed = subscription?.messages_used || 0;
        const isUnlimited = maxMessages === -1 || maxMessages >= 999999;

        if (!isUnlimited && maxMessages > 0 && messagesUsed >= maxMessages) {

            return NextResponse.json({ message: 'Quota exceeded' });
        }

        const wpConnection = await supabase
            .from('whatsapp_connections')
            .select('status')
            .eq('user_id', store.user_id)
            .eq('status', 'CONNECTED')
            .single();

        if (!wpConnection.data) {
            return NextResponse.json({ message: 'No active WhatsApp connection' });
        }

        // Logic to send WhatsApp message
        const customerName = payload.data?.customer?.first_name || 'عميل';
        const customerPhone = payload.data?.customer?.mobile || payload.data?.customer?.mobile_code + payload.data?.customer?.mobile_number || '';
        const orderNumber = payload.data?.reference_id || payload.data?.id || '';
        const orderStatus = payload.data?.status?.name || 'unknown';
        const paymentMethod = payload.data?.payment_method || 'غير محدد';
        const itemsCount = payload.data?.items?.length?.toString() || '0';
        const currency = payload.data?.total?.currency || 'ر.س';
        const storeName = store?.store_url || 'متجرك';

        if (!customerPhone) {
            return NextResponse.json({ message: 'No phone number provided' });
        }

        let cleanedPhone = customerPhone.replace(/[^\d]/g, '');
        if (cleanedPhone.startsWith('00')) cleanedPhone = cleanedPhone.substring(2);

        let messagesToInsert: any[] = [];

        // --- Data Extraction for Templates ---
        // customerPhone is already defined above
        const productList = payload.data?.items?.map((item: any) => `- ${item.name} (x${item.quantity})`).join('\n') || 'لا يوجد منتجات';
        const shippingAddress = payload.data?.shipping?.address?.name || payload.data?.address?.name || 'غير محدد';

        const replacements = {
            '{customer_name}': customerName,
            '{customer_phone}': customerPhone,
            '{order_number}': orderNumber,
            '{order_total}': payload.data?.total?.amount || '0',
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

        const messageBody = applyReplacements(rule.message_template);

        messagesToInsert.push({
            user_id: store.user_id,
            store_id: store.id,
            recipient_phone: cleanedPhone,
            message_body: messageBody,
            status: 'PENDING',
            external_id: `salla_${orderNumber}_${event}`
        });

        // --- Owner Alert ---
        const { data: adminSettings } = await supabase
            .from('admin_alert_settings')
            .select('*')
            .eq('store_id', store.id)
            .maybeSingle();

        if (adminSettings?.is_enabled && adminSettings?.alert_phone && adminSettings?.enabled_events) {
            const isEventEnabled = Array.isArray(adminSettings.enabled_events) &&
                adminSettings.enabled_events.includes(event);

            if (isEventEnabled) {
                let adminPhone = adminSettings.alert_phone.replace(/[^\d]/g, '');
                if (adminPhone.startsWith('00')) adminPhone = adminPhone.substring(2);

                const customTemplate = event && adminSettings.event_templates?.[event];
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
                    store_id: store.id,
                    recipient_phone: adminPhone,
                    message_body: adminMessageBody,
                    status: 'PENDING',
                    external_id: `sallaadmin_${orderNumber}_${event}`
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
                    .eq('store_id', store.id)
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
                console.error("[Salla Webhook] Error inserting message logs:", insertError);
            } else {
                // --- Auto-Trigger Send Engine (fire-and-forget) ---
                const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3001';
                for (const msg of messagesToInsert) {
                    fetch(`${workerUrl}/api/whatsapp/send`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': process.env.WORKER_API_KEY || ''
                        },
                        body: JSON.stringify({
                            userId: msg.user_id,
                            to: msg.recipient_phone,
                            message: msg.message_body,
                            buttons: msg.buttons || null
                        })
                    }).then(async (res) => {
                        const statusUpdate = res.ok
                            ? { status: 'SENT', sent_at: new Date().toISOString() }
                            : { status: 'FAILED', error_details: `Worker returned ${res.status}` };
                        await supabase.from('message_logs').update(statusUpdate).eq('external_id', msg.external_id);
                        if (res.ok) {
                            const { data: sub } = await supabase
                                .from('subscriptions').select('id, messages_used')
                                .eq('user_id', msg.user_id).eq('status', 'active').maybeSingle();
                            if (sub) await supabase.from('subscriptions')
                                .update({ messages_used: (sub.messages_used || 0) + 1 }).eq('id', sub.id);
                        }
                    }).catch(async (err) => {
                        console.error('[Salla Webhook] Auto-send error:', err.message);
                        await supabase.from('message_logs')
                            .update({ status: 'FAILED', error_details: err.message })
                            .eq('external_id', msg.external_id);
                    });
                }
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Salla Webhook Error]:', error);
        return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
    }
}
