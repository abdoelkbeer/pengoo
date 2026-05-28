import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { packageId, amount_dollars, messages_count, type } = body;

        let final_messages = 0;
        let final_amount = amount_dollars;
        let final_type = type || 'recharge_custom';

        // 1. Get Settings for Custom Rate and Enabled Status
        const { data: settings } = await supabaseAdmin
            .from('platform_settings')
            .select('billing_custom_enabled, billing_custom_rate')
            .limit(1)
            .single();

        // 2. Handle Logic based on packageId or Custom Amount
        if (packageId) {
            const { data: pkg, error: pkgError } = await supabaseAdmin
                .from('billing_packages')
                .select('messages, price')
                .eq('id', packageId)
                .single();
            
            if (pkgError || !pkg) {
                return NextResponse.json({ error: 'Package not found' }, { status: 404 });
            }
            final_messages = pkg.messages;
            final_amount = pkg.price;
            final_type = 'recharge_package';
        } else {
            // Custom Recharge Logic
            if (!settings?.billing_custom_enabled) {
                return NextResponse.json({ error: 'Custom recharge is disabled' }, { status: 403 });
            }
            
            if (!amount_dollars || amount_dollars <= 0) {
                return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
            }

            const rate = settings?.billing_custom_rate || 100;
            final_messages = Math.floor(amount_dollars * rate);
            final_amount = amount_dollars;
            final_type = 'recharge_custom';
        }

        if (final_messages <= 0) {
            return NextResponse.json({ error: 'Invalid messages calculation' }, { status: 400 });
        }

        // 1. Get current user wallet balance
        const { data: userData, error: userError } = await supabaseAdmin
            .from('user_credits')
            .select('balance')
            .eq('user_id', user.id)
            .single();

        if (userError && userError.code !== 'PGRST116') throw userError;

        const currentBalance = userData?.balance || 0;
        const newBalance = currentBalance + final_messages;

        // 2. Update user wallet
        let updateError;
        if (!userData) {
            const res = await supabaseAdmin.from('user_credits').insert({ user_id: user.id, balance: newBalance });
            updateError = res.error;
        } else {
            const res = await supabaseAdmin.from('user_credits').update({ balance: newBalance }).eq('user_id', user.id);
            updateError = res.error;
        }

        if (updateError) throw updateError;

        // 3. Log transaction
        await supabaseAdmin
            .from('credit_transactions')
            .insert({
                user_id: user.id,
                amount: final_messages,
                type: final_type,
                status: 'completed',
                description: packageId 
                    ? `شراء باقة (${final_messages} رسالة / ${final_amount}$)`
                    : `شحن مخصص (${final_messages} رسالة / ${final_amount}$)`
            });

        return NextResponse.json({ success: true, new_balance: newBalance });

    } catch (error: any) {
        console.error('Recharge API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
