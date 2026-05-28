import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password, fullName, phoneNumber, planId, status, startsAt, endsAt, maxMessages, maxWhatsappNumbers, maxStores } = body;

        if (!email || !password || !planId) {
            return NextResponse.json({ error: 'Email, password, and plan ID are required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 1. Create User in Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                phone: phoneNumber,
            }
        });

        if (authError) {
            throw new Error(`Failed to create auth user: ${authError.message}`);
        }

        const userId = authData.user.id;

        // 2. Ensure User Profile exists/update it
        // The trigger should have created it, but let's safely update it
        const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
                id: userId,
                full_name: fullName,
                phone_number: phoneNumber,
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error('Failed to update profile, but continuing...', profileError);
        }

        // 3. Deactivate existing subscriptions
        await supabase
            .from('subscriptions')
            .update({ status: 'inactive' })
            .eq('user_id', userId)
            .eq('status', 'active');

        // 4. Create Subscription
        const { error: subError } = await supabase.from('subscriptions').insert({
            user_id: userId,
            plan_id: planId,
            status: status || 'active',
            starts_at: startsAt || new Date().toISOString(),
            ends_at: endsAt || null,
            max_messages_override: maxMessages || null,
            max_whatsapp_numbers_override: maxWhatsappNumbers || null,
            max_stores_override: maxStores || null,
            messages_used: 0
        });

        if (subError) {
            throw new Error(`Failed to link subscription: ${subError.message}`);
        }

        return NextResponse.json({ success: true, userId });

    } catch (error: any) {
        console.error('Create manual user error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
