import React from 'react';
import { createAdminClient } from '@/utils/supabase/admin';
import InvoicesManager from './InvoicesManager';

export default async function Page() {
    const supabase = createAdminClient();

    // Fetch all data separately for robustness
    const [
        { data: rawInvoices, error: invoicesError },
        { data: profiles, error: profilesError },
        { data: plans, error: plansError }
    ] = await Promise.all([
        supabase.from('invoices').select('*, plans(name)').order('created_at', { ascending: false }).limit(200),
        supabase.from('user_profiles').select('id, full_name'),
        supabase.from('plans').select('id, name, price_monthly, price_yearly')
    ]);

    if (invoicesError) console.error('Invoices Error:', invoicesError);
    if (profilesError) console.error('Profiles Error:', profilesError);

    // Merge in memory
    const invoices = rawInvoices?.map(inv => ({
        ...inv,
        user_profiles: profiles?.find(p => p.id === inv.user_id) || null
    })) || [];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-black text-gray-900 font-display">إدارة الفواتير والمدفوعات</h1>
                <p className="text-gray-500 font-medium">متابعة تحصيلات النظام، والتحقق من فواتير العملاء.</p>
            </div>

            <InvoicesManager
                initialInvoices={invoices as any}
                customers={profiles || []}
                plans={plans || []}
            />
        </div>
    );
}
