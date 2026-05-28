// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import IntegrationsTabs from '../IntegrationsTabs';

const ALL_EVENT_TYPES = [
    { group: 'حالات الطلب', type: 'orders/create', label: 'طلب جديد (Order Created)', icon: 'add_shopping_cart', color: 'amber', template: 'مرحباً {customer_name}، تم استلام طلبك رقم #{order_number} بنجاح. سنقوم بتجهيزه قريباً.' },
    { group: 'حالات الطلب', type: 'orders/updated', label: 'تحديث الطلب (Order Updated)', icon: 'update', color: 'blue', template: 'مرحباً {customer_name}، تم تحديث حالة طلبك رقم #{order_number}.' },
    { group: 'حالات الطلب', type: 'orders/fulfilled', label: 'تم الشحن (Order Fulfilled)', icon: 'local_shipping', color: 'green', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} في الطريق إليك الآن! 🚚' },
    { group: 'حالات الطلب', type: 'orders/cancelled', label: 'طلب ملغى (Order Cancelled)', icon: 'cancel', color: 'red', template: 'مرحباً {customer_name}، تم إلغاء طلبك رقم #{order_number}. تواصل معنا إذا كان لديك أي استفسار.' },
    { group: 'العملاء', type: 'customers/create', label: 'عميل جديد (New Customer)', icon: 'person_add', color: 'teal', template: 'أهلاً بك {customer_name} في متجرنا! يسعدنا انضمامك إلينا 🌟' },
];

const TABS = [
    { id: 'connection', label: 'الربط الذكي', icon: 'bolt' },
];

