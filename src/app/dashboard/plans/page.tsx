// @ts-nocheck
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import PlansList from './PlansList';

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch plans from DB
    const { data: plans } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    // Fetch global currency
    const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('currency')
        .limit(1)
        .maybeSingle();

    const currency = platformSettings?.currency;

    // Fetch current subscription
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', user?.id)
        .eq('status', 'active')
        .maybeSingle();

    const currentPlanSlug = subscription?.plans?.slug || 'free';
    const messagesUsed = subscription?.messages_used || 0;
    const billingCycle = subscription?.billing_cycle || 'monthly';
    const renewalDate = subscription?.ends_at
        ? new Date(subscription.ends_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    return (
        <div className="p-4 md:p-8 pb-20">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <a className="hover:text-primary transition-colors" href="/dashboard">الرئيسية</a>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="text-slate-900 font-medium">الباقات والخطط</span>
                    </nav>
                    <h2 className="text-3xl font-bold text-slate-900">اختر الباقة المناسبة لك</h2>
                    <p className="text-slate-500 mt-1">اختر الباقة المناسبة لحجم عملك وزد من مبيعاتك عبر واتساب.</p>
                </div>

                {/* Current Plan Summary */}
                <div className="bg-gradient-to-l from-primary to-blue-700 rounded-2xl px-6 py-5 text-white shadow-lg shadow-blue-200 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                        </div>
                        <div>
                            <p className="text-blue-100 text-xs">باقتك الحالية</p>
                            <h3 className="text-xl font-bold">{subscription?.plans?.name || 'مجاني'}</h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-blue-100 text-xs">الرسائل المستخدمة</p>
                            <p className="text-lg font-bold">{messagesUsed.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-blue-100 text-xs">دورة الفاتورة</p>
                            <p className="text-lg font-bold">{billingCycle === 'yearly' ? 'سنوي' : 'شهري'}</p>
                        </div>
                        {renewalDate && (
                            <div className="text-center">
                                <p className="text-blue-100 text-xs">تاريخ التجديد</p>
                                <p className="text-sm font-bold">{renewalDate}</p>
                            </div>
                        )}
                    </div>
                </div>

                <PlansList
                    plans={plans || []}
                    currentPlanSlug={currentPlanSlug}
                    defaultBillingCycle={billingCycle}
                    currency={currency}
                />
            </div>
        </div>
    );
}
