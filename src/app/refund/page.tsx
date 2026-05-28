import React from 'react';

export default function RefundPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="bg-primary/5 border-b border-primary/10 p-8 lg:p-12">
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">سياسة الاسترجاع</h1>
                    <p className="text-slate-500 font-medium">آخر تحديث: 20 مارس 2024</p>
                </div>
                <div className="p-8 lg:p-12 prose prose-slate prose-lg max-w-none dir-rtl" style={{ direction: 'rtl' }}>
                    <h2>1. سياسة الاسترجاع العام</h2>
                    <p>نحن في "بينجو" نسعى لرضا عملائنا. إذا لم تكن راضيًا عن خدماتنا المتميزة، فبإمكانك طلب استرداد مالي خلال 14 يوماً من تاريخ اشتراكك للمرة الأولى.</p>

                    <h2>2. الشروط والأحكام</h2>
                    <p>ينطبق الاسترجاع فقط على الخطط السنوية أو ربع السنوية للمستخدمين الجدد. الاشتراكات الشهرية والتجديدات التلقائية لا تخضع لسياسة الاسترجاع بعد مرور فترة الـ 3 أيام الأولى من كل دورة.</p>

                    <h2>3. ألية الطلب</h2>
                    <p>يمكنك تقديم طلب استرجاع عن طريق فتح تذكرة دعم مبيعات من داخل لوحة التحكم لمتجرك أو مراسلتنا على البريد الإلكتروني لدعم العملاء.</p>

                    <div className="mt-12 pt-8 border-t border-slate-200">
                        <a href="/" className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                            <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
                            العودة للصفحة الرئيسية
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
