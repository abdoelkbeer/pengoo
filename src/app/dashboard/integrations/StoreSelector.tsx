// @ts-nocheck
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

const PLATFORMS = [
    {
        id: 'woocommerce',
        name: 'WooCommerce',
        nameAr: 'ووكومرس',
        description: 'متاجر ووردبريس',
        icon: 'shopping_bag',
        color: '#7B61FF',
        bgGradient: 'from-purple-500/10 to-purple-600/5',
        borderColor: 'border-purple-200/60 hover:border-purple-400',
        iconBg: 'bg-purple-500',
        href: '/dashboard/integrations/woocommerce',
        comingSoon: false,
    },
    {
        id: 'easyorder',
        name: 'EasyOrder',
        nameAr: 'إيزي أوردر',
        description: 'منصة إيزي أوردر',
        icon: 'receipt_long',
        color: '#3B82F6',
        bgGradient: 'from-blue-500/10 to-blue-600/5',
        borderColor: 'border-blue-200/60',
        iconBg: 'bg-blue-500',
        href: '#',
        comingSoon: true,
    },
    {
        id: 'shopify',
        name: 'Shopify',
        nameAr: 'شوبيفاي',
        description: 'متاجر شوبيفاي',
        icon: 'storefront',
        color: '#96bf48',
        bgGradient: 'from-green-500/10 to-green-600/5',
        borderColor: 'border-green-200/60',
        iconBg: 'bg-[#96bf48]',
        href: '#',
        comingSoon: true,
    },
    {
        id: 'salla',
        name: 'Salla',
        nameAr: 'سلة',
        description: 'منصة سلة السعودية',
        icon: 'shopping_cart',
        color: '#5756C5',
        bgGradient: 'from-indigo-500/10 to-indigo-600/5',
        borderColor: 'border-indigo-200/60',
        iconBg: 'bg-[#5756C5]',
        href: '#',
        comingSoon: true,
    },
];

