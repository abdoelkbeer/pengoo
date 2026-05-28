import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, maxMessages, maxWhatsappNumbers, maxStores, planId, status, startsAt, endsAt, fullName, phoneNumber } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // 0. Update Profile if provided
        if (fullName) {
            await supabase.from('user_profiles').update({ 
                full_name: fullName, 
                phone_number: phoneNumber, 
                updated_at: new Date().toISOString() 
            }).eq('id', userId);
        }

        // 1. Get all active subscriptions for this user
        const { data: activeSubs, error: subsError } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (subsError) throw subsError;

        // 2. Identify target subscription or create one
        let targetSubId = activeSubs && activeSubs.length > 0 ? activeSubs[0].id : null;

        // Deactivate others if there are multiple
        if (activeSubs && activeSubs.length > 1) {
            const others = activeSubs.slice(1).map(s => s.id);
            await supabase
                .from('subscriptions')
                .update({ status: 'inactive' })
                .in('id', others);
        }

        if (!targetSubId) {
            // Check if there is ANY subscription at all to reuse
            const { data: anySub } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            
            if (anySub) {
                targetSubId = anySub.id;
            }
        }

        if (!targetSubId) {
             // Create new if none exists
             if (!planId) return NextResponse.json({ error: 'Plan ID required for new subscription' }, { status: 400 });
             const { error: insertError } = await supabase.from('subscriptions').insert({
                 user_id: userId,
                 plan_id: planId,
                 status: status || 'active',
                 starts_at: startsAt || new Date().toISOString(),
                 ends_at: endsAt || null,
                 max_messages_override: maxMessages,
                 max_whatsapp_numbers_override: maxWhatsappNumbers,
                 max_stores_override: maxStores,
                 messages_used: 0
             });
             if (insertError) throw insertError;
        } else {
            // Update existing
            const updates: any = {
                max_messages_override: maxMessages,
                max_whatsapp_numbers_override: maxWhatsappNumbers,
                max_stores_override: maxStores,
                updated_at: new Date().toISOString()
            };
            if (planId !== undefined) updates.plan_id = planId;
            if (status !== undefined) updates.status = status;
            if (startsAt !== undefined) updates.starts_at = startsAt;
            if (endsAt !== undefined) updates.ends_at = (endsAt === '' || endsAt === null) ? null : endsAt;

            const { error: updateError } = await supabase
                .from('subscriptions')
                .update(updates)
                .eq('id', targetSubId);

            if (updateError) throw updateError;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Update subscription error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
