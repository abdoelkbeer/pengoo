'use client';

import React, { useEffect, useState } from 'react';

interface Props {
    onSuccess: (connectionId: string) => void;
    onCancel: () => void;
}

declare global {
    interface Window {
        fbAsyncInit: () => void;
        FB: any;
    }
}

export default function MetaEmbeddedSignup({ onSuccess, onCancel }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const configId = process.env.META_CONFIG_ID || '';

    useEffect(() => {
        // Load Facebook SDK
        if (!window.FB) {
            const script = document.createElement('script');
            script.src = "https://connect.facebook.net/en_US/sdk.js";
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);

            window.fbAsyncInit = function() {
                window.FB.init({
                    appId: appId,
                    cookie: true,
                    xfbml: true,
                    version: 'v22.0'
                });
            };
        }
    }, [appId]);

    const launchWhatsAppSignup = () => {
        setLoading(true);
        setError(null);

        window.FB.login((response: any) => {
            if (response.authResponse) {
                const code = response.authResponse.code;
                handleSignupSuccess(code);
            } else {
                setLoading(false);
                setError('تم إلغاء عملية التسجيل أو حدث خطأ ما.');
            }
        }, {
            scope: 'whatsapp_business_management,whatsapp_business_messaging',
            extras: {
                feature: 'whatsapp_embedded_signup',
                config_id: configId
            }
        });
    };

    const handleSignupSuccess = async (code: string) => {
        try {
            const res = await fetch('/api/whatsapp/meta/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            onSuccess(data.connectionId);
        } catch (err: any) {
            setError(err.message || 'فشل تبادل البيانات مع Meta');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-6 p-4 text-center" dir="rtl">
            <div className="size-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 mb-2">
                <span className="material-symbols-outlined text-4xl">verified_user</span>
            </div>
            
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">ربط رسمي وسريع</h2>
                <p className="text-sm text-slate-500 max-w-xs">اربط رقمك بضغطة زر واحدة عبر منصة Meta الرسمية دون الحاجة لإعدادات معقدة.</p>
            </div>

            {error && (
                <div className="w-full p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-xs text-red-600 font-bold">
                    {error}
                </div>
            )}

            <button
                onClick={launchWhatsAppSignup}
                disabled={loading || !appId}
                className="w-full flex items-center justify-center gap-3 py-4 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
                {loading ? (
                    <span className="sidebar-loading-spinner text-white"></span>
                ) : (
                    <>
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span>متابعة باستخدام فيسبوك</span>
                    </>
                )}
            </button>

            {!appId && (
                <p className="text-[10px] text-red-500 font-bold mt-2">
                    خطأ: لم يتم ضبط Meta App ID في إعدادات المنصة.
                </p>
            )}

            <button
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors mt-2"
            >
                إلغاء والعودة للخيارات
            </button>
        </div>
    );
}
