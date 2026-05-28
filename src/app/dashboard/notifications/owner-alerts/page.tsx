'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

const AVAILABLE_EVENTS = [
    { id: 'order.created', label: 'طلب جديد', description: 'تنبيه فوري بمجرد إنشاء طلب جديد في متجرك', icon: 'shopping_basket', defaultTemplate: '🛒 *طلب جديد!*\n\nرقم الطلب: {order_number}\nالعميل: {customer_name}\nالإجمالي: {order_total}' },
    { id: 'order.processing', label: 'طلب قيد المعالجة', description: 'تنبيه عند تحول حالة الطلب إلى قيد المعالجة', icon: 'autorenew', defaultTemplate: '🔄 *طلب قيد المعالجة*\n\nرقم الطلب: {order_number}\nالعميل: {customer_name}' },
    { id: 'order.completed', label: 'طلب مكتمل', description: 'تنبيه عند اكتمال الطلب بنجاح', icon: 'check_circle', defaultTemplate: '✅ *طلب مكتمل*\n\nرقم الطلب: {order_number}\nالعميل: {customer_name}\nالإجمالي: {order_total}' },
    { id: 'order.cancelled', label: 'طلب ملغي', description: 'تنبيه عند إلغاء أي طلب من قبل العميل أو المتجر', icon: 'cancel', defaultTemplate: '❌ *طلب ملغي*\n\nرقم الطلب: {order_number}\nالعميل: {customer_name}' },
    { id: 'order.refunded', label: 'طلب مسترجع', description: 'تنبيه عند استرجاع أي طلب', icon: 'keyboard_return', defaultTemplate: '↩️ *طلب مسترجع*\n\nرقم الطلب: {order_number}\nالعميل: {customer_name}\nالإجمالي: {order_total}' },
    { id: 'customer.new', label: 'عميل جديد', description: 'تنبيه عند تسجيل عميل جديد في متجرك', icon: 'person_add', defaultTemplate: '👤 *عميل جديد!*\n\nاسم العميل: {customer_name}' },
];

const TEMPLATE_VARIABLES = [
    { key: '{customer_name}', label: 'اسم العميل', icon: 'person' },
    { key: '{customer_phone}', label: 'رقم العميل', icon: 'phone' },
    { key: '{order_number}', label: 'رقم الطلب', icon: 'tag' },
    { key: '{order_total}', label: 'إجمالي الطلب', icon: 'payments' },
    { key: '{product_list}', label: 'قائمة المنتجات', icon: 'list_alt' },
    { key: '{shipping_address}', label: 'عنوان الشحن', icon: 'location_on' },
];

import CountryCodeSelector from '@/components/CountryCodeSelector';
import { COUNTRIES } from '@/utils/countries';

