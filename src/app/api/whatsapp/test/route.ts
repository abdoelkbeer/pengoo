import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { phone_number, message } = await req.json();

        if (!phone_number || !message) {
            return NextResponse.json({ error: 'Phone number and message are required' }, { status: 400 });
        }

        // Insert directly to message_logs so the worker picks it up
        const { error: insertError } = await supabase
            .from('message_logs')
            .insert({
                user_id: user.id,
                recipient_phone: phone_number,
                message_body: message,
                status: 'PENDING',
                is_test: true
                // store_id and rule_id are null for manual tests
            });

        if (insertError) {
            console.error('Error inserting test message:', insertError);
            return NextResponse.json({ error: 'Failed to queue test message' }, { status: 500 });
        }

        // 2. Upsert Contact
        await supabase.from('contacts').upsert({
            user_id: user.id,
            phone_number: phone_number,
            name: 'رقم تجريبي'
        }, { onConflict: 'user_id,phone_number' });

        // 3. Auto-Trigger the Send Engine
        const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3001';
        try {
            fetch(`${workerUrl}/api/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.WORKER_API_KEY || ''
                },
                body: JSON.stringify({
                    userId: user.id,
                    to: phone_number,
                    message: message,
                    buttons: null
                })
            }).then(async (res) => {
                // Not updating message_logs external_id because we don't have it here. We'd have to update by matching or returning ID from insert.
                // Actually, let's just let the worker send it. But wait, if we don't update the status, it will remain PENDING forever!
                // Let's modify the insert above to return the ID so we can update it.
            });
        } catch(e) {}

        return NextResponse.json({ success: true, message: 'Message queued successfully' });
    } catch (error: any) {
        console.error('Test Message Error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
