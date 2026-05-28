import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const storeId = searchParams.get('storeId');

        let query = supabase
            .from('admin_alert_settings')
            .select('*')
            .eq('user_id', user.id);

        if (storeId) {
            query = query.eq('store_id', storeId);
        } else {
            // Fallback for global or old settings without store
            query = query.is('store_id', null);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;

        return NextResponse.json({ success: true, settings: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { alert_phone, is_enabled, enabled_events, event_templates, store_id } = await req.json();

        // Note: Make sure there's a unique constraint on (user_id, store_id) in the DB
        // or upsert based on id if it exists. Upsert needs the unique columns.
        const { data, error } = await supabase
            .from('admin_alert_settings')
            .upsert({
                user_id: user.id,
                store_id: store_id || null,
                alert_phone,
                is_enabled,
                enabled_events,
                event_templates: event_templates || {},
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,store_id' }) 
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, settings: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
