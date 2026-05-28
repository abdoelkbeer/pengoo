import React from 'react';

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-slate-50 py-16 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                <div className="bg-primary/5 border-b border-primary/10 p-8 lg:p-12">
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 mb-4">شروط الاستخدام</h1>
                    <p className="text-slate-500 font-medium">آخر تحديث: 20 مارس 2024</p>
                </div>
                <div className="p-8 lg:p-12 prose prose-slate prose-lg max-w-none dir-rtl" style={{ direction: 'rtl' }}>
                    <h2>1. قبول الشروط</h2>
                    <p>من خلال وصولك واستخدامك لمنصة بينجو، فإنك توافق على الالتزام بشروط الاستخدام هذه. إذا كنت غير موافق على أي جزء منها، يرجى عدم استخدام الخدمة.</p>

                    <h2>2. الاستخدام المسموح به</h2>
                    <p>يجب استخدام خدماتنا فقط للأغراض المشروعة وللشركات المسجلة التي تمتلك الحق في الوصول إلى بيانات عملائها وإرسال الرسائل بناءً على موافقتهم عبر ووكومرس.</p>

                    <h2>3. التوفر والحدود</h2>
                    <p>نحن نسعى لتقديم خدمة بنسبة تواجد 99.9%، ولكننا لا نضمن عدم حدوث أخطاء أو انقطاعات مؤقتة، ولا نتحمل مسؤولية أي ضرر ناتج عن الاستخدام المباشر أو غير المباشر للخدمة.</p>

                    <h2>4. الدفع والاشتراكات</h2>
                    <p>الخدمات المدفوعة تتطلب اشتراكاً دورياً. يتم خصم الرسوم في بداية كل دورة بناءً على الخطة المحددة، ويمكن إلغاء التجديد التلقائي في أي وقت من لوحة التحكم.</p>

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
