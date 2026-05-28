'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { verifyRecaptcha } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    try {
        const supabase = await createClient()
        console.log('Supabase client created')

        // Extract from the form based on actual exact fields in the HTML
        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const recaptchaToken = formData.get('g-recaptcha-response') as string

        // Verify reCAPTCHA
        const isRecaptchaValid = await verifyRecaptcha(recaptchaToken, 'login');
        if (!isRecaptchaValid) {
            console.log('reCAPTCHA verification failed')
            redirect('/auth/login?error=Invalid reCAPTCHA')
            return
        }


        if (!email || !password) {
            console.log('Missing fields')
            redirect('/auth/login?error=Missing Fields')
            return
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            console.error('Supabase auth error:', error.message)
            redirect('/auth/login?error=' + encodeURIComponent(error.message))
            return
        }

        revalidatePath('/', 'layout')
        redirect('/dashboard')
    } catch (err: any) {
        // Next.js redirect() throws a special error, we need to let it bubble up
        if (err?.digest?.startsWith('NEXT_REDIRECT')) {
            throw err
        }
        console.error('Unexpected error in login action:', err)
        redirect('/auth/login?error=An unexpected error occurred. Please try again.')
    }
}

export async function signup(formData: FormData) {
    try {
        const supabase = await createClient()
        console.log('Supabase client created')

        const email = formData.get('email') as string
        const password = formData.get('password') as string
        const name = formData.get('name') as string


        if (!email || !password) {
            console.log('Missing fields')
            redirect('/auth/login?error=Missing Fields')
            return
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                }
            }
        })

        if (error) {
            console.error('Supabase signup error:', error.message)
            redirect('/auth/login?error=' + encodeURIComponent(error.message))
            return
        }

        revalidatePath('/', 'layout')
        redirect('/onboarding')
    } catch (err: any) {
        if (err?.digest?.startsWith('NEXT_REDIRECT')) {
            throw err
        }
        console.error('Unexpected error in signup action:', err)
        redirect('/auth/login?error=An unexpected error occurred. Please try again.')
    }
}

export async function loginWithGoogle() {
    const supabase = await createClient()
    const headersList = await headers()
    const origin =
        headersList.get('origin') ||
        process.env.NEXT_PUBLIC_APP_URL ||
        `https://${headersList.get('host')}`

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
    })

    if (error) {
        console.error('Google login error:', error.message)
        return redirect('/auth/login?error=' + encodeURIComponent(error.message))
    }

    if (data.url) {
        redirect(data.url)
    }
}
