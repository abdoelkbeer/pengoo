import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET() {
    try {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from('billing_packages')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const admin = createAdminClient();
        
        const { id, ...data } = body;

        let result;
        if (id) {
            result = await admin.from('billing_packages').update(data).eq('id', id);
        } else {
            result = await admin.from('billing_packages').insert(data);
        }

        if (result.error) throw result.error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) throw new Error('Package ID is required');

        const admin = createAdminClient();
        const { error } = await admin.from('billing_packages').delete().eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
