import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Ideally we should verify if the user is a super_admin.
        // For now, we trust the token (we can add a role check here later).

        const body = await request.json();
        const { amount, description } = body; // amount can be positive or negative

        if (!amount || amount === 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const { userId } = await params;

        // 1. Get current user wallet balance
        const { data: userData, error: userError } = await supabaseAdmin
            .from('user_credits')
            .select('balance')
            .eq('user_id', userId)
            .single();

        if (userError && userError.code !== 'PGRST116') throw userError;

        const currentBalance = userData?.balance || 0;
        const newBalance = currentBalance + amount;

        // 2. Update user wallet
        let updateError;
        if (!userData) {
            const res = await supabaseAdmin.from('user_credits').insert({ user_id: userId, balance: newBalance });
            updateError = res.error;
        } else {
            const res = await supabaseAdmin.from('user_credits').update({ balance: newBalance }).eq('user_id', userId);
            updateError = res.error;
        }

        if (updateError) throw updateError;

        // 3. Log transaction
        await supabaseAdmin
            .from('credit_transactions')
            .insert({
                user_id: userId,
                amount: amount,
                type: 'admin_adjustment',
                status: 'completed',
                description: description || `تعديل إداري للرصيد بـ ${amount} رسالة`
            });

        return NextResponse.json({ success: true, new_balance: newBalance });

    } catch (error: any) {
        console.error('Admin Credits API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
