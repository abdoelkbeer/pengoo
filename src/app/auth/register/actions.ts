'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { verifyRecaptcha } from '@/utils/auth'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string
    const recaptchaToken = formData.get('g-recaptcha-response') as string

    // Verify reCAPTCHA
    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
        return redirect('/auth/register?error=Invalid reCAPTCHA')
    }

    if (!email || !password) {
        return redirect('/auth/register?error=Missing Fields')
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
        return redirect('/auth/register?error=' + error.message)
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
}
