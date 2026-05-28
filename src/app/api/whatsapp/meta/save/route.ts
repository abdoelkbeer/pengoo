import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { sessionName, phoneNumberId, wabaId, accessToken, verifyToken } = await req.json();

        if (!phoneNumberId || !accessToken) {
            return NextResponse.json({ error: 'Missing required Meta credentials' }, { status: 400 });
        }

        // 1. Get user subscription and plan limits
        const { data: sub } = await supabase
            .from('subscriptions')
            .select('*, plans(*)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

        const planLimit = sub?.plans?.max_whatsapp_numbers || 1;
        const overrideLimit = sub?.max_whatsapp_numbers_override;
        const finalLimit = overrideLimit !== null && overrideLimit !== undefined ? overrideLimit : planLimit;

        // 2. Count existing connections
        const { count: currentCount } = await supabase
            .from('whatsapp_connections')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if ((currentCount || 0) >= finalLimit) {
            return NextResponse.json({
                error: `لقد وصلت للحد الأقصى للأرقام المسموح بها (${finalLimit}). يرجى ترقية باقتك أو مسح رقم قديم.`
            }, { status: 403 });
        }

        // 3. Insert the connection
        const { data: newConn, error: insertError } = await supabase
            .from('whatsapp_connections')
            .insert({
                user_id: user.id,
                session_name: sessionName || 'Official Meta API',
                engine_type: 'META',
                status: 'CONNECTED', // Meta API is "connected" as soon as credentials are valid
                meta_phone_number_id: phoneNumberId,
                meta_waba_id: wabaId,
                meta_access_token: accessToken,
                meta_verify_token: verifyToken
            })
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            connectionId: newConn.id
        });

    } catch (error: any) {
        console.error('Failed to save Meta WhatsApp connection:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
