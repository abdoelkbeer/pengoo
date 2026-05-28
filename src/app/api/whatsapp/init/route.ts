import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        // 1. Get user subscription and plan limits
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('*, plans(*)')
            .eq('user_id', userId)
            .eq('status', 'active')
            .maybeSingle();

        const planLimit = sub?.plans?.max_whatsapp_numbers || 1;
        const overrideLimit = sub?.max_whatsapp_numbers_override;
        const finalLimit = overrideLimit !== null && overrideLimit !== undefined ? overrideLimit : planLimit;

        // 2. Count existing connections
        const { count: currentCount } = await supabase
            .from('whatsapp_connections')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        let connectionId: string;

        // 3. Decide whether to create new or reuse an initializing/disconnected one
        const { data: existing } = await supabase
            .from('whatsapp_connections')
            .select('id, status')
            .eq('user_id', userId)
            .in('status', ['INITIALIZING', 'DISCONNECTED', 'QR_READY'])
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (existing) {
            connectionId = existing.id;
            await supabase
                .from('whatsapp_connections')
                .update({
                    status: 'INITIALIZING',
                    qr_code: null,
                    phone_number: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', connectionId);
        } else {
            // Check if we can add a new one
            if ((currentCount || 0) >= finalLimit) {
                return NextResponse.json({
                    error: `لقد وصلت للحد الأقصى للأرقام المسموح بها (${finalLimit}). يرجى ترقية باقتك أو مسح رقم قديم.`
                }, { status: 403 });
            }

            const { data: newConn, error: insertError } = await supabase
                .from('whatsapp_connections')
                .insert({
                    user_id: userId,
                    session_name: `رقم ${(currentCount || 0) + 1}`,
                    status: 'INITIALIZING',
                    qr_code: null,
                    phone_number: null
                })
                .select()
                .single();

            if (insertError) throw insertError;
            connectionId = newConn.id;
        }

        // 4. Call the external worker with connectionId
        const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3001';
        const response = await fetch(`${workerUrl}/api/whatsapp/init`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.WORKER_API_KEY || ''
            },
            body: JSON.stringify({ userId, connectionId, forceNew: true })
        });

        if (!response.ok) {
            throw new Error('Worker failed to initialize session');
        }

        return NextResponse.json({
            success: true,
            status: 'INITIALIZING',
            connectionId
        });

    } catch (error: any) {
        console.error('Failed to init WhatsApp:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

