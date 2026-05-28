'use client';

import React, { useState } from 'react';

type Plan = {
    id: string;
    name: string;
    slug: string;
    description?: string;
    price_monthly: number;
    price_yearly: number;
    is_active: boolean;
    sort_order: number;
    features: string[];
    max_stores: number;
    max_messages: number;
    max_whatsapp_numbers: number;
    meta_api_enabled: boolean;
    intro_price_monthly?: number;
    intro_price_yearly?: number;
    intro_period_months?: number;
    original_price_monthly?: number;
    original_price_yearly?: number;
    allowed_tabs?: string[];
    subscriberCount?: number;
};

const isUnlimited = (val: number | undefined) => val === -1 || (val !== undefined && val >= 999999);

export default function PlansManager({ initialPlans, currency }: { initialPlans: Plan[], currency?: string }) {
    const [plans, setPlans] = useState<Plan[]>(initialPlans);
    const [editingPlan, setEditingPlan] = useState<Partial<Plan> & { _newFeature?: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('basic');

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const action = editingPlan?.id ? 'update' : 'create';
        const { _newFeature, subscriberCount, featuresArr, ...cleanData } = editingPlan as any;
        const payload = {
            action,
            id: editingPlan?.id,
            data: {
                ...cleanData,
                features: Array.isArray(cleanData.features) ? cleanData.features : []
            }
        };
        delete (payload.data as any).id;

        try {
            const res = await fetch('/api/admin/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            if (result.success) {
                window.location.reload();
            } else {
                alert('خطأ: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الخطة؟ قد يؤثر ذلك على المشتركين الحاليين.')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
            const result = await res.json();
            if (result.success) {
                window.location.reload();
            } else {
                alert('فشل الحذف');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getEmptyPlan = (): Partial<Plan> => ({
        name: '',
        slug: '',
        description: '',
        price_monthly: 0,
        price_yearly: 0,
        is_active: true,
        sort_order: 0,
        features: [],
        allowed_tabs: [],
        max_stores: 1,
        max_messages: 100,
        max_whatsapp_numbers: 1,
        meta_api_enabled: false,
        intro_price_monthly: 0,
        intro_price_yearly: 0,
        intro_period_months: 0,
        original_price_monthly: 0,
        original_price_yearly: 0
    });

    const addFeature = () => {
        if (!editingPlan?._newFeature?.trim()) return;
        const currentFeatures = Array.isArray(editingPlan.features) ? editingPlan.features : [];
        setEditingPlan({
            ...editingPlan,
            features: [...currentFeatures, editingPlan._newFeature.trim()],
            _newFeature: ''
        });
    };

    const removeFeature = (index: number) => {
        const currentFeatures = Array.isArray(editingPlan?.features) ? [...editingPlan!.features] : [];
        currentFeatures.splice(index, 1);
        setEditingPlan({ ...editingPlan!, features: currentFeatures });
    };

    const moveFeature = (index: number, direction: 'up' | 'down') => {
        const currentFeatures = Array.isArray(editingPlan?.features) ? [...editingPlan!.features] : [];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= currentFeatures.length) return;
        [currentFeatures[index], currentFeatures[newIndex]] = [currentFeatures[newIndex], currentFeatures[index]];
        setEditingPlan({ ...editingPlan!, features: currentFeatures });
    };

    const sections = [
        { id: 'basic', label: 'أساسي', icon: 'info' },
        { id: 'pricing', label: 'التسعير', icon: 'payments' },
        { id: 'limits', label: 'الحدود', icon: 'tune' },
        { id: 'features', label: 'المميزات', icon: 'star' },
        { id: 'permissions', label: 'الصلاحيات', icon: 'security' },
        { id: 'settings', label: 'إعدادات', icon: 'settings' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-border-color shadow-sm">
                <div>
                    <h3 className="text-lg font-bold">إدارة الخطط</h3>
                    <p className="text-xs text-text-sub">أضف أو عدل خطط الأسعار والحدود المتاحة للمستخدمين.</p>
                </div>
                <button
                    onClick={() => { setEditingPlan(getEmptyPlan()); setActiveSection('basic'); }}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    إضافة خطة جديدة
                </button>
            </div>

            {/* Plans Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.length === 0 ? (
                    <div className="col-span-3 p-12 text-center text-text-sub bg-surface border border-border-color rounded-2xl">
                        <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">payments</span>
                        <p className="font-medium">لا توجد خطط مضافة حالياً</p>
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div key={plan.id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all hover:shadow-md ${plan.is_active ? 'border-border-color' : 'border-dashed border-red-200 opacity-75'}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-text-main text-xl font-black">{plan.name}</h3>
                                        {plan.description && <p className="text-xs text-text-sub mt-0.5">{plan.description}</p>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => { setEditingPlan({ ...plan }); setActiveSection('basic'); }} className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                                            <span className="material-symbols-outlined text-sm">edit</span>
                                        </button>
                                        <button onClick={() => handleDelete(plan.id)} className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1 mb-4">
                                    <span className="text-3xl font-bold text-primary">{plan.price_monthly === 0 ? 'مجاني' : plan.price_monthly}</span>
                                    {plan.price_monthly > 0 && <span className="text-text-sub text-sm">{currency}/شهر</span>}
                                </div>
                                <div className="bg-primary/5 rounded-lg p-3 mb-4 text-center border border-primary/10">
                                    <span className="text-2xl font-bold text-primary">{plan.subscriberCount || 0}</span>
                                    <span className="text-text-sub text-sm mr-1">مشترك نشط</span>
                                </div>

                                {/* Limits Summary */}
                                <div className="space-y-2 mb-4">
                                    <p className="text-xs font-bold text-text-sub uppercase mb-1">الحدود والقيود:</p>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-sub">الرسائل:</span>
                                        <span className="font-bold">{isUnlimited(plan.max_messages) ? '∞ غير محدود' : plan.max_messages.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-sub">المتاجر:</span>
                                        <span className="font-bold">{isUnlimited(plan.max_stores) ? '∞ غير محدود' : plan.max_stores}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-sub">أرقام واتساب:</span>
                                        <span className="font-bold">{isUnlimited(plan.max_whatsapp_numbers) ? '∞ غير محدود' : plan.max_whatsapp_numbers}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-text-sub">ميتا API:</span>
                                        <span className={`font-bold ${plan.meta_api_enabled ? 'text-green-600' : 'text-red-400'}`}>{plan.meta_api_enabled ? '✓ مفعل' : '✗ معطل'}</span>
                                    </div>
                                </div>

                                {/* Features Preview */}
                                <ul className="space-y-1.5 border-t pt-3">
                                    {(plan.features || []).slice(0, 5).map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs text-text-sub">
                                            <span className="material-symbols-outlined text-green-500 text-[14px]">check_circle</span>
                                            {f}
                                        </li>
                                    ))}
                                    {(plan.features || []).length > 5 && <li className="text-[10px] text-primary font-bold">+{plan.features.length - 5} مميزات أخرى</li>}
                                </ul>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Editing Modal - Full Redesign */}
            {editingPlan && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl my-8 animate-fadeIn max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="p-5 border-b border-border-color flex justify-between items-center bg-gray-50/50 rounded-t-3xl shrink-0">
                            <h3 className="font-black text-xl">{editingPlan.id ? 'تعديل الخطة' : 'إضافة خطة جديدة'}</h3>
                            <button onClick={() => setEditingPlan(null)} className="text-gray-400 hover:text-black transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Section Tabs */}
                        <div className="flex gap-1 p-3 bg-gray-50 border-b border-border-color shrink-0 overflow-x-auto">
                            {sections.map(s => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setActiveSection(s.id)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeSection === s.id
                                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                                        : 'bg-white text-text-sub border border-border-color hover:border-primary hover:text-primary'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                                    {s.label}
                                </button>
                            ))}
                        </div>

                        {/* Form Content - Scrollable */}
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">

                                {/* ===== BASIC SECTION ===== */}
                                {activeSection === 'basic' && (
                                    <div className="space-y-5">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-bold text-text-main">اسم الخطة *</label>
                                                <input required type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all"
                                                    value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="مثال: احترافي، المؤسسات" />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-sm font-bold text-text-main">الاسم البرمجي (Slug) *</label>
                                                <input required type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all font-mono text-sm"
                                                    value={editingPlan.slug} onChange={e => setEditingPlan({ ...editingPlan, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} placeholder="pro" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-bold text-text-main">وصف الخطة</label>
                                            <input type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all"
                                                value={editingPlan.description || ''} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} placeholder="وصف مختصر يظهر تحت اسم الخطة" />
                                        </div>
                                    </div>
                                )}

                                {/* ===== PRICING SECTION ===== */}
                                {activeSection === 'pricing' && (
                                    <div className="space-y-5">
                                        <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                            <p className="text-xs font-bold text-blue-600 mb-3 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">info</span>
                                                الأسعار الأساسية
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-bold text-text-sub">السعر الشهري ({currency})</label>
                                                    <input required type="number" className="w-full h-11 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all"
                                                        value={editingPlan.price_monthly} onChange={e => setEditingPlan({ ...editingPlan, price_monthly: parseFloat(e.target.value) })} />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-bold text-text-sub">السعر السنوي ({currency})</label>
                                                    <input required type="number" className="w-full h-11 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all"
                                                        value={editingPlan.price_yearly} onChange={e => setEditingPlan({ ...editingPlan, price_yearly: parseFloat(e.target.value) })} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-green-50/50 rounded-2xl border border-green-100">
                                            <p className="text-xs font-bold text-green-600 mb-3 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">local_offer</span>
                                                السعر الافتتاحي (خصم أول فترة)
                                            </p>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-bold text-text-sub">شهري ({currency})</label>
                                                    <input type="number" className="w-full h-11 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-green-500 transition-all"
                                                        value={editingPlan.intro_price_monthly || 0} onChange={e => setEditingPlan({ ...editingPlan, intro_price_monthly: parseFloat(e.target.value) })} />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-bold text-text-sub">سنوي ({currency})</label>
                                                    <input type="number" className="w-full h-11 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-green-500 transition-all"
                                                        value={editingPlan.intro_price_yearly || 0} onChange={e => setEditingPlan({ ...editingPlan, intro_price_yearly: parseFloat(e.target.value) })} />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-bold text-text-sub">المدة (بالشهور)</label>
                                                    <input type="number" className="w-full h-11 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-green-500 transition-all"
                                                        value={editingPlan.intro_period_months || 0} onChange={e => setEditingPlan({ ...editingPlan, intro_period_months: parseInt(e.target.value) })} placeholder="12" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 rounded-2xl border border-border-color">
                                            <p className="text-xs font-bold text-text-sub mb-3 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-sm">strikethrough_s</span>
                                                السعر المشطوب (للعرض فقط)
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-bold text-text-sub">شهري ({currency})</label>
                                                    <input type="number" className="w-full h-10 px-3 rounded-lg border border-border-color bg-white"
                                                        value={editingPlan.original_price_monthly || 0} onChange={e => setEditingPlan({ ...editingPlan, original_price_monthly: parseFloat(e.target.value) })} />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-bold text-text-sub">سنوي ({currency})</label>
                                                    <input type="number" className="w-full h-10 px-3 rounded-lg border border-border-color bg-white"
                                                        value={editingPlan.original_price_yearly || 0} onChange={e => setEditingPlan({ ...editingPlan, original_price_yearly: parseFloat(e.target.value) })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ===== LIMITS SECTION ===== */}
                                {activeSection === 'limits' && (
                                    <div className="space-y-4">
                                        {/* Messages Limit */}
                                        <div className="p-4 bg-white rounded-2xl border border-border-color">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">sms</span>
                                                    <span className="text-sm font-bold text-text-main">الرسائل الشهرية</span>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <span className="text-xs text-text-sub">غير محدود</span>
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 accent-primary rounded cursor-pointer"
                                                        checked={isUnlimited(editingPlan.max_messages)}
                                                        onChange={e => setEditingPlan({
                                                            ...editingPlan,
                                                            max_messages: e.target.checked ? 999999 : 100
                                                        })}
                                                    />
                                                </label>
                                            </div>
                                            {!isUnlimited(editingPlan.max_messages) && (
                                                <input type="number" className="w-full h-11 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all"
                                                    value={editingPlan.max_messages} onChange={e => setEditingPlan({ ...editingPlan, max_messages: parseInt(e.target.value) || 0 })} placeholder="مثال: 500" />
                                            )}
                                            {isUnlimited(editingPlan.max_messages) && (
                                                <div className="text-center py-2 bg-green-50 rounded-xl border border-green-200 text-green-700 text-sm font-bold">
                                                    ∞ رسائل غير محدودة
                                                </div>
                                            )}
                                        </div>

                                        {/* Stores Limit */}
                                        <div className="p-4 bg-white rounded-2xl border border-border-color">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">storefront</span>
                                                    <span className="text-sm font-bold text-text-main">عدد المتاجر</span>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <span className="text-xs text-text-sub">غير محدود</span>
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 accent-primary rounded cursor-pointer"
                                                        checked={isUnlimited(editingPlan.max_stores)}
                                                        onChange={e => setEditingPlan({
                                                            ...editingPlan,
                                                            max_stores: e.target.checked ? 999999 : 1
                                                        })}
                                                    />
                                                </label>
                                            </div>
                                            {!isUnlimited(editingPlan.max_stores) && (
                                                <input type="number" className="w-full h-11 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all"
                                                    value={editingPlan.max_stores} onChange={e => setEditingPlan({ ...editingPlan, max_stores: parseInt(e.target.value) || 0 })} placeholder="مثال: 3" />
                                            )}
                                            {isUnlimited(editingPlan.max_stores) && (
                                                <div className="text-center py-2 bg-green-50 rounded-xl border border-green-200 text-green-700 text-sm font-bold">
                                                    ∞ متاجر غير محدودة
                                                </div>
                                            )}
                                        </div>

                                        {/* WhatsApp Numbers Limit */}
                                        <div className="p-4 bg-white rounded-2xl border border-border-color">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">phone_android</span>
                                                    <span className="text-sm font-bold text-text-main">أرقام واتساب</span>
                                                </div>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <span className="text-xs text-text-sub">غير محدود</span>
                                                    <input
                                                        type="checkbox"
                                                        className="w-5 h-5 accent-primary rounded cursor-pointer"
                                                        checked={isUnlimited(editingPlan.max_whatsapp_numbers)}
                                                        onChange={e => setEditingPlan({
                                                            ...editingPlan,
                                                            max_whatsapp_numbers: e.target.checked ? 999999 : 1
                                                        })}
                                                    />
                                                </label>
                                            </div>
                                            {!isUnlimited(editingPlan.max_whatsapp_numbers) && (
                                                <input type="number" className="w-full h-11 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all"
                                                    value={editingPlan.max_whatsapp_numbers} onChange={e => setEditingPlan({ ...editingPlan, max_whatsapp_numbers: parseInt(e.target.value) || 0 })} placeholder="مثال: 5" />
                                            )}
                                            {isUnlimited(editingPlan.max_whatsapp_numbers) && (
                                                <div className="text-center py-2 bg-green-50 rounded-xl border border-green-200 text-green-700 text-sm font-bold">
                                                    ∞ أرقام غير محدودة
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta API Toggle */}
                                        <div className="p-4 bg-white rounded-2xl border border-border-color">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary">api</span>
                                                    <div>
                                                        <span className="text-sm font-bold text-text-main">ميتا API الرسمي</span>
                                                        <p className="text-[10px] text-text-sub">السماح باستخدام Meta WhatsApp Business API</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="sr-only peer"
                                                        checked={editingPlan.meta_api_enabled || false}
                                                        onChange={e => setEditingPlan({ ...editingPlan, meta_api_enabled: e.target.checked })}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ===== FEATURES SECTION ===== */}
                                {activeSection === 'features' && (
                                    <div className="space-y-4">
                                        <p className="text-xs text-text-sub">هذه المميزات تظهر في بطاقة الباقة للمستخدم. يمكنك إضافة أو حذف أو ترتيب كل ميزة.</p>

                                        {/* Feature List */}
                                        <div className="space-y-2">
                                            {(Array.isArray(editingPlan.features) ? editingPlan.features : []).map((feature, index) => (
                                                <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-border-color group">
                                                    <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>
                                                    <span className="flex-1 text-sm text-text-main">{feature}</span>
                                                    <div className="flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <button type="button" onClick={() => moveFeature(index, 'up')} disabled={index === 0}
                                                            className="p-1 hover:bg-white rounded disabled:opacity-20 transition-all">
                                                            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                                                        </button>
                                                        <button type="button" onClick={() => moveFeature(index, 'down')} disabled={index === (editingPlan.features as string[]).length - 1}
                                                            className="p-1 hover:bg-white rounded disabled:opacity-20 transition-all">
                                                            <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                                                        </button>
                                                        <button type="button" onClick={() => removeFeature(index)}
                                                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-all">
                                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {(Array.isArray(editingPlan.features) ? editingPlan.features : []).length === 0 && (
                                            <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-border-color">
                                                <span className="material-symbols-outlined text-3xl text-text-sub opacity-30 mb-2 block">playlist_add</span>
                                                <p className="text-sm text-text-sub">لم تتم إضافة مميزات بعد</p>
                                            </div>
                                        )}

                                        {/* Add New Feature */}
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                className="flex-1 h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all"
                                                value={editingPlan._newFeature || ''}
                                                onChange={e => setEditingPlan({ ...editingPlan, _newFeature: e.target.value })}
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                                                placeholder="اكتب ميزة جديدة واضغط Enter أو زر الإضافة..."
                                            />
                                            <button type="button" onClick={addFeature}
                                                className="px-5 h-12 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-md shadow-primary/20">
                                                <span className="material-symbols-outlined text-sm">add</span>
                                                إضافة
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ===== PERMISSIONS SECTION ===== */}
                                {activeSection === 'permissions' && (
                                    <div className="space-y-4">
                                        <p className="text-xs text-text-sub">حدد التبويبات التي يمكن لمشتركي هذه الخطة الوصول إليها في لوحة التحكم.</p>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {[
                                                { id: 'dashboard', label: 'لوحة التحكم', icon: 'dashboard' },
                                                { id: 'connections', label: 'ربط واتساب', icon: 'link' },
                                                { id: 'woocommerce', label: 'ووكومرس', icon: 'shopping_cart' },
                                                { id: 'salla', label: 'سلة', icon: 'store' },
                                                { id: 'shopify', label: 'شوبيفاي', icon: 'storefront' },
                                                { id: 'notifications', label: 'سجل الرسائل', icon: 'notifications' },
                                                { id: 'emulator', label: 'المحاكي', icon: 'phone_iphone' },
                                                { id: 'campaigns', label: 'الحملات', icon: 'campaign' },
                                                { id: 'abandoned-cart', label: 'السلة المتروكة', icon: 'remove_shopping_cart' },
                                                { id: 'settings', label: 'الإعدادات', icon: 'settings' },
                                                { id: 'support', label: 'الدعم الفني', icon: 'support_agent' }
                                            ].map(tab => {
                                                const isChecked = editingPlan.allowed_tabs?.includes(tab.id) ?? false;
                                                return (
                                                    <label key={tab.id} className={`flex items-center gap-2.5 cursor-pointer p-3 rounded-xl transition-all border ${isChecked ? 'bg-primary/5 border-primary/30 shadow-sm' : 'bg-white border-border-color hover:border-primary/30'}`}>
                                                        <input
                                                            type="checkbox"
                                                            className="w-4 h-4 accent-primary rounded cursor-pointer"
                                                            checked={isChecked}
                                                            onChange={e => {
                                                                const currentTabs = editingPlan.allowed_tabs || [];
                                                                if (e.target.checked) {
                                                                    setEditingPlan({ ...editingPlan, allowed_tabs: [...currentTabs, tab.id] });
                                                                } else {
                                                                    setEditingPlan({ ...editingPlan, allowed_tabs: currentTabs.filter(t => t !== tab.id) });
                                                                }
                                                            }}
                                                        />
                                                        <span className={`material-symbols-outlined text-[16px] ${isChecked ? 'text-primary' : 'text-text-sub'}`}>{tab.icon}</span>
                                                        <span className={`text-xs font-bold ${isChecked ? 'text-primary' : 'text-text-main'}`}>{tab.label}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ===== SETTINGS SECTION ===== */}
                                {activeSection === 'settings' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-border-color">
                                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                                                <input type="checkbox" className="w-6 h-6 accent-primary rounded-lg cursor-pointer transition-all"
                                                    checked={editingPlan.is_active} onChange={e => setEditingPlan({ ...editingPlan, is_active: e.target.checked })} />
                                                <div>
                                                    <span className="text-sm font-bold text-text-main block">تفعيل الخطة</span>
                                                    <span className="text-[10px] text-text-sub">الخطط المعطلة لن تظهر في صفحة الباقات</span>
                                                </div>
                                            </label>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-border-color">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <label className="text-sm font-bold text-text-main block mb-1">ترتيب العرض</label>
                                                    <p className="text-[10px] text-text-sub">الأرقام الأصغر تظهر أولاً (من اليمين)</p>
                                                </div>
                                                <input type="number" className="w-24 h-11 px-3 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary text-center font-bold"
                                                    value={editingPlan.sort_order} onChange={e => setEditingPlan({ ...editingPlan, sort_order: parseInt(e.target.value) })} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer - Fixed */}
                            <div className="p-5 border-t border-border-color bg-gray-50/50 flex gap-4 justify-end rounded-b-3xl shrink-0">
                                <button type="button" onClick={() => setEditingPlan(null)} className="px-8 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all">إلغاء</button>
                                <button disabled={loading} type="submit" className="px-10 py-3 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50">
                                    {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
