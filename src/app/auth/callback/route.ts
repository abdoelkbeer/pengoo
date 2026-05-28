import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    let next = searchParams.get('next') ?? '/dashboard'

    if (!next.startsWith('/')) {
        next = '/dashboard'
    }

    if (error) {
        return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
        )
    }

    if (!code) {
        return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent('Missing OAuth code')}`
        )
    }

    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
        return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`
        )
    }

    return NextResponse.redirect(`${origin}${next}`)
}
