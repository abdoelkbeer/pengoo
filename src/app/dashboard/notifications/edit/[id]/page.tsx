// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import WhatsAppPreview from '@/components/WhatsAppPreview';

const EVENT_LABELS: Record<string, string> = {
    'order.pending': 'بانتظار الدفع',
    'order.created': 'طلب جديد',
    'order.processing': 'قيد المعالجة',
    'order.on-hold': 'معلق',
    'order.completed': 'مكتمل',
    'order.cancelled': 'ملغي',
    'order.refunded': 'مسترجع',
    'order.failed': 'فشل الدفع',
    'order.shipped': 'تم الشحن',
    'order.out_for_delivery': 'خارج للتوصيل',
    'customer.new': 'عميل جديد',
    'customer.note': 'ملاحظة على الطلب',
};

const EVENTS = [
    { value: 'order.created', label: 'طلب جديد', icon: 'pending', color: 'bg-amber-500' },
    { value: 'order.processing', label: 'قيد المعالجة', icon: 'autorenew', color: 'bg-blue-500' },
    { value: 'order.completed', label: 'مكتمل', icon: 'check_circle', color: 'bg-emerald-500' },
    { value: 'order.refunded', label: 'مسترجع', icon: 'keyboard_return', color: 'bg-rose-500' },
    { value: 'order.cancelled', label: 'ملغي', icon: 'cancel', color: 'bg-slate-500' },
    { value: 'order.on-hold', label: 'معلق', icon: 'pause_circle', color: 'bg-orange-500' },
    { value: 'order.shipped', label: 'تم الشحن', icon: 'local_shipping', color: 'bg-indigo-500' },
    { value: 'order.failed', label: 'فشل الدفع', icon: 'error', color: 'bg-red-500' },
];

const VARIABLES = [
    { key: '{customer_name}', label: 'اسم العميل' },
    { key: '{customer_phone}', label: 'رقم العميل' },
    { key: '{order_id}', label: 'رقم الطلب' },
    { key: '{order_number}', label: 'رقم الطلب #' },
    { key: '{order_total}', label: 'مبلغ الطلب' },
    { key: '{product_list}', label: 'قائمة المنتجات' },
    { key: '{shipping_address}', label: 'عنوان الشحن' },
    { key: '{tracking_url}', label: 'رابط التتبع' },
];

