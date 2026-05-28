import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Create a notification rule
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { store_id, event_type, message_template, is_active, language, buttons_config } = body;

        if (!store_id || !event_type || !message_template) {
            return NextResponse.json({ error: 'store_id, event_type, and message_template are required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('notification_rules')
            .insert({
                user_id: user.id,
                store_id,
                event_type,
                message_template,
                is_active: is_active !== undefined ? is_active : true,
                language: language || 'ar',
                buttons_config: buttons_config || { confirm: false, cancel: false, support: false }
            })
            .select()
            .single();

        if (error) {
            console.error('[API Notifications] Create Error:', error.message);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, rule: data });
    } catch (error: any) {
        console.error('[API Notifications] POST Internal Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// Update a notification rule
export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, event_type, message_template, is_active, language, buttons_config } = body;

        if (!id) {
            return NextResponse.json({ error: 'Rule id is required' }, { status: 400 });
        }

        const updateData: any = { updated_at: new Date().toISOString() };
        if (event_type !== undefined) updateData.event_type = event_type;
        if (message_template !== undefined) updateData.message_template = message_template;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (language !== undefined) updateData.language = language;
        if (buttons_config !== undefined) updateData.buttons_config = buttons_config;

        const { error } = await supabase
            .from('notification_rules')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('[API Notifications] Update Error:', error.message);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API Notifications] PUT Internal Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// Delete a notification rule
export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Rule id is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('notification_rules')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('[API Notifications] Delete Error:', error.message);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[API Notifications] DELETE Internal Error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
