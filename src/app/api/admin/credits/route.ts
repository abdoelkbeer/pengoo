import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, amount, type } = body;
        const supabase = createAdminClient();

        if (!userId || !amount) {
            return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
        }

        // Fetch current subscription and its plan limit
        const { data: sub, error: fetchError } = await supabase
            .from('subscriptions')
            .select('id, max_messages_override, plan_id, plans(max_messages)')
            .eq('user_id', userId)
            .single();

        if (fetchError || !sub) {
            return NextResponse.json({ error: 'لا يوجد اشتراك نشط لهذا المستخدم' }, { status: 404 });
        }

        const planLimit = (sub as any).plans?.max_messages || 0;
        const currentLimit = (sub.max_messages_override !== null && sub.max_messages_override !== undefined)
            ? sub.max_messages_override
            : planLimit;

        let newLimit = currentLimit;
        if (type === 'add') {
            newLimit += amount;
        } else if (type === 'set') {
            newLimit = amount;
        }

        const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
                max_messages_override: newLimit,
                updated_at: new Date().toISOString()
            })
            .eq('id', sub.id);

        if (updateError) throw updateError;

        // Log transaction
        await supabase.from('credit_transactions').insert({
            user_id: userId,
            amount: type === 'add' ? amount : (amount - currentLimit),
            type: 'adjustment',
            reason: type === 'add' ? `منح رصيد إضافي يدوي: ${amount}` : `تعديل الحد الكلي إلى: ${amount}`,
            created_at: new Date().toISOString()
        });

        return NextResponse.json({ success: true, newLimit });
    } catch (error: any) {
        console.error('Credits Admin API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
