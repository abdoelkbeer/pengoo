'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function SettingsClient({ initialSettings }: { initialSettings: any }) {
    const [settings, setSettings] = useState(initialSettings);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [testingSmtp, setTestingSmtp] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const supabase = createClient();

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `branding/${fileName}`;

        setUploading(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from('platform')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('platform')
                .getPublicUrl(filePath);

            setSettings({ ...settings, logo_url: publicUrl });
            setMessage('تم رفع الشعار بنجاح! تذكر حفظ الإعدادات لتطبيقه.');
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('فشل رفع الشعار: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `favicon-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `branding/${fileName}`;

        setUploading(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from('platform')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('platform')
                .getPublicUrl(filePath);

            setSettings({ ...settings, favicon_url: publicUrl });
            setMessage('تم رفع الأيقونة بنجاح! تذكر حفظ الإعدادات لتطبيقها.');
            setTimeout(() => setMessage(''), 3000);
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('فشل رفع الأيقونة: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleTestSmtp = async () => {
        if (!testEmail) return alert('الرجاء إدخال بريد إلكتروني للتجربة');
        setTestingSmtp(true);
        try {
            const res = await fetch('/api/admin/settings/test-smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: testEmail })
            });
            const result = await res.json();
            if (result.success) {
                alert('تم إرسال رسالة التجربة بنجاح!');
            } else {
                alert('خطأ أثناء إرسال الرسالة: ' + result.error);
            }
        } catch (error: any) {
            console.error('Test SMTP Error:', error);
            alert('فشل الاتصال بخادم البريد');
        } finally {
            setTestingSmtp(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: settings.id, data: settings })
            });
            const result = await res.json();
            if (result.success) {
                setMessage('تم حفظ الإعدادات بنجاح!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                alert('خطأ: ' + result.error);
            }
        } catch (error: any) {
            console.error(error);
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-border-color shadow-sm p-8 max-w-4xl mx-auto">
            <form onSubmit={handleSave} className="space-y-8">

                {/* Branding & Logo Section */}
                <div className="p-6 bg-slate-50/50 rounded-3xl border border-border-color/50 space-y-6">
                    <div className="flex items-center gap-3 border-b border-border-color pb-4">
                        <span className="material-symbols-outlined text-primary">image</span>
                        <h3 className="font-black text-text-main">هوية المنصة (Branding)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                            <label className="text-sm font-black text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-primary">upload_file</span>
                                شعار المنصة (Logo)
                            </label>

                            <div className="flex flex-col gap-4">
                                <div className="relative group">
                                    <div className="h-32 w-full bg-white border-2 border-dashed border-border-color rounded-2xl flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 relative">
                                        {settings.logo_url ? (
                                            <img src={settings.logo_url} alt="Site Logo" className="max-h-24 max-w-[80%] object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-text-sub">
                                                <span className="material-symbols-outlined text-4xl opacity-20">image_not_supported</span>
                                                <span className="text-xs font-bold">لا يوجد شعار حالياً</span>
                                            </div>
                                        )}

                                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <span className="text-white text-xs font-bold bg-primary px-4 py-2 rounded-xl shadow-lg">تغيير الشعار</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                                        </label>
                                    </div>
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                <span className="text-xs font-bold text-primary">جاري الرفع...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button type="button" onClick={() => setSettings({ ...settings, logo_url: '' })} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 w-fit transition-colors">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    حذف الشعار والعودة للافتراضي
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-black text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-primary">add_photo_alternate</span>
                                أيقونة المتصفح (Favicon)
                            </label>

                            <div className="flex flex-col gap-4">
                                <div className="relative group">
                                    <div className="h-32 w-full bg-white border-2 border-dashed border-border-color rounded-2xl flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50 relative">
                                        {settings.favicon_url ? (
                                            <img src={settings.favicon_url} alt="Favicon" className="h-16 w-16 object-contain" />
                                        ) : (
                                            <div className="flex flex-col items-center gap-2 text-text-sub">
                                                <span className="material-symbols-outlined text-4xl opacity-20">featured_video</span>
                                                <span className="text-xs font-bold">لا يوجد أيقونة حالياً</span>
                                            </div>
                                        )}

                                        <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <span className="text-white text-xs font-bold bg-primary px-4 py-2 rounded-xl shadow-lg">تغيير الأيقونة</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFaviconUpload} disabled={uploading} />
                                        </label>
                                    </div>
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                <span className="text-xs font-bold text-primary">جاري الرفع...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button type="button" onClick={() => setSettings({ ...settings, favicon_url: '' })} className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 w-fit transition-colors">
                                    <span className="material-symbols-outlined text-sm">delete</span>
                                    حذف الأيقونة والعودة للافتراضي
                                </button>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-border-color/50 shadow-sm space-y-4 md:col-span-2">
                            <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-lg">lightbulb</span>
                                إرشادات الهوية البصرية:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2 text-xs text-text-sub leading-relaxed">
                                        <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                                        <span>**الشعار**: يفضل مقاس 300x80 بكسل (عرضي).</span>
                                    </li>
                                    <li className="flex items-start gap-2 text-xs text-text-sub leading-relaxed">
                                        <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                                        <span>**الأيقونة**: يجب أن تكون مربعة 1:1 (مثلاً 128x128 بكسل).</span>
                                    </li>
                                </ul>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2 text-xs text-text-sub leading-relaxed">
                                        <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                                        <span>**الصيغ**: ننصح بـ **SVG** للدقة، أو **PNG** بخلفية شفافة.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-sm font-black text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">title</span>
                            اسم الموقع / المنصة
                        </label>
                        <input type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all font-bold"
                            value={settings.site_name} onChange={e => setSettings({ ...settings, site_name: e.target.value })} />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">email</span>
                            بريد التواصل الرسمي
                        </label>
                        <input type="email" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all font-bold"
                            value={settings.contact_email} onChange={e => setSettings({ ...settings, contact_email: e.target.value })} />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">payments</span>
                            العملة الافتراضية للمنصة
                        </label>
                        <select
                            className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                            value={settings.currency || 'EGP'}
                            onChange={e => setSettings({ ...settings, currency: e.target.value })}
                        >
                            <option value="EGP">جنيه مصري (EGP)</option>
                            <option value="SAR">ريال سعودي (SAR)</option>
                            <option value="AED">درهم إماراتي (AED)</option>
                            <option value="KWD">دينار كويتي (KWD)</option>
                            <option value="QAR">ريال قطري (QAR)</option>
                            <option value="USD">دولار أمريكي (USD)</option>
                            <option value="EUR">يورو (EUR)</option>
                            <option value="GBP">جنيه إسترليني (GBP)</option>
                        </select>
                        <p className="text-[10px] text-text-sub mt-1">تأكد من اختيار العملة المتوافقة مع حسابك في فواتيرك.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="text-sm font-black text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">phone</span>
                            رقم الدعم الفني
                        </label>
                        <input type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all font-bold text-left" dir="ltr"
                            value={settings.support_phone} onChange={e => setSettings({ ...settings, support_phone: e.target.value })} />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-black text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">copyright</span>
                            نص التذييل (Footer)
                        </label>
                        <input type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all font-bold"
                            value={settings.footer_text} onChange={e => setSettings({ ...settings, footer_text: e.target.value })} />
                    </div>
                </div>

                {/* SMTP Settings Section */}
                <div className="p-6 bg-slate-50/50 rounded-3xl border border-border-color/50 space-y-6">
                    <div className="flex items-center gap-3 border-b border-border-color pb-4">
                        <span className="material-symbols-outlined text-primary">mail</span>
                        <h3 className="font-black text-text-main">إعدادات خادم البريد (SMTP)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-sm font-black text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-primary">dns</span>
                                خادم الإرسال (Host)
                            </label>
                            <input type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                value={settings.smtp_host || ''} onChange={e => setSettings({ ...settings, smtp_host: e.target.value })} dir="ltr" placeholder="smtp.example.com" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-black text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-primary">numbers</span>
                                المنفذ (Port)
                            </label>
                            <input type="number" className="w-full h-12 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                value={settings.smtp_port || ''} onChange={e => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 0 })} dir="ltr" placeholder="587" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-black text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-primary">person</span>
                                اسم المستخدم / البريد (Username)
                            </label>
                            <input type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                value={settings.smtp_user || ''} onChange={e => setSettings({ ...settings, smtp_user: e.target.value })} dir="ltr" placeholder="user@example.com" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-black text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-primary">password</span>
                                كلمة المرور (Password)
                            </label>
                            <input type="password" className="w-full h-12 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                value={settings.smtp_password || ''} onChange={e => setSettings({ ...settings, smtp_password: e.target.value })} dir="ltr" placeholder="••••••••" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-black text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-primary">alternate_email</span>
                                بريد المُرسل (Sender Email)
                            </label>
                            <input type="email" className="w-full h-12 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                value={settings.smtp_sender_email || ''} onChange={e => setSettings({ ...settings, smtp_sender_email: e.target.value })} dir="ltr" placeholder="noreply@example.com" />
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-black text-text-main flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm text-primary">badge</span>
                                اسم المُرسل (Sender Name)
                            </label>
                            <input type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold"
                                value={settings.smtp_sender_name || ''} onChange={e => setSettings({ ...settings, smtp_sender_name: e.target.value })} placeholder="منصة بينجو" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border-color/50 flex flex-col md:flex-row gap-4 items-center">
                        <div className="flex-1 w-full relative">
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-text-sub">mail</span>
                            <input type="email" placeholder="البريد الإلكتروني للتجربة" className="w-full h-12 pr-12 pl-4 border border-border-color rounded-xl focus:border-primary outline-none transition-all font-bold bg-white"
                                value={testEmail} onChange={(e) => setTestEmail(e.target.value)} dir="ltr" />
                        </div>
                        <button type="button" onClick={handleTestSmtp} disabled={testingSmtp}
                            className="w-full md:w-auto px-8 h-12 bg-white border border-primary text-primary hover:bg-primary/5 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap">
                            {testingSmtp ? 'جاري الإرسال...' : (
                                <>
                                    <span className="material-symbols-outlined text-lg">send</span>
                                    إرسال بريد تجريبي
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Payment Gateway Settings Section */}
                <div className="p-6 bg-slate-50/50 rounded-3xl border border-border-color/50 space-y-6">
                    <div className="flex items-center gap-3 border-b border-border-color pb-4">
                        <span className="material-symbols-outlined text-primary">payments</span>
                        <h3 className="font-black text-text-main">إعدادات بوابات الدفع (Payment Gateways)</h3>
                    </div>

                    <div className="space-y-4 max-w-md">
                        <label className="text-sm font-black text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                            بوابة الدفع النشطة
                        </label>
                        <select
                            className="w-full h-12 px-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                            value={settings.active_payment_gateway || 'fawaterk'}
                            onChange={e => setSettings({ ...settings, active_payment_gateway: e.target.value })}
                        >
                            <option value="fawaterk">Fawaterk (فواتيرك)</option>
                            <option value="stripe">Stripe (سترايب)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Fawaterk Settings */}
                        <div className={`p-6 rounded-2xl border transition-all ${settings.active_payment_gateway === 'fawaterk' ? 'bg-white border-primary shadow-sm' : 'bg-gray-50 border-border-color opacity-60'}`}>
                            <h4 className="font-bold text-text-main mb-4 flex items-center gap-2">
                                Fawaterk
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-text-sub block mb-1">API Key</label>
                                    <input type="text" className="w-full h-10 px-3 rounded-lg border border-border-color bg-white outline-none focus:border-primary transition-all text-sm font-medium"
                                        value={settings.fawaterk_api_key || ''} onChange={e => setSettings({ ...settings, fawaterk_api_key: e.target.value })} dir="ltr" placeholder="Keys.pk_..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-sub block mb-1">Webhook Secret (Optional)</label>
                                    <input type="text" className="w-full h-10 px-3 rounded-lg border border-border-color bg-white outline-none focus:border-primary transition-all text-sm font-medium"
                                        value={settings.fawaterk_webhook_secret || ''} onChange={e => setSettings({ ...settings, fawaterk_webhook_secret: e.target.value })} dir="ltr" />
                                </div>
                            </div>
                        </div>

                        {/* Stripe Settings */}
                        <div className={`p-6 rounded-2xl border transition-all ${settings.active_payment_gateway === 'stripe' ? 'bg-white border-primary shadow-sm' : 'bg-gray-50 border-border-color opacity-60'}`}>
                            <h4 className="font-bold text-text-main mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-500">credit_card</span>
                                Stripe
                            </h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-text-sub block mb-1">Publishable Key</label>
                                    <input type="text" className="w-full h-10 px-3 rounded-lg border border-border-color bg-white outline-none focus:border-primary transition-all text-sm font-medium"
                                        value={settings.stripe_publishable_key || ''} onChange={e => setSettings({ ...settings, stripe_publishable_key: e.target.value })} dir="ltr" placeholder="pk_test_..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-sub block mb-1">Secret Key</label>
                                    <input type="password" size={30} className="w-full h-10 px-3 rounded-lg border border-border-color bg-white outline-none focus:border-primary transition-all text-sm font-medium"
                                        value={settings.stripe_secret_key || ''} onChange={e => setSettings({ ...settings, stripe_secret_key: e.target.value })} dir="ltr" placeholder="sk_test_..." />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-text-sub block mb-1">Webhook Signing Secret</label>
                                    <input type="text" className="w-full h-10 px-3 rounded-lg border border-border-color bg-white outline-none focus:border-primary transition-all text-sm font-medium"
                                        value={settings.stripe_webhook_secret || ''} onChange={e => setSettings({ ...settings, stripe_webhook_secret: e.target.value })} dir="ltr" placeholder="whsec_..." />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-4">
                        <label className="text-sm font-black text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">token</span>
                            الحد الأدنى للرموز المطلوبة للتشغيل
                        </label>
                        <input type="number" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all font-bold"
                            value={settings.min_tokens_required} onChange={e => setSettings({ ...settings, min_tokens_required: parseInt(e.target.value) })} />
                        <p className="text-xs text-text-sub font-medium leading-relaxed">حدد عدد الرموز التي يجب أن تتوفر لدى المستخدم ليتمكن من تشغيل محرك الإرسال تلقائياً.</p>
                    </div>

                    <div className="flex-1">
                        <label className={`flex flex-col gap-4 p-6 rounded-3xl border cursor-pointer transition-all h-full
                            ${settings.maintenance_mode ? 'bg-rose-50 border-rose-200' : 'bg-green-50 border-green-200'}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-black text-text-main">وضع الصيانة الكامل</span>
                                <input type="checkbox" className="w-6 h-6 accent-rose-500 rounded-lg"
                                    checked={settings.maintenance_mode} onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })} />
                            </div>
                            <p className="text-xs font-bold text-text-sub">عند تفعيل هذا الوضع، سيتم منع جميع المستخدمين من الدخول للمنصة وسيظهر إشعار صيانة.</p>
                        </label>
                    </div>
                </div>

                <div className="pt-8 border-t border-border-color flex justify-between items-center">
                    {message && <div className="text-green-600 font-bold animate-pulse text-sm">✓ {message}</div>}
                    <button type="submit" disabled={loading}
                        className="mr-auto px-12 py-3.5 rounded-2xl bg-primary text-white font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 flex items-center gap-2">
                        {loading ? 'جاري الحفظ...' :
                            <>
                                <span className="material-symbols-outlined text-lg">save</span>
                                <span>حفظ وتطبيق الإعدادات</span>
                            </>
                        }
                    </button>
                </div>
            </form>
        </div>
    );
}
