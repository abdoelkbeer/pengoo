import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, data } = body;
        const supabase = createAdminClient();

        if (!id) {
            // If no ID, update the first one
            const { data: firstRow } = await supabase.from('platform_settings').select('id').limit(1).single();
            if (firstRow) {
                const { error } = await supabase.from('platform_settings').update({ ...data, updated_at: new Date() }).eq('id', firstRow.id);
                if (error) throw error;
            }
        } else {
            const { error } = await supabase.from('platform_settings').update({ ...data, updated_at: new Date() }).eq('id', id);
            if (error) throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Settings Admin API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
