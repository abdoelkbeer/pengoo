'use client';

import React from 'react';

export default function MetaSetupGuide() {
    return (
        <div className="flex flex-col gap-4 text-right" dir="rtl">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">خطوات ربط Meta API الرسمي:</h3>
            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li>
                    قم بإنشاء حساب في <a href="https://developers.facebook.com/" target="_blank" className="text-primary underline">Meta for Developers</a>.
                </li>
                <li>
                    أنشئ تطبيقاً جديداً من نوع <span className="font-bold">Business</span>.
                </li>
                <li>
                    أضف منتج <span className="font-bold">WhatsApp</span> للتطبيق.
                </li>
                <li>
                    من إعدادات الواتساب، ستجد <span className="font-bold">Phone Number ID</span> و <span className="font-bold">WhatsApp Business Account ID</span>.
                </li>
                <li>
                    قم بإنشاء <span className="font-bold">System User Access Token</span> دائم (Permanent) بصلاحية <span className="text-primary italic">whatsapp_business_messaging</span>.
                </li>
            </ol>
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400">
                <span className="font-bold block mb-1">💡 نصيحة:</span>
                استخدم توكن دائم (Permanent Token) حتى لا ينقطع الاتصال بعد 24 ساعة.
            </div>
        </div>
    );
}
