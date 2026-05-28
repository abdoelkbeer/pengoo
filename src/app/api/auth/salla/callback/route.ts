import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    const clientId = process.env.SALLA_CLIENT_ID;
    const clientSecret = process.env.SALLA_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/salla/callback`;

    try {
        // Exchange code for token
        const tokenResponse = await fetch('https://accounts.salla.sa/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId!,
                client_secret: clientSecret!,
                grant_type: 'authorization_code',
                code,
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error('Salla Token Error:', tokenData);
            return NextResponse.json({ error: tokenData.error_description || 'Failed to exchange token' }, { status: 500 });
        }

        // Get store info to get the store URL
        const storeResponse = await fetch('https://api.salla.dev/admin/v2/stores/info', {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Accept': 'application/json',
            }
        });
        const storeInfo = await storeResponse.json();
        const storeUrl = storeInfo.data?.domain || storeInfo.data?.url || 'salla_store';

        // Save to database
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600));

        const { data: store, error: dbError } = await supabase
            .from('stores')
            .upsert({
                user_id: user.id,
                store_url: storeUrl,
                store_type: 'salla',
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token,
                expires_at: expiresAt.toISOString(),
                is_active: true,
                webhook_secret: crypto.randomUUID(),
            }, { onConflict: 'user_id,store_type' }) // Assuming a unique constraint or similar logic
            .select()
            .single();

        if (dbError) {
            console.error('Database Error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        // Redirect back to Salla integration page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/integrations/salla?success=true`);
    } catch (error) {
        console.error('Salla OAuth Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
