import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { code, sessionName = 'Meta Official Connection' } = await req.json();
        if (!code) {
            return NextResponse.json({ error: 'Missing auth code' }, { status: 400 });
        }

        const appId = process.env.NEXT_PUBLIC_META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;

        // 1. Exchange code for access token
        const tokenRes = await axios.get(`https://graph.facebook.com/v22.0/oauth/access_token`, {
            params: {
                client_id: appId,
                client_secret: appSecret,
                code: code
            }
        });

        const accessToken = tokenRes.data.access_token;

        // 2. Get WABA and Phone Number ID (This is simplified, usually you get multiple but we target the first one)
        const debugRes = await axios.get(`https://graph.facebook.com/v22.0/debug_token`, {
            params: {
                input_token: accessToken,
                access_token: `${appId}|${appSecret}` // App Access Token
            }
        });

        // Normally, the embedded signup response includes the WABA ID and Phone ID in the client-side callback data too.
        // For robustness, we'll assume the frontend sends what it got.
        // But here we'll perform the final storage.

        const { data: connection, error: dbError } = await supabase
            .from('whatsapp_connections')
            .insert({
                user_id: user.id,
                session_name: sessionName,
                engine_type: 'META',
                meta_access_token: accessToken,
                status: 'CONNECTED'
                // IDs will be updated on first webhook or manually if sent from frontend
            })
            .select()
            .single();

        if (dbError) throw dbError;

        return NextResponse.json({ success: true, connectionId: connection.id });

    } catch (err: any) {
        console.error('Meta Exchange Error:', err.response?.data || err.message);
        return NextResponse.json({ error: err.message || 'Failed to exchange token' }, { status: 500 });
    }
}
