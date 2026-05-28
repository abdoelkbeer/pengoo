import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { store_id, event_type, phone_number, payload } = await req.json();

        if (!store_id || !event_type || !phone_number) {
            return NextResponse.json({ error: 'Store ID, Event Type, and Phone Number are required' }, { status: 400 });
        }

        // 1. Fetch the active rule for this event
        const { data: rules } = await supabase
            .from('notification_rules')
            .select('*')
            .eq('store_id', store_id)
            .eq('event_type', event_type)
            .eq('is_active', true);

        if (!rules || rules.length === 0) {
            return NextResponse.json({
                error: `لا توجد قاعدة إشعارات مفعلة للحدث: ${event_type}`,
                success: false
            }, { status: 404 });
        }

        const rule = rules[0];
        let messageBody = rule.message_template;

        // 2. Format the message using the mock payload
        messageBody = messageBody.replace(/{customer_name}/g, payload.billing?.first_name || 'عميل تجريبي');
        messageBody = messageBody.replace(/{order_number}/g, payload.id || '9999');
        messageBody = messageBody.replace(/{order_total}/g, payload.total || '0');
        messageBody = messageBody.replace(/{customer_phone}/g, phone_number || '');
        messageBody = messageBody.replace(/{product_list}/g, 'منتج تجريبي ×1');
        messageBody = messageBody.replace(/{shipping_address}/g, 'عنوان شحن تجريبي');

        // Add fake tracking if it exists in the template
        messageBody = messageBody.replace(/{tracking_number}/g, 'TRK-123456789');
        messageBody = messageBody.replace(/{note}/g, 'هذه ملاحظة تجريبية تمت إضافتها للطلب.');
        messageBody = messageBody.replace(/{store_name}/g, 'متجرك');

        // 2.5 Construct Buttons from rule.buttons_config
        let buttons = null;
        if (rule.buttons_config) {
            const btns: { id: string; text: string }[] = [];
            if (rule.buttons_config.confirm) {
                btns.push({ id: `confirm_${store_id}_${payload.id || '9999'}_${rule.id}`, text: 'تأكيد الطلب' });
            }
            if (rule.buttons_config.cancel) {
                btns.push({ id: `cancel_${store_id}_${payload.id || '9999'}_${rule.id}`, text: 'إلغاء الطلب' });
            }
            if (rule.buttons_config.support) {
                btns.push({ id: `support_${store_id}`, text: 'خدمة العملاء' });
            }
            if (btns.length > 0) {
                buttons = btns;
            }
        }

        // 3. Insert into message_logs as PENDING
        const { error: insertError } = await supabase
            .from('message_logs')
            .insert({
                user_id: user.id,
                recipient_phone: phone_number,
                message_body: messageBody,
                status: 'PENDING',
                store_id: store_id,
                is_test: true,
                buttons: buttons
            });

        if (insertError) {
            console.error('Error inserting simulated message:', insertError);
            return NextResponse.json({ error: 'Failed to queue simulated message' }, { status: 500 });
        }

        // 4. Upsert Contact
        await supabase.from('contacts').upsert({
            user_id: user.id,
            phone_number: phone_number,
            name: payload.billing?.first_name ? `${payload.billing.first_name} ${payload.billing.last_name || ''}`.trim() : 'عميل تجريبي'
        }, { onConflict: 'user_id,phone_number' });

        return NextResponse.json({
            success: true,
            message: 'تمت المحاكاة وإدراج الرسالة في الطابور بنجاح'
        });

    } catch (error: any) {
        console.error('Simulate API Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
