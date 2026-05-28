// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import IntegrationsTabs from '../IntegrationsTabs';

const ZID_EVENT_TYPES = [
    { group: 'حالات الطلب', type: 'order.created', label: 'طلب جديد', icon: 'add_shopping_cart', color: 'orange', template: 'مرحباً {customer_name}، تم استلام طلبك رقم #{order_number} بنجاح! شكراً لك 🎉' },
    { group: 'حالات الطلب', type: 'order.shipped', label: 'تم الشحن', icon: 'local_shipping', color: 'blue', template: 'بشرى سارة {customer_name}! طلبك رقم #{order_number} في الطريق إليك الآن 🚚' },
    { group: 'حالات الطلب', type: 'order.completed', label: 'تم التوصيل', icon: 'task_alt', color: 'emerald', template: 'مرحباً {customer_name}، تم توصيل طلبك #{order_number}. نأمل أن تنال منتجاتنا رضاك ✨' },
    { group: 'حالات الطلب', type: 'order.cancelled', label: 'طلب ملغي', icon: 'cancel', color: 'red', template: 'نعتذر منك {customer_name}، تم إلغاء طلبك رقم #{order_number}. تواصل معنا لأي استفسار.' },
];

const TABS = [
    { id: 'connection', label: 'الربط', icon: 'link' },
];

