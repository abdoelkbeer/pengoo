'use client';

import React, { useState } from 'react';
import CountryCodeSelector from '@/components/CountryCodeSelector';

const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: 'dashboard' },
    { id: 'settings', label: 'إعدادات الربط', icon: 'settings' },
    { id: 'otp', label: 'الدفع والتحقق (OTP)', icon: 'verified_user' },
    { id: 'whatsapp-btn', label: 'زر واتساب', icon: 'chat' },
    { id: 'sync', label: 'المزامنة', icon: 'sync' },
];

export default function WooCommerceTabs() {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <>
            <div className="border-b border-slate-200 overflow-x-auto">
                <nav className="flex gap-8 min-w-max">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`border-b-[3px] py-3 px-1 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === tab.id
                                ? 'border-primary text-primary font-bold'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="animate-fade-in" key={activeTab}>
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'settings' && <SettingsTab />}
                {activeTab === 'otp' && <OtpTab />}
                {activeTab === 'whatsapp-btn' && <WhatsAppButtonTab />}
                {activeTab === 'sync' && <SyncTab />}
            </div>
        </>
    );
}

/* ─── Overview Tab ─── */
function OverviewTab() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">مفتاح الربط (API Key)</h3>
                        <button className="text-red-500 text-sm font-medium hover:text-red-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            إعادة توليد المفتاح
                        </button>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">مفتاح API الخاص بك</label>
                            <div className="flex rounded-lg shadow-sm">
                                <input className="flex-1 block w-full rounded-r-lg border-slate-300 bg-slate-50 text-slate-500 sm:text-sm focus:ring-primary focus:border-primary px-3 py-2.5 border border-l-0" dir="ltr" readOnly type="text" defaultValue="rbt_live_************************8a92" />
                                <button className="inline-flex items-center px-4 rounded-l-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-medium text-sm">
                                    <span className="material-symbols-outlined text-[18px] ml-1">content_copy</span>
                                    نسخ
                                </button>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">استخدم هذا المفتاح في إعدادات إضافة ووكومرس الخاصة بك.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">رابط الويب هوك (Webhook URL)</label>
                            <div className="flex rounded-lg shadow-sm">
                                <input className="flex-1 block w-full rounded-r-lg border-slate-300 bg-slate-50 text-slate-500 sm:text-sm focus:ring-primary focus:border-primary px-3 py-2.5 border border-l-0" dir="ltr" readOnly type="text" defaultValue="https://api.pengoo-platform.com/v1/webhook/wc/12345" />
                                <button className="inline-flex items-center px-4 rounded-l-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-medium text-sm">
                                    <span className="material-symbols-outlined text-[18px] ml-1">content_copy</span>
                                    نسخ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <ActivationSteps />
                <SupportCard />
            </div>
        </div>
    );
}

/* ─── Settings Tab ─── */
function SettingsTab() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">بيانات المتجر</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">رابط المتجر (Store URL)</label>
                            <input className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-700 sm:text-sm focus:ring-primary focus:border-primary px-3 py-2.5 border" dir="ltr" type="url" defaultValue="https://mystore.com" placeholder="https://mystore.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Consumer Key</label>
                            <input className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-500 sm:text-sm focus:ring-primary focus:border-primary px-3 py-2.5 border" dir="ltr" type="text" defaultValue="ck_************************3f7a" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Consumer Secret</label>
                            <input className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-500 sm:text-sm focus:ring-primary focus:border-primary px-3 py-2.5 border" dir="ltr" type="password" defaultValue="cs_secretkey1234" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">إعدادات الويب هوك</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Webhook Secret</label>
                            <div className="flex rounded-lg shadow-sm">
                                <input className="flex-1 block w-full rounded-r-lg border-slate-300 bg-slate-50 text-slate-500 sm:text-sm px-3 py-2.5 border border-l-0" dir="ltr" readOnly type="text" defaultValue="whsec_************************9d1e" />
                                <button className="inline-flex items-center px-4 rounded-l-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-medium text-sm">
                                    <span className="material-symbols-outlined text-[18px] ml-1">content_copy</span>
                                    نسخ
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">التحقق من التوقيع (Signature Verification)</p>
                                <p className="text-xs text-slate-500 mt-1">تأكد من أن الطلبات الواردة من ووكومرس أصلية</p>
                            </div>
                            <ToggleSwitch defaultChecked />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">اختبار الاتصال</button>
                    <button className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/20">حفظ الإعدادات</button>
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                    <div className="flex gap-3 mb-2">
                        <span className="material-symbols-outlined text-amber-600">warning</span>
                        <p className="font-bold text-slate-900 text-sm">ملاحظة مهمة</p>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">تأكد من تفعيل REST API في إعدادات ووكومرس وإنشاء مفاتيح API بصلاحيات القراءة والكتابة.</p>
                </div>
                <SupportCard />
            </div>
        </div>
    );
}



/* ─── OTP Tab ─── */
function OtpTab() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <h3 className="text-lg font-bold text-slate-900">تأكيد الطلب عبر واتساب (OTP)</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-bold">مفعّل</span>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">أرسل رمز تأكيد (OTP) للعملاء عبر واتساب للتحقق من الطلبات قبل المعالجة.</p>
                    <div className="space-y-4">
                        <SettingRow title="تفعيل OTP عند الدفع عند الاستلام (COD)" desc="إرسال رمز تحقق قبل تأكيد طلبات الدفع عند الاستلام" defaultOn />
                        <SettingRow title="تفعيل OTP عند التسجيل" desc="التحقق من رقم هاتف العميل عند إنشاء حساب جديد" defaultOn={false} />
                        <SettingRow title="تفعيل OTP عند تغيير العنوان" desc="طلب تأكيد عند تحديث عنوان الشحن" defaultOn={false} />
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">إعدادات OTP</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">عدد أرقام الرمز</label>
                            <select className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-700 text-sm px-3 py-2.5 border focus:ring-primary focus:border-primary" defaultValue="6">
                                <option value="4">4 أرقام</option>
                                <option value="6">6 أرقام</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">مدة صلاحية الرمز (بالدقائق)</label>
                            <input className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-700 text-sm px-3 py-2.5 border focus:ring-primary focus:border-primary" type="number" defaultValue="5" min="1" max="30" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">عدد المحاولات المسموحة</label>
                            <input className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-700 text-sm px-3 py-2.5 border focus:ring-primary focus:border-primary" type="number" defaultValue="3" min="1" max="10" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">نص رسالة OTP</label>
                            <textarea className="w-full rounded-lg border border-slate-200 bg-white text-sm p-3 h-20 resize-none focus:ring-primary focus:border-primary" defaultValue="رمز التحقق الخاص بك هو: {otp_code}. صالح لمدة {minutes} دقائق. لا تشاركه مع أحد." />
                            <div className="flex flex-wrap gap-2 mt-2">
                                {['{otp_code}', '{minutes}', '{store_name}'].map(tag => (
                                    <span key={tag} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md cursor-pointer hover:bg-primary/20 font-mono">{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/20">حفظ الإعدادات</button>
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">إحصائيات OTP</h3>
                    <div className="space-y-4">
                        <StatItem label="إجمالي الرموز المرسلة" value="1,247" />
                        <StatItem label="عمليات تحقق ناجحة" value="1,189" color="text-green-600" />
                        <StatItem label="عمليات فاشلة" value="58" color="text-red-600" />
                        <StatItem label="معدل النجاح" value="95.3%" color="text-primary" />
                    </div>
                </div>
                <SupportCard />
            </div>
        </div>
    );
}

/* ─── WhatsApp Button Tab ─── */
function WhatsAppButtonTab() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <h3 className="text-lg font-bold text-slate-900">زر واتساب العائم</h3>
                        <ToggleSwitch defaultChecked />
                    </div>
                    <p className="text-sm text-slate-500 mb-6">أضف زر واتساب عائم على متجرك ليتمكن العملاء من التواصل معك مباشرة.</p>
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">رقم واتساب</label>
                            <WhatsAppPhoneInput defaultValue="+966500000000" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">رسالة الترحيب</label>
                            <textarea className="w-full rounded-lg border border-slate-200 bg-white text-sm p-3 h-20 resize-none" defaultValue="مرحباً! 👋 كيف يمكنني مساعدتك اليوم؟" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">موضع الزر</label>
                            <select className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-700 text-sm px-3 py-2.5 border" defaultValue="bottom-left">
                                <option value="bottom-left">أسفل يسار</option>
                                <option value="bottom-right">أسفل يمين</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">لون الزر</label>
                            <div className="flex items-center gap-3">
                                <input type="color" defaultValue="#25D366" className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer" />
                                <span className="text-sm text-slate-500">اللون الافتراضي لواتساب</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-3">عرض الزر في</label>
                            <div className="space-y-3">
                                <SettingRow title="جميع الصفحات" desc="عرض زر واتساب في كل صفحات المتجر" defaultOn />
                                <SettingRow title="صفحة المنتج فقط" desc="عرض الزر في صفحات المنتجات فقط" defaultOn={false} />
                                <SettingRow title="صفحة السلة والدفع" desc="مساعدة العملاء أثناء الشراء" defaultOn />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <button className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/20">حفظ الإعدادات</button>
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="font-bold text-slate-900 mb-4">معاينة الزر</h3>
                    <div className="bg-slate-100 rounded-xl h-64 relative overflow-hidden border border-slate-200">
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">صفحة المتجر</div>
                        <div className="absolute bottom-4 left-4 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-white text-2xl">chat</span>
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-3 text-center">هذا شكل الزر على متجرك</p>
                </div>
                <SupportCard />
            </div>
        </div>
    );
}

/* ─── Sync Tab ─── */
function SyncTab() {
    const syncLogs = [
        { time: '08:30', date: '2024-01-15', type: 'تلقائي', items: 45, status: 'success' },
        { time: '14:00', date: '2024-01-15', type: 'يدوي', items: 120, status: 'success' },
        { time: '20:30', date: '2024-01-14', type: 'تلقائي', items: 38, status: 'success' },
        { time: '08:30', date: '2024-01-14', type: 'تلقائي', items: 0, status: 'failed' },
        { time: '14:00', date: '2024-01-13', type: 'تلقائي', items: 52, status: 'success' },
    ];

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">آخر مزامنة</p>
                    <p className="text-lg font-bold text-slate-900" dir="ltr">2024-01-15 08:30</p>
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-2"><span className="size-1.5 rounded-full bg-green-500"></span>ناجحة</span>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">إجمالي العناصر المُزامنة</p>
                    <p className="text-lg font-bold text-slate-900">1,247</p>
                    <span className="text-xs text-slate-400 mt-2 block">منتجات + طلبات + عملاء</span>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <p className="text-sm text-slate-500 mb-1">الجدول الزمني</p>
                    <p className="text-lg font-bold text-slate-900">كل 12 ساعة</p>
                    <span className="text-xs text-primary mt-2 block font-medium">المزامنة التالية: 20:30</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900">إعدادات المزامنة</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">تكرار المزامنة التلقائية</label>
                        <select className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-700 text-sm px-3 py-2.5 border" defaultValue="12h">
                            <option value="1h">كل ساعة</option>
                            <option value="6h">كل 6 ساعات</option>
                            <option value="12h">كل 12 ساعة</option>
                            <option value="24h">كل 24 ساعة</option>
                            <option value="manual">يدوي فقط</option>
                        </select>
                    </div>
                    <SettingRow title="مزامنة المنتجات" desc="تحديث بيانات المنتجات تلقائياً" defaultOn />
                    <SettingRow title="مزامنة الطلبات" desc="استلام الطلبات الجديدة تلقائياً" defaultOn />
                    <SettingRow title="مزامنة العملاء" desc="تحديث بيانات العملاء" defaultOn />
                </div>
                <div className="flex gap-3 mt-6">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 shadow-lg shadow-blue-500/20">
                        <span className="material-symbols-outlined text-[18px]">sync</span>
                        مزامنة الآن
                    </button>
                    <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">حفظ الإعدادات</button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-bold text-slate-900">سجل المزامنة</h3>
                </div>
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">التاريخ</th>
                            <th className="px-6 py-4">الوقت</th>
                            <th className="px-6 py-4">النوع</th>
                            <th className="px-6 py-4">العناصر</th>
                            <th className="px-6 py-4">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {syncLogs.map((log, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 text-slate-700" dir="ltr">{log.date}</td>
                                <td className="px-6 py-4 text-slate-500" dir="ltr">{log.time}</td>
                                <td className="px-6 py-4 text-slate-600">{log.type}</td>
                                <td className="px-6 py-4 font-medium text-slate-900">{log.items}</td>
                                <td className="px-6 py-4">
                                    {log.status === 'success' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                            <span className="size-1.5 rounded-full bg-green-500"></span>ناجح
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                            <span className="size-1.5 rounded-full bg-red-500"></span>فشل
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


function WhatsAppPhoneInput({ defaultValue }: { defaultValue: string }) {
    const [countryCode, setCountryCode] = useState('+966');
    const [phone, setPhone] = useState(defaultValue.replace('+966', ''));

    return (
        <div className="relative group flex items-center" dir="ltr">
            <div className="relative h-10 w-40 shrink-0 z-10">
                <CountryCodeSelector
                    value={countryCode}
                    onChange={(val) => setCountryCode(val)}
                    className="h-full"
                    variant="prefix"
                />
            </div>
            <div className="relative flex-1 h-10 -ml-px">
                <input
                    type="tel"
                    className="w-full h-full pl-3 pr-8 rounded-r-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-700 text-sm"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    dir="ltr"
                    placeholder="5XXXXXXXX"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-[18px]">phone_iphone</span>
            </div>
        </div>
    );
}

/* ─── Shared Components ─── */
function ToggleSwitch({ defaultChecked = false }: { defaultChecked?: boolean }) {
    return (
        <label className="relative inline-flex items-center cursor-pointer">
            <input defaultChecked={defaultChecked} className="sr-only peer" type="checkbox" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
    );
}

function SettingRow({ title, desc, defaultOn }: { title: string; desc: string; defaultOn: boolean }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
            <div>
                <p className="font-bold text-slate-800 text-sm">{title}</p>
                <p className="text-xs text-slate-500 mt-1">{desc}</p>
            </div>
            <ToggleSwitch defaultChecked={defaultOn} />
        </div>
    );
}

function StatItem({ label, value, color = 'text-slate-900' }: { label: string; value: string; color?: string }) {
    return (
        <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className={`font-bold ${color}`}>{value}</span>
        </div>
    );
}



function ActivationSteps() {
    return (
        <div className="bg-slate-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#2e69ff_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <h3 className="text-lg font-bold mb-4 relative z-10">خطوات التفعيل</h3>
            <div className="flex flex-col gap-6 relative z-10">
                {[
                    { n: '1', title: 'تثبيت الإضافة', desc: 'حمل وثبت إضافة "Pengoo" على متجر ووردبريس الخاص بك.', active: true },
                    { n: '2', title: 'إدخال المفاتيح', desc: 'انسخ مفتاح الربط من هنا وألصقه في إعدادات الإضافة.', active: false },
                    { n: '3', title: 'اختبار الاتصال', desc: 'اضغط على زر "فحص الاتصال" في ووردبريس للتأكد من الربط.', active: false },
                ].map(step => (
                    <div key={step.n} className="flex gap-4">
                        <div className={`flex-none flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${step.active ? 'bg-primary' : 'bg-slate-700 border border-slate-600'}`}>{step.n}</div>
                        <div>
                            <p className="font-bold text-sm mb-1">{step.title}</p>
                            <p className="text-xs text-slate-400">{step.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="mt-6 w-full py-2.5 bg-white text-slate-900 rounded-lg text-sm font-bold hover:bg-slate-100 transition-colors relative z-10">تحميل الإضافة</button>
        </div>
    );
}

function SupportCard() {
    return (
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <div className="flex gap-3 mb-2">
                <span className="material-symbols-outlined text-primary">support_agent</span>
                <p className="font-bold text-slate-900">هل تحتاج مساعدة؟</p>
            </div>
            <p className="text-sm text-slate-600 mb-4">فريقنا جاهز لمساعدتك في عملية الربط خطوة بخطوة.</p>
            <a className="text-primary text-sm font-bold hover:underline" href="/dashboard/support">تواصل مع الدعم الفني ←</a>
        </div>
    );
}

