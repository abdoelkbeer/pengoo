'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';

const platforms = [
    { id: 'woocommerce', label: 'WooCommerce', labelAr: 'ووكومرس', icon: 'shopping_bag', href: '/dashboard/integrations/woocommerce', color: '#7B61FF' },
    { id: 'easyorder', label: 'EasyOrder', labelAr: 'إيزي أوردر', icon: 'receipt_long', href: '#', color: '#3B82F6' },
    { id: 'shopify', label: 'Shopify', labelAr: 'شوبيفاي', icon: 'storefront', href: '#', color: '#96bf48' },
    { id: 'salla', label: 'سلة', labelAr: 'سلة', icon: 'shopping_cart', href: '#', color: '#5756C5' },
];

export default function IntegrationsTabs() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
            {/* Back to store selection */}
            <button
                onClick={() => router.push('/dashboard/integrations')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-primary hover:bg-primary/5 transition-all"
            >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                كل المتاجر
            </button>

            <div className="h-6 w-px bg-slate-200"></div>

            {/* Platform Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
                {platforms.map((platform) => {
                    const isActive = pathname.startsWith(platform.href) && platform.href !== '#';
                    const isComingSoon = platform.href === '#';
                    return (
                        <button
                            key={platform.id}
                            onClick={() => !isComingSoon && router.push(platform.href)}
                            disabled={isComingSoon}
                            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${isActive
                                ? 'bg-white text-slate-900 shadow-sm'
                                : isComingSoon
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg" style={isActive ? { color: platform.color } : {}}>{platform.icon}</span>
                            <span className="hidden sm:inline">{platform.label}</span>
                            {isComingSoon && (
                                <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full font-bold hidden sm:inline">قريباً</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
