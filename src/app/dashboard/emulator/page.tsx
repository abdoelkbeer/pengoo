'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import CountryCodeSelector from '@/components/CountryCodeSelector';

const ALL_EVENT_TYPES = [
    { type: 'order.pending', label: 'بانتظار الدفع (Pending)' },
    { type: 'order.processing', label: 'قيد المعالجة (Processing)' },
    { type: 'order.on-hold', label: 'معلق (On Hold)' },
    { type: 'order.completed', label: 'مكتمل (Completed)' },
    { type: 'order.cancelled', label: 'ملغى (Cancelled)' },
    { type: 'order.refunded', label: 'مسترجع (Refunded)' },
    { type: 'order.failed', label: 'فشل الدفع (Failed)' },
    { type: 'order.shipped', label: 'تم الشحن (Shipped)' },
    { type: 'order.out_for_delivery', label: 'خارج للتوصيل (Out for Delivery)' },
    { type: 'customer.created', label: 'عميل جديد (New Customer)' },
    { type: 'order.note', label: 'ملاحظة على الطلب (Order Note)' },
];

export default function EmulatorPage() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState<any>(null);
    const [connections, setConnections] = useState<any[]>([]);
    const [engineProcessing, setEngineProcessing] = useState(false);

    // Testing state
    const [testPhone, setTestPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+20');
    const [testMode, setTestMode] = useState<'custom' | 'webhook'>('webhook');
    const [customMessage, setCustomMessage] = useState('');

    // Webhook simulation state
    const [selectedEvent, setSelectedEvent] = useState('order.processing');
    const [orderId, setOrderId] = useState('1001');
    const [orderTotal, setOrderTotal] = useState('150');
    const [customerName, setCustomerName] = useState('أحمد محمد');

    // Chat logs
    const [logs, setLogs] = useState<any[]>([]);
    const [simulating, setSimulating] = useState(false);
    const [toasts, setToasts] = useState<any[]>([]);
    const chatEndRef = useRef<HTMLDivElement>(null);

    const addToast = (message: string, type: 'success' | 'error' = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    };

    useEffect(() => {
        loadInitialData();
        // Set up real-time subscription for message logs to update the chat
        const channel = supabase
            .channel('message_logs_emulator')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_logs' }, (payload) => {
                if (payload.new) {
                    setLogs(prev => {
                        const exists = prev.find((l: any) => l.id === (payload.new as any).id);
                        if (exists) {
                            return prev.map((l: any) => l.id === (payload.new as any).id ? payload.new : l);
                        }
                        return [...prev, payload.new];
                    });
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const loadInitialData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Load stores
        const { data: stores } = await supabase.from('stores').select('*').eq('user_id', user.id).limit(1);
        if (stores && stores.length > 0) setStore(stores[0]);

        // Load connections
        const { data: conns } = await supabase.from('whatsapp_connections').select('*').eq('user_id', user.id);
        setConnections(conns || []);

        // Load recent logs for this user
        const { data: recentLogs } = await supabase
            .from('message_logs')
            .select('*, buttons')
            .eq('user_id', user.id)
            .order('sent_at', { ascending: false })
            .limit(20);

        if (recentLogs) setLogs(recentLogs.reverse());
        setLoading(false);
    };

    const getFullPhoneNumber = () => {
        let cleaned = testPhone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
        return `${countryCode}${cleaned}`.replace(/\+/g, '');
    };

    const handleSendCustomMessage = async () => {
        if (!testPhone || !customMessage) return alert('يرجى إدخال رقم الهاتف والرسالة');
        setSimulating(true);
        try {
            const fullPhone = getFullPhoneNumber();
            let finalMessage = customMessage
                .replace(/{customer_name}/g, customerName)
                .replace(/{name}/g, customerName)
                .replace(/{phone}/g, fullPhone)
                .replace(/{order_id}/g, orderId)
                .replace(/{total}/g, orderTotal);

            const res = await fetch('/api/whatsapp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone_number: fullPhone, message: finalMessage })
            });
            if (res.ok) {
                setCustomMessage('');
                addToast('تم إرسال الرسالة بنجاح', 'success');
            } else {
                addToast('فشل إرسال الرسالة. تأكد من اتصال الرقم.', 'error');
            }
        } catch (e) {
            addToast('حدث خطأ أثناء محاولة الإرسال', 'error');
        }
        setSimulating(false);
        // Automatically trigger the engine to process the test message
        runSenderEngineOnce();
    };

    const handleSimulateWebhook = async () => {
        if (!testPhone || !store) return alert(!store ? 'لا يوجد متجر مربوط' : 'يرجى إدخال رقم الهاتف');
        setSimulating(true);
        try {
            const fullPhone = getFullPhoneNumber();
            const res = await fetch('/api/emulator/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    store_id: store.id,
                    event_type: selectedEvent,
                    phone_number: fullPhone,
                    payload: {
                        id: orderId,
                        total: orderTotal,
                        billing: { first_name: customerName, phone: fullPhone }
                    }
                })
            });
            const data = await res.json();
            if (data.success) {
                addToast('تمت محاكاة الحدث وإرسال الإشعار', 'success');
            } else {
                addToast(data.error || 'فشل محاكاة الطلب. تأكد من تفعيل الإشعارات.', 'error');
            }
        } catch (e) {
            addToast('حدث خطأ أثناء محاكاة الحدث', 'error');
        }
        setSimulating(false);
        // Automatically trigger (removed to avoid duplicates as worker is already polling)
    };

    const runSenderEngineOnce = async () => {
        // (Removed to avoid duplicates as worker is already polling)
    };

    const handleRunSenderEngine = async () => {
        if (connections.filter(c => c.status === 'CONNECTED').length === 0) {
            return alert('يجب ربط رقم واتساب أولاً لتتمكن من الإرسال.');
        }
        setEngineProcessing(true);
        try {
            let processedTotal = 0;
            let hasMore = true;

            while (hasMore) {
                const res = await fetch('/api/whatsapp/send', { method: 'POST' });
                const data = await res.json();

                if (data.processed > 0) {
                    processedTotal += data.processed;
                    // If the API says there are still more 'remaining' in the DB
                    if (data.remaining > 0) {
                        hasMore = true;
                        // Optional: Small delay to not spam the server/worker too hard
                        await new Promise(r => setTimeout(r, 1000));
                    } else {
                        hasMore = false;
                    }
                } else {
                    hasMore = false;
                }

                if (!hasMore) {
                    if (processedTotal > 0) {
                        addToast(`تم الانتهاء من معالجة ${processedTotal} رسالة بنجاح`, 'success');
                    } else if (data.message === 'No pending messages') {
                        addToast('لا يوجد رسائل معلقة حالياً', 'success');
                    }
                }
            }
        } catch (error) {
            console.error('Engine error:', error);
            addToast('حدث خطأ أثناء تشغيل محرك الإرسال', 'error');
        } finally {
            setEngineProcessing(false);
        }
    };

    if (loading) return <div className="p-10 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">sync</span></div>;

    const activeConnections = connections.filter(c => c.status === 'CONNECTED');

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-slate-50">
            {/* LEFT PANEL: Setup & Controls */}
            <div className="w-1/3 border-l border-slate-200 bg-white p-6 overflow-y-auto flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-3xl">science</span>
                        جرّب ترسل مجانا
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">جرب الرسائل الواردة من ووكومرس أو أرسل رسائل مخصصة مباشرة.</p>
                </div>

                {/* Target Number with Country Selector */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">رقم العميل (اختبار)</label>
                    <div className="relative group flex items-center" dir="ltr">
                        <div className="relative h-[52px] w-40 shrink-0 z-10">
                            <CountryCodeSelector
                                value={countryCode}
                                onChange={(val) => setCountryCode(val)}
                                className="h-full"
                                variant="prefix"
                            />
                        </div>
                        <div className="relative flex-1 h-[52px] -ml-px">
                            <input
                                type="tel"
                                className="w-full h-full pl-4 pr-10 rounded-r-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-700 font-bold"
                                value={testPhone}
                                onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                                dir="ltr"
                                placeholder="10XXXXXXXX"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">phone_iphone</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-center text-balance">اختر الدولة من اليسار وأدخل الرقم في الخانة اليمين.</p>
                </div>

                {/* Mode Switch */}
                <div className="flex p-1 bg-slate-100 rounded-lg">
                    <button
                        onClick={() => setTestMode('webhook')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${testMode === 'webhook' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        تجربة Webhook
                    </button>
                    <button
                        onClick={() => setTestMode('custom')}
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${testMode === 'custom' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        رسالة مخصصة
                    </button>
                </div>

                {/* Webhook Controls */}
                {testMode === 'webhook' && (
                    <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease]">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">الحدث</label>
                            <select
                                value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm"
                            >
                                {ALL_EVENT_TYPES.map(ev => <option key={ev.type} value={ev.type}>{ev.label}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">رقم الطلب الموهمي</label>
                                <input type="text" value={orderId} onChange={e => setOrderId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">المبلغ الموهمي</label>
                                <input type="text" value={orderTotal} onChange={e => setOrderTotal(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">اسم العميل الوهمي</label>
                                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
                            </div>
                        </div>
                        <button
                            disabled={simulating || !testPhone}
                            onClick={handleSimulateWebhook}
                            className="mt-2 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
                        >
                            <span className={`material-symbols-outlined ${simulating ? 'animate-spin' : ''}`}>{simulating ? 'sync' : 'play_arrow'}</span>
                            محاكاة الحدث وإرسال
                        </button>
                    </div>
                )}

                {/* Custom Message Controls */}
                {testMode === 'custom' && (
                    <div className="flex flex-col gap-4 animate-[fadeIn_0.3s_ease]">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">الرسالة</label>
                            <textarea
                                rows={4}
                                value={customMessage} onChange={e => setCustomMessage(e.target.value)}
                                placeholder="مرحباً، هذه رسالة تجريبية..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resiz-none"
                            ></textarea>
                        </div>
                        <button
                            disabled={simulating || !testPhone || !customMessage}
                            onClick={handleSendCustomMessage}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition-colors text-white font-bold disabled:opacity-50"
                        >
                            <span className={`material-symbols-outlined ${simulating ? 'animate-spin' : ''}`}>{simulating ? 'sync' : 'send'}</span>
                            إرسال الرسالة
                        </button>
                    </div>
                )}
            </div>

            {/* RIGHT PANEL: WhatsApp Device Preview */}
            <div className="flex-1 bg-slate-100 flex items-center justify-center p-8 relative overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundSize: '400px' }}></div>

                {/* Device Frame */}
                <div className="w-full max-w-[400px] h-[750px] max-h-[100%] bg-[#efeae2] rounded-[3rem] border-[12px] border-slate-900 shadow-2xl relative flex flex-col overflow-hidden ring-4 ring-slate-800">

                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-20"></div>

                    {/* Chat Header */}
                    <div className="h-24 bg-[#075e54] text-white px-4 pt-10 pb-3 flex items-center gap-3 shadow-md z-10 shrink-0">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 shrink-0">
                            <span className="material-symbols-outlined">storefront</span>
                        </div>
                        <div className="flex flex-col flex-1">
                            <span className="font-bold">{store?.store_url ? new URL(store.store_url).hostname : 'المتجر'}</span>
                            <span className="text-xs text-green-100">بواسطة بينجو • متصل</span>
                        </div>
                        <span className="material-symbols-outlined">more_vert</span>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative z-10">
                        <div className="bg-[#e2f7cb] px-3 py-1.5 rounded-lg text-xs text-center text-slate-600 w-fit mx-auto opacity-70 mb-4 shadow-sm border border-emerald-100">
                            الرسائل المعروضة هنا هي محاكاة لطابور الإرسال في النظام.
                        </div>

                        {logs.filter(l => !testPhone || l.recipient_phone?.includes(testPhone.replace(/\+/g, ''))).map((log, i) => (
                            <div key={log.id} className="flex flex-col items-end gap-1 max-w-[85%] self-end">
                                <div className="relative bg-[#dcf8c6] rounded-xl rounded-tr-none px-3 py-2 shadow-sm w-full">
                                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{log.message_body}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-green-700/60">
                                        <span>{new Date(log.sent_at || Date.now()).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                        {log.status === 'SENT' ? (
                                            <span title="تم الإرسال بنجاح" className="material-symbols-outlined text-[14px] text-blue-500 cursor-help">done_all</span>
                                        ) : log.status === 'FAILED' ? (
                                            <span title={`فشل: ${log.error_details || 'خطأ غير معروف'}`} className="material-symbols-outlined text-[14px] text-red-500 cursor-help">error</span>
                                        ) : (
                                            <span title="قيد الانتظار (سيتم الإرسال قريباً)" className="material-symbols-outlined text-[14px] cursor-help">schedule</span>
                                        )}
                                    </div>
                                </div>
                                {/* Interactive Buttons */}
                                {log.buttons && log.buttons.length > 0 && (
                                    <div className="w-full flex flex-col gap-1">
                                        {log.buttons.map((btn: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`bg-white p-2.5 rounded-xl border text-center text-sm font-bold shadow-sm ${
                                                    btn.id?.startsWith('confirm') ? 'text-emerald-600 border-emerald-200' :
                                                    btn.id?.startsWith('cancel') ? 'text-rose-500 border-rose-200' :
                                                    'text-blue-500 border-blue-200'
                                                }`}
                                            >
                                                {btn.text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input Bar */}
                    <div className="h-16 bg-white px-3 py-2 flex items-center gap-2 shrink-0 z-10 pb-4">
                        <div className="flex-1 bg-slate-100 rounded-full h-10 px-4 flex items-center text-slate-400 text-sm">
                            اكتب رسالة...
                        </div>
                        <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center text-white shrink-0">
                            <span className="material-symbols-outlined text-lg">mic</span>
                        </div>
                    </div>
                </div>
            </div>
            {/* Toast Container */}
            <div className="fixed bottom-8 left-8 z-[100] flex flex-col gap-3">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                            className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${toast.type === 'success'
                                ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800'
                                : 'bg-red-50/90 border-red-200 text-red-800'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">
                                {toast.type === 'success' ? 'check_circle' : 'error'}
                            </span>
                            <span className="text-sm font-bold">{toast.message}</span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
