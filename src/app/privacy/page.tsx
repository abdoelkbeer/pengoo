import React from 'react';

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="bg-primary/5 border-b border-primary/10 p-8 lg:p-12">
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">سياسة الخصوصية</h1>
                    <p className="text-slate-500 font-medium">آخر تحديث: 20 مارس 2024</p>
                </div>
                <div className="p-8 lg:p-12 prose prose-slate prose-lg max-w-none dir-rtl" style={{ direction: 'rtl' }}>
                    <h2>1. مقدمة</h2>
                    <p>في منصة بينجو، نحن نأخذ خصوصيتك على محمل الجد. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية البيانات الخاصة بك عند استخدام خدماتنا.</p>

                    <h2>2. البيانات التي نجمعها</h2>
                    <p>نحن نجمع فقط المعلومات الضرورية لتشغيل وتوفير خدماتنا بشكل أفضل، مثل الاسم، البريد الإلكتروني، معلومات المتجر (WooCommerce)، وأرقام الهواتف المرتبطة بحساب واتساب الخاص بك.</p>

                    <h2>3. استخدام البيانات</h2>
                    <p>تُستخدم بياناتك فقط لتوفير الخدمة المطلوبة، تحسين تجربة المستخدم، وتوفير الدعم الفني. نحن لا نشارك بيانات متجرك أو عملائك مع أطراف ثالثة لأغراض تسويقية.</p>

                    <h2>4. الأمان</h2>
                    <p>نحن نستخدم معايير تشفير عالية لحماية كل من رسائلك وبيانات عملائك المخزنة لدينا لضمان بيئة عمل آمنة وموثوقة.</p>

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