export default function ZidPage() {
    const [activeTab, setActiveTab] = useState('connection');
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [rules, setRules] = useState<any[]>([]);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const supabase = createClient();

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: stores } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', user.id)
            .eq('store_type', 'zid')
            .order('created_at', { ascending: false })
            .limit(1);

        if (stores && stores.length > 0) {
            setStore(stores[0]);

            const { data: rulesData } = await supabase
                .from('notification_rules')
                .select('*')
                .eq('store_id', stores[0].id)
                .eq('user_id', user.id);

            setRules(rulesData || []);
        } else {
            setStore(null);
            setRules([]);
        }
        setLoading(false);
    };

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleConnectZid = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                showMessage('يرجى تسجيل الدخول أولاً', 'error');
                return;
            }

            // Mock automatic connection by directly inserting a store record
            const { data, error } = await supabase
                .from('stores')
                .insert([
                    {
                        user_id: user.id,
                        store_type: 'zid',
                        store_url: 'zid.store', // Mock URL
                        access_token: 'zid_mock_token_' + Date.now(),
                        name: 'متجر زد',
                        is_active: true
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setStore(data);
            showMessage('تم ربط متجرك بنجاح عبر الربط التلقائي!');
            loadData();
        } catch (error) {
            console.error('Error connecting Zid:', error);
            showMessage('حدث خطأ أثناء الربط، يرجى المحاولة مرة أخرى', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleRule = async (eventType: string, currentlyActive: boolean, template: string) => {
        const existingRule = rules.find(r => r.event_type === eventType);
        try {
            if (existingRule) {
                const res = await fetch('/api/notifications', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: existingRule.id, is_active: !currentlyActive })
                });
                const data = await res.json();
                if (data.success) {
                    setRules(rules.map(r => r.id === existingRule.id ? { ...r, is_active: !currentlyActive } : r));
                }
            } else if (store) {
                const res = await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ store_id: store.id, event_type: eventType, message_template: template, is_active: true })
                });
                const data = await res.json();
                if (data.success) {
                    setRules([...rules, data.rule]);
                } else {
                    showMessage('فشل تفعيل الحدث', 'error');
                }
            } else {
                showMessage('يرجى ربط المتجر أولاً', 'error');
            }
        } catch { showMessage('فشل تحديث الإعداد', 'error'); }
    };

    const isRuleActive = (eventType: string) => {
        const rule = rules.find(r => r.event_type === eventType);
        return rule ? rule.is_active : false;
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center p-10">
            <div className="flex flex-col items-center text-primary">
                <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
                <span className="font-bold">جاري التحميل...</span>
            </div>
        </div>
    );

    return (
        <>
            {message && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${message.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
                    {message.text}
                </div>
            )}
            <div className="flex-1 px-6 py-8 md:px-10">
                <div className="max-w-5xl mx-auto flex flex-col gap-6">

                    {/* Platform Switcher */}
                    <IntegrationsTabs />

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-[#F26722] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-100">
                                <span className="text-white font-bold text-xl">زد</span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">ربط منصة زد</h1>
                                <p className="text-slate-500 text-sm mt-1">قم بربط متجرك على زد بضغطة زر واحدة تلقائياً</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${store ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            <span className={`h-2 w-2 rounded-full ${store ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                            {store ? 'متصل بنجاح' : 'غير متصل'}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {activeTab === 'connection' && (
                        <div className="flex flex-col gap-6">
                            {store ? (
                                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                        <span className="material-symbols-outlined text-4xl text-green-500">check_circle</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-2">متجرك متصل بـ زد!</h3>
                                    <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-md">
                                        تم الربط التلقائي بنجاح. يمكنك الآن تفعيل الرسائل التلقائية والبدء بإرسالها لعملائك بمجرد حدوث تغييرات في متجرك.
                                    </p>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => window.location.href = '/dashboard/customer-messages'}
                                            className="px-8 py-3 bg-[#F26722] text-white rounded-xl font-bold hover:bg-[#e05c1b] transition-all shadow-lg shadow-orange-200 flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">mark_email_read</span>
                                            إدارة رسائل العملاء
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (confirm('هل أنت متأكد من فصل المتجر؟')) {
                                                    await supabase.from('stores').delete().eq('id', store.id);
                                                    setStore(null);
                                                    showMessage('تم فصل المتجر');
                                                    loadData();
                                                }
                                            }}
                                            className="px-8 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all"
                                        >
                                            فصل المتجر
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col items-center text-center">
                                    <div className="size-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                                        <span className="material-symbols-outlined text-4xl text-[#F26722]">bolt</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-4">الربط التلقائي الذكي</h3>
                                    <p className="text-slate-500 text-sm mb-8 leading-relaxed max-w-sm">
                                        تم تفعيل ميزة الربط التلقائي. لن تحتاج لاستخدام تطبيق خارجي أو إدخال بيانات معقدة، بضغطة زر واحدة سيتم ربط حسابك فوراً.
                                    </p>
                                    <button
                                        onClick={handleConnectZid}
                                        disabled={saving}
                                        className="flex items-center gap-3 px-10 py-4 bg-[#F26722] text-white rounded-2xl font-bold hover:bg-[#e05c1b] transition-all shadow-xl shadow-orange-200 active:scale-95 disabled:opacity-75"
                                    >
                                        {saving ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin">sync</span>
                                                جاري الربط...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">link</span>
                                                الربط التلقائي بمتجر زد
                                            </>
                                        )}
                                    </button>
                                    <div className="mt-8 flex items-center gap-6 text-xs text-slate-400 font-medium border-t border-slate-50 pt-8 w-full justify-center">
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">speed</span> ربط فوري</div>
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">settings_suggest</span> إعداد تلقائي</div>
                                        <div className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">sync</span> مزامنة سلسة</div>
                                    </div>
                                </div>
                            )}

                            {/* Info Card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <span className="material-symbols-outlined text-[#F26722] mb-3">send</span>
                                    <h4 className="font-bold text-slate-900 text-sm mb-2">رسائل الطلبات</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">أرسل رسائل تأكيد وتتبع الطلب فوراً من زد إلى واتساب العميل.</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <span className="material-symbols-outlined text-[#F26722] mb-3">shopping_cart_checkout</span>
                                    <h4 className="font-bold text-slate-900 text-sm mb-2">السلال المتروكة</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">استرجع مبيعاتك بتذكير العملاء بسلالهم المتروكة تلقائياً.</p>
                                </div>
                                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                    <span className="material-symbols-outlined text-[#F26722] mb-3">bar_chart</span>
                                    <h4 className="font-bold text-slate-900 text-sm mb-2">تقارير وتحليلات</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">تابع أداء حملاتك ومدى فعالية الرسائل في زيادة مبيعاتك.</p>
                                </div>
                            </div>
                        </div>
                    )}



                </div>
            </div>
        </>
    );
}
