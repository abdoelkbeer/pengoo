'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
    const searchParams = useSearchParams();
    const invoiceId = searchParams.get('invoice_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const verifyPayment = async () => {
            if (!invoiceId) {
                setStatus('error');
                setErrorMessage('رقم الفاتورة مفقود.');
                return;
            }

            try {
                const response = await fetch('/api/payments/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ invoice_id: invoiceId })
                });

                if (response.ok) {
                    setStatus('success');
                } else {
                    const data = await response.json();
                    setStatus('error');
                    setErrorMessage(data.error || 'فشل التحقق من الدفع، يرجى التواصل مع الدعم الفني.');
                }
            } catch (error) {
                setStatus('error');
                setErrorMessage('حدث خطأ أثناء الاتصال بالخادم.');
            }
        };

        verifyPayment();
    }, [invoiceId]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-3xl border border-slate-100 shadow-2xl shadow-blue-100 p-8 text-center animate-fade-in relative overflow-hidden">
                {status === 'loading' && (
                    <div className="flex flex-col items-center py-8">
                        <span className="material-symbols-outlined text-[48px] text-primary animate-spin mb-4">progress_activity</span>
                        <h1 className="text-xl font-bold text-slate-800 mb-2">جاري التحقق من الدفع...</h1>
                        <p className="text-slate-500 font-medium">يرجى الانتظار، يتم الآن تفعيل باقتك.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="animate-fade-in">
                        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600">
                            <span className="material-symbols-outlined text-5xl">check_circle</span>
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-2 font-display">تم الدفع بنجاح!</h1>
                        <p className="text-slate-500 mb-8 font-medium">
                            شكراً لك! تم ترقية باقتك بنجاح. يمكنك الآن الاستمتاع بكافة المميزات الجديدة في حسابك.
                        </p>
                        <div className="space-y-3">
                            <Link href="/dashboard" className="flex items-center justify-center gap-2 w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-lg">dashboard</span>
                                الذهاب للوحة التحكم
                            </Link>
                            <Link href="/dashboard/plans" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">
                                العودة للباقات
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="animate-fade-in">
                        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 text-red-600">
                            <span className="material-symbols-outlined text-5xl">error</span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2 font-display">لم يكتمل تأكيد الباقة</h1>
                        <p className="text-red-500 mb-8 font-medium bg-red-50 p-3 rounded-lg border border-red-100">
                            {errorMessage}
                        </p>
                        <div className="space-y-3">
                            <Link href="/dashboard/support" className="flex items-center justify-center gap-2 w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                                <span className="material-symbols-outlined text-lg">support_agent</span>
                                التواصل مع الدعم الفني
                            </Link>
                            <Link href="/dashboard/plans" className="flex items-center justify-center gap-2 w-full py-4 bg-slate-50 text-slate-600 font-bold rounded-2xl hover:bg-slate-100 transition-all">
                                العودة للباقات
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[80vh] flex items-center justify-center p-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <SuccessContent />
        </Suspense>
    );
}
