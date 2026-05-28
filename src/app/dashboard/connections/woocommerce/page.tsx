// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

const ALL_EVENT_TYPES = [
    { group: 'حالات الطلب', type: 'order.pending', label: 'بانتظار الدفع (Pending)', icon: 'schedule', color: 'amber', template: 'مرحباً {customer_name}، تم استلام طلبك رقم #{order_number} وبانتظار الدفع. المبلغ: {order_total}' },
    { group: 'حالات الطلب', type: 'order.processing', label: 'قيد المعالجة (Processing)', icon: 'autorenew', color: 'blue', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} قيد التجهيز الآن. سنبلغك عند الشحن.' },
    { group: 'حالات الطلب', type: 'order.on-hold', label: 'معلق (On Hold)', icon: 'pause_circle', color: 'orange', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} معلق مؤقتاً. سيتم مراجعته قريباً.' },
    { group: 'حالات الطلب', type: 'order.completed', label: 'مكتمل (Completed)', icon: 'check_circle', color: 'green', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} تم تسليمه بنجاح! شكراً لتسوقك معنا 🎉' },
    { group: 'حالات الطلب', type: 'order.cancelled', label: 'ملغى (Cancelled)', icon: 'cancel', color: 'red', template: 'مرحباً {customer_name}، تم إلغاء طلبك رقم #{order_number}. تواصل معنا لأي استفسار.' },
    { group: 'حالات الطلب', type: 'order.refunded', label: 'مسترجع (Refunded)', icon: 'keyboard_return', color: 'purple', template: 'مرحباً {customer_name}، تم استرجاع مبلغ طلبك رقم #{order_number} بنجاح.' },
    { group: 'حالات الطلب', type: 'order.failed', label: 'فشل الدفع (Failed)', icon: 'error', color: 'red', template: 'مرحباً {customer_name}، فشل دفع طلبك رقم #{order_number}. يرجى المحاولة مجدداً.' },
    { group: 'الشحن', type: 'order.shipped', label: 'تم الشحن (Shipped)', icon: 'local_shipping', color: 'blue', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} تم شحنه! رقم التتبع: {tracking_number}' },
    { group: 'الشحن', type: 'order.out_for_delivery', label: 'خارج للتوصيل (Out for Delivery)', icon: 'delivery_dining', color: 'teal', template: 'مرحباً {customer_name}، طلبك رقم #{order_number} في الطريق إليك اليوم 🚚' },
    { group: 'العملاء', type: 'customer.new', label: 'عميل جديد (New Customer)', icon: 'person_add', color: 'green', template: 'مرحباً {customer_name}! نرحب بك في {store_name}. يسعدنا خدمتك 🌟' },
    { group: 'العملاء', type: 'customer.note', label: 'ملاحظة على الطلب (Order Note)', icon: 'note_add', color: 'blue', template: 'مرحباً {customer_name}، لديك ملاحظة جديدة على طلبك رقم #{order_number}: {note}' },
];

const TABS = [
    { id: 'connection', label: 'الربط', icon: 'link' },
    { id: 'events', label: 'الأحداث', icon: 'notifications_active' },
];

