import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function verifyWooCommerceSignature(payload: string, signature: string, secret: string) {
    if (!signature || !secret) return false;

    const expected = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    return signatureBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('x-wc-webhook-signature');
        const topic = req.headers.get('x-wc-webhook-topic'); // e.g., order.created, order.updated

        // Read raw body
        const rawBody = await req.text();
        const payload = JSON.parse(rawBody);

        if (!signature) {
            return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
        }

        // Get a Service Role Supabase Client to bypass RLS for incoming external webhooks
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'Webhook processing is not configured' }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // 1. Find the store associated with this webhook (assuming webhook URL has ?store_id=... or we match by URL)
        const { searchParams } = new URL(req.url);
        const storeIdParam = searchParams.get('store_id');
        const storeUrlParam = searchParams.get('store_url');

        if (!storeIdParam && !storeUrlParam) {
            return NextResponse.json({ error: 'Missing store_id or store_url in webhook URL' }, { status: 400 });
        }

        // 2. Fetch the Store and Check if active
        let storeQuery = supabase
            .from('stores')
            .select('id, user_id, webhook_secret, is_active, store_url, site_language');
            
        if (storeIdParam) {
            storeQuery = storeQuery.eq('id', storeIdParam);
        } else if (storeUrlParam) {
            storeQuery = storeQuery.eq('store_url', storeUrlParam);
        }

        const { data: store, error: storeError } = await storeQuery.single();

        if (storeError || !store || !store.is_active) {
            return NextResponse.json({ error: 'Store not found or inactive' }, { status: 404 });
        }
        
        const storeId = store.id;

        if (!store.webhook_secret) {
            return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
        }

        const isValid = verifyWooCommerceSignature(rawBody, signature, store.webhook_secret);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
        }

        // 4. Determine Exact Event Type
        let eventType = topic;
        // If order webhook, append the exact status so we match specific rules like 'order.processing', 'order.completed'
        if ((topic === 'order.created' || topic === 'order.updated') && payload.status) {
            eventType = `order.${payload.status}`;
        }

        // 5. Determine the language for template matching
        const siteLanguage = payload?.site_language || store?.site_language || 'ar';

        // 6. Fetch the User's corresponding Notification Rules for this specific event type and language
        // Try specific language first, then fall back to 'ar'
        let { data: rules } = await supabase
            .from('notification_rules')
            .select('*')
            .eq('store_id', storeId)
            .in('event_type', [eventType, topic])
            .eq('is_active', true)
            .eq('language', siteLanguage);

        // Fallback to Arabic if no rules found for the site language
        if ((!rules || rules.length === 0) && siteLanguage !== 'ar') {
            const fallback = await supabase
                .from('notification_rules')
                .select('*')
                .eq('store_id', storeId)
                .in('event_type', [eventType, topic])
                .eq('is_active', true)
                .eq('language', 'ar');
            rules = fallback.data;
        }

        if (!rules || rules.length === 0) {
            // No rules defined for this event, stop here.
            return NextResponse.json({ message: `Event ${eventType} or ${topic} received, no active rules matched` });
        }

        // 5. Check if user has an active WhatsApp Connection
        const { data: wpConnection } = await supabase
            .from('whatsapp_connections')
            .select('id, status, phone_number')
            .eq('user_id', store.user_id)
            .eq('status', 'CONNECTED')
            .limit(1)
            .maybeSingle();

        if (!wpConnection) {
            // User hasn't connected WhatsApp, just return. (Or log a failed intent)

            return NextResponse.json({ message: 'No active WhatsApp connection for this user' });
        }

        // 5.5 Check Subscription Limits
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

        // If maxMessages > 0, it means it's limited.
        if (!isUnlimited && maxMessages > 0 && messagesUsed >= maxMessages) {

            return NextResponse.json({ message: 'Quota exceeded for this user' });
        }

        // 6. Process rules & Queue Messages (Basic string replacement)
        const rawPhone = payload?.billing?.phone || payload?.shipping?.phone;
        const customerName = payload?.billing?.first_name || 'العميل';
        const orderStatus = payload?.status || 'unknown';
        const paymentMethod = payload?.payment_method_title || 'غير محدد';
        const itemsCount = payload?.line_items?.length?.toString() || '0';
        const currency = payload?.currency || 'ج.م';
        const storeName = store?.store_url || 'متجرك'; // In the future, we might have a store_name field

        // Fetch Admin Global Alert Settings for this specific store
        const { data: adminSettings } = await supabase
            .from('admin_alert_settings')
            .select('*')
            .eq('store_id', storeId)
            .maybeSingle();

        // --- Data Extraction for Templates ---
        const customerPhone = rawPhone?.replace(/[^\d]/g, '') || 'غير محدد';
        const productList = payload.line_items?.map((item: any) => `- ${item.name} (x${item.quantity})`).join('\n') || 'لا يوجد منتجات';
        const shippingAddress = [
            payload.shipping?.address_1,
            payload.shipping?.city,
            payload.shipping?.state,
            payload.shipping?.country
        ].filter(Boolean).join(', ') || [
            payload.billing?.address_1,
            payload.billing?.city,
            payload.billing?.state,
            payload.billing?.country
        ].filter(Boolean).join(', ') || 'غير محدد';

        const replacements = {
            '{customer_name}': customerName,
            '{customer_phone}': customerPhone,
            '{order_number}': payload.id,
            '{order_total}': payload.total,
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

        const messagesToInsert: any[] = [];

        // --- 1. Process Customer Notification Rules ---
        const contactsToUpsert: any[] = [];
        
        rules.forEach(rule => {
            let messageBody = applyReplacements(rule.message_template);

            // 1. Message to Customer
            if (rawPhone) {
                let customerPhone = rawPhone.replace(/[^\d]/g, '');
                if (customerPhone.startsWith('00')) customerPhone = customerPhone.substring(2);

                // 1.1 Construct Buttons if enabled
                let buttons = null;
                if (rule.buttons_config) {
                    const btns: any[] = [];
                    let appendedInstructions = '\n\n---\n*للرد على هذه الرسالة:*\n';
                    let hasButtons = false;
                    
                    if (Array.isArray(rule.buttons_config)) {
                        // New dynamic buttons array
                        rule.buttons_config.forEach((btn: any, idx: number) => {
                            if (btn.text && btn.action !== 'none') {
                                let actionDesc = 'الرجاء إرسال';
                                if (btn.action === 'wc_meta_confirm') actionDesc = 'لتأكيد الطلب أرسل';
                                else if (btn.action === 'wc_meta_cancel') actionDesc = 'لإلغاء الطلب أرسل';
                                else if (btn.action === 'wc_meta_support') actionDesc = 'للتواصل مع الدعم الفني أرسل';
                                
                                appendedInstructions += `- ${actionDesc}: *${btn.text}*\n`;
                                hasButtons = true;

                                // ID format: act:{rule_id}:{btn_index}:{order_id}
                                btns.push({ 
                                    id: `act:${rule.id}:${idx}:${payload.id}`, 
                                    text: btn.text 
                                });
                            }
                        });
                    }

                    if (hasButtons) {
                        messageBody += appendedInstructions;
                    }

                    if (btns.length > 0) {
                        buttons = btns.slice(0, 3); // WhatsApp limit
                    }
                }

                messagesToInsert.push({
                    user_id: store.user_id,
                    store_id: storeId,
                    recipient_phone: customerPhone,
                    message_body: messageBody,
                    status: 'PENDING',
                    connection_id: wpConnection.id,
                    external_id: `wc_${payload.id}_${topic}_${rule.id}`, // Unique per rule & status
                    buttons: buttons
                });

                // Add to contacts upsert list
                contactsToUpsert.push({
                    user_id: store.user_id,
                    phone_number: customerPhone,
                    name: `${payload?.billing?.first_name || ''} ${payload?.billing?.last_name || ''}`.trim() || customerName
                });
            }
        });

        // --- 2. Handle Direct Store Owner Global Alerts ---
        if (adminSettings?.is_enabled && adminSettings?.alert_phone && adminSettings?.enabled_events) {
            // Check if the current event is enabled for the owner
            const isEventEnabled = Array.isArray(adminSettings.enabled_events) &&
                (adminSettings.enabled_events.includes(eventType) || adminSettings.enabled_events.includes(topic));

            if (isEventEnabled) {
                let adminPhone = adminSettings.alert_phone.replace(/[^\d]/g, '');
                if (adminPhone.startsWith('00')) adminPhone = adminPhone.substring(2);

                // Use custom template if set, otherwise use default
                const customTemplate = (eventType && adminSettings.event_templates?.[eventType]) || (topic && adminSettings.event_templates?.[topic]);
                let adminMessageBody: string;

                if (customTemplate) {
                    adminMessageBody = applyReplacements(customTemplate);
                } else {
                    adminMessageBody = `🛍️ *طلب جديد من متجرك!*\n\n` +
                        `👤 *العميل:* {customer_name}\n` +
                        `📞 *الهاتف:* {customer_phone}\n` +
                        `💰 *الإجمالي:* {order_total} {currency}\n` +
                        `✅ *الحالة:* {order_status}\n\n` +
                        `━━━━━━━━━━━━━━━\n` +
                        `للمتابعة: pengoo.net/dashboard/orders/{order_number}`;
                }

                messagesToInsert.push({
                    user_id: store.user_id,
                    store_id: storeId,
                    recipient_phone: adminPhone,
                    message_body: adminMessageBody,
                    status: 'PENDING',
                    connection_id: wpConnection.id,
                    external_id: `admin_${payload.id}_${topic}` // Unique per status & store
                });
            }
        }

        // --- 3. Run De-duplication Check & Insert ---
        let filteredMessages: any[] = [];
        if (messagesToInsert.length > 0) {
            const extIds = messagesToInsert.map(m => m.external_id).filter(Boolean);
            
            if (extIds.length > 0) {
                // Query database to find existing messages with these external_ids
                const { data: existingLogs } = await supabase
                    .from('message_logs')
                    .select('external_id')
                    .in('external_id', extIds);

                const existingSet = new Set(existingLogs?.map(l => l.external_id) || []);
                filteredMessages = messagesToInsert.filter(m => !m.external_id || !existingSet.has(m.external_id));
            } else {
                filteredMessages = messagesToInsert;
            }

            if (filteredMessages.length > 0) {
                const { error: insertError } = await supabase
                    .from('message_logs')
                    .insert(filteredMessages);

                if (insertError) {
                    console.error("[Webhook] Error inserting message logs:", insertError);
                }
            } else {
                console.log("[Webhook] All messages filtered out as duplicates.");
            }
        }

        // --- 4. Upsert Contacts ---
        if (contactsToUpsert.length > 0) {
            const uniqueContacts = Array.from(new Map(contactsToUpsert.map(c => [c.phone_number, c])).values());
            const { error: contactError } = await supabase
                .from('contacts')
                .upsert(uniqueContacts, { onConflict: 'user_id,phone_number' });
            
            if (contactError) {
                console.error("[Webhook] Error upserting contacts:", contactError);
            }
        }

        // --- 5. Auto-Trigger the Send Engine ---
        // Fire-and-forget: dispatch pending messages immediately after queueing
        if (filteredMessages.length > 0) {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3001';
            try {
                // Directly call worker for each message (faster, no auth needed)
                for (const msg of filteredMessages) {
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
                        if (res.ok) {
                            // Mark as SENT
                            await supabase
                                .from('message_logs')
                                .update({ status: 'SENT', sent_at: new Date().toISOString() })
                                .eq('external_id', msg.external_id);

                            // Increment subscription usage
                            const { data: sub } = await supabase
                                .from('subscriptions')
                                .select('id, messages_used')
                                .eq('user_id', msg.user_id)
                                .eq('status', 'active')
                                .maybeSingle();
                            if (sub) {
                                await supabase
                                    .from('subscriptions')
                                    .update({ messages_used: (sub.messages_used || 0) + 1 })
                                    .eq('id', sub.id);
                            }
                        } else {
                            // Mark as FAILED
                            await supabase
                                .from('message_logs')
                                .update({ status: 'FAILED', error_details: `Worker returned ${res.status}` })
                                .eq('external_id', msg.external_id);
                        }
                    }).catch(async (err) => {
                        console.error('[Webhook] Auto-send error:', err.message);
                        await supabase
                            .from('message_logs')
                            .update({ status: 'FAILED', error_details: err.message })
                            .eq('external_id', msg.external_id);
                    });
                }
            } catch (triggerErr: any) {
                console.error('[Webhook] Failed to trigger send engine:', triggerErr.message);
            }
        }

        return NextResponse.json({ success: true, processedMessages: filteredMessages.length });

    } catch (error: any) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
