import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { data: adminCheck } = await supabase
        .from('admins')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (!adminCheck) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    let query = supabase
        .from('credit_transactions')
        .select(`
            *,
            user_profiles!credit_transactions_user_id_fkey (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ transactions: data });
}
