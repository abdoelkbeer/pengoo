'use client';

import React, { useState } from 'react';

type Plan = {
    id: string;
    name: string;
    max_messages: number;
    max_whatsapp_numbers: number;
    max_stores: number;
};

type OverrideLimits = {
    max_messages_override?: number | null;
    max_whatsapp_numbers_override?: number | null;
    max_stores_override?: number | null;
};

interface UserEditorModalProps {
    mode: 'create' | 'edit';
    plans: Plan[];
    
    // For edit mode
    userId?: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    currentPlanId?: string;
    currentStatus?: string;
    currentStartsAt?: string;
    currentEndsAt?: string;
    currentMessages?: number;
    currentWhatsapp?: number;
    currentStores?: number;
    overrides?: OverrideLimits;
}

export default function UserEditorModal(props: UserEditorModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Initial state based on mode
    const [formData, setFormData] = useState({
        // Auth / Profile fields (create only mostly)
        email: props.userEmail || '',
        password: '',
        fullName: props.userName || '',
        phoneNumber: '',

        // Subscription fields
        planId: props.currentPlanId || props.plans[0]?.id || '',
        status: props.currentStatus || 'active',
        startsAt: props.currentStartsAt ? new Date(props.currentStartsAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        endsAt: props.currentEndsAt ? new Date(props.currentEndsAt).toISOString().slice(0, 16) : '',
        
        // Overrides
        maxMessages: props.overrides?.max_messages_override || props.currentMessages || '',
        maxWhatsappNumbers: props.overrides?.max_whatsapp_numbers_override || props.currentWhatsapp || '',
        maxStores: props.overrides?.max_stores_override || props.currentStores || ''
    });

    // Re-sync name/email/phone when props change
    React.useEffect(() => {
        if (props.mode === 'edit') {
            setFormData(prev => ({
                ...prev,
                fullName: props.userName || '',
                email: props.userEmail || '',
                phoneNumber: props.userPhone || '',
            }));
        }
    }, [props.userName, props.userEmail, props.userPhone, props.mode]);

    // Helper to get default limits for selected plan
    const getSelectedPlanDefaults = () => {
        return props.plans.find(p => p.id === formData.planId) || props.plans[0];
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const endpoint = props.mode === 'create' 
                ? '/api/admin/customers/create-manual' 
                : '/api/admin/customers/update-limits';

            const payload = props.mode === 'create' ? {
                email: formData.email,
                password: formData.password,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                planId: formData.planId,
                status: formData.status,
                startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
                endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : null,
                maxMessages: formData.maxMessages !== '' ? Number(formData.maxMessages) : null,
                maxWhatsappNumbers: formData.maxWhatsappNumbers !== '' ? Number(formData.maxWhatsappNumbers) : null,
                maxStores: formData.maxStores !== '' ? Number(formData.maxStores) : null
            } : {
                userId: props.userId,
                planId: formData.planId,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                status: formData.status,
                startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : undefined,
                endsAt: formData.endsAt ? new Date(formData.endsAt).toISOString() : '',
                maxMessages: formData.maxMessages !== '' ? Number(formData.maxMessages) : null,
                maxWhatsappNumbers: formData.maxWhatsappNumbers !== '' ? Number(formData.maxWhatsappNumbers) : null,
                maxStores: formData.maxStores !== '' ? Number(formData.maxStores) : null
            };

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to finish operation');

            alert(props.mode === 'create' ? 'تم إنشاء العميل بنجاح!' : 'تم تحديث العميل بنجاح!');
            window.location.reload();
        } catch (err: any) {
            alert('حدث خطأ: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {props.mode === 'create' ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-black rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/25"
                >
                    <span className="material-symbols-outlined text-[20px]">person_add</span>
                    إضافة عميل يدوياً
                </button>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="p-2 text-text-sub hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="التحكم الشامل والإعدادات"
                >
                    <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
                </button>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>

                    {/* Modal Container */}
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[100%] flex flex-col animate-scale-up border border-border-color">
                        {/* Header */}
                        <div className="bg-gray-50/50 px-6 py-4 border-b border-border-color flex justify-between items-center shrink-0">
                            <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">
                                    {props.mode === 'create' ? 'person_add' : 'manage_accounts'}
                                </span>
                                {props.mode === 'create' ? 'إضافة عميل جديد يدوياً' : `تعديل وإدارة: ${props.userName}`}
                            </h3>
                            <button onClick={() => setIsOpen(false)} className="text-text-sub hover:text-text-main p-1 rounded-lg hover:bg-gray-100 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                            
                            {/* Personal Details - required for Create */}
                            {(props.mode === 'create' || props.mode === 'edit') && (
                                <div className="space-y-4">
                                    <h4 className="text-lg font-black text-text-main border-b pb-2 mb-4">البيانات الشخصية</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-text-sub mb-2">اسم العميل</label>
                                            <input 
                                                type="text" 
                                                value={formData.fullName} 
                                                onChange={e => setFormData({...formData, fullName: e.target.value})}
                                                className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-text-sub mb-2">البريد الإلكتروني</label>
                                            <input 
                                                type="email" 
                                                disabled={props.mode === 'edit'}
                                                value={formData.email} 
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white disabled:bg-gray-100 outline-none focus:border-primary transition-all font-bold" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-text-sub mb-2">رقم الهاتف (اختياري)</label>
                                            <input 
                                                type="tel" 
                                                value={formData.phoneNumber} 
                                                onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                                                className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold text-left" 
                                                dir="ltr"
                                            />
                                        </div>
                                        {props.mode === 'create' && (
                                            <div>
                                                <label className="block text-sm font-bold text-text-sub mb-2">كلمة المرور (دخول مباشر)</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.password} 
                                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                                    className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold" 
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Subscription Details */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-black text-text-main border-b pb-2 mb-4">تفاصيل الاشتراك</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-2">الخطة الأساسية</label>
                                        <select 
                                            value={formData.planId} 
                                            onChange={e => setFormData({...formData, planId: e.target.value})}
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                        >
                                            {props.plans.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-2">حالة الحساب</label>
                                        <select 
                                            value={formData.status} 
                                            onChange={e => setFormData({...formData, status: e.target.value})}
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                        >
                                            <option value="active">نشط (Active)</option>
                                            <option value="inactive">غير نشط (Inactive)</option>
                                            <option value="trialing">فترة تجريبية (Trialing)</option>
                                            <option value="canceled">ملغي (Canceled)</option>
                                            <option value="past_due">متأخر الدفع (Past Due)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-2">تاريخ البدء</label>
                                        <input 
                                            type="datetime-local" 
                                            value={formData.startsAt} 
                                            onChange={e => setFormData({...formData, startsAt: e.target.value})}
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold text-left font-mono" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-2">تاريخ الانتهاء</label>
                                        <input 
                                            type="datetime-local" 
                                            value={formData.endsAt} 
                                            onChange={e => setFormData({...formData, endsAt: e.target.value})}
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold text-left font-mono" 
                                        />
                                        <p className="text-[10px] mt-1 text-slate-500">اتركه فارغاً للاشتراك المفتوح (بدون نهاية).</p>
                                    </div>
                                </div>
                            </div>

                            {/* Overrides */}
                            <div className="space-y-4">
                                <h4 className="text-lg font-black text-text-main border-b pb-2 mb-4">التجاوزات الخاصة (Custom Limits)</h4>
                                <p className="text-xs text-amber-600 font-bold mb-4 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    اترك الحقول فارغة لتطبيق حدود الخطة الأساسية ({getSelectedPlanDefaults().name}). سيتم الاعتماد على الأرقام هنا فقط إذا أدخلت قيماً مخصصة.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-2">حد الرسائل</label>
                                        <input
                                            type="number"
                                            placeholder={`الخطة: ${getSelectedPlanDefaults().max_messages}`}
                                            value={formData.maxMessages}
                                            onChange={(e) => setFormData({ ...formData, maxMessages: e.target.value })}
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-2">حد الأرقام</label>
                                        <input
                                            type="number"
                                            placeholder={`الخطة: ${getSelectedPlanDefaults().max_whatsapp_numbers}`}
                                            value={formData.maxWhatsappNumbers}
                                            onChange={(e) => setFormData({ ...formData, maxWhatsappNumbers: e.target.value })}
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-text-sub mb-2">حد المتاجر</label>
                                        <input
                                            type="number"
                                            placeholder={`الخطة: ${getSelectedPlanDefaults().max_stores}`}
                                            value={formData.maxStores}
                                            onChange={(e) => setFormData({ ...formData, maxStores: e.target.value })}
                                            className="w-full h-11 px-4 text-sm rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            </div>

                            <div className="px-6 py-4 border-t border-border-color bg-gray-50/50 flex gap-3 shrink-0">
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="flex-1 h-12 bg-primary text-white rounded-xl font-black shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                                    {loading ? 'جاري المعالجة...' : props.mode === 'create' ? 'إنشاء العميل' : 'حفظ التعديلات'}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 h-12 bg-white text-text-main border border-border-color rounded-xl font-black hover:bg-gray-50 transition-all"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
            )}

        </>
    );
}
