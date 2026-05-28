import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Get settings
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('abandoned_cart_settings')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            settings: data || { is_enabled: false, steps: [] }
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Save settings (upsert)
export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { is_enabled, steps } = body;

        const { error } = await supabase
            .from('abandoned_cart_settings')
            .upsert({
                user_id: user.id,
                is_enabled: is_enabled ?? false,
                steps: steps || [],
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
