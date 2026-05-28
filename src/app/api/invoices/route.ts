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
        const status = searchParams.get('status');
        const limit = parseInt(searchParams.get('limit') || '20');

        let query = supabase
            .from('invoices')
            .select(`
                *,
                plans (name)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({ invoices: data });
    } catch (error: any) {
        console.error('Invoices API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
