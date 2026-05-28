import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const connectionId = searchParams.get('connectionId');

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = user.id;

        const query = supabase
            .from('whatsapp_connections')
            .select('id, status, qr_code, phone_number')
            .eq('user_id', userId);

        if (connectionId) {
            query.eq('id', connectionId);
        } else {
            query.order('created_at', { ascending: false }).limit(1);
        }

        const { data: dbConnection } = await query.maybeSingle();

        if (!dbConnection) {
            return NextResponse.json({
                status: 'DISCONNECTED',
                qr: null,
                phoneNumber: null,
                error: null
            });
        }

        return NextResponse.json({
            status: dbConnection.status,
            qr: dbConnection.qr_code,
            phoneNumber: dbConnection.phone_number,
            error: null
        });

    } catch (error: any) {
        console.error('Status check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

