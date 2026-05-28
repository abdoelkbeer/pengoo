// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

const DELAY_OPTIONS = [
    '15 دقيقة', '30 دقيقة', '1 ساعة', '2 ساعة', '4 ساعات',
    '6 ساعات', '12 ساعة', '24 ساعة', '2 يوم', '3 أيام', '7 أيام',
    'قيمة مخصصة'
];

const DEFAULT_STEPS = [
    { delay: '30 دقيقة', message: 'مرحباً {customer_name}، لاحظنا أنك تركت سلة مشترياتك! لا تفوت الفرصة 🛒', active: true },
    { delay: '4 ساعات', message: 'لا تنسَ سلتك {customer_name}! منتجاتك لا تزال بانتظارك.', active: true },
    { delay: '24 ساعة', message: 'آخر تذكير {customer_name}! سلتك ستنتهي صلاحيتها قريباً. أكمل طلبك الآن ⚡', active: false },
];

export default function Page() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [carts, setCarts] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, recovered: 0, totalValue: 0 });
    const [currency, setCurrency] = useState('');

    const [isEnabled, setIsEnabled] = useState(false);
    const [steps, setSteps] = useState(DEFAULT_STEPS);

    const supabase = createClient();

    useEffect(() => {
        loadData();
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await fetch('/api/abandoned-cart-settings');
            const data = await res.json();
            if (data.success && data.settings) {
                setIsEnabled(data.settings.is_enabled ?? false);
                if (data.settings.steps?.length) setSteps(data.settings.steps);
            }

            // Fetch global currency
            const { data: platformSettings } = await supabase
                .from('platform_settings')
                .select('currency')
                .limit(1)
                .maybeSingle();

            if (platformSettings?.currency) {
                setCurrency(platformSettings.currency);
            }
        } catch (e) {
            console.error('Failed to load settings', e);
        }
    };

    const loadData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: stores } = await supabase.from('stores').select('id').eq('user_id', user.id);
        const storeIds = (stores || []).map(s => s.id);

        if (storeIds.length > 0) {
            const { data: cartsData } = await supabase
                .from('abandoned_carts')
                .select('*')
                .in('store_id', storeIds)
                .order('created_at', { ascending: false });

            const all = cartsData || [];
            setCarts(all);
            const pending = all.filter(c => c.status === 'PENDING').length;
            const recovered = all.filter(c => c.status === 'RECOVERED').length;
            const totalValue = all.reduce((sum, c) => sum + (parseFloat(c.cart_total) || 0), 0);
            setStats({ total: all.length, pending, recovered, totalValue: Math.round(totalValue) });
        }
        setLoading(false);
    };

    const showMsg = (msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 3000); };

    const toggleStep = (index: number) =>
        setSteps(steps.map((s, i) => i === index ? { ...s, active: !s.active } : s));

    const updateStep = (index: number, field: string, value: string) =>
        setSteps(steps.map((s, i) => i === index ? { ...s, [field]: value } : s));

    const deleteStep = (index: number) => setSteps(steps.filter((_, i) => i !== index));

    const addStep = () => {
        if (steps.length >= 10) { showMsg('الحد الأقصى 10 خطوات'); return; }
        const lastStep = steps[steps.length - 1];
        let nextDelay = '24 ساعة';
        if (lastStep) {
            if (lastStep.delay === '30 دقيقة') nextDelay = '2 ساعة';
            else if (lastStep.delay.includes('دقيقة')) nextDelay = '4 ساعات';
            else if (lastStep.delay === '4 ساعات') nextDelay = '12 ساعة';
            else if (lastStep.delay === '24 ساعة') nextDelay = '2 يوم';
            else if (lastStep.delay === '2 يوم') nextDelay = '3 أيام';
            else if (lastStep.delay === '3 أيام') nextDelay = '7 أيام';
        }
        setSteps([...steps, { delay: nextDelay, message: 'مرحباً {customer_name}، لا تنسَ سلتك!', active: true }]);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/abandoned-cart-settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_enabled: isEnabled, steps })
            });
            const data = await res.json();
            if (data.success) {
                showMsg('✓ تم حفظ الإعدادات بنجاح');
            } else {
                showMsg('❌ فشل حفظ الإعدادات');
            }
        } catch (e) {
            showMsg('❌ حدث خطأ في الاتصال');
        }
        setSaving(false);
    };

    const recoveryRate = stats.total > 0 ? Math.round((stats.recovered / stats.total) * 100) : 0;

    const statCards = [
        { label: 'معدل الاسترجاع', value: `${recoveryRate}%`, icon: 'trending_up', color: 'text-primary', bg: 'bg-blue-50 text-primary', desc: 'من إجمالي السلات' },
        { label: 'إجمالي السلات', value: stats.total, icon: 'shopping_cart', color: 'text-slate-700', bg: 'bg-slate-100 text-slate-500', desc: 'سلة متروكة' },
        { label: 'تم الاسترجاع', value: stats.recovered, icon: 'check_circle', color: 'text-green-600', bg: 'bg-green-100 text-green-600', desc: 'عملية ناجحة' },
        { label: 'قيمة السلات', value: `${stats.totalValue} ${currency}`, icon: 'payments', color: 'text-amber-600', bg: 'bg-amber-100 text-amber-600', desc: 'إجمالي القيمة' },
    ];

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
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium">{message}</div>
            )}
            <div className="flex-1 flex flex-col p-8 gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">السلة المتروكة</h1>
                        <p className="text-sm text-slate-500 mt-0.5">أتمتة استرجاع السلات المتروكة عبر واتساب</p>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold border ${isEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        <span className={`h-2 w-2 rounded-full ${isEnabled ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></span>
                        {isEnabled ? 'التسلسل مفعّل' : 'التسلسل معطّل'}
                    </div>
                </div>

                {/* Stats — 4 beautiful cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card) => (
                        <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">{card.label}</span>
                                <div className={`p-2 rounded-lg ${card.bg}`}>
                                    <span className="material-symbols-outlined text-lg">{card.icon}</span>
                                </div>
                            </div>
                            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                            <p className="text-xs text-slate-400">{card.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sequence Settings */}
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-bold text-slate-900">تسلسل الرسائل</h2>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} className="sr-only peer" type="checkbox" />
                                    <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    <span className="mr-3 text-sm font-semibold text-slate-700">{isEnabled ? 'مفعّل' : 'معطّل'}</span>
                                </label>
                            </div>

                            <div className="flex flex-col gap-4">
                                {steps.map((step, i) => (
                                    <div key={i} className={`rounded-xl border-2 p-4 transition-all ${step.active ? 'border-primary/20 bg-primary/5' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-none ${step.active ? 'bg-primary' : 'bg-slate-300'}`}>{i + 1}</div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-slate-500">بعد:</span>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <select
                                                            value={DELAY_OPTIONS.includes(step.delay) ? step.delay : 'قيمة مخصصة'}
                                                            onChange={e => {
                                                                if (e.target.value === 'قيمة مخصصة') {
                                                                    updateStep(i, 'delay', '1 دقيقة');
                                                                } else {
                                                                    updateStep(i, 'delay', e.target.value);
                                                                }
                                                            }}
                                                            className="text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                                                        >
                                                            {DELAY_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                                        </select>

                                                        {(!DELAY_OPTIONS.includes(step.delay) || step.delay === 'قيمة مخصصة') && (
                                                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={step.delay.split(' ')[0] || '1'}
                                                                    onChange={e => {
                                                                        const val = e.target.value || '1';
                                                                        const unit = step.delay.split(' ')[1] || 'دقيقة';
                                                                        updateStep(i, 'delay', `${val} ${unit}`);
                                                                    }}
                                                                    className="w-12 text-sm font-bold text-center bg-white border border-slate-200 rounded-md py-0.5 focus:outline-none"
                                                                />
                                                                <select
                                                                    value={step.delay.split(' ')[1] || 'دقيقة'}
                                                                    onChange={e => {
                                                                        const val = step.delay.split(' ')[0] || '1';
                                                                        const unit = e.target.value;
                                                                        updateStep(i, 'delay', `${val} ${unit}`);
                                                                    }}
                                                                    className="text-xs font-bold text-slate-600 bg-transparent border-none focus:outline-none"
                                                                >
                                                                    <option value="دقيقة">دقيقة</option>
                                                                    <option value="ساعة">ساعة</option>
                                                                    <option value="يوم">يوم</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input checked={step.active} onChange={() => toggleStep(i)} className="sr-only peer" type="checkbox" />
                                                    <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                                </label>
                                                <button onClick={() => deleteStep(i)} className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                        <textarea
                                            value={step.message}
                                            onChange={e => updateStep(i, 'message', e.target.value)}
                                            rows={2}
                                            className="w-full text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                                            placeholder="نص الرسالة..."
                                        />
                                        <p className="text-xs text-slate-400 mt-1.5">متغيرات: {'{customer_name}'} {'{cart_total}'} {'{store_name}'} {'{cart_link}'}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex gap-3">
                                <button onClick={addStep} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-colors text-sm font-medium">
                                    <span className="material-symbols-outlined text-lg">add_circle</span>
                                    إضافة خطوة جديدة
                                </button>
                                <button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20">
                                    {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Recent Carts */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
                            <h3 className="text-base font-bold text-slate-900 mb-4">آخر السلات المتروكة</h3>
                            {carts.length === 0 ? (
                                <div className="py-10 text-center flex flex-col items-center gap-3">
                                    <div className="p-4 bg-slate-50 rounded-full">
                                        <span className="material-symbols-outlined text-3xl text-slate-200">shopping_cart</span>
                                    </div>
                                    <p className="text-slate-400 text-sm">لا توجد سلات متروكة بعد</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {carts.slice(0, 8).map(cart => (
                                        <div key={cart.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-bold text-slate-700" dir="ltr">{cart.customer_phone}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cart.status === 'RECOVERED' ? 'bg-green-100 text-green-700' : cart.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {cart.status === 'RECOVERED' ? 'مسترجعة' : cart.status === 'PENDING' ? 'معلقة' : cart.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span className="font-medium">{parseFloat(cart.cart_total || 0).toFixed(0)} {currency}</span>
                                                <span>{new Date(cart.created_at).toLocaleDateString('ar-EG')}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
