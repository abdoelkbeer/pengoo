import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, data, id } = body;

        // action: 'create', 'update', 'delete'
        const supabase = createAdminClient();

        if (action === 'create') {
            const planData = {
                ...data,
                intro_price_monthly: data.intro_price_monthly || null,
                intro_price_yearly: data.intro_price_yearly || null,
                intro_period_months: data.intro_period_months || 0,
                original_price_monthly: data.original_price_monthly || null,
                original_price_yearly: data.original_price_yearly || null
            };
            const { data: result, error } = await supabase.from('plans').insert([planData]).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, data: result });
        }

        else if (action === 'update') {
            if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
            const updateData = {
                ...data,
                intro_price_monthly: data.intro_price_monthly || null,
                intro_price_yearly: data.intro_price_yearly || null,
                intro_period_months: data.intro_period_months || 0,
                original_price_monthly: data.original_price_monthly || null,
                original_price_yearly: data.original_price_yearly || null,
                updated_at: new Date().toISOString()
            };
            delete (updateData as any).id;
            delete (updateData as any).created_at;

            const { data: result, error } = await supabase.from('plans').update(updateData).eq('id', id).select().single();
            if (error) throw error;
            return NextResponse.json({ success: true, data: result });
        }

        else if (action === 'delete') {
            if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
            const { error } = await supabase.from('plans').delete().eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Plans Admin API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
