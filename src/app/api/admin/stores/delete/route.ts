import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        const { storeId } = await req.json();

        if (!storeId) {
            return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
        }

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('stores')
            .delete()
            .eq('id', storeId);

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete store error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
