'use client';

import React, { useState, useEffect } from 'react';

interface PaymentMethod {
    id: number;
    name: string;
    icon: string;
    description: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
    { id: 2, name: 'بطاقة ائتمانية / ميزة', icon: 'credit_card', description: 'Visa, Mastercard, Meeza' },
    { id: 3, name: 'فوري (Fawry)', icon: 'account_balance_wallet', description: 'دفع عبر ماكينات فوري' },
    { id: 4, name: 'المحافظ الإلكترونية', icon: 'smartphone', description: 'Vodafone Cash, InstaPay, etc.' },
    { id: 11, name: 'أمان / مصاري', icon: 'storefront', description: 'دفع عبر مراكز الدفع' },
];

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    url: string | null;
    title?: string;
    onMethodSelect?: (methodId: number) => void;
    isInitializing?: boolean;
}

export default function PaymentModal({
    isOpen,
    onClose,
    url,
    title = 'إكمال عملية الدفع',
    onMethodSelect,
    isInitializing = false
}: PaymentModalProps) {
    const [loading, setLoading] = useState(true);
    const [prevUrl, setPrevUrl] = useState<string | null>(null);

    if (url !== prevUrl) {
        setPrevUrl(url);
        setLoading(true);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl h-[90vh] max-h-[850px] rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 border border-slate-200 dark:border-slate-800">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 text-right" dir="rtl">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center ${isInitializing || url ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
                            <span className="material-symbols-outlined text-2xl font-variation-icon">
                                {isInitializing ? 'sync' : url ? 'shield_lock' : 'payments'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                                {isInitializing ? 'جاري تحضير بوابة الدفع...' : url ? 'اتصال آمن ومشفر عبر فواتيرك' : 'اختر وسيلة الدفع المناسبة لك'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 mr-auto ml-0">
                        {url && !isInitializing && (
                            <button
                                onClick={() => {
                                    // Communicate reset to parent if callback exists
                                    onMethodSelect?.(-1);
                                }}
                                className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-all flex items-center gap-1.5 text-xs font-bold"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                تغيير الوسيلة
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="size-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative bg-white dark:bg-slate-950 overflow-y-auto">
                    {/* Loader */}
                    {(loading && url || isInitializing) && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white dark:bg-slate-900">
                            <div className="relative">
                                <span className="material-symbols-outlined text-6xl text-primary animate-spin">progress_activity</span>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-2xl text-primary">lock</span>
                                </div>
                            </div>
                            <h4 className="mt-4 font-bold text-slate-900 dark:text-white">جاري الاتصال ببوابة الدفع...</h4>
                            <p className="text-sm text-slate-500 mt-1">تأكد من بقائك في الصفحة</p>
                        </div>
                    )}

                    {!url && !isInitializing ? (
                        /* Method Selection View */
                        <div className="p-8 max-w-2xl mx-auto space-y-6 text-right" dir="rtl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {PAYMENT_METHODS.map((method) => (
                                    <button
                                        key={method.id}
                                        onClick={() => onMethodSelect?.(method.id)}
                                        className="group p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 hover:border-primary hover:bg-primary/5 transition-all text-right flex items-start gap-4"
                                    >
                                        <div className="size-12 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                                            <span className="material-symbols-outlined text-3xl">{method.icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{method.name}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{method.description}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-all mr-auto translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">chevron_left</span>
                                    </button>
                                ))}
                            </div>

                            <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                                <div className="flex gap-3">
                                    <span className="material-symbols-outlined text-amber-500">info</span>
                                    <div>
                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-200">الدفع آمن ومشفر</p>
                                        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">تتم المعاملات عبر بوابة Fawaterk المعتمدة من البنك المركزي المصري.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : url ? (
                        /* Iframe View */
                        <div className="w-full h-full flex flex-col">
                            <iframe
                                src={url}
                                className={`flex-1 w-full border-none transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
                                onLoad={() => setLoading(false)}
                                title="Fawaterk Checkout"
                            />

                            {/* Fallback button if iframe is blocked */}
                            {!loading && (
                                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-primary dark:text-blue-400 font-bold rounded-2xl shadow-[0_15px_35px_-5px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all text-sm whitespace-nowrap"
                                    >
                                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                                        إذا لم تظهر صفحة الدفع، اضغط هنا لفتحها في نافذة جديدة
                                    </a>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span className="material-symbols-outlined text-sm">shield</span>
                        <span>دفع آمن ومحمي</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
