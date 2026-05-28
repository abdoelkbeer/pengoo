import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Create a campaign
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, store_id, message_template, target_audience, target_count, scheduled_at, audience_type } = body;

        if (!name) {
            return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('campaigns')
            .insert({
                user_id: user.id,
                store_id: store_id || null,
                name,
                message_template: message_template || null,
                target_audience: target_audience || null,
                target_count: target_count || 0,
                status: scheduled_at ? 'SCHEDULED' : 'DRAFT',
                scheduled_at: scheduled_at || null,
                audience_type: audience_type || 'manual'
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, campaign: data });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Update a campaign
export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, ...updateFields } = body;

        if (!id) {
            return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('campaigns')
            .update({ ...updateFields, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Delete a campaign
export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Campaign id is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
// Handle Campaign Actions (e.g., Launch)
export async function PATCH(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, action } = body;
        let { audience, audienceType } = body;

        if (!id || action !== 'launch') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // 1. Fetch Campaign
        const { data: campaign, error: fetchError } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        // 2. Use audience info from campaign if not provided in body
        if (!audienceType) audienceType = campaign.audience_type;
        if (!audience) audience = campaign.target_audience;

        // 3. Prepare Audience
        let phoneNumbers: string[] = [];

        if (audienceType === 'manual' || audienceType === 'selected') {
            const raw = audience || '';
            phoneNumbers = raw.split(/[\n,]+/).map((p: string) => p.replace(/\D/g, '')).filter((p: string) => p.length >= 8);
        } else if (audienceType === 'all') {
            // Fetch all unique phones from contacts table
            const { data: contacts } = await supabase
                .from('contacts')
                .select('phone_number')
                .eq('user_id', user.id);

            if (contacts) {
                phoneNumbers = Array.from(new Set(contacts.map(c => c.phone_number)));
            }
        }

        if (phoneNumbers.length === 0) {
            return NextResponse.json({ error: 'No valid phone numbers found' }, { status: 400 });
        }

        // 3. Check Subscription Limits
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('messages_used, plans(max_messages)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

        const maxMessages = (subscription?.plans as any)?.max_messages || 0;
        const messagesUsed = subscription?.messages_used || 0;
        const isUnlimited = maxMessages === -1 || maxMessages >= 999999;

        if (!isUnlimited && maxMessages > 0 && (messagesUsed + phoneNumbers.length) > maxMessages) {
            return NextResponse.json({
                error: `Quota exceeded. You are trying to send ${phoneNumbers.length} messages, but you only have ${maxMessages - messagesUsed} messages remaining in your plan.`
            }, { status: 403 });
        }

        // 4. Queue Messages
        const messagesToInsert = phoneNumbers.map(phone => ({
            user_id: user.id,
            store_id: campaign.store_id,
            campaign_id: campaign.id,
            recipient_phone: phone,
            message_body: campaign.message_template,
            status: 'PENDING'
        }));

        // Batch insert (Supabase handles large inserts well, but let's be safe if it's huge)
        const { error: insertError } = await supabase
            .from('message_logs')
            .insert(messagesToInsert);

        if (insertError) {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // 5. Batch Upsert Contacts
        const contactsToUpsert = phoneNumbers.map(phone => ({
            user_id: user.id,
            phone_number: phone,
            name: null // We don't have individual names in manual/all audience types yet
        }));

        if (contactsToUpsert.length > 0) {
            // Upsert with onConflict to avoid duplicates and errors
            const { error: contactError } = await supabase
                .from('contacts')
                .upsert(contactsToUpsert, { onConflict: 'user_id,phone_number' });

            if (contactError) {
                console.error("[Campaign] Error upserting contacts:", contactError);
            }
        }

        // 4. Update Campaign Status
        await supabase
            .from('campaigns')
            .update({
                status: 'ACTIVE',
                target_count: phoneNumbers.length,
                sent_count: 0,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        // 5. Auto-trigger the WhatsApp sender engine (fire-and-forget)
        try {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
            fetch(`${baseUrl}/api/whatsapp/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.WORKER_API_KEY || ''
                },
                body: JSON.stringify({ userId: user.id })
            }).catch(err => console.error('[Campaign] Auto-trigger error:', err));
        } catch (triggerErr) {
            console.error('[Campaign] Failed to auto-trigger sender:', triggerErr);
        }

        return NextResponse.json({
            success: true,
            count: phoneNumbers.length,
            message: `Successfully queued ${phoneNumbers.length} messages.`
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
