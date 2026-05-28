// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import WhatsAppPreview from '@/components/WhatsAppPreview';

const EVENT_LABELS: Record<string, string> = {
    'order.pending': 'طلب جديد (قيد الانتظار)',
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

export default function Page() {
    const [allStores, setAllStores] = useState<any[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<string | null>(null);
    const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);

    // Preview Modal State
    const [previewMessage, setPreviewMessage] = useState<string>('');
    const [previewTitle, setPreviewTitle] = useState<string>('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    // Pending messages state
    const [pendingCount, setPendingCount] = useState(0);
    const [retryLoading, setRetryLoading] = useState(false);

    const supabase = createClient();

    useEffect(() => { loadData(); checkPendingCount(); }, []);

    const checkPendingCount = async () => {
        try {
            const res = await fetch('/api/whatsapp/retry-pending');
            const data = await res.json();
            setPendingCount(data.total_stuck || 0);
        } catch (e) {}
    };

    const handleRetryPending = async (action: 'retry' | 'fail_old') => {
        setRetryLoading(true);
        try {
            const res = await fetch('/api/whatsapp/retry-pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            showToast(data.message || 'تمت العملية بنجاح');
            // Refresh everything
            await checkPendingCount();
            await loadData();
        } catch (e) {
            showToast('حدث خطأ أثناء المعالجة');
        }
        setRetryLoading(false);
    };

    const loadData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: stores } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (stores && stores.length > 0) {
            setAllStores(stores);
            if (!selectedStoreId) {
                const initialStoreId = stores[0].id;
                setSelectedStoreId(initialStoreId);
                await fetchLogs(initialStoreId, user.id);
            } else {
                await fetchLogs(selectedStoreId, user.id);
            }
        } else {
            setLoading(false);
        }
    };

    const fetchLogs = async (storeId: string, userId: string) => {
        const { data: logsData } = await supabase
            .from('message_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('store_id', storeId)
            .order('sent_at', { ascending: false })
            .limit(100);

        setLogs(logsData || []);
        setLoading(false);
    };

    // Watch for store selection changes
    useEffect(() => {
        if (selectedStoreId && allStores.length > 0) {
            setLoading(true);
            (async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) await fetchLogs(selectedStoreId, user.id);
            })();
        }
    }, [selectedStoreId]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    const lastSent = logs[0]?.sent_at;
    const sentToday = logs.filter(l => new Date(l.sent_at).toDateString() === new Date().toDateString()).length;
    const successLogs = logs.filter(l => l.status === 'SENT' || l.status === 'sent').length;
    const failedLogs = logs.filter(l => l.status === 'FAILED' || l.status === 'failed').length;

    const statusStyle = (s: string) => {
        const st = (s || '').toUpperCase();
        if (st === 'SENT') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (st === 'FAILED') return 'bg-red-50 text-red-700 border-red-100';
        if (st === 'PENDING') return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-slate-100 text-slate-600 border-slate-200';
    };
    const statusLabel = (s: string) => {
        const st = (s || '').toUpperCase();
        if (st === 'SENT') return 'أُرسلت بنجاح';
        if (st === 'FAILED') return 'فشلت';
        if (st === 'PENDING') return 'معلقة';
        return s;
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center p-10 h-full">
            <div className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4">history</span>
                <span className="font-bold text-slate-700 text-lg">جاري تحميل سجل الرسائل...</span>
                <span className="text-sm text-slate-400 mt-1">لحظات ونكون جاهزين</span>
            </div>
        </div>
    );

    return (
        <>
            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-5">
                    {toast}
                </div>
            )}

            {/* WhatsApp Preview Modal */}
            <WhatsAppPreview
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                message={previewMessage}
                title={previewTitle}
            />

            <div className="flex-1 flex flex-col h-full w-full bg-background-light">
                <div className="p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative z-20">
                        {/* Decorative background circle wrapper - clipped to header bounds */}
                        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 mb-1 flex items-center gap-3">
                                    <span className="material-symbols-outlined text-primary text-4xl">history</span>
                                    سجل الرسائل المرسلة
                                </h1>
                                <p className="text-slate-500 font-medium">سجل تفصيلي بجميع الرسائل التي تم إرسالها من خلال المنصة وحالات وصولها.</p>
                            </div>

                            {/* ── Pending Messages Alert + Actions ── */}
                            {pendingCount > 0 && (
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 border border-amber-200 px-4 py-2.5 rounded-2xl text-sm font-bold">
                                        <span className="material-symbols-outlined text-lg animate-pulse">pending</span>
                                        <span>{pendingCount} رسالة معلقة</span>
                                    </div>
                                    <button
                                        onClick={() => handleRetryPending('retry')}
                                        disabled={retryLoading}
                                        className="flex items-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        <span className={`material-symbols-outlined text-lg ${retryLoading ? 'animate-spin' : ''}`}>{retryLoading ? 'progress_activity' : 'replay'}</span>
                                        إعادة الإرسال
                                    </button>
                                    <button
                                        onClick={() => handleRetryPending('fail_old')}
                                        disabled={retryLoading}
                                        className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                        title="إلغاء جميع الرسائل المعلقة"
                                    >
                                        <span className="material-symbols-outlined text-lg">cancel</span>
                                        إلغاء الكل
                                    </button>
                                </div>
                            )}

                            {/* ── Store Selector ── */}
                            <div className="flex flex-col gap-1 relative z-40 min-w-[220px]">
                                <label className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">filter_alt</span>
                                    تصفية حسب المتجر
                                </label>
                                <button
                                    onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                                    className="flex items-center justify-between bg-white border border-slate-200 text-slate-800 font-bold rounded-2xl px-5 py-3 transition-all shadow-sm hover:border-primary/30"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[22px]">storefront</span>
                                        <span>{allStores.find(s => s.id === selectedStoreId)?.name || 'اختر متجر'}</span>
                                    </div>
                                    <span className={`material-symbols-outlined transition-transform ${isStoreDropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                </button>

                                {isStoreDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setIsStoreDropdownOpen(false)}></div>
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden min-w-[280px] animate-in fade-in slide-in-from-top-2">
                                            {allStores.map(s => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => {
                                                        setSelectedStoreId(s.id);
                                                        setIsStoreDropdownOpen(false);
                                                    }}
                                                    className={`flex items-center justify-between w-full text-start px-5 py-4 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${selectedStoreId === s.id ? 'bg-primary/5 text-primary' : 'text-slate-700'}`}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{s.name}</span>
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
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'أُرسلت اليوم', value: sentToday, icon: 'today', gradient: 'from-blue-500 to-indigo-600', bgIcon: 'bg-blue-50 text-blue-600' },
                            { label: 'وصلت بنجاح', value: successLogs, icon: 'done_all', gradient: 'from-emerald-400 to-green-500', bgIcon: 'bg-emerald-50 text-emerald-600' },
                            { label: 'فشلت', value: failedLogs, icon: 'error_outline', gradient: 'from-red-400 to-orange-500', bgIcon: 'bg-red-50 text-red-600' },
                            { label: 'الإجمالي', value: logs.length, icon: 'list_alt', gradient: 'from-purple-500 to-pink-600', bgIcon: 'bg-purple-50 text-purple-600' },
                        ].map((card, i) => (
                            <div key={card.label} className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group overflow-hidden relative">
                                {/* Small gradient splash on hover */}
                                <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 blur-3xl rounded-full transition-opacity duration-500`}></div>

                                <div className="flex items-center justify-between mb-4 relative z-10">
                                    <h3 className="text-slate-500 font-bold text-sm">{card.label}</h3>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.bgIcon} transition-transform group-hover:scale-110`}>
                                        <span className="material-symbols-outlined text-2xl">{card.icon}</span>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-4xl font-black text-slate-800">{card.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* -------------------- LOGS -------------------- */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            {logs.length === 0 ? (
                                <div className="py-24 flex flex-col items-center gap-4 text-center">
                                    <div className="w-24 h-24 bg-slate-50 rounded-full border-8 border-white shadow-sm flex items-center justify-center mb-2">
                                        <span className="material-symbols-outlined text-5xl text-slate-300">chat_bubble_outline</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-xl text-slate-800">لا يوجد سجلات بعد</h3>
                                        <p className="text-slate-500 mt-2 max-w-sm mx-auto">عندما يبدأ النظام في إرسال الرسائل التلقائية، ستظهر هنا بالتفصيل وتحتوي على حالة الوصول.</p>
                                    </div>
                                    <a href="/dashboard/notifications/create" className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-md hover:bg-slate-800 transition-colors">عليك إنشاء قاعدة أولاً</a>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">التاريخ والوقت</th>
                                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">العميل المُستلم</th>
                                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">الحدث / المشغل</th>
                                                <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {logs.map((log, i) => (
                                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="py-4 px-6 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-slate-800 text-sm">
                                                                {new Date(log.sent_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className="text-xs text-slate-400 mt-0.5">
                                                                {new Date(log.sent_at).toLocaleDateString('ar-SA')}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-blue-50 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                                                                {log.recipient_phone?.substring(log.recipient_phone.length - 2)}
                                                            </div>
                                                            <span className="font-mono text-sm font-semibold text-slate-700" dir="ltr">+{log.recipient_phone?.replace(/[^\d]/g, '')}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                                            <span className="material-symbols-outlined text-[16px]">bolt</span>
                                                            {EVENT_LABELS[log.event_type] || log.event_type || 'تنبيه نظام'}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${statusStyle(log.status)}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'SENT' ? 'bg-emerald-500' : log.status === 'FAILED' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                                                            {statusLabel(log.status)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                                        <a href="/dashboard/logs" className="text-sm font-bold text-primary hover:text-blue-700 transition-colors">عرض السجلات الكاملة المتقدمة ←</a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