export default function Page() {
    const [activeTab, setActiveTab] = useState('connection');
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeUrl, setStoreUrl] = useState('');
    const [accessToken, setAccessToken] = useState('');
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
            .eq('store_type', 'shopify')
            .order('created_at', { ascending: false })
            .limit(1);

        if (stores && stores.length > 0) {
            setStore(stores[0]);
            setStoreUrl(stores[0].store_url);
            setAccessToken(stores[0].consumer_key || '');

            const { data: rulesData } = await supabase
                .from('notification_rules')
                .select('*')
                .eq('store_id', stores[0].id)
                .eq('user_id', user.id);

            setRules(rulesData || []);
        }
        setLoading(false);
    };

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleSaveStore = async () => {
        if (!storeUrl.trim()) { showMessage('يرجى إدخال رابط المتجر', 'error'); return; }
        if (!accessToken.trim()) { showMessage('يرجى إدخال رمز الوصول (Access Token)', 'error'); return; }

        setSaving(true);
        try {
            const method = store ? 'PUT' : 'POST';
            const body = store
                ? { id: store.id, store_url: storeUrl, consumer_key: accessToken, store_type: 'shopify' }
                : { store_url: storeUrl, consumer_key: accessToken, store_type: 'shopify' };

            const res = await fetch('/api/stores', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.success) {
                showMessage(store ? 'تم تحديث البيانات بنجاح' : 'تم الربط وتبرمجة التنبيهات تلقائياً! 🎉');
                loadData();
                if (!store) window.location.href = '/dashboard/customer-messages';
            } else {
                showMessage('فشل: ' + data.error, 'error');
            }
        } catch { showMessage('حدث خطأ غير متوقع', 'error'); }
        setSaving(false);
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
                if (data.success) setRules(rules.map(r => r.id === existingRule.id ? { ...r, is_active: !currentlyActive } : r));
            } else if (store) {
                const res = await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ store_id: store.id, event_type: eventType, message_template: template, is_active: true })
                });
                const data = await res.json();
                if (data.success) setRules([...rules, data.rule]);
                else showMessage('يرجى ربط المتجر أولاً', 'error');
            } else {
                showMessage('يرجى ربط المتجر أولاً ثم تفعيل الرسائل التلقائية', 'error');
            }
        } catch { showMessage('فشل تحديث الإعداد', 'error'); }
    };

    const isRuleActive = (eventType: string) => {
        const rule = rules.find(r => r.event_type === eventType);
        return rule ? rule.is_active : false;
    };

    const groupedEvents = ALL_EVENT_TYPES.reduce((acc, ev) => {
        if (!acc[ev.group]) acc[ev.group] = [];
        acc[ev.group].push(ev);
        return acc;
    }, {} as Record<string, typeof ALL_EVENT_TYPES>);

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

                    {/* Header + Status */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="size-14 bg-[#96bf48] rounded-2xl flex items-center justify-center shadow-lg shadow-[#96bf48]/20">
                                <svg className="size-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M15.111 6.077l-.603-3.61c-.066-.395-.445-.66-.84-.593l-4.215.703c-.394.066-.66.444-.593.84l.603 3.61c-1.353.308-2.61.85-3.715 1.583L3.107 6.44c-.337-.215-.785-.11-1 .232l-2.107 3.652c-.215.372-.084.845.289 1.03l2.843 1.413c-.02.408-.032.82-.032 1.233s.013.825.032 1.233l-2.843 1.413c-.373.185-.504.658-.289 1.03l2.107 3.652c.215.342.663.447 1 .232l2.741-2.176c1.105.732 2.362 1.275 3.715 1.583l-.603 3.61c-.066.395.199.774.593.84l4.215.703c.395.066.774-.198.841-.593l.603-3.61c1.352-.308 2.61-.85 3.715-1.583l2.741 2.176c.337.215.785.11 1-.232l2.107-3.652c.215-.372.084-.845-.289-1.03l-2.843-1.413c.02-.408.032-.82.032-1.233s-.012-.825-.032-1.233l2.843-1.413c.373-.185.504-.658.289-1.03l-2.107-3.652c-.215-.342-.663-.447-1-.232l-2.741 2.176c-1.105-.733-2.362-1.275-3.715-1.583zM12 16c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">تطبيق Shopify الذكي</h1>
                                <p className="text-slate-500 text-sm">أتمتة الرسائل بضغطة زر واحدة (بدون تعقيد)</p>
                            </div>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${store ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            <span className={`h-2 w-2 rounded-full ${store ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                            {store ? `متصل بمتجر: ${store.store_url}` : 'في انتظار الربط'}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-lg text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* TAB 1: Connection */}
                    {activeTab === 'connection' && (
                        <div className="flex flex-col gap-6">

                            {!store && (
                                <div className="bg-gradient-to-r from-[#96bf48]/10 to-transparent p-6 rounded-2xl border-l-4 border-[#96bf48]">
                                    <h3 className="font-bold text-slate-900 mb-2">كيف يعمل الربط الذكي؟</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        بدلاً من إنشاء تطبيق معقد، ستقوم فقط بإنشاء "Custom App" في متجرك وإعطائنا الـ Token.
                                        <b> نحن سنقوم ببرمجة كل شيء تلقائياً في خلفية شوبيفاي</b> لتبدأ الرسائل بالوصول فوراً.
                                    </p>
                                </div>
                            )}

                            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-slate-900">بيانات الربط</h3>
                                        <p className="text-xs text-slate-500 mt-0.5">أدخل بيانات متجرك لبدء الأتمتة</p>
                                    </div>
                                    <span className="material-symbols-outlined text-slate-400">lock</span>
                                </div>
                                <div className="p-6 flex flex-col gap-5">

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">رابط متجر شوبيفاي</label>
                                            <div className="relative">
                                                <input
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-11 py-3 text-sm focus:ring-2 focus:ring-[#96bf48]/30 focus:border-[#96bf48] transition outline-none"
                                                    dir="ltr" type="url" placeholder="example.myshopify.com"
                                                    value={storeUrl} onChange={e => setStoreUrl(e.target.value)}
                                                />
                                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">storefront</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Admin API Access Token</label>
                                            <div className="relative">
                                                <input
                                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-4 pr-11 py-3 text-sm font-mono focus:ring-2 focus:ring-[#96bf48]/30 focus:border-[#96bf48] transition outline-none"
                                                    dir="ltr" type="password" placeholder="shpat_xxxxxxxxxxxxxxxx"
                                                    value={accessToken} onChange={e => setAccessToken(e.target.value)}
                                                />
                                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">key</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveStore}
                                        disabled={saving}
                                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#96bf48] text-white font-bold shadow-lg shadow-[#96bf48]/20 hover:bg-[#86ac41] transition-all disabled:opacity-50 active:scale-[0.99]"
                                    >
                                        {saving ? (
                                            <><span className="material-symbols-outlined animate-spin">sync</span> جاري الربط وتفعيل التنبيهات...</>
                                        ) : (
                                            <><span className="material-symbols-outlined">bolt</span> {store ? 'تحديث بيانات الربط' : 'ابدأ الربط التلقائي الآن'}</>
                                        )}
                                    </button>

                                    {store && (
                                        <div className="pt-6 border-t border-slate-100 flex flex-col gap-4">
                                            <div className="flex items-center gap-2 text-[#96bf48] font-bold text-sm">
                                                <span className="material-symbols-outlined text-lg">verified</span>
                                                تم الربط وبرمجة التنبيهات بنجاح
                                            </div>
                                            <div className="text-xs text-slate-500 bg-slate-50 p-4 rounded-xl leading-relaxed">
                                                <b>ملاحظة:</b> المنصة قامت بإعداد (Webhooks) في متجرك تلقائياً لكل من:
                                                <ul className="list-disc list-inside mt-2 space-y-1">
                                                    <li>إنشاء الطلبات الجديدة (Orders Create)</li>
                                                    <li>تحديث حالة الطلب (Orders Updated)</li>
                                                    <li>إنشاء حسابات العملاء الجدد (Customers Create)</li>
                                                </ul>
                                            </div>
                                            <div className="flex gap-4 items-center">
                                                <button
                                                    onClick={() => window.location.href = '/dashboard/customer-messages'}
                                                    className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 flex items-center gap-2 text-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg">mark_email_read</span>
                                                    إدارة رسائل العملاء
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('هل أنت متأكد من فصل المتجر؟')) return;
                                                        await supabase.from('stores').delete().eq('id', store.id);
                                                        setStore(null); setStoreUrl(''); setAccessToken('');
                                                        showMessage('تم فصل المتجر'); loadData();
                                                    }}
                                                    className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-100"
                                                >
                                                    <span className="material-symbols-outlined text-lg">link_off</span>
                                                    فصل المتجر
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}


                </div>
            </div>
        </>
    );
}
