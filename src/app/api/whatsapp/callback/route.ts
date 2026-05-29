import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const apiKey = req.headers.get('x-api-key');
        if (apiKey !== process.env.WORKER_API_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { from, buttonId } = await req.json();
        console.log(`[WhatsApp Callback] Received button click: ${buttonId} from ${from}`);

        // --- New Dynamic Buttons Handling ---
        if (buttonId.startsWith('act:')) {
            const [, ruleId, btnIndex, orderId] = buttonId.split(':');
            const idx = parseInt(btnIndex);

            // 1. Fetch the rule to get the config and user/store context
            const { data: rule, error: ruleError } = await supabase
                .from('notification_rules')
                .select('*, user_id, store_id, buttons_config')
                .eq('id', ruleId)
                .single();

            if (ruleError || !rule) {
                console.error('[Callback] Rule not found:', ruleError);
                return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
            }

            const buttons = Array.isArray(rule.buttons_config) ? rule.buttons_config : [];
            const btnConfig = buttons[idx];

            if (!btnConfig) {
                console.error('[Callback] Button config not found for index:', idx);
                return NextResponse.json({ error: 'Button config not found' }, { status: 400 });
            }

            // 2. Fetch store credentials
            const { data: store, error: storeError } = await supabase
                .from('stores')
                .select('*')
                .eq('id', rule.store_id)
                .single();

            if (storeError || !store) {
                console.error('[Callback] Store not found:', storeError);
                return NextResponse.json({ error: 'Store not found' }, { status: 404 });
            }

            // 3. Execute Action if needed
            if (btnConfig.action && btnConfig.action.startsWith('wc_meta_')) {
                let metaValue = '';
                if (btnConfig.action === 'wc_meta_confirm') metaValue = 'تأكيد';
                else if (btnConfig.action === 'wc_meta_cancel') metaValue = 'إلغاء';
                else if (btnConfig.action === 'wc_meta_support') metaValue = 'تواصل مع الدعم الفني';

                if (metaValue) {
                    const cleanUrl = store.store_url.replace(/\/$/, '');
                    try {
                        console.log(`[Callback] Updating order ${orderId} meta 'whatsapp_response' to ${metaValue}`);
                        const wcRes = await fetch(`${cleanUrl}/wp-json/pengoo/v1/order-action`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-pengoo-secret': store.webhook_secret || '',
                                'Authorization': 'Basic ' + Buffer.from(`${store.consumer_key}:${store.consumer_secret}`).toString('base64')
                            },
                            body: JSON.stringify({
                                order_id: orderId,
                                action: btnConfig.action,
                                response: metaValue,
                                secret: store.webhook_secret
                            })
                        });
                        if (!wcRes.ok) {
                            const errorText = await wcRes.text();
                            console.error('[Callback] WC Update Meta Failed:', errorText);
                        }
                    } catch (err) {
                        console.error('[Callback] WC Meta Error:', err);
                    }
                }
            }

            // 4. Send the Auto-Reply
            const replyMsg = btnConfig.reply || btnConfig.reply_text;
            if (replyMsg) {
                const workerUrl = `${process.env.WORKER_URL || 'http://localhost:3001'}/api/whatsapp/send`;
                try {
                    await fetch(workerUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': process.env.WORKER_API_KEY!
                        },
                        body: JSON.stringify({
                            userId: rule.user_id,
                            to: from,
                            message: replyMsg
                        })
                    });
                } catch (err) {
                    console.error('[Callback] Failed to send auto-reply:', err);
                }
            }
            
            return NextResponse.json({ success: true });
        }

        // --- Legacy Buttons Handling (Confirm/Cancel) ---
        if (buttonId.startsWith('confirm_') || buttonId.startsWith('cancel_')) {
            const parts = buttonId.split('_');
            const action = parts[0];
            const storeId = parts[1];
            const orderId = parts[2];
            
            const { data: store } = await supabase.from('stores').select('*').eq('id', storeId).single();
            if (store) {
                const targetStatus = action === 'confirm' ? 'processing' : 'cancelled';
                const statusMessage = action === 'confirm' ? 'تم تأكيد طلبك بنجاح ✅' : 'تم إلغاء طلبك بناءً على طلبك ❌';
                
                const cleanUrl = store.store_url.replace(/\/$/, '');
                await fetch(`${cleanUrl}/wp-json/wc/v3/orders/${orderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + Buffer.from(`${store.consumer_key}:${store.consumer_secret}`).toString('base64')
                    },
                    body: JSON.stringify({ status: targetStatus })
                });

                await fetch(`${cleanUrl}/wp-json/pengoo/v1/order-action`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-pengoo-secret': store.webhook_secret || '',
                        'Authorization': 'Basic ' + Buffer.from(`${store.consumer_key}:${store.consumer_secret}`).toString('base64')
                    },
                    body: JSON.stringify({
                        order_id: orderId,
                        action: action === 'confirm' ? 'confirmed' : 'cancelled',
                        secret: store.webhook_secret
                    })
                }).catch((err) => console.error('[Callback] Pengoo legacy order action error:', err));

                const workerUrl = `${process.env.WORKER_URL || 'http://localhost:3001'}/api/whatsapp/send`;
                await fetch(workerUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.WORKER_API_KEY! },
                    body: JSON.stringify({ userId: store.user_id, to: from, message: statusMessage })
                });
            }
            return NextResponse.json({ success: true });
        }

        // --- Support Button Legacy ---
        if (buttonId.startsWith('support_')) {
            console.log('[Callback] Support button clicked');
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Callback] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
