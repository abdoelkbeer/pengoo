'use client';

import React, { useState } from 'react';
import MetaSetupGuide from './MetaSetupGuide';

interface Props {
    onSuccess: (connectionId: string) => void;
    onCancel: () => void;
}

export default function MetaConnectionForm({ onSuccess, onCancel }: Props) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(false);

    // Form states
    const [sessionName, setSessionName] = useState('');
    const [phoneNumberId, setPhoneNumberId] = useState('');
    const [wabaId, setWabaId] = useState('');
    const [accessToken, setAccessToken] = useState('');
    const [verifyToken, setVerifyToken] = useState('pengoo_verify_' + Math.random().toString(36).substring(7));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/whatsapp/meta/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionName,
                    phoneNumberId,
                    wabaId,
                    accessToken,
                    verifyToken
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            onSuccess(data.connectionId);
        } catch (err: any) {
            setError(err.message || 'فشل حفظ الاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full flex flex-col gap-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">إعداد Meta API الرسمي</h2>
                <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-xs text-primary font-bold underline hover:no-underline"
                >
                    {showGuide ? 'إخفاء الدليل' : 'كيف أحصل على هذه البيانات؟'}
                </button>
            </div>

            {showGuide && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
                    <MetaSetupGuide />
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">اسم الاتصال (اختياري)</label>
                    <input
                        type="text"
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        placeholder="مثلاً: متجر بينجو الرسمي"
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Phone Number ID <span className="text-red-500">*</span></label>
                    <input
                        required
                        type="text"
                        value={phoneNumberId}
                        onChange={(e) => setPhoneNumberId(e.target.value)}
                        placeholder="أدخل معرف رقم الهاتف"
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        dir="ltr"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">WhatsApp Business Account ID</label>
                    <input
                        type="text"
                        value={wabaId}
                        onChange={(e) => setWabaId(e.target.value)}
                        placeholder="أدخل معرف حساب الأعمال"
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                        dir="ltr"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">System User Access Token <span className="text-red-500">*</span></label>
                    <textarea
                        required
                        rows={3}
                        value={accessToken}
                        onChange={(e) => setAccessToken(e.target.value)}
                        placeholder="الصق التوكن هنا..."
                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                        dir="ltr"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg text-xs text-red-600 font-bold">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-3 mt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all disabled:opacity-50 active:scale-95"
                    >
                        {loading ? 'جاري الحفظ...' : 'حفظ الاتصال'}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                    >
                        إلغاء
                    </button>
                </div>
            </form>
        </div>
    );
}