export default function OwnerAlertsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const [isEnabled, setIsEnabled] = useState(false);
    const [alertPhone, setAlertPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+20');
    const [enabledEvents, setEnabledEvents] = useState<string[]>([]);
    const [eventTemplates, setEventTemplates] = useState<Record<string, string>>({});
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
    const [stores, setStores] = useState<any[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

    const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
    const supabase = createClient();

    useEffect(() => {
        loadStoresAndSettings();
    }, []);

    const loadStoresAndSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: storesData, error } = await supabase
                .from('stores')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            if (storesData && storesData.length > 0) {
                setStores(storesData);
                const initialStoreId = storesData[0].id;
                setSelectedStoreId(initialStoreId);
                await fetchSettingsForStore(initialStoreId);
            } else {
                setLoading(false);
            }
        } catch (err) {
            console.error('Failed to load stores or settings', err);
            setLoading(false);
        }
    };

    const fetchSettingsForStore = async (storeId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/notifications/owner-settings?storeId=${storeId}`);
            const data = await res.json();
            if (data.settings) {
                setIsEnabled(data.settings.is_enabled);
                
                const phoneStr = data.settings.alert_phone || '';
                if (phoneStr) {
                    const cleanedPhone = phoneStr.startsWith('+') ? phoneStr : '+' + phoneStr;
                    const countryMatch = COUNTRIES.find(c => cleanedPhone.startsWith(c.code));
                    if (countryMatch) {
                        setCountryCode(countryMatch.code);
                        setAlertPhone(cleanedPhone.substring(countryMatch.code.length));
                    } else {
                        setAlertPhone(phoneStr);
                        setCountryCode('+20'); // fallback
                    }
                } else {
                    setAlertPhone('');
                    setCountryCode('+20');
                }
                
                setEnabledEvents(data.settings.enabled_events || []);
                setEventTemplates(data.settings.event_templates || {});
            } else {
                setIsEnabled(false);
                setAlertPhone('');
                setCountryCode('+20');
                setEnabledEvents([]);
                setEventTemplates({});
            }
        } catch (err) {
            console.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleStoreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const storeId = e.target.value;
        setSelectedStoreId(storeId);
        fetchSettingsForStore(storeId);
    };

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const fullPhone = alertPhone ? (countryCode + alertPhone).replace(/\+/g, '') : '';
            const res = await fetch('/api/notifications/owner-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    store_id: selectedStoreId || null,
                    alert_phone: fullPhone,
                    is_enabled: isEnabled,
                    enabled_events: enabledEvents,
                    event_templates: eventTemplates
                })
            });
            const data = await res.json();
            if (data.success) {
                showMessage('تم حفظ إعدادات الإشعارات بنجاح ✓');
            } else {
                showMessage('فشل الحفظ: ' + data.error, 'error');
            }
        } catch (err) {
            showMessage('حدث خطأ غير متوقع', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleEvent = (eventId: string) => {
        const isCurrentlyEnabled = enabledEvents.includes(eventId);
        if (isCurrentlyEnabled) {
            setEnabledEvents(prev => prev.filter(id => id !== eventId));
            if (expandedEvent === eventId) setExpandedEvent(null);
        } else {
            setEnabledEvents(prev => [...prev, eventId]);
            // Set default template if none exists
            if (!eventTemplates[eventId]) {
                const event = AVAILABLE_EVENTS.find(e => e.id === eventId);
                if (event) {
                    setEventTemplates(prev => ({ ...prev, [eventId]: event.defaultTemplate }));
                }
            }
            setExpandedEvent(eventId);
        }
    };

    const updateTemplate = (eventId: string, value: string) => {
        setEventTemplates(prev => ({ ...prev, [eventId]: value }));
    };

    const insertVariable = (eventId: string, variable: string) => {
        const textarea = textareaRefs.current[eventId];
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const currentValue = eventTemplates[eventId] || '';
            const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end);
            updateTemplate(eventId, newValue);

            // Restore cursor position after variable
            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + variable.length;
            }, 0);
        } else {
            // Fallback: append to end
            const currentValue = eventTemplates[eventId] || '';
            updateTemplate(eventId, currentValue + variable);
        }
    };

    const resetToDefault = (eventId: string) => {
        const event = AVAILABLE_EVENTS.find(e => e.id === eventId);
        if (event) {
            updateTemplate(eventId, event.defaultTemplate);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-10 h-full">
                <div className="flex flex-col items-center text-primary">
                    <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
                    <span className="font-bold">جاري تحميل الإعدادات...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-slate-50 overflow-y-auto">
            <AnimatePresence>
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-xl text-white font-bold text-sm ${message.type === 'success' ? 'bg-slate-900' : 'bg-red-600'}`}
                    >
                        {message.text}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-8 max-w-4xl mx-auto w-full">
                {/* Header Section */}
                <div className="mb-10 text-start">
                    <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center justify-start gap-3">
                        <span className="material-symbols-outlined text-primary text-4xl">notifications_active</span>
                        إشعارات صاحب المتجر (واتساب)
                    </h1>
                    <p className="text-slate-500 font-medium text-start">استلم إشعاراً فورياً على واتساب مع كل طلب جديد أو تحديث في متجرك لتبقى على إطلاع دائم.</p>
                </div>

                {/* Store Selector */}
                {stores.length > 0 && (
                    <div className="mb-8 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-50">
                        <div className="flex items-center gap-3">
                            <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-[28px]">storefront</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">تخصيص المتجر</h3>
                                <p className="text-sm text-slate-500">قم بتعديل إعدادات التنبيهات لكل متجر على حدة</p>
                            </div>
                        </div>

                        <div className="relative z-50 min-w-[250px]">
                            <button
                                onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 text-slate-800 font-bold rounded-2xl px-5 py-3.5 transition-all shadow-sm hover:border-primary/30"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                                    <span>{stores.find(s => s.id === selectedStoreId)?.name || (stores.find(s => s.id === selectedStoreId)?.store_url) || 'اختر متجر'}</span>
                                </div>
                                <span className={`material-symbols-outlined transition-transform ${isStoreDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>

                            {isStoreDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsStoreDropdownOpen(false)}></div>
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[280px] animate-in fade-in slide-in-from-top-2">
                                        {stores.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => {
                                                    setSelectedStoreId(s.id);
                                                    fetchSettingsForStore(s.id);
                                                    setIsStoreDropdownOpen(false);
                                                }}
                                                className={`flex items-center justify-between w-full text-start px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${selectedStoreId === s.id ? 'bg-primary/5 text-primary' : 'text-slate-700'}`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{s.name || s.domain || 'متجر غير مسمى'}</span>
                                                    <span className="text-[10px] opacity-60 uppercase font-mono tracking-tighter">{s.store_url}</span>
                                                </div>
                                                {selectedStoreId === s.id && (
                                                    <span className="material-symbols-outlined text-primary">check_circle</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Configuration Card */}
                <div className="grid grid-cols-1 gap-8">
                    {/* Main Settings */}
                    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <div className="px-10 py-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isEnabled ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 'bg-slate-100 text-slate-400'}`}>
                                        <span className="material-symbols-outlined text-2xl">{isEnabled ? 'notifications_active' : 'notifications_off'}</span>
                                    </div>
                                    <div className="text-right">
                                        <h3 className="text-lg font-black text-slate-900">حالة الإشعارات</h3>
                                        <p className="text-sm text-slate-500">{isEnabled ? 'إشعارات الواتساب مفعّلة' : 'إشعارات الواتساب معطلة حالياً'}</p>
                                    </div>
                                </div>
                                <button
                                    dir="ltr"
                                    onClick={() => setIsEnabled(!isEnabled)}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isEnabled ? 'bg-green-500' : 'bg-slate-200'}`}
                                >
                                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex flex-col gap-2 text-right">
                                    <label className="text-sm font-black text-slate-700">رقم واتساب صاحب المتجر (لاستلام الإشعارات)</label>
                                    <div className="relative group flex items-center h-14" dir="ltr">
                                        <div className="relative h-full w-44 shrink-0 z-[60]">
                                            <CountryCodeSelector
                                                value={countryCode}
                                                onChange={(val) => setCountryCode(val)}
                                                disabled={!isEnabled}
                                                className="h-full"
                                                variant="prefix"
                                            />
                                        </div>
                                        
                                        <div className="relative flex-1 h-full -ml-px">
                                            <input
                                                type="tel"
                                                className="w-full h-full pl-6 pr-12 rounded-r-2xl rounded-l-none border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 font-bold text-lg text-left shadow-sm z-10 relative focus:z-20"
                                                placeholder="10XXXXXXXX"
                                                value={alertPhone}
                                                onChange={(e) => setAlertPhone(e.target.value.replace(/\D/g, ''))}
                                                dir="ltr"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors z-30">phone_iphone</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 pr-2 italic">اختر دولتك وأدخل باقي رقمك بدون مفتاح الدولة (مثال لمصر: 1012345678)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Events Selection Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-lg font-black text-slate-800">الأحداث التي سيصلك عنها تنبيه</h3>
                            <span className="text-xs bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-bold">{enabledEvents.length} مفعل</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {AVAILABLE_EVENTS.map((event) => {
                                const active = enabledEvents.includes(event.id);
                                const isExpanded = expandedEvent === event.id && active;
                                return (
                                    <div key={event.id} className={`rounded-[2rem] border-2 transition-all overflow-hidden ${active ? 'bg-white border-primary shadow-xl shadow-primary/5 ring-4 ring-primary/5' : 'bg-white/50 border-slate-100 hover:border-slate-200'} ${isExpanded ? 'md:col-span-2' : ''}`}>
                                        <button
                                            onClick={() => toggleEvent(event.id)}
                                            className="w-full p-6 text-right flex gap-4"
                                        >
                                            <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                <span className="material-symbols-outlined text-2xl">{event.icon}</span>
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className={`font-black text-sm ${active ? 'text-slate-900' : 'text-slate-500'}`}>{event.label}</h4>
                                                    <div className="flex items-center gap-2">
                                                        {active && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExpandedEvent(isExpanded ? null : event.id);
                                                                }}
                                                                className="text-primary hover:bg-primary/10 rounded-xl px-2 py-1 text-xs font-bold flex items-center gap-1 transition-colors"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">{isExpanded ? 'expand_less' : 'edit_note'}</span>
                                                                {isExpanded ? 'إغلاق' : 'تعديل الرسالة'}
                                                            </button>
                                                        )}
                                                        {active && <span className="material-symbols-outlined text-primary text-lg">check_circle</span>}
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{event.description}</p>
                                            </div>
                                        </button>

                                        {/* Expanded Message Template Editor */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-6 pb-6 pt-0 border-t border-slate-100">
                                                        <div className="mt-4 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <label className="text-sm font-black text-slate-700">✏️ نص الرسالة</label>
                                                                <button
                                                                    onClick={() => resetToDefault(event.id)}
                                                                    className="text-xs text-slate-400 hover:text-primary font-bold flex items-center gap-1 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                                                                    استعادة الافتراضي
                                                                </button>
                                                            </div>

                                                            <textarea
                                                                ref={(el) => { textareaRefs.current[event.id] = el; }}
                                                                className="w-full min-h-[140px] p-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-800 font-medium text-sm resize-y leading-relaxed"
                                                                dir="rtl"
                                                                placeholder="اكتب رسالة التنبيه هنا..."
                                                                value={eventTemplates[event.id] || ''}
                                                                onChange={(e) => updateTemplate(event.id, e.target.value)}
                                                            />

                                                            {/* Variable Buttons */}
                                                            <div className="space-y-2">
                                                                <p className="text-xs text-slate-400 font-bold">📌 اضغط لإدراج متغير في الرسالة:</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {TEMPLATE_VARIABLES.map(v => (
                                                                        <button
                                                                            key={v.key}
                                                                            onClick={() => insertVariable(event.id, v.key)}
                                                                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                                                                        >
                                                                            <span className="material-symbols-outlined text-sm">{v.icon}</span>
                                                                            {v.label}
                                                                            <span className="text-primary/50 font-mono text-[10px]" dir="ltr">{v.key}</span>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Preview */}
                                                            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mt-2">
                                                                <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-sm">visibility</span>
                                                                    معاينة الرسالة
                                                                </p>
                                                                <p className="text-sm text-green-900 whitespace-pre-wrap leading-relaxed" dir="rtl">
                                                                    {(eventTemplates[event.id] || '')
                                                                        .replace(/{customer_name}/g, 'أحمد محمد')
                                                                        .replace(/{customer_phone}/g, '+966501234567')
                                                                        .replace(/{order_number}/g, '1042')
                                                                        .replace(/{order_total}/g, '350 ج.م')
                                                                        .replace(/{product_list}/g, '• منتج 1 × 1\n• منتج 2 × 2')
                                                                        .replace(/{shipping_address}/g, 'الرياض، المملكة العربية السعودية')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Save Footer */}
                    <div className="pt-6 pb-20">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-bold text-lg hover:bg-slate-800 shadow-2xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                            {saving ? (
                                <span className="material-symbols-outlined animate-spin">sync</span>
                            ) : (
                                <span className="material-symbols-outlined">save</span>
                            )}
                            {saving ? 'جاري الحفظ...' : 'حفظ إعدادات الإشعارات'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
