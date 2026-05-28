'use client';

import React, { useState, useEffect } from 'react';

export default function PendingMessagesBanner() {
    const [pendingCount, setPendingCount] = useState(0);
    const [whatsappConnected, setWhatsappConnected] = useState(true);
    const [workerAlive, setWorkerAlive] = useState(true);
    const [retryLoading, setRetryLoading] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

    useEffect(() => { checkPending(); }, []);

    const checkPending = async () => {
        try {
            const res = await fetch('/api/whatsapp/retry-pending');
            const data = await res.json();
            setPendingCount(data.total_stuck || 0);
            setWhatsappConnected(data.whatsapp_connected ?? true);
            setWorkerAlive(data.worker_alive ?? true);
        } catch (e) {}
    };

    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast(msg);
        setToastType(type);
        setTimeout(() => setToast(null), 5000);
    };

    const handleAction = async (action: 'retry' | 'fail_old') => {
        setRetryLoading(true);
        try {
            const res = await fetch('/api/whatsapp/retry-pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            
            if (data.success && (data.sent > 0 || data.cancelled > 0)) {
                showToast(data.message, 'success');
            } else if (data.reason === 'NO_CONNECTION' || data.reason === 'WORKER_DOWN') {
                showToast(data.message, 'error');
            } else {
                showToast(data.message, 'info');
            }
            
            await checkPending();
        } catch (e) {
            showToast('حدث خطأ أثناء المعالجة', 'error');
        }
        setRetryLoading(false);
    };

    if (pendingCount === 0) return null;

    const toastBg = toastType === 'success' ? 'bg-green-600' : toastType === 'error' ? 'bg-red-600' : 'bg-slate-900/90';

    // Determine the reason messages are stuck
    let reasonText = '';
    let reasonIcon = '';
    if (!whatsappConnected) {
        reasonText = 'السبب: لا يوجد رقم واتساب متصل';
        reasonIcon = 'phonelink_off';
    } else if (!workerAlive) {
        reasonText = 'السبب: خدمة الإرسال (Worker) غير متصلة';
        reasonIcon = 'cloud_off';
    }

    return (
        <>
            {toast && (
                <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 ${toastBg} backdrop-blur-md text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-5 max-w-md text-center`}>
                    {toast}
                </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl animate-pulse">pending</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-800 text-sm">
                            {pendingCount} رسالة معلقة لم تُرسل بعد
                        </h4>
                        {reasonText ? (
                            <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1 font-medium">
                                <span className="material-symbols-outlined text-[14px]">{reasonIcon}</span>
                                {reasonText}
                            </p>
                        ) : (
                            <p className="text-xs text-amber-600 mt-0.5">
                                اضغط "إعادة الإرسال" لمحاولة إرسالها الآن.
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => handleAction('retry')}
                        disabled={retryLoading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-60"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${retryLoading ? 'animate-spin' : ''}`}>
                            {retryLoading ? 'progress_activity' : 'replay'}
                        </span>
                        إعادة الإرسال
                    </button>
                    <button
                        onClick={() => handleAction('fail_old')}
                        disabled={retryLoading}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                        title="إلغاء جميع الرسائل المعلقة"
                    >
                        <span className="material-symbols-outlined text-[18px]">cancel</span>
                        إلغاء الكل
                    </button>
                </div>
            </div>
        </>
    );
}
