import React from 'react';
import { createClient } from '@/utils/supabase/server';
import BillingClient from './BillingClient';

export default async function BillingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user wallet balance
    const { data: userCredit } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user?.id)
        .single();

    // Fetch transaction history (ignore error if table doesn't exist yet)
    let transactions = [];
    try {
        const { data } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: false })
            .limit(10);
        if (data) transactions = data;
    } catch (e) {
        console.log('Credit transactions table might not exist yet.');
    }

    return (
        <div className="p-4 md:p-8 pb-20">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <a className="hover:text-primary transition-colors" href="/dashboard">الرئيسية</a>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="text-slate-900 font-medium">الرصيد والباقات</span>
                    </nav>
                    <h2 className="text-3xl font-bold text-slate-900">شحن رصيد الرسائل</h2>
                    <p className="text-slate-500 mt-1">
                        اشحن محفظتك بآلاف الرسائل بتكلفة بسيطة، ليتم استخدامها تلقائياً في الإشعارات والرسائل الترويجية.
                    </p>
                </div>

                <BillingClient
                    initialBalance={userCredit?.balance || 0}
                    transactions={transactions}
                />
            </div>
        </div>
    );
}