export default function EditNotificationPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedEvent, setSelectedEvent] = useState('');
    const [selectedStore, setSelectedStore] = useState('');
    const [messageTemplate, setMessageTemplate] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [currency, setCurrency] = useState('EGP');
    const [buttonsConfig, setButtonsConfig] = useState<any[]>([]);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: rule } = await supabase
            .from('notification_rules')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (rule) {
            setSelectedEvent(rule.event_type || '');
            setSelectedStore(rule.store_id || '');
            setMessageTemplate(rule.message_template || '');
            setIsActive(rule.is_active ?? true);
            if (rule.buttons_config) {
                setButtonsConfig(Array.isArray(rule.buttons_config) ? rule.buttons_config : []);
            }
        }

        const { data: storesData } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);
        setStores(storesData || []);

        const { data: platformSettings } = await supabase
            .from('platform_settings')
            .select('currency')
            .limit(1)
            .maybeSingle();
        if (platformSettings?.currency) setCurrency(platformSettings.currency);

        setLoading(false);
    };

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        window.dispatchEvent(new CustomEvent('new-notification', {
            detail: {
                id: Math.random().toString(36).substr(2, 9),
                title: type === 'error' ? 'تنبيه' : 'تم بنجاح',
                message,
                type,
                created_at: new Date().toISOString()
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedEvent) { showNotification('يرجى اختيار حدث الإطلاق', 'error'); return; }
        if (!messageTemplate.trim()) { showNotification('يرجى كتابة نص الرسالة', 'error'); return; }

        setSaving(true);
        try {
            const res = await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    event_type: selectedEvent,
                    message_template: messageTemplate,
                    store_id: selectedStore || undefined,
                    is_active: isActive,
                    buttons_config: buttonsConfig,
                }),
            });
            const data = await res.json();
            if (data.success) {
                showNotification('تم الحفظ بنجاح ✓');
                setTimeout(() => router.push('/dashboard/customer-messages'), 1000);
            } else {
                showNotification('فشل الحفظ: ' + (data.error || 'خطأ غير معروف'), 'error');
            }
        } catch {
            showNotification('حدث خطأ غير متوقع', 'error');
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-10">
                <div className="flex flex-col items-center text-primary">
                    <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
                    <span className="font-semibold italic">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    const currentStore = stores.find(s => s.id === selectedStore);

    return (
        <div className="flex-1 w-full bg-[#f8fafc]">
            <div className="max-w-[1400px] mx-auto min-h-screen">
                <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 md:px-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 hover:bg-slate-50 transition-all text-slate-500"
                        >
                            <span className="material-symbols-outlined text-2xl">arrow_forward</span>
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 leading-tight">تعديل قاعدة الرسالة</h1>
                            <p className="text-xs text-slate-500 font-medium">تحكم في محتوى وتوقيت رسائل الواتساب الآلية</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 pulse' : 'bg-slate-400'}`}></span>
                            {isActive ? 'القاعدة نشطة' : 'متوقفة'}
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : <span className="material-symbols-outlined text-sm">save</span>}
                            حفظ التعديلات
                        </button>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-8 p-6 md:p-10">
                    <div className="flex-1 flex flex-col gap-8">
                        <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
                            <div className="flex items-center justify-between relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-2xl">{isActive ? 'notifications_active' : 'notifications_off'}</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900">تفعيل القاعدة</p>
                                        <p className="text-xs text-slate-500 font-medium">تحكم في تشغيل أو إيقاف هذه الرسالة برغبتك</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input checked={isActive} onChange={() => setIsActive(!isActive)} className="sr-only peer" type="checkbox" />
                                    <div className="w-14 h-7 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </section>

                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                            <div className="flex items-center gap-3 mb-6">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">bolt</span>
                                    متى يتم إرسال الرسالة؟
                                </h2>
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {EVENTS.map(event => (
                                    <button
                                        key={event.value}
                                        onClick={() => setSelectedEvent(event.value)}
                                        className={`group relative flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all duration-300 ${selectedEvent === event.value 
                                            ? 'border-primary bg-primary/5 ring-4 ring-primary/5' 
                                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl mb-3 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${selectedEvent === event.value ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 text-slate-500'}`}>
                                            <span className="material-symbols-outlined text-2xl">{event.icon}</span>
                                        </div>
                                        <span className={`text-[13px] font-black text-center ${selectedEvent === event.value ? 'text-primary' : 'text-slate-600'}`}>{event.label}</span>
                                        {selectedEvent === event.value && (
                                            <div className="absolute top-2 right-2 flex items-center justify-center w-5 h-5 bg-primary text-white rounded-full">
                                                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">sms</span>
                                    محتوى الرسالة
                                </h2>
                                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{messageTemplate.length} حرف</span>
                            </div>

                            <div className="mb-6 flex flex-wrap gap-2">
                                {VARIABLES.map(v => (
                                    <button
                                        key={v.key}
                                        onClick={() => setMessageTemplate(prev => prev + ' ' + v.key)}
                                        className="px-4 py-2 bg-slate-50 hover:bg-primary hover:text-white text-slate-600 text-[13px] font-black rounded-2xl border border-slate-200 transition-all flex items-center gap-2 group"
                                    >
                                        <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-white transition-colors">add_circle</span>
                                        {v.label}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                className="w-full h-56 p-6 rounded-[2rem] border-2 border-slate-100 focus:border-primary focus:ring-0 transition-all text-base leading-relaxed resize-none bg-slate-50/50 focus:bg-white font-medium"
                                placeholder="اكتب نص رسالتك هنا مستخدماً المتغيرات أعلاه..."
                                value={messageTemplate}
                                onChange={(e) => setMessageTemplate(e.target.value)}
                            />

                            {/* Dynamic Buttons UI */}
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="font-bold text-slate-900 text-sm">أزرار تفاعلية (حد أقصى 3)</h4>
                                    <button
                                        onClick={() => {
                                            if (buttonsConfig.length < 3) {
                                                setButtonsConfig([...buttonsConfig, { text: '', action: 'none', value: '', reply: '' }]);
                                            } else {
                                                showNotification('الحد الأقصى هو 3 أزرار', 'error');
                                            }
                                        }}
                                        disabled={buttonsConfig.length >= 3}
                                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-30"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        إضافة زر
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    {buttonsConfig.map((btn, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative">
                                            <button 
                                                onClick={() => setButtonsConfig(buttonsConfig.filter((_, i) => i !== idx))}
                                                className="absolute top-2 left-2 size-6 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">الرقم أو النص المطلوب للرد (مثال: 1 أو تأكيد)</label>
                                                    <input 
                                                        type="text"
                                                        maxLength={20}
                                                        placeholder="مثال: 1"
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary outline-none"
                                                        value={btn.text}
                                                        onChange={(e) => {
                                                            const newConfigs = [...buttonsConfig];
                                                            newConfigs[idx].text = e.target.value;
                                                            setButtonsConfig(newConfigs);
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">الإجراء (Action)</label>
                                                    <select 
                                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary outline-none bg-white"
                                                        value={btn.action}
                                                        onChange={(e) => {
                                                            const newConfigs = [...buttonsConfig];
                                                            newConfigs[idx].action = e.target.value;
                                                            if (e.target.value === 'update_wc_status' && !newConfigs[idx].value) {
                                                                newConfigs[idx].value = 'processing';
                                                            }
                                                            setButtonsConfig(newConfigs);
                                                        }}
                                                    >
                                                        <option value="wc_meta_confirm">تأكيد الطلب (تحديث خانة ووكومرس)</option>
                                                        <option value="wc_meta_cancel">إلغاء الطلب (تحديث خانة ووكومرس)</option>
                                                        <option value="wc_meta_support">تواصل مع الدعم (تحديث خانة ووكومرس)</option>
                                                    </select>
                                                </div>
                                            </div>





                                            <div className="mt-3">
                                                <label className="block text-[10px] font-bold text-slate-500 mb-1">الرد التلقائي (يرسل للعميل بعد الضغط)</label>
                                                <textarea 
                                                    rows={2}
                                                    placeholder="مثال: شكراً لك! تم تأكيد طلبك."
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:border-primary outline-none resize-none"
                                                    value={btn.reply}
                                                    onChange={(e) => {
                                                        const newConfigs = [...buttonsConfig];
                                                        newConfigs[idx].reply = e.target.value;
                                                        setButtonsConfig(newConfigs);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {buttonsConfig.length === 0 && (
                                        <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                                            <p className="text-xs text-slate-400">لا يوجد أزرار مضافة حالياً</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {stores.length > 1 && (
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <p className="text-sm font-black text-slate-800 mb-4">المتجر المتصل:</p>
                                    <div className="flex flex-wrap gap-3">
                                        {stores.map(store => (
                                            <button
                                                key={store.id}
                                                onClick={() => setSelectedStore(store.id)}
                                                className={`px-4 py-2.5 rounded-2xl border-2 transition-all text-[13px] font-black ${selectedStore === store.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-500'}`}
                                            >
                                                {store.store_url.split('://')[1] || store.store_url}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="lg:w-[400px]">
                        <div className="sticky top-28">
                            <div className="mb-6 flex items-center justify-between px-4">
                                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-500">visibility</span>
                                    معاينة الهاتف
                                </h3>
                                <div className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">مباشر الآن</span>
                                </div>
                            </div>

                            {/* Phone Mockup with WhatsAppPreview internal logic */}
                            <div className="relative mx-auto w-full max-w-[320px] aspect-[9/18.5] bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-[8px] border-slate-800 overflow-hidden ring-4 ring-slate-100">
                                <div className="h-full w-full bg-[#e5ddd5] rounded-[2.2rem] overflow-hidden flex flex-col relative pattern-whatsapp">
                                    <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                                            <span className="material-symbols-outlined">person</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black">Pengoo Bot</p>
                                            <p className="text-[10px] opacity-70">متصل الآن</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                                        <div className="mx-auto bg-white/50 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] text-slate-500 font-bold mb-4 shadow-sm w-fit">
                                            اليوم
                                        </div>

                                        <div className="relative group max-w-[90%] self-end">
                                            <div className="bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-none shadow-sm relative z-10">
                                                <p className="text-[13px] text-slate-800 leading-relaxed whitespace-pre-wrap font-medium" dir="rtl">
                                                    {messageTemplate.trim() ? (
                                                        messageTemplate
                                                            .replace(/{customer_name}/g, 'أحمد محمد')
                                                            .replace(/{customer_phone}/g, '+966501234567')
                                                            .replace(/{order_id}/g, '1234')
                                                            .replace(/{order_number}/g, '1234')
                                                            .replace(/{order_total}/g, `250 ${currency}`)
                                                            .replace(/{product_list}/g, '• منتج 1 × 1\n• منتج 2 × 2')
                                                            .replace(/{shipping_address}/g, 'الرياض، المملكة العربية السعودية')
                                                            .replace(/{tracking_url}/g, 'https://track.example.com')
                                                    ) : (
                                                        <span className="text-slate-400 italic">ابدأ في الكتابة لمشاهدة المعاينة...</span>
                                                    )}
                                                </p>
                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                    <span className="text-[9px] text-slate-400 font-bold">12:45 PM</span>
                                                    <span className="material-symbols-outlined text-[14px] text-sky-500 font-bold">done_all</span>
                                                </div>
                                            </div>

                                            {/* Preview Buttons */}
                                            {buttonsConfig.length > 0 && (
                                                <div className="mt-1 flex flex-col gap-1">
                                                    {buttonsConfig.map((btn, idx) => (
                                                        <div key={idx} className="bg-white/90 backdrop-blur-sm p-3 rounded-xl border border-slate-200 text-center text-[12px] font-bold text-primary shadow-sm">
                                                            {btn.text || "زر بدون نص"}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white p-3 flex items-center gap-3">
                                        <div className="flex-1 bg-slate-50 rounded-full px-4 py-2 text-[10px] text-slate-400 border border-slate-100">
                                            اكتب رسالة...
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <WhatsAppPreview 
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                message={messageTemplate}
                buttons={buttonsConfig}
            />
            
            <style jsx>{`
                .pattern-whatsapp {
                    background-image: url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png");
                    background-color: #e5ddd5;
                    background-size: 400px;
                }
                .pulse {
                    animation: pulse-animation 2s infinite;
                }
                @keyframes pulse-animation {
                    0% { box-shadow: 0 0 0 0px rgba(16, 185, 129, 0.4); }
                    100% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                }
            `}</style>
        </div>
    );
}
