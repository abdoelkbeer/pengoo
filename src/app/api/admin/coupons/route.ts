import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
    try {
        const supabase = createAdminClient();
        const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, data, id } = body;
        const supabase = createAdminClient();

        if (action === 'create') {
            const { data: result, error } = await supabase.from('coupons').insert([data]).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, data: result });
        }

        else if (action === 'update') {
            if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
            const updateData = { ...data, updated_at: new Date().toISOString() };
            delete (updateData as any).id;
            delete (updateData as any).created_at;

            const { data: result, error } = await supabase.from('coupons').update(updateData).eq('id', id).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, data: result });
        }

        else if (action === 'delete') {
            if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
            const { error } = await supabase.from('coupons').delete().eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Coupons Admin API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