export default function Page() {
    const [activeTab, setActiveTab] = useState('connection');
    const [store, setStore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [storeUrl, setStoreUrl] = useState('');
    const [consumerKey, setConsumerKey] = useState('');
    const [consumerSecret, setConsumerSecret] = useState('');
    const [rules, setRules] = useState<any[]>([]);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    // New connection flow state
    const [connectionMethod, setConnectionMethod] = useState<'smart' | 'manual' | null>(null);
    const [manualStoreUrl, setManualStoreUrl] = useState('');
    const [pluginDownloaded, setPluginDownloaded] = useState(false);

    // Sync languages state
    const [syncingLanguages, setSyncingLanguages] = useState(false);
    const [storeLanguages, setStoreLanguages] = useState<any[]>([]);

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
            .order('created_at', { ascending: false })
            .limit(1);

        if (stores && stores.length > 0) {
            setStore(stores[0]);
            setStoreUrl(stores[0].store_url);
            setConsumerKey(stores[0].consumer_key || '');
            setConsumerSecret(stores[0].consumer_secret || '');
            setStoreLanguages(stores[0].store_languages || []);

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
        // Dispatch global notification event
        window.dispatchEvent(new CustomEvent('new-notification', {
            detail: {
                id: Math.random().toString(36).substr(2, 9),
                title: type === 'error' ? 'تنبيه' : 'تم بنجاح',
                message: text,
                type: type,
                created_at: new Date().toISOString()
            }
        }));
    };

    const handleSaveStore = async () => {
        if (!storeUrl.trim()) { showMessage('يرجى إدخال رابط المتجر', 'error'); return; }
        setSaving(true);
        try {
            const method = store ? 'PUT' : 'POST';
            const body = store
                ? { id: store.id, store_url: storeUrl, consumer_key: consumerKey, consumer_secret: consumerSecret }
                : { store_url: storeUrl, consumer_key: consumerKey, consumer_secret: consumerSecret };
            const res = await fetch('/api/stores', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (data.success) {
                showMessage(store ? 'تم تحديث المتجر بنجاح ✓' : 'تم ربط المتجر بنجاح ✓');
                loadData();
                if (!store) setActiveTab('events');
            } else {
                showMessage('فشل: ' + data.error, 'error');
            }
        } catch { showMessage('حدث خطأ غير متوقع', 'error'); }
        setSaving(false);
    };

    const handleManualConnect = async () => {
        if (!manualStoreUrl.trim() || !consumerKey.trim() || !consumerSecret.trim()) {
            showMessage('يرجى إدخال رابط المتجر ومفاتيح الربط (Key & Secret)', 'error');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/woocommerce/manual-connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    store_url: manualStoreUrl,
                    consumer_key: consumerKey,
                    consumer_secret: consumerSecret
                }),
            });
            const data = await res.json();
            if (data.success || res.ok) {
                showMessage('تم ربط المتجر بنجاح! ✓');
                loadData();
                setConnectionMethod(null);
                setActiveTab('events');
            } else {
                showMessage('فشل الربط: ' + (data.error || 'خطأ غير معروف'), 'error');
            }
        } catch { showMessage('حدث خطأ في الاتصال', 'error'); }
        setSaving(false);
    };

    const handleSmartConnect = () => {
        const appUrl = window.location.origin;
        const callbackUrl = `${appUrl}/woocommerce-auth`;
        showMessage('سيتم توجيهك للووردبريس... اضغط "Connect with 1-Click" من إعدادات الإضافة', 'success');
    };

    const handleSyncLanguages = async () => {
        if (!store) return;
        setSyncingLanguages(true);
        try {
            const res = await fetch('/api/woocommerce/sync-languages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ store_id: store.id }),
            });
            const data = await res.json();
            if (data.success && data.store_languages) {
                setStoreLanguages(data.store_languages);
                showMessage(`تم مزامنة ${data.store_languages.length} لغة بنجاح ✓`);
            } else {
                showMessage(data.error || 'فشل مزامنة اللغات', 'error');
            }
        } catch {
            showMessage('فشل الاتصال بالمتجر لمزامنة اللغات', 'error');
        }
        setSyncingLanguages(false);
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
                showMessage('يرجى ربط المتجر أولاً ثم تفعيل الأحداث', 'error');
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
            <div className="flex-1 px-6 py-8 md:px-10">
                <div className="max-w-5xl mx-auto flex flex-col gap-6">

                    {/* Header + Status */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">ربط WooCommerce</h1>
                            <p className="text-slate-500 text-sm mt-1">أتمتة رسائل واتساب مع متجر ووردبريس الخاص بك</p>
                        </div>
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${store ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            <span className={`h-2 w-2 rounded-full ${store ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                            {store ? `متصل: ${store.store_url}` : 'غير متصل'}
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
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* ═══════════════════════════════════════════════ */}
                    {/* TAB 1: NEW CONNECTION FLOW                     */}
                    {/* ═══════════════════════════════════════════════ */}
                    {activeTab === 'connection' && (
                        <div className="flex flex-col gap-6">

                            {/* ── Already connected state ── */}
                            {store && (
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-200">
                                            <span className="material-symbols-outlined text-white text-2xl">check_circle</span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-green-900 mb-1">متجرك متصل بنجاح! 🎉</h3>
                                            <p className="text-sm text-green-700 mb-3">{store.store_url}</p>
                                            <div className="flex flex-wrap gap-3 text-xs">
                                                <span className="px-3 py-1.5 bg-white/70 rounded-lg text-green-800 font-medium border border-green-100">
                                                    <span className="material-symbols-outlined text-sm align-middle ml-1">sync</span>
                                                    المزامنة نشطة
                                                </span>
                                                <span className="px-3 py-1.5 bg-white/70 rounded-lg text-green-800 font-medium border border-green-100">
                                                    <span className="material-symbols-outlined text-sm align-middle ml-1">notifications_active</span>
                                                    {rules.filter(r => r.is_active).length} حدث مفعّل
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── Connection Methods ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                {/* Automatic Connect */}
                                <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm flex flex-col transition-all ${store ? 'border-green-300 bg-green-50/30' : 'border-slate-200 hover:border-primary/40'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${store ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'}`}>
                                                <span className="material-symbols-outlined text-xl">{store ? 'check' : 'auto_awesome'}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-lg">الربط الأوتوماتيكي</h3>
                                                <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold">الأسهل والأسرع</span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 flex-1 mb-5 leading-relaxed">
                                        طريقة سريعة وآمنة. قم بتحميل إضافة ووردبريس، ثم اضغط زر الربط من داخل متجرك ليتم ربط المتجر وإعداد Webhooks تلقائياً!
                                    </p>

                                    <div className="flex flex-col gap-3">
                                        <a
                                            href="/pengoo-woocommerce-connector.zip"
                                            download
                                            onClick={() => setPluginDownloaded(true)}
                                            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-lg">download</span>
                                            1. تحميل إضافة ووردبريس
                                        </a>
                                        <button
                                            onClick={handleSmartConnect}
                                            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20 transition-all border border-primary/20"
                                        >
                                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                                            2. ثم اربط من داخل متجرك بضغطة
                                        </button>
                                    </div>
                                </div>

                                {/* Manual Connect */}
                                <div className={`bg-white rounded-2xl border-2 p-6 shadow-sm flex flex-col transition-all ${connectionMethod === 'manual' ? 'border-primary/50 ring-2 ring-primary/10' : 'border-slate-200 hover:border-primary/40'}`}>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                                            <span className="material-symbols-outlined text-xl">tune</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">الربط اليدوي</h3>
                                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">للمطورين أو Localhost</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500 flex-1 mb-5 leading-relaxed">
                                        استخدم هذه الطريقة إذا كان متجرك يعمل محلياً أو إذا كنت تفضل إدخال مفاتيح REST API برمجياً. Webhooks يتم توليدها تلقائياً.
                                    </p>
                                    <button
                                        onClick={() => setConnectionMethod(connectionMethod === 'manual' ? null : 'manual')}
                                        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all mt-auto ${connectionMethod === 'manual' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">{connectionMethod === 'manual' ? 'expand_less' : 'expand_more'}</span>
                                        {connectionMethod === 'manual' ? 'إخفاء الإعدادات' : 'إظهار إعدادات الربط اليدوي'}
                                    </button>
                                </div>
                            </div>

                            {/* ── Manual Connect Expanded Form ── */}
                            {connectionMethod === 'manual' && (
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-[fadeSlideDown_0.3s_ease]">
                                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">vpn_key</span>
                                            الربط اليدوي
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-1">أدخل بيانات المتجر يدوياً من إعدادات WooCommerce REST API</p>
                                    </div>
                                    <div className="p-6 flex flex-col gap-5">
                                        {/* How to get keys helper */}
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <p className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-blue-500 text-lg">help</span>
                                                كيف أحصل على المفاتيح؟
                                            </p>
                                            <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside mr-2">
                                                <li>افتح لوحة ووردبريس → <strong>WooCommerce</strong> → <strong>الإعدادات</strong></li>
                                                <li>انتقل إلى <strong>متقدم</strong> → <strong>REST API</strong></li>
                                                <li>اضغط <strong>أضف مفتاح جديد</strong> بصلاحية "قراءة/كتابة"</li>
                                                <li>انسخ Consumer Key و Consumer Secret</li>
                                            </ol>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">رابط المتجر (Store URL)</label>
                                            <input
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                                                dir="ltr" type="url" placeholder="https://your-store.com"
                                                value={manualStoreUrl || storeUrl} onChange={e => { setManualStoreUrl(e.target.value); setStoreUrl(e.target.value); }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Consumer Key</label>
                                            <input
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                                                dir="ltr" type="text" placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                                                value={consumerKey} onChange={e => setConsumerKey(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Consumer Secret</label>
                                            <input
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                                                dir="ltr" type="password" placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxx"
                                                value={consumerSecret} onChange={e => setConsumerSecret(e.target.value)}
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleManualConnect}
                                                disabled={saving}
                                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 active:scale-[0.98]"
                                            >
                                                {saving ? (
                                                    <><span className="material-symbols-outlined text-lg animate-spin">sync</span> جاري تشغيل المتجر وإعداد الـ Webhooks...</>
                                                ) : (
                                                    <><span className="material-symbols-outlined text-lg">link</span> {store ? 'تحديث الاتصال وإعداد الـ Webhooks' : 'ربط المتجر (وإنشاء Webhooks تلقائياً)'}</>
                                                )}
                                            </button>
                                        </div>

                                        <p className="text-xs text-center text-slate-400">
                                            <span className="material-symbols-outlined text-sm align-middle ml-1">lock</span>
                                            بياناتك مشفرة ومحمية. لا نشارك معلوماتك مع أي طرف ثالث.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── Connection Already Exists - Quick Settings ── */}
                            {store && !connectionMethod && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">settings</span>
                                        إعدادات الاتصال الحالي
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-xs text-slate-400 mb-1 font-semibold">رابط المتجر</p>
                                            <p className="text-sm font-medium text-slate-800" dir="ltr">{store.store_url}</p>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                            <p className="text-xs text-slate-400 mb-1 font-semibold">Consumer Key</p>
                                            <p className="text-sm font-mono text-slate-800" dir="ltr">{store.consumer_key ? store.consumer_key.substring(0, 10) + '••••••••' : '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setConnectionMethod('manual')}
                                            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">edit</span>
                                            تعديل البيانات
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!confirm('هل أنت متأكد من فصل المتجر؟')) return;
                                                const { data: { user } } = await supabase.auth.getUser();
                                                if (!user) return;
                                                await supabase.from('stores').delete().eq('id', store.id);
                                                setStore(null);
                                                setStoreUrl('');
                                                setConsumerKey('');
                                                setConsumerSecret('');
                                                showMessage('تم فصل المتجر');
                                                loadData();
                                            }}
                                            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2 border border-red-100"
                                        >
                                            <span className="material-symbols-outlined text-lg">link_off</span>
                                            فصل المتجر
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ── Store Languages Sync ── */}
                            {store && !connectionMethod && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">translate</span>
                                            لغات المتجر
                                        </h3>
                                        <button
                                            onClick={handleSyncLanguages}
                                            disabled={syncingLanguages}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-all border border-primary/20 disabled:opacity-50"
                                        >
                                            <span className={`material-symbols-outlined text-lg ${syncingLanguages ? 'animate-spin' : ''}`}>sync</span>
                                            {syncingLanguages ? 'جاري المزامنة...' : 'مزامنة اللغات'}
                                        </button>
                                    </div>
                                    
                                    {storeLanguages.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-wrap gap-2">
                                                {storeLanguages.map((lang: any, i: number) => (
                                                    <div
                                                        key={i}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${
                                                            lang.is_default
                                                                ? 'bg-primary/5 text-primary border-primary/20'
                                                                : 'bg-slate-50 text-slate-700 border-slate-200'
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-base">language</span>
                                                        <span>{lang.native_name || lang.name}</span>
                                                        <span className="text-xs opacity-60 font-mono">({lang.code})</span>
                                                        {lang.is_default && (
                                                            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold">افتراضية</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                <span className="material-symbols-outlined text-sm align-middle ml-1">info</span>
                                                يتم استخدام اللغات لإرسال رسائل واتساب بلغة العميل المناسبة
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 rounded-xl p-5 text-center border border-slate-100">
                                            <span className="material-symbols-outlined text-3xl text-slate-300 mb-2 block">translate</span>
                                            <p className="text-sm text-slate-500 font-medium">لم يتم مزامنة اللغات بعد</p>
                                            <p className="text-xs text-slate-400 mt-1">اضغط &quot;مزامنة اللغات&quot; لجلب لغات المتجر من ووردبريس</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: Events */}
                    {activeTab === 'events' && (
                        <div className="flex flex-col gap-4">
                            {!store && (
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm font-medium flex items-center gap-3">
                                    <span className="material-symbols-outlined">warning</span>
                                    يجب ربط المتجر أولاً من تبويب "الربط" قبل تفعيل الأحداث
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">أحداث WooCommerce</h3>
                                <span className="bg-primary/10 text-primary text-sm font-bold px-3 py-1 rounded-full">{rules.filter(r => r.is_active).length} نشط</span>
                            </div>
                            {Object.entries(groupedEvents).map(([group, events]) => (
                                <div key={group} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-700">{group}</h4>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {events.map(event => (
                                            <div key={event.type} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg bg-${event.color}-100 text-${event.color}-600`}>
                                                        <span className="material-symbols-outlined text-lg">{event.icon}</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm">{event.label}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5 max-w-xs truncate">{event.template.substring(0, 60)}...</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        checked={isRuleActive(event.type)}
                                                        onChange={() => handleToggleRule(event.type, isRuleActive(event.type), event.template)}
                                                        className="sr-only peer" type="checkbox"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}



                </div>
            </div>
        </>
    );
}
