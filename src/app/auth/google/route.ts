import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function getOrigin(request: Request) {
    const url = new URL(request.url)
    return url.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export async function GET(request: Request) {
    const supabase = await createClient()
    const origin = getOrigin(request)

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
    })

    if (error) {
        return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
        )
    }

    if (!data.url) {
        return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent('Google login is unavailable')}`
        )
    }

    return NextResponse.redirect(data.url)
}
