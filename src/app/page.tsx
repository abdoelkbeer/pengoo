// @ts-nocheck
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { FadeIn } from '@/components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '@/components/animations/StaggerContainer';

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [
        { data: services },
        { data: packages },
        { data: faqs },
        { data: settings }
    ] = await Promise.all([
        supabase.from('landing_services').select('*').order('sorted_order', { ascending: true }),
        supabase.from('landing_packages').select('*').order('sorted_order', { ascending: true }),
        supabase.from('landing_faqs').select('*').order('sorted_order', { ascending: true }),
        supabase.from('platform_settings').select('*').limit(1).single()
    ]);

    return (
        <>

            <div className="relative flex min-h-screen w-full flex-col group/design-root">
                <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-20">
                            <div className="flex items-center gap-4">
                                {settings?.logo_url ? (
                                    <img src={settings.logo_url} alt={settings.site_name || 'Logo'} className="h-10 w-auto object-contain" />
                                ) : (
                                    <>
                                        <div className="size-8 text-primary">
                                            <svg className="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" fill="currentColor"></path>
                                            </svg>
                                        </div>
                                        <h2 className="text-slate-900 dark:text-white text-2xl font-bold tracking-tight">{settings?.site_name || 'بينجو'}</h2>
                                    </>
                                )}
                            </div>
                            <nav className="hidden md:flex items-center gap-8">
                                <a className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors text-sm font-medium" href="#features">المميزات</a>
                                <a className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors text-sm font-medium" href="#woocommerce">ووكومرس</a>
                                <a className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors text-sm font-medium" href="#pricing">الأسعار</a>
                                <a className="text-slate-600 dark:text-slate-300 hover:text-primary transition-colors text-sm font-medium" href="#support">الدعم</a>
                            </nav>
                            <div className="flex items-center gap-4">
                                {user ? (
                                    <a href="/dashboard" className="flex items-center justify-center rounded-xl h-10 px-6 bg-primary hover:bg-primary/90 transition-colors text-white text-sm font-bold shadow-lg shadow-primary/20">
                                        <span className="material-symbols-outlined text-sm ml-2">dashboard</span>
                                        <span>لوحة التحكم</span>
                                    </a>
                                ) : (
                                    <>
                                        <a className="hidden sm:block text-slate-600 dark:text-slate-300 font-medium text-sm hover:text-primary" href="/auth/login">تسجيل الدخول</a>
                                        <a href="/auth/login" className="flex items-center justify-center rounded-xl h-10 px-6 bg-primary hover:bg-primary/90 transition-colors text-white text-sm font-bold shadow-lg shadow-primary/20">
                                            <span>ابدأ الآن</span>
                                        </a>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-grow">
                    <section className="relative py-16 lg:py-24 overflow-hidden">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="flex flex-col gap-6 text-right">
                                    <FadeIn delay={0.1}>
                                        <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                                            بينجو | منصة أتمتة رسائل واتساب للمتاجر الإلكترونية
                                        </h1>
                                    </FadeIn>
                                    <FadeIn delay={0.2}>
                                        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
                                            امسح QR، ثبّت الإضافة، فعّل القواعد، وابدأ بإرسال حملاتك فوراً.
                                        </p>
                                    </FadeIn>
                                    <FadeIn delay={0.3} className="flex flex-wrap gap-4 mt-4">
                                        <a href="/auth/login" className="flex items-center justify-center rounded-xl h-12 px-8 bg-primary hover:bg-primary/90 transition-colors text-white text-base font-bold shadow-xl shadow-primary/30">
                                            ابدأ التجربة مجاناً
                                        </a>
                                        <a href="#docs" className="flex items-center justify-center rounded-xl h-12 px-8 bg-white border border-slate-200 hover:bg-slate-50 transition-colors text-slate-900 text-base font-bold">
                                            <span className="ml-2 material-symbols-outlined text-primary">play_circle</span>
                                            شاهد الدليل
                                        </a>
                                    </FadeIn>
                                    <FadeIn delay={0.4} className="flex items-center gap-2 text-sm text-slate-500 mt-2">
                                        <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                        <span>تجربة مجانية لمدة 14 يوم</span>
                                        <span className="mx-2">•</span>
                                        <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                        <span>لا يحتاج بطاقة ائتمان</span>
                                    </FadeIn>
                                </div>
                                <FadeIn direction="left" delay={0.2} className="relative lg:h-auto">
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white aspect-[4/3] group">
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent"></div>
                                        <img alt="Dashboard interface showing whatsapp analytics" className="w-full h-full object-cover object-left-top transform group-hover:scale-105 transition-transform duration-700" data-alt="Dashboard interface showing whatsapp analytics" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCW5qpxrXKAMZrLQQ86uO_uRhpvWQyFUHqC88OhPY8L4nF22fbE1hM6pPSB0fbPeovVQaZcXA1tMeD0VDzCIdBtwVfDdRQDdoWuZM1bAP0HcdSs49qUikcl9T2Didp3C6McrYG4YdLb34a5LNxnX_millYR7Db9D5whgp3cVxpKWC8QEbE9oSSO3u16n6eKQLngJ3s4csS8I0_FcfOMin4Tz39U0dmwrVNQq0Xl_auApALNtjpuM11t1vcIIVbbGpsgLEdObsDZiR5L" />
                                        <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur rounded-lg p-4 shadow-lg border border-slate-100 max-w-xs animate-bounce" style={{ "animationDuration": "3s" }}>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="bg-green-100 text-green-600 rounded-full p-1">
                                                    <span className="material-symbols-outlined text-sm">chat</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-800">إشعار طلب جديد</span>
                                                <span className="mr-auto text-[10px] text-slate-400">الآن</span>
                                            </div>
                                            <p className="text-xs text-slate-600">مرحباً محمد، تم استلام طلبك #4920 بنجاح. سيتم تجهيزه قريباً 🚀</p>
                                        </div>
                                    </div>
                                </FadeIn>
                            </div>
                        </div>
                    </section>
                    <section className="py-12 bg-white border-y border-slate-100">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                <StaggerItem className="flex flex-col gap-2 items-center text-center">
                                    <p className="text-slate-500 text-sm font-medium">متجر نشط</p>
                                    <p className="text-slate-900 text-3xl font-black font-display text-primary">+٥٠٠</p>
                                </StaggerItem>
                                <StaggerItem className="flex flex-col gap-2 items-center text-center">
                                    <p className="text-slate-500 text-sm font-medium">رسالة يومياً</p>
                                    <p className="text-slate-900 text-3xl font-black font-display text-primary">+١٠٠٠٠</p>
                                </StaggerItem>
                                <StaggerItem className="flex flex-col gap-2 items-center text-center">
                                    <p className="text-slate-500 text-sm font-medium">معدل الفتح</p>
                                    <p className="text-slate-900 text-3xl font-black font-display text-primary">٩٨٪</p>
                                </StaggerItem>
                                <StaggerItem className="flex flex-col gap-2 items-center text-center">
                                    <p className="text-slate-500 text-sm font-medium">سلة مسترجعة</p>
                                    <p className="text-slate-900 text-3xl font-black font-display text-primary">+١٥٠٠</p>
                                </StaggerItem>
                            </StaggerContainer>
                        </div>
                    </section>
                    <section className="py-20 bg-background-light">
                        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <FadeIn direction="up">
                                    <h2 className="text-3xl font-bold text-slate-900 mb-4">ابدأ في دقائق معدودة</h2>
                                    <p className="text-slate-600">خطوات بسيطة تفصلك عن أتمتة متجرك بالكامل</p>
                                </FadeIn>
                            </div>
                            <StaggerContainer className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                                <div className="hidden md:block absolute top-6 right-1/2 translate-x-1/2 w-[80%] h-0.5 bg-slate-200 -z-10"></div>
                                <StaggerItem className="flex flex-col items-center text-center gap-4">
                                    <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm z-10 hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">person_add</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">أنشئ حسابك</h3>
                                        <p className="text-xs text-slate-500 mt-1">سجل في المنصة مجاناً</p>
                                    </div>
                                </StaggerItem>
                                <StaggerItem className="flex flex-col items-center text-center gap-4">
                                    <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm z-10 hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">qr_code_scanner</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">امسح الكود</h3>
                                        <p className="text-xs text-slate-500 mt-1">اربط رقم الواتساب</p>
                                    </div>
                                </StaggerItem>
                                <StaggerItem className="flex flex-col items-center text-center gap-4">
                                    <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm z-10 hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">extension</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">ثبت الإضافة</h3>
                                        <p className="text-xs text-slate-500 mt-1">إضافة ووكومرس الرسمية</p>
                                    </div>
                                </StaggerItem>
                                <StaggerItem className="flex flex-col items-center text-center gap-4">
                                    <div className="size-12 rounded-full bg-white border border-slate-200 flex items-center justify-center text-primary shadow-sm z-10 hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined">rocket_launch</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">انطلق</h3>
                                        <p className="text-xs text-slate-500 mt-1">فعل الإشعارات التلقائية</p>
                                    </div>
                                </StaggerItem>
                            </StaggerContainer>
                        </div>
                    </section>
                    <section className="py-20 bg-white" id="woocommerce">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col md:flex-row gap-12 items-center mb-16">
                                <div className="flex-1">
                                    <FadeIn direction="right">
                                        <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-6">لماذا تختار بينجو؟</h2>
                                        <p className="text-lg text-slate-600 leading-relaxed">تحكم كامل في إشعارات متجرك عبر الواتساب لضمان أفضل تجربة لعملائك، بدءاً من لحظة الطلب وحتى التوصيل.</p>
                                    </FadeIn>
                                </div>
                                <div className="flex-1 w-full">
                                    <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {services && services.length > 0 ? services.map((service, idx) => (
                                            <StaggerItem key={service.id} className={`p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all ${idx === 2 && services.length === 3 ? 'sm:col-span-2' : ''}`}>
                                                <div className={`flex flex-col ${idx === 2 && services.length === 3 ? 'sm:flex-row' : ''} gap-4 items-start ${idx === 2 && services.length === 3 ? 'sm:items-center' : ''}`}>
                                                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group">
                                                        <span className="material-symbols-outlined group-hover:scale-110 group-hover:rotate-12 transition-transform">{service.icon || 'star'}</span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-slate-900 mb-1">{service.title}</h3>
                                                        <p className="text-sm text-slate-600">{service.description}</p>
                                                    </div>
                                                </div>
                                            </StaggerItem>
                                        )) : (
                                            <p className="text-slate-500">جاري التحميل...</p>
                                        )}
                                    </StaggerContainer>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="py-20 bg-background-light" id="features">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center max-w-3xl mx-auto mb-16">
                                <FadeIn direction="up">
                                    <span className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full">كل ما تحتاجه</span>
                                    <h2 className="text-3xl font-bold text-slate-900 mt-4 mb-4">مميزات شاملة لنمو متجرك</h2>
                                    <p className="text-slate-600">أدوات قوية مصممة لتسريع وتيرة عملك وزيادة رضا عملائك</p>
                                </FadeIn>
                            </div>
                            <StaggerContainer delayChildren={0.1} staggerChildren={0.05} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">campaign</span><h3 className="text-sm font-bold">حملات تسويقية</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">schedule_send</span><h3 className="text-sm font-bold">جدولة الرسائل</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">smart_button</span><h3 className="text-sm font-bold">أزرار تفاعلية</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">perm_media</span><h3 className="text-sm font-bold">إرسال وسائط</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">contacts</span><h3 className="text-sm font-bold">إدارة جهات الاتصال</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">auto_graph</span><h3 className="text-sm font-bold">تقارير مفصلة</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">api</span><h3 className="text-sm font-bold">API مفتوح</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">support_agent</span><h3 className="text-sm font-bold">الرد الآلي</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">groups</span><h3 className="text-sm font-bold">تجزئة العملاء</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">webhook</span><h3 className="text-sm font-bold">Webhooks</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">translate</span><h3 className="text-sm font-bold">دعم متعدد اللغات</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">bolt</span><h3 className="text-sm font-bold">سرعة إرسال عالية</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">security</span><h3 className="text-sm font-bold">تشفير البيانات</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">backup</span><h3 className="text-sm font-bold">نسخ احتياطي</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">phone_iphone</span><h3 className="text-sm font-bold">توافق مع الجوال</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">filter_alt</span><h3 className="text-sm font-bold">فلترة الأرقام</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">history</span><h3 className="text-sm font-bold">سجل الرسائل</h3></StaggerItem>
                                <StaggerItem className="bg-white p-4 rounded-xl border border-slate-200 text-center hover:shadow-md transition-shadow group"><span className="material-symbols-outlined text-primary mb-2 group-hover:scale-125 transition-transform">grid_view</span><h3 className="text-sm font-bold">قوالب جاهزة</h3></StaggerItem>
                            </StaggerContainer>
                        </div>
                    </section>
                    <section className="py-24 bg-white relative overflow-hidden" id="pricing">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-light pointer-events-none"></div>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                            <div className="text-center mb-16">
                                <FadeIn direction="up">
                                    <h2 className="text-3xl font-bold text-slate-900 mb-4">خطط تناسب حجم تجارتك</h2>
                                    <p className="text-slate-600">اختر الخطة المناسبة لحجم أعمالك وابدأ فوراً</p>
                                </FadeIn>
                            </div>
                            <StaggerContainer className="grid md:grid-cols-3 gap-8 items-start">
                                {packages && packages.length > 0 ? packages.map((pkg, idx) => (
                                    <StaggerItem key={pkg.id} className={`p-8 rounded-2xl ${pkg.is_popular ? 'border-2 border-primary bg-slate-50 relative shadow-xl shadow-primary/10' : 'border border-slate-200 bg-white'}`}>
                                        {pkg.is_popular && <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-bold animate-bounce" style={{ "animationDuration": "3s" }}>الأكثر طلباً</div>}
                                        <h3 className={`text-xl font-bold ${pkg.is_popular ? 'text-primary' : 'text-slate-900'}`}>{pkg.title}</h3>
                                        <p className="text-sm text-slate-500 mt-2 h-10 line-clamp-2">{pkg.description}</p>
                                        <div className="my-6 flex items-baseline gap-1">
                                            {Number(pkg.price) === 0 ? (
                                                <span className="text-4xl font-black text-slate-900">مجاناً</span>
                                            ) : (
                                                <>
                                                    <span className="text-4xl font-black text-slate-900">{pkg.price}</span>
                                                    <span className="text-xl text-slate-600 font-bold">ريال</span>
                                                    <span className="text-slate-500">/ شهرياً</span>
                                                </>
                                            )}
                                        </div>
                                        <a href="/auth/login" className={`w-full py-3 flex text-center items-center justify-center rounded-xl font-bold transition-colors ${pkg.is_popular ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20' : 'border-2 border-slate-200 text-slate-700 hover:border-primary hover:text-primary'}`}>{pkg.is_popular ? 'اختر هذه الخطة' : 'ابدأ الآن'}</a>
                                        <ul className="mt-8 space-y-4">
                                            {(pkg.features || []).map((f: string, i: number) => (
                                                <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                                                    <span className="material-symbols-outlined text-green-500 text-lg">check</span>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </StaggerItem>
                                )) : (
                                    <p className="col-span-3 text-center text-slate-500">جاري تحميل الباقات...</p>
                                )}
                            </StaggerContainer>
                        </div>
                    </section>
                    <section className="py-20 bg-white" id="support">
                        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                            <FadeIn direction="down">
                                <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">الأسئلة الشائعة</h2>
                            </FadeIn>
                            <StaggerContainer className="space-y-4">
                                {faqs && faqs.length > 0 ? faqs.map((faq, idx) => (
                                    <StaggerItem key={faq.id} className="group p-4 bg-slate-50 rounded-xl border border-slate-100 open:bg-white open:shadow-md transition-all">
                                        <details className="group">
                                            <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-slate-900">
                                                <span>{faq.question}</span>
                                                <span className="transition group-open:rotate-180 material-symbols-outlined text-slate-400">expand_more</span>
                                            </summary>
                                            <div className="text-slate-600 mt-3 group-open:animate-fadeIn">
                                                {faq.answer}
                                            </div>
                                        </details>
                                    </StaggerItem>
                                )) : (
                                    <p className="text-center text-slate-500">جاري تحميل الأسئلة الشائعة...</p>
                                )}
                            </StaggerContainer>
                        </div>
                    </section>
                </main>
                <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-4 gap-8 mb-8">
                            <div className="col-span-1 md:col-span-2">
                                <div className="flex items-center gap-3 mb-4 text-white">
                                    {settings?.logo_url ? (
                                        <img src={settings.logo_url} alt={settings.site_name || 'Logo'} className="h-10 w-auto object-contain brightness-0 invert" />
                                    ) : (
                                        <>
                                            <svg className="size-8" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" fill="currentColor"></path>
                                            </svg>
                                            <span className="text-2xl font-bold">{settings?.site_name || 'بينجو'}</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
                                    {settings?.footer_text || 'بينجو | منصة أتمتة رسائل واتساب للمتاجر الإلكترونية. نساعدك على التواصل مع عملائك وزيادة مبيعاتك بذكاء.'}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-4">روابط سريعة</h4>
                                <ul className="space-y-2 text-sm">
                                    <li><a className="hover:text-primary transition-colors" href="#features">عن المنصة</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="#pricing">الأسعار</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="#woocommerce">ووكومرس</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="#docs">شروحات الاستخدام</a></li>
                                </ul>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-4">قانوني</h4>
                                <ul className="space-y-2 text-sm">
                                    <li><a className="hover:text-primary transition-colors" href="/privacy">سياسة الخصوصية</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="/terms">شروط الاستخدام</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="/refund">سياسة الاسترجاع</a></li>
                                    <li><a className="hover:text-primary transition-colors" href="#support">الدعم الفني</a></li>
                                </ul>
                            </div>
                        </div>
                        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-sm text-slate-500">© {new Date().getFullYear()} {settings?.site_name || 'منصة بينجو'}. جميع الحقوق محفوظة.</p>
                            <div className="flex gap-4">
                                <a className="text-slate-400 hover:text-white transition-colors" href={`mailto:${settings?.contact_email || 'info@pengoo-platform.com'}`}><span className="material-symbols-outlined">mail</span></a>
                                <a className="text-slate-400 hover:text-white transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>


        </>
    );
}
