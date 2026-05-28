'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

interface OnboardingStep {
    id: number;
    title: string;
    description: string;
    icon: string;
    href: string;
    isDone: boolean;
}

interface OnboardingWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: (completed: boolean) => void;
    user: any;
}

export default function OnboardingWizard({ isOpen, onClose, onComplete, user }: OnboardingWizardProps) {
    const [steps, setSteps] = useState<OnboardingStep[]>([
        { id: 1, title: 'ربط رقم واتساب', description: 'قم بربط رقم هاتفك لبدء إرسال الرسائل التلقائية.', icon: 'chat', href: '/dashboard/connections', isDone: false },
        { id: 2, title: 'ربط المتجر', description: 'اربط متجر ووكومرس الخاص بك لمزامنة الطلبات والسلال.', icon: 'storefront', href: '/dashboard/integrations/woocommerce', isDone: false },
        { id: 3, title: 'إعداد الرسائل', description: 'قم بتفعيل أول رسالة تلقائية لعملائك.', icon: 'notifications_active', href: '/dashboard/notifications/create', isDone: false },
    ]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    const supabase = createClient();

    useEffect(() => {
        checkProgress();
    }, [isOpen]);

    const checkProgress = async () => {
        setLoading(true);
        try {
            // Check WhatsApp
            const { count: activeConnections } = await supabase
                .from('whatsapp_connections')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user?.id)
                .eq('status', 'CONNECTED');

            // Check Store
            const { count: activeStores } = await supabase
                .from('stores')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user?.id)
                .eq('is_active', true);

            // Check Rules
            const { count: notificationsCount } = await supabase
                .from('notification_rules')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user?.id);

            const updatedSteps = [...steps];
            updatedSteps[0].isDone = (activeConnections || 0) > 0;
            updatedSteps[1].isDone = (activeStores || 0) > 0;
            updatedSteps[2].isDone = (notificationsCount || 0) > 0;

            const allDone = updatedSteps.every(s => s.isDone);
            if (onComplete) onComplete(allDone);

            // Find first incomplete step
            const firstIncomplete = updatedSteps.findIndex(s => !s.isDone);
            if (firstIncomplete !== -1) {
                setCurrentStepIndex(firstIncomplete);
            } else {
                setCurrentStepIndex(updatedSteps.length - 1);
            }
        } catch (error) {
            console.error('Error checking onboarding progress:', error);
        } finally {
            setLoading(false);
        }
    };

    const currentStep = steps[currentStepIndex];
    const progress = Math.round((steps.filter(s => s.isDone).length / steps.length) * 100);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.1, rotate: -10, x: 300, y: 400 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0, rotate: 10, x: 300, y: 400, transition: { duration: 0.4, ease: "backIn" } }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 120,
                            opacity: { duration: 0.2 }
                        }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative border border-slate-100"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-10"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="flex flex-col md:flex-row h-full">
                            {/* Left Sidebar (Progress) */}
                            <div className="w-full md:w-64 bg-slate-50 p-8 border-l border-slate-100 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-8 text-primary overflow-hidden">
                                        <motion.span
                                            animate={{
                                                y: [0, -4, 0],
                                                rotate: [0, 5, 0]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            className="material-symbols-outlined text-3xl font-bold"
                                        >
                                            rocket_launch
                                        </motion.span>
                                        <h2 className="text-xl font-black tracking-tight">إعداد المنصة</h2>
                                    </div>

                                    <div className="space-y-6">
                                        {steps.map((step, idx) => (
                                            <div key={step.id} className="flex items-start gap-3 relative">
                                                {idx < steps.length - 1 && (
                                                    <div className={`absolute top-8 right-4 w-0.5 h-10 ${idx < currentStepIndex ? 'bg-primary' : 'bg-slate-200'}`}></div>
                                                )}
                                                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${step.isDone ? 'bg-green-500 text-white shadow-lg shadow-green-200' :
                                                    idx === currentStepIndex ? 'bg-primary text-white shadow-lg shadow-blue-200 ring-4 ring-primary/20' :
                                                        'bg-slate-200 text-slate-500'
                                                    }`}>
                                                    {step.isDone ? (
                                                        <span className="material-symbols-outlined text-[18px]">check</span>
                                                    ) : (
                                                        <span className="text-xs font-bold">{step.id}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold transition-colors ${idx === currentStepIndex ? 'text-primary' : 'text-slate-600'}`}>
                                                        {step.title}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{step.isDone ? 'مكتمل' : 'قيد الانتظار'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-500">الإنجاز</span>
                                        <span className="text-xs font-black text-primary">{progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Right Content */}
                            <div className="flex-1 p-8 flex flex-col justify-center min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentStepIndex}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6 text-center md:text-right"
                                    >
                                        <div className="inline-flex items-center justify-center size-20 rounded-3xl bg-primary/10 text-primary mb-2">
                                            <span className="material-symbols-outlined text-4xl">{currentStep?.icon}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-2xl font-black text-slate-900">{currentStep?.title}</h3>
                                            <p className="text-slate-500 leading-relaxed max-w-sm mx-auto md:mx-0">
                                                {currentStep?.description}
                                            </p>
                                        </div>

                                        <div className="pt-4 flex flex-col gap-3">
                                            {currentStep?.isDone ? (
                                                <div className="bg-green-50 text-green-700 p-4 rounded-2xl border border-green-100 flex items-center justify-center gap-2">
                                                    <span className="material-symbols-outlined">check_circle</span>
                                                    <span className="font-bold">لقد أكملت هذه الخطوة بنجاح!</span>
                                                </div>
                                            ) : (
                                                <a
                                                    href={currentStep?.href}
                                                    className="bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    البدء الآن
                                                    <span className="material-symbols-outlined">arrow_back</span>
                                                </a>
                                            )}

                                            <div className="flex items-center justify-between gap-4 mt-6">
                                                <button
                                                    disabled={currentStepIndex === 0}
                                                    onClick={() => setCurrentStepIndex(prev => prev - 1)}
                                                    className="text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-medium transform"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                                    السابق
                                                </button>
                                                <div className="flex gap-1.5">
                                                    {steps.map((_, i) => (
                                                        <div key={i} className={`size-1.5 rounded-full transition-all ${i === currentStepIndex ? 'w-6 bg-primary' : 'bg-slate-200'}`} />
                                                    ))}
                                                </div>
                                                <button
                                                    disabled={currentStepIndex === steps.length - 1}
                                                    onClick={() => setCurrentStepIndex(prev => prev + 1)}
                                                    className="text-primary hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 font-bold"
                                                >
                                                    التالي
                                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