export default function StoreSelector({ stores }: { stores: any[] }) {
    const router = useRouter();

    const getStoreStatus = (platformId: string) => {
        return stores.find(s => s.store_type === platformId && s.is_active);
    };

    const connectedStores = stores.filter(s => s.is_active);

    const formatDate = (dateString: string) => {
        if (!dateString) return '—';
        try {
            return new Date(dateString).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return '—';
        }
    };

    const getPlatformLabel = (storeType: string) => {
        const p = PLATFORMS.find(p => p.id === storeType);
        return p ? p.nameAr : storeType;
    };

    const getPlatformColor = (storeType: string) => {
        const p = PLATFORMS.find(p => p.id === storeType);
        return p ? p.color : '#6B7280';
    };

    return (
        <div className="flex flex-col gap-10">
            {/* Platform Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {PLATFORMS.map((platform) => {
                    const connectedStore = getStoreStatus(platform.id);
                    const isConnected = !!connectedStore;
                    const isComingSoon = platform.comingSoon;

                    return (
                        <button
                            key={platform.id}
                            onClick={() => !isComingSoon && router.push(platform.href)}
                            disabled={isComingSoon}
                            className={`group relative bg-gradient-to-br ${platform.bgGradient} bg-white rounded-2xl border-2 ${platform.borderColor} p-6 text-right transition-all duration-300 ${
                                isComingSoon
                                    ? 'opacity-75 cursor-not-allowed'
                                    : 'hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-0.5 active:scale-[0.98]'
                            }`}
                        >
                            {/* Status Badge */}
                            <div className="absolute top-4 left-4">
                                {isComingSoon ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-200">
                                        <span className="material-symbols-outlined text-xs">schedule</span>
                                        قريباً
                                    </span>
                                ) : isConnected ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-black rounded-full border border-green-200">
                                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                        متصل
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold rounded-full border border-slate-200">
                                        غير متصل
                                    </span>
                                )}
                            </div>

                            {/* Icon */}
                            <div className={`w-14 h-14 ${platform.iconBg} rounded-2xl flex items-center justify-center mb-4 shadow-lg ${!isComingSoon ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
                                <span className="material-symbols-outlined text-white text-3xl">{platform.icon}</span>
                            </div>

                            {/* Info */}
                            <h3 className="text-lg font-black text-slate-900 mb-1">{platform.nameAr}</h3>
                            <p className="text-xs text-slate-500 mb-3">{platform.description}</p>

                            {/* CTA */}
                            <div className={`flex items-center gap-2 text-xs font-bold transition-colors ${
                                isComingSoon
                                    ? 'text-amber-500'
                                    : 'text-slate-400 group-hover:text-primary'
                            }`}>
                                <span>
                                    {isComingSoon
                                        ? 'سيتوفر قريباً'
                                        : isConnected
                                            ? 'إدارة الإعدادات'
                                            : 'ابدأ الربط'
                                    }
                                </span>
                                {!isComingSoon && (
                                    <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                                )}
                            </div>

                            {/* Connected Store URL */}
                            {isConnected && connectedStore.store_url && (
                                <div className="mt-3 pt-3 border-t border-green-100">
                                    <p className="text-[10px] text-green-600 font-mono truncate" dir="ltr">
                                        {connectedStore.store_url}
                                    </p>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* Connected Stores Table                         */}
            {/* ═══════════════════════════════════════════════ */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Section Header */}
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-xl">hub</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900">المتاجر المربوطة</h2>
                            <p className="text-xs text-slate-400">إدارة ومتابعة جميع متاجرك المتصلة</p>
                        </div>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-sm font-bold px-3 py-1.5 rounded-full">
                        {connectedStores.length} متجر
                    </span>
                </div>

                {/* Table or Empty State */}
                {connectedStores.length === 0 ? (
                    <div className="px-6 py-14 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-slate-300 text-3xl">link_off</span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-600 mb-1">لا توجد متاجر مربوطة حالياً</h3>
                        <p className="text-xs text-slate-400 max-w-xs">اختر منصة من الأعلى واتبع خطوات الربط لبدء أتمتة رسائل واتساب</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/80">
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">المتجر</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">المنصة</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider">تاريخ الربط</th>
                                    <th className="px-6 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {connectedStores.map((store) => (
                                    <tr key={store.id} className="hover:bg-slate-50/60 transition-colors">
                                        {/* Store URL */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: getPlatformColor(store.store_type) + '15' }}>
                                                    <span className="material-symbols-outlined text-lg" style={{ color: getPlatformColor(store.store_type) }}>store</span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-slate-800 truncate max-w-[220px]" dir="ltr">
                                                        {store.store_url || '—'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-mono" dir="ltr">ID: {store.id?.substring(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Platform */}
                                        <td className="px-6 py-4">
                                            <span
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border"
                                                style={{
                                                    backgroundColor: getPlatformColor(store.store_type) + '10',
                                                    color: getPlatformColor(store.store_type),
                                                    borderColor: getPlatformColor(store.store_type) + '25',
                                                }}
                                            >
                                                {getPlatformLabel(store.store_type)}
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            {store.is_active ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200">
                                                    <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                                    متصل
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-200">
                                                    <span className="size-1.5 rounded-full bg-red-400"></span>
                                                    غير متصل
                                                </span>
                                            )}
                                        </td>

                                        {/* Date */}
                                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                            {formatDate(store.created_at)}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => router.push(`/dashboard/integrations/${store.store_type}`)}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold hover:bg-primary/20 transition-colors"
                                                    title="إدارة الإعدادات"
                                                >
                                                    <span className="material-symbols-outlined text-sm">settings</span>
                                                    إدارة
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm('هل أنت متأكد من قطع اتصال هذا المتجر؟')) return;
                                                        const { createClient } = await import('@/utils/supabase/client');
                                                        const supabase = createClient();
                                                        await supabase.from('stores').delete().eq('id', store.id);
                                                        window.location.reload();
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors border border-red-100"
                                                    title="قطع الاتصال"
                                                >
                                                    <span className="material-symbols-outlined text-sm">link_off</span>
                                                    قطع
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
