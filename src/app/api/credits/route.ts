import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// اليوزر يقدر يشوف رصيده
export async function GET() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { data, error } = await supabase
        .from('user_credits')
        .select('balance, updated_at')
        .eq('user_id', user.id)
        .single();

    if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ balance: data?.balance ?? 0 });
}
