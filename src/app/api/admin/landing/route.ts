import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, action, data, id } = body;

        // type: 'service', 'package', 'faq'
        // action: 'create', 'update', 'delete'

        const tableMap: Record<string, string> = {
            service: 'landing_services',
            package: 'landing_packages',
            faq: 'landing_faqs'
        };

        const table = tableMap[type];
        if (!table) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

        const supabase = createAdminClient();

        if (action === 'create') {
            const { data: result, error } = await supabase.from(table).insert([data]).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, data: result });
        }

        else if (action === 'update') {
            if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
            // Add updated_at if updating
            const updateData = { ...data, updated_at: new Date().toISOString() };
            const { data: result, error } = await supabase.from(table).update(updateData).eq('id', id).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, data: result });
        }

        else if (action === 'delete') {
            if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Landing API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
