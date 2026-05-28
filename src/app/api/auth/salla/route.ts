import { NextResponse } from 'next/server';

export async function GET() {
    const clientId = process.env.SALLA_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/salla/callback`;

    if (!clientId) {
        return NextResponse.json({ error: 'Salla Client ID not configured' }, { status: 500 });
    }

    const sallaAuthUrl = `https://accounts.salla.sa/oauth2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=offline_access%20stores.read%20orders.read%20webhooks.write&state=pengoo_auth`;

    return NextResponse.redirect(sallaAuthUrl);
}
