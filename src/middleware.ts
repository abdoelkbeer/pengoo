import { updateSession } from '@/utils/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
    const response = await updateSession(request)

    // Admin route protection: check if user is in the admins table
    if (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/api/admin')) {
        try {
            const { createServerClient } = await import('@supabase/ssr')
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return request.cookies.getAll()
                        },
                        setAll() { },
                    },
                }
            )
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                const url = request.nextUrl.clone()
                url.pathname = '/auth/login'
                return NextResponse.redirect(url)
            }

            // Use service role to check admins table (bypasses RLS)
            const adminClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                { auth: { autoRefreshToken: false, persistSession: false } }
            )
            const { data: admin } = await adminClient
                .from('admins')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle()

            if (!admin) {
                const url = request.nextUrl.clone()
                url.pathname = '/dashboard'
                return NextResponse.redirect(url)
            }
        } catch (error) {
            console.error('[Middleware] Admin check failed:', error)
            // If check fails, redirect to dashboard for safety
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
