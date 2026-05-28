'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
    const [currentStep, setCurrentStep] = useState(1);
    const router = useRouter();

    React.useEffect(() => {
        const handleClick = (e: any) => {
            console.log('[Onboarding] Click detected at:', e.target);
        };
        document.addEventListener('click', handleClick);
        return () => document.removeEventListener('click', handleClick);
    }, []);

    const steps = [
        { id: 1, title: 'معلومات المتجر' },
        { id: 2, title: 'واتساب QR' },
        { id: 3, title: 'تحميل الإضافة' },
        { id: 4, title: 'التحقق' },
        { id: 5, title: 'الإرسال' },
        { id: 6, title: 'القواعد' },
    ];

    const handleNext = () => {
        console.log('[Onboarding] handleNext clicked. Current step:', currentStep);
        if (currentStep < 6) {
            setCurrentStep(currentStep + 1);
        } else {
            router.push('/dashboard');
        }
    };

    const handleBack = () => {
        console.log('[Onboarding] handleBack clicked. Current step:', currentStep);
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        console.log('[Onboarding] handleSkip clicked');
        router.push('/dashboard');
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 2:
                return (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-5 flex flex-col justify-center gap-6 p-4">
                            <div className="space-y-4">
                                <h2 className="text-3xl md:text-4xl font-bold text-text-main dark:text-white leading-tight">ربط حساب واتساب للأعمال</h2>
                                <p className="text-lg text-text-sub dark:text-gray-300 leading-relaxed">
                                    امسح رمز الاستجابة السريعة (QR Code) باستخدام تطبيق واتساب على هاتفك لربط حسابك بمنصة بينجو.
                                </p>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-5 flex gap-4 items-start mt-4">
                                <span className="material-symbols-outlined text-primary mt-1">info</span>
                                <div className="text-sm text-text-sub dark:text-gray-300 space-y-1">
                                    <p className="font-bold text-primary dark:text-blue-400 mb-1">كيفية المسح:</p>
                                    <ol className="list-decimal list-inside space-y-1 marker:text-primary">
                                        <li>افتح واتساب على هاتفك</li>
                                        <li>اضغط على القائمة (أو الإعدادات) واختر <strong>الأجهزة المرتبطة</strong></li>
                                        <li>اضغط على <strong>ربط جهاز</strong></li>
                                        <li>وجه الكاميرا نحو الرمز الظاهر على الشاشة</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-7">
                            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg border border-border-light dark:border-border-dark p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                                <div className="relative z-10 w-full flex flex-col items-center gap-6">
                                    <div className="relative p-4 bg-white rounded-xl shadow-inner border border-border-light">
                                        <img alt="WhatsApp Connection QR Code" className="w-64 h-64 object-contain mix-blend-multiply opacity-90" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmT1EjlmFdpZ9Q0iqNX0i0jX5XOJad1mnLsNQC2d31Y-x9hiP_7m1AXqdZKhzXvak-cSUxCE0Jp5KNp-Mxlo2j1OQtK47ZtfgAyLZJc0FdOXaZ4J3tjVqXMiq8-3u-KBCKnZRCVJwU0y-yRBwF--2rFF0bYlIrR_t0NiJRgbGzsP-pgefB9QZBC3_fKnQGqJMA5cQ8Ygju2p44mq8Z65w-w-_yv7uqQDJ9DYrCRTRReRFYwPtkHKwT_DPuCKbgCek0GjULN6_Dllj7" />
                                        <div className="absolute top-0 left-0 w-full h-1 bg-primary/30 shadow-[0_0_15px_rgba(46,105,255,0.5)] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <h3 className="text-xl font-bold text-text-main dark:text-white">امسح للاتصال</h3>
                                        <div className="flex items-center gap-2 text-sm text-text-sub dark:text-gray-400 bg-background-light dark:bg-background-dark px-3 py-1 rounded-full border border-border-light dark:border-border-dark">
                                            <span className="material-symbols-outlined text-base">timer</span>
                                            <span>تنتهي الصلاحية خلال: <span className="font-mono font-bold text-primary">00:42</span></span>
                                        </div>
                                    </div>
                                    <button className="flex items-center gap-2 text-primary hover:text-primary-hover font-medium text-sm transition-colors rounded-lg px-2 py-1">
                                        <span className="material-symbols-outlined">refresh</span>
                                        تحديث رمز QR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="flex flex-col items-center justify-center py-10 text-center max-w-2xl mx-auto">
                        <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-8 text-primary shadow-inner">
                            <span className="material-symbols-outlined text-4xl">download</span>
                        </div>
                        <h2 className="text-3xl font-bold text-text-main dark:text-white mb-4">تحميل إضافة الووردبريس</h2>
                        <p className="text-lg text-text-sub dark:text-gray-400 mb-10 leading-relaxed">
                            قم بتحميل إضافة <strong>Pengoo</strong> وتثبيتها على متجر ووردبريس الخاص بك لبدء عملية الربط التلقائي.
                        </p>
                        
                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark text-right">
                                <span className="flex items-center justify-center size-8 rounded-full bg-primary text-white font-bold text-sm mb-4">1</span>
                                <h3 className="font-bold text-text-main dark:text-white mb-2">حمل الإضافة</h3>
                                <p className="text-sm text-text-sub dark:text-gray-400">اضغط على زر التحميل للحصول على ملف الـ ZIP.</p>
                            </div>
                            <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-border-light dark:border-border-dark text-right">
                                <span className="flex items-center justify-center size-8 rounded-full bg-primary text-white font-bold text-sm mb-4">2</span>
                                <h3 className="font-bold text-text-main dark:text-white mb-2">ثبت الإضافة</h3>
                                <p className="text-sm text-text-sub dark:text-gray-400">توجه إلى إضافات {'>'} أضف جديد {'>'} رفع إضافة في ووردبريس.</p>
                            </div>
                        </div>

                        <a 
                            href="/pengoo-woocommerce-connector.zip" 
                            download
                            className="bg-primary hover:bg-primary-hover text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center gap-3 transform hover:-translate-y-1 active:scale-95 text-lg"
                        >
                            <span className="material-symbols-outlined">download</span>
                            تحميل الإضافة الآن (ZIP)
                        </a>
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl text-primary">construction</span>
                        </div>
                        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">{steps[currentStep - 1].title}</h2>
                        <p className="text-text-sub dark:text-gray-400 max-w-sm">هذه الصفحة قيد التطوير حالياً، يمكنك المتابعة للخطوة التالية أو التوجه مباشرة للوحة التحكم.</p>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark" dir="rtl">
            <header className="sticky top-0 z-50 w-full bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3 text-primary dark:text-blue-400">
                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-primary">link</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-text-main dark:text-white">بينجو <span className="text-sm font-medium text-text-sub dark:text-gray-400 opacity-60">Pengoo</span></h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 text-sm text-text-sub dark:text-gray-400 bg-background-light dark:bg-background-dark px-3 py-1.5 rounded-full border border-border-light dark:border-border-dark">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            النظام يعمل
                        </div>
                        <button onClick={handleSkip} className="flex items-center gap-2 text-text-sub hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors">
                            <span className="text-sm font-semibold">خروج</span>
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow flex flex-col items-center justify-start py-10 px-4 md:px-8">
                <div className="w-full max-w-[1024px] flex flex-col gap-8">
                    <div className="w-full bg-surface-light dark:bg-surface-dark rounded-xl p-6 shadow-sm border border-border-light dark:border-border-dark">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-lg font-bold text-text-main dark:text-white">إعداد الربط</span>
                            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">الخطوة {currentStep} من 6</span>
                        </div>

                        <div className="hidden md:flex items-center justify-between relative w-full pt-4 pb-8">
                            <div className="absolute top-1/2 left-0 right-0 h-1 bg-border-light dark:bg-border-dark -z-0 rounded-full"></div>
                            <div 
                                className="absolute top-1/2 right-0 h-1 bg-primary z-0 rounded-full transition-all duration-500" 
                                style={{ width: `${((currentStep - 1) / 5) * 100}%` }}
                            ></div>

                            {steps.map((step) => (
                                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2 group cursor-default">
                                    <div className={`size-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-white dark:ring-surface-dark transition-all duration-300 ${
                                        step.id < currentStep ? 'bg-primary text-white' : 
                                        step.id === currentStep ? 'bg-primary text-white scale-110' : 
                                        'bg-surface-light dark:bg-surface-dark border-2 border-border-light dark:border-gray-600 text-text-sub dark:text-gray-400'
                                    }`}>
                                        {step.id < currentStep ? <span className="material-symbols-outlined text-[18px]">check</span> : step.id}
                                    </div>
                                    <span className={`text-[10px] font-medium absolute -bottom-6 w-max ${step.id === currentStep ? 'text-primary font-bold' : 'text-text-sub dark:text-gray-400'}`}>
                                        {step.title}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="md:hidden w-full h-2 bg-border-light dark:bg-border-dark rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(currentStep / 6) * 100}%` }}></div>
                        </div>
                    </div>

                    <div className="min-h-[400px]">
                        {renderStepContent()}
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t border-border-light dark:border-border-dark mt-4 relative z-50">
                        <button 
                            onClick={handleBack}
                            disabled={currentStep === 1}
                            className="px-6 py-2.5 rounded-xl border border-border-light dark:border-border-dark text-text-sub dark:text-gray-300 font-medium hover:bg-background-light dark:hover:bg-background-dark transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="material-symbols-outlined text-[20px] rotate-180">arrow_forward</span>
                            السابق
                        </button>
                        <div className="flex gap-4">
                            <button 
                                onClick={handleSkip}
                                className="px-6 py-2.5 rounded-xl text-text-sub dark:text-gray-400 font-medium hover:text-text-main dark:hover:text-white transition-colors"
                            >
                                تخطي هذه الخطوة
                            </button>
                            <button 
                                onClick={handleNext}
                                className="bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center gap-2 transform active:scale-95"
                            >
                                {currentStep === 6 ? 'إنهاء' : 'التالي'}
                                <span className="material-symbols-outlined text-[20px] rotate-180">arrow_back</span>
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <style dangerouslySetInnerHTML={{ __html: "\n        @keyframes scan {\n            0% { top: 4%; opacity: 0; }\n            10% { opacity: 1; }\n            90% { opacity: 1; }\n            100% { top: 96%; opacity: 0; }\n        }\n    " }} />
        </div>
    );
}
