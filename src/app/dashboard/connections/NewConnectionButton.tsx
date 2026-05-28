'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import MetaConnectionForm from './MetaConnectionForm';
import MetaEmbeddedSignup from '@/components/MetaEmbeddedSignup';

export default function NewConnectionButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [engine, setEngine] = useState<'WEB' | 'META' | 'META_EMBEDDED' | null>(null);
    const [qr, setQr] = useState<string | null>(null);
    const [status, setStatus] = useState<'IDLE' | 'INITIALIZING' | 'QR_READY' | 'CONNECTED' | 'DISCONNECTED' | 'AUTH_FAILURE' | 'TIMEOUT'>('IDLE');
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const [connectionId, setConnectionId] = useState<string | null>(null);

    const openModal = () => {
        setIsOpen(true);
        setEngine(null);
        setStatus('IDLE');
    };

    const startWebConnection = async () => {
        setEngine('WEB');
        setStatus('INITIALIZING');
        setQr(null);
        setPhoneNumber(null);
        setErrorMsg(null);
        setConnectionId(null);

        // Set a 2-minute timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setStatus((prev) => {
                if (prev !== 'CONNECTED') {
                    setErrorMsg('انتهت المهلة - لم يتم الاتصال في الوقت المحدد');
                    return 'TIMEOUT';
                }
                return prev;
            });
        }, 120000);

        try {
            const res = await fetch('/api/whatsapp/init', { method: 'POST' });
            const data = await res.json();

            if (data.error) {
                setStatus('DISCONNECTED');
                setErrorMsg(data.error);
                return;
            }

            if (data.connectionId) setConnectionId(data.connectionId);
            if (data.status) setStatus(data.status);
            if (data.qr) setQr(data.qr);
        } catch (err) {
            console.error(err);
            setStatus('DISCONNECTED');
            setErrorMsg('فشل الاتصال بالخادم');
        }
    };

    const handleMetaSuccess = (id: string) => {
        setConnectionId(id);
        setStatus('CONNECTED');
        setTimeout(() => window.location.reload(), 2000);
    };

    const closeModal = () => {
        setIsOpen(false);
        setEngine(null);
        setStatus('IDLE');
        setQr(null);
        setErrorMsg(null);
        setConnectionId(null);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        const shouldPoll = isOpen && engine === 'WEB' && status !== 'CONNECTED' && status !== 'IDLE' && status !== 'TIMEOUT' && connectionId;

        if (shouldPoll) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/whatsapp/status?connectionId=${connectionId}`);
                    const data = await res.json();

                    if (data.status) setStatus(data.status);
                    if (data.qr) setQr(data.qr);
                    if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
                    if (data.error) setErrorMsg(data.error);

                    if (data.status === 'CONNECTED') {
                        clearInterval(interval);
                        if (timeoutRef.current) {
                            clearTimeout(timeoutRef.current);
                            timeoutRef.current = null;
                        }
                        setPhoneNumber(data.phoneNumber || null);
                        // Reload page to refresh server component data
                        setTimeout(() => window.location.reload(), 2500);
                    }

                    if (data.status === 'AUTH_FAILURE' || data.status === 'DISCONNECTED') {
                        clearInterval(interval);
                        if (data.error) setErrorMsg(data.error);
                    }
                } catch (err) {
                    // silently ignore network errors during polling
                }
            }, 2000); // Poll every 2 seconds for faster response
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isOpen, status, connectionId, engine]);


    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    return (
        <>
            <button
                onClick={openModal}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all active:scale-95"
            >
                <span className="material-symbols-outlined text-xl">add</span>
                <span>ربط رقم جديد</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl p-8 relative overflow-hidden">

                        {/* Background Decoration */}
                        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-primary/5 blur-3xl"></div>
                        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl"></div>

                        <button
                            onClick={closeModal}
                            className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        {!engine ? (
                            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">كيف تحب تربط واتساب؟</h2>
                                <p className="text-sm text-slate-500 mb-8 max-w-sm">اختر الطريقة المناسبة لك وابدأ أتمتة رسائل متجرك في دقائق</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full">
                                    {/* Card 1: QR - Free & Easy */}
                                    <button
                                        onClick={startWebConnection}
                                        className="group relative flex flex-col items-center gap-3 p-7 rounded-2xl border-2 border-slate-200/80 dark:border-slate-700 hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 text-center"
                                    >
                                        <div className="absolute top-3 left-3">
                                            <span className="inline-block px-2.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100">مجاني</span>
                                        </div>
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                                            <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="font-black text-slate-900 dark:text-white text-base">مسح QR Code</span>
                                            <span className="text-xs text-slate-400 leading-relaxed">امسح الكود بجوالك وابدأ فوراً.<br/>الأسهل والأسرع للمتاجر الناشئة.</span>
                                        </div>
                                    </button>

                                    {/* Card 2: Meta API - Official & Pro */}
                                    <button
                                        onClick={() => setEngine('META_EMBEDDED')}
                                        className="group relative flex flex-col items-center gap-3 p-7 rounded-2xl border-2 border-blue-200/80 dark:border-blue-800/50 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-800 transition-all duration-300 text-center"
                                    >
                                        <div className="absolute top-3 left-3">
                                            <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full border border-blue-100">احترافي</span>
                                        </div>
                                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-600/5 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                            <span className="material-symbols-outlined text-3xl">verified</span>
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <span className="font-black text-slate-900 dark:text-white text-base">Meta API الرسمي</span>
                                            <span className="text-xs text-slate-400 leading-relaxed">ربط رسمي ومستقر عبر Meta.<br/>مثالي للمتاجر الكبيرة والإرسال الكثيف.</span>
                                        </div>
                                        {/* Credits Notice */}
                                        <div className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-50/80 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-700/30 rounded-lg">
                                            <span className="material-symbols-outlined text-amber-500 text-sm">toll</span>
                                            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">يخصم تلقائياً من رصيد الكريدتز</span>
                                        </div>
                                    </button>
                                </div>

                                {/* Manual setup link */}
                                <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/50 w-full">
                                    <button
                                        onClick={() => setEngine('META')}
                                        className="text-xs text-slate-400 hover:text-blue-500 transition-colors duration-200 flex items-center justify-center gap-1.5 mx-auto group"
                                    >
                                        <span className="material-symbols-outlined text-sm">settings</span>
                                        <span>عندك Meta App خاص بك؟ <span className="underline underline-offset-2 group-hover:no-underline">ربط يدوي</span></span>
                                    </button>
                                </div>
                            </div>
                        ) : engine === 'WEB' ? (
                            <div className="flex flex-col items-center text-center">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">ربط واتساب ويب (QR)</h2>
                                <p className="text-sm text-slate-500 mb-6 max-w-xs">قم بمسح الكود باستخدام هاتفك لربط الرقم فوراً</p>

                                <div className="flex flex-col items-center justify-center min-h-[300px] w-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 p-8 shadow-inner">
                                    {status === 'INITIALIZING' && (
                                        <div className="flex flex-col items-center gap-6 animate-in fade-in duration-700">
                                            <div className="relative h-24 w-24 flex items-center justify-center">
                                                {/* Outer Glow */}
                                                <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse"></div>
                                                
                                                {/* Outer Rotating Ring */}
                                                <div className="absolute inset-0 rounded-full border-[3px] border-primary/10"></div>
                                                <div className="absolute inset-0 rounded-full border-[3px] border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-ring-rotate"></div>
                                                
                                                {/* Middle Reverse Rotating Ring */}
                                                <div className="absolute inset-2 rounded-full border-[2px] border-blue-400/10"></div>
                                                <div className="absolute inset-2 rounded-full border-[2px] border-b-blue-400 border-t-transparent border-r-transparent border-l-transparent animate-ring-rotate-reverse"></div>
                                                
                                                {/* Inner Icon with Pulse */}
                                                <div className="relative z-10 h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary animate-soft-pulse">
                                                    <span className="material-symbols-outlined text-3xl">sync</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col items-center gap-1.5">
                                                <span className="text-xl font-black animate-shimmer-text">جاري تجهيز الخادم...</span>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <span className="h-1 w-1 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.3s]"></span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-300 animate-bounce [animation-delay:-0.15s]"></span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-300 animate-bounce"></span>
                                                    <span className="text-[11px] font-medium">قد يستغرق هذا بضع ثوان</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {status === 'QR_READY' && qr && (
                                        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                                            <div className="p-4 bg-white rounded-2xl shadow-xl border border-slate-100">
                                                <QRCodeSVG value={qr} size={220} includeMargin={true} />
                                            </div>
                                            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-full text-xs font-bold border border-yellow-100">
                                                <span className="h-2 w-2 rounded-full bg-yellow-600 animate-pulse"></span>
                                                بانتظار مسح الكود من هاتفك
                                            </div>
                                        </div>
                                    )}

                                    {status === 'CONNECTED' && (
                                        <div className="flex flex-col items-center text-green-500 animate-bounce">
                                            <span className="material-symbols-outlined text-6xl mb-4">check_circle</span>
                                            <span className="text-xl font-black">تم الربط بنجاح!</span>
                                            {phoneNumber && (
                                                <span className="text-sm mt-2 text-slate-700 dark:text-slate-300 font-bold bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-sm" dir="ltr">+{phoneNumber}</span>
                                            )}
                                        </div>
                                    )}

                                    {(status === 'DISCONNECTED' || status === 'AUTH_FAILURE' || status === 'TIMEOUT') && (
                                        <div className="flex flex-col items-center text-red-500">
                                            <span className="material-symbols-outlined text-6xl mb-4">error</span>
                                            <span className="text-lg font-bold">فشل الاتصال</span>
                                            <p className="text-xs text-red-400 mt-2 text-center max-w-[200px]">{errorMsg || 'حدث خطأ غير متوقع'}</p>
                                            <button
                                                onClick={startWebConnection}
                                                className="mt-6 px-6 py-2 bg-primary text-white text-sm font-bold rounded-full hover:bg-primary-dark transition-all"
                                            >
                                                إعادة المحاولة
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setEngine(null)} className="mt-6 text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                                    العودة لاختيار الطريقة
                                </button>
                            </div>
                        ) : engine === 'META' ? (
                            <div className="animate-in slide-in-from-left duration-300">
                                <MetaConnectionForm
                                    onSuccess={handleMetaSuccess}
                                    onCancel={() => setEngine(null)}
                                />
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-right duration-300">
                                <MetaEmbeddedSignup
                                    onSuccess={handleMetaSuccess}
                                    onCancel={() => setEngine(null)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
