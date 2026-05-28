'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/utils/format';


interface Plan {
    id: string;
    name: string;
    slug: string;
    description: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
    max_stores: number;
    max_messages: number;
    intro_price_monthly?: number;
    intro_price_yearly?: number;
    intro_period_months?: number;
    original_price_monthly?: number;
    original_price_yearly?: number;
    max_whatsapp_numbers: number;
    meta_api_enabled: boolean;
}

interface Props {
    plans: Plan[];
    currentPlanSlug: string;
    defaultBillingCycle: string;
    currency?: string;
    // Assuming currentSubscription is passed as a prop or derived elsewhere
    // For this change, we'll assume it's available in the scope where the button logic is applied.
    currentSubscription?: {
        plan_id: string;
        status: string;
    };
}

export default function PlansList({ plans, currentPlanSlug, defaultBillingCycle, currency, currentSubscription }: Props) {
    const [billingCycle, setBillingCycle] = useState<'yearly'>('yearly');
    const [loading, setLoading] = useState<string | null>(null);
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState<{ type: string, value: number, id: string } | null>(null);
    const [couponError, setCouponError] = useState('');
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    const handleValidateCoupon = async () => {
        if (!couponCode) return;
        setValidatingCoupon(true);
        setCouponError('');
        try {
            const res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'validate_coupon', couponCode })
            });
            // Note: I'll need to update checkout API to handle 'validate_coupon' action or create a separate one.
            // For now, let's assume a dedicated endpoint is better or just handle it in checkout.
            const data = await res.json();
            if (data.discount) {
                setCouponDiscount(data.discount);
                setCouponError('');
            } else if (data.error) {
                setCouponError(data.error);
                setCouponDiscount(null);
            }
        } catch (e) {
            setCouponError('كود غير صالح');
            setCouponDiscount(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleSubscribe = async (plan: Plan) => {
        setLoading(plan.id);
        try {
            const res = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: plan.id,
                    billingCycle,
                    couponCode: couponCode || undefined
                })
            });
            const data = await res.json();
            
            if (data.url) {
                // Forward to payment gateway
                window.location.href = data.url;
            } else {
                alert('حدث خطأ أثناء بدء عملية الدفع: ' + (typeof data.error === 'string' ? data.error : JSON.stringify(data.error) || 'Unknown error'));
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('فشل الاتصال بخادم الدفع');
        } finally {
            setLoading(null);
        }
    };

    if (!plans || plans.length === 0) {
        return <div className="text-center py-12 text-slate-500">لا توجد باقات متاحة حالياً.</div>;
    }

    return (
        <>
            {/* Billing Toggle */}
            {/* Billing Cycle fixed to Yearly */}

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isCurrent = plan.slug === currentPlanSlug;
                    const isPopular = plan.slug === 'pro';
                    const price = Number(plan.price_yearly);
                    const monthlyEquiv = Math.round(Number(plan.price_yearly) / 12);

                    return (
                        <div
                            key={plan.id}
                            className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col transition-all hover:shadow-lg ${isPopular ? 'border-primary shadow-lg shadow-primary/10 scale-[1.02]' :
                                isCurrent ? 'border-green-200 bg-green-50/30' :
                                    'border-slate-100'
                                }`}
                        >
                            {isPopular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm">
                                    الأكثر شيوعاً
                                </div>
                            )}
                            {isCurrent && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-sm flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                    باقتك الحالية
                                </div>
                            )}
                            <div className="mb-6 pt-2">
                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
                            </div>
                            <div className="flex flex-col items-center mb-6 w-full">
                                {(() => {
                                    const hasIntro = plan.intro_price_yearly !== undefined && plan.intro_price_yearly > 0;
                                    const displayPrice = hasIntro ? plan.intro_price_yearly : plan.price_yearly;
                                    const renewalPrice = hasIntro ? plan.price_yearly : (plan.original_price_yearly || null);

                                    if (price === 0) {
                                        return <span className="text-4xl font-black text-slate-900">مجاني</span>;
                                    }

                                    return (
                                        <>
                                            {renewalPrice && (
                                                <div className="flex items-center justify-center gap-2 mb-1 w-full relative">
                                                    <span className="text-sm line-through decoration-red-500 decoration-2 font-bold text-slate-400">
                                                        {renewalPrice} {formatCurrency(currency)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-baseline justify-center gap-2">
                                                <span className="text-5xl font-black text-primary tracking-tighter">
                                                    {displayPrice}
                                                </span>
                                                <div className="flex flex-col items-start translate-y-[-2px]">
                                                    <span className="text-slate-900 font-bold text-sm leading-none">{formatCurrency(currency)}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-1">
                                                <span className={hasIntro ? "text-slate-600 font-bold text-xs bg-slate-100 px-3 py-1 rounded-full whitespace-nowrap" : "text-slate-400 font-medium text-[10px] uppercase"}>
                                                    {hasIntro ? 'أول سنة' : 'سنوياً'}
                                                </span>
                                            </div>

                                            {price > 0 && !hasIntro && (
                                                <p className="text-[11px] text-slate-400 mt-2">يتم الفوترة سنوياً فقط.</p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                            <div className="flex-1 space-y-3 mb-6">
                                {plan.features?.map((feature: string, i: number) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span>
                                        <span className="text-sm text-slate-700">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 space-y-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="كود الخصم؟"
                                        className="w-full h-10 px-4 py-2 text-sm border border-slate-200 rounded-xl bg-gray-50 focus:border-primary outline-none transition-all uppercase placeholder:normal-case font-bold"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-lg">confirmation_number</span>
                                </div>

                                {(() => {
                                    const isCurrentSlug = currentPlanSlug === plan.slug;
                                    const isFree = plan.slug === 'free' || plan.price_monthly === 0;

                                    // Determine plan index/order for comparison (Free < Pro < Enterprise/المؤسسات)
                                    const getPlanIndex = (slug: string) => {
                                        if (!slug) return 0;
                                        if (slug === 'free') return 0;
                                        if (slug === 'pro') return 1;
                                        if (slug.includes('enterprise') || slug === 'المؤسسات') return 2;
                                        return 1; // Default
                                    };

                                    const currentOrder = getPlanIndex(currentPlanSlug);
                                    const thisOrder = getPlanIndex(plan.slug);

                                    let buttonText = 'اشترك الآن';
                                    let isDisabled = loading !== null;

                                     if (isCurrentSlug) {
                                        buttonText = 'باقتك الحالية';
                                        isDisabled = true;
                                    } else if (isFree) {
                                        buttonText = 'المستوى الحالي';
                                        isDisabled = true;
                                    }

                                    return (
                                        <button
                                            onClick={() => handleSubscribe(plan)}
                                            disabled={isDisabled}
                                            className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl ${isCurrentSlug
                                                    ? 'bg-green-100 text-green-700 border border-green-200 cursor-default shadow-none'
                                                    : isDisabled && isFree
                                                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed shadow-none'
                                                        : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]'
                                                }`}
                                        >
                                            {loading === plan.id ? (
                                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                            ) : (
                                                <>
                                                    {isCurrentSlug && <span className="material-symbols-outlined">check_circle</span>}
                                                    {buttonText}
                                                </>
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
