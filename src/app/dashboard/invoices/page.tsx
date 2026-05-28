import React from 'react';
import { createClient } from '@/utils/supabase/server';
import InvoicesList from './InvoicesList';

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch initial invoices
    const { data: invoices } = await supabase
        .from('invoices')
        .select(`
            *,
            plans (name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

    // Fetch active subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .maybeSingle();

    // Fetch currency
    const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('currency')
        .maybeSingle();

    return (
        <div className="p-4 md:p-8 pb-20">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <a className="hover:text-primary transition-colors" href="/dashboard">الرئيسية</a>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="text-slate-900 font-medium">الفواتير والمدفوعات</span>
                    </nav>
                    <h2 className="text-3xl font-bold text-slate-900 font-display">سجل الفواتير</h2>
                    <p className="text-slate-500 mt-1 font-medium">تابع مدفوعاتك وحمل فواتيرك السابقة والجديدة.</p>
                </div>

                <InvoicesList
                    initialInvoices={invoices || []}
                    subscription={subscription}
                    currency={platformSettings?.currency || 'EGP'}
                />
            </div>
        </div>
    );
}
