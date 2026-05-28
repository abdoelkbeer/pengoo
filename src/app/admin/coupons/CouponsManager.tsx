'use client';

import React, { useState, useEffect } from 'react';
import { formatCurrency } from '@/utils/format';

type Coupon = {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    is_active: boolean;
    expires_at: string | null;
    max_usages: number | null;
    used_count: number;
    created_at: string;
};

type CouponStats = {
    active_users: number;
    mrr: number;
    total_revenue: number;
};

export default function CouponsManager() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [stats, setStats] = useState<Record<string, CouponStats>>({});
    const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
    const [viewingStats, setViewingStats] = useState<Coupon | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const fetchCouponsAndStats = async () => {
        try {
            const [couponsRes, statsRes] = await Promise.all([
                fetch('/api/admin/coupons'),
                fetch('/api/admin/coupons/stats')
            ]);
            
            const couponsData = await couponsRes.json();
            const statsData = await statsRes.json();
            
            if (couponsData.success) setCoupons(couponsData.data);
            if (statsData.success) setStats(statsData.stats);
        } catch (error) {
            console.error('Failed to fetch coupons data:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        fetchCouponsAndStats();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const action = editingCoupon?.id ? 'update' : 'create';
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, data: editingCoupon, id: editingCoupon?.id })
            });
            const result = await res.json();
            if (result.success) {
                setEditingCoupon(null);
                fetchCouponsAndStats();
            } else {
                alert('خطأ: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('حدث خطأ');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete', id })
            });
            const result = await res.json();
            if (result.success) {
                fetchCouponsAndStats();
            } else {
                alert('فشل الحذف');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getEmptyCoupon = (): Partial<Coupon> => ({
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        is_active: true,
        expires_at: null,
        max_usages: null
    });

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center p-20">
                <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-border-color shadow-sm text-right">
                <div>
                    <h3 className="text-xl font-bold">إدارة وإحصائيات الكوبونات</h3>
                    <p className="text-sm text-text-sub mt-1">تتبع أداء حملاتك التسويقية الكوبونات الخاصة بك.</p>
                </div>
                <button
                    onClick={() => setEditingCoupon(getEmptyCoupon())}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    إضافة كوبون جديد
                </button>
            </div>

            <div className="bg-white border border-border-color rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-separate border-spacing-0">
                        <thead className="bg-gray-50/50 text-text-sub text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b border-border-color">الكود</th>
                                <th className="px-6 py-4 border-b border-border-color">الخصم</th>
                                <th className="px-6 py-4 border-b border-border-color text-center">المشتركين النشطين</th>
                                <th className="px-6 py-4 border-b border-border-color text-left">الدخل الشهري (MRR)</th>
                                <th className="px-6 py-4 border-b border-border-color text-left">إجمالي الأرباح</th>
                                <th className="px-6 py-4 border-b border-border-color text-center">مرات الاستخدام</th>
                                <th className="px-6 py-4 border-b border-border-color">تاريخ الانتهاء</th>
                                <th className="px-6 py-4 border-b border-border-color text-center">الحالة</th>
                                <th className="px-6 py-4 border-b border-border-color">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color/50">
                            {coupons.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-text-sub opacity-50 font-bold">
                                        لا توجد كوبونات مضافة حالياً
                                    </td>
                                </tr>
                            ) : (
                                coupons.map((coupon) => {
                                    const cStats = stats[coupon.id] || { active_users: 0, mrr: 0, total_revenue: 0 };
                                    return (
                                        <tr key={coupon.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-primary text-sm font-bold">{coupon.code}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-text-main">
                                                    {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} ${formatCurrency('EGP')}`}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 w-8 h-8 rounded-full text-xs font-bold">
                                                    {cStats.active_users}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                    {cStats.mrr} {formatCurrency('EGP')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                                                    {cStats.total_revenue} {formatCurrency('EGP')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs text-text-sub font-medium">
                                                    {coupon.used_count} / {coupon.max_usages || '∞'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-text-sub">
                                                {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString('ar-EG') : 'دائم'}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${coupon.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                    {coupon.is_active ? 'نشط' : 'معطل'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2 justify-end">
                                                <button onClick={() => setViewingStats(coupon)} title="عرض الإحصائيات" className="p-1.5 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                                                    <span className="material-symbols-outlined text-sm">analytics</span>
                                                </button>
                                                <button onClick={() => setEditingCoupon(coupon)} title="تعديل الكوبون" className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </button>
                                                <button onClick={() => handleDelete(coupon.id)} title="حذف الكوبون" className="p-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100">
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Editing Modal */}
            {editingCoupon && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-fadeIn">
                        <div className="p-6 border-b border-border-color flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-black text-xl">{editingCoupon.id ? 'تعديل الكوبون' : 'إضافة كوبون جديد'}</h3>
                            <button onClick={() => setEditingCoupon(null)} className="text-gray-400 hover:text-black transition-colors rounded-full p-1 hover:bg-gray-200">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-8 space-y-6 text-right" dir="rtl">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-text-main">كود الخصم</label>
                                <input required type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all font-mono uppercase"
                                    value={editingCoupon.code} onChange={e => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })} placeholder="SUMMER2025" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-text-main">نوع الخصم</label>
                                    <select className="h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none"
                                        value={editingCoupon.discount_type} onChange={e => setEditingCoupon({ ...editingCoupon, discount_type: e.target.value as any })}>
                                        <option value="percentage">نسبة مئوية (%)</option>
                                        <option value="fixed">قيمة ثابتة (مبلغ)</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-text-main">قيمة الخصم</label>
                                    <input required type="number" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none"
                                        value={editingCoupon.discount_value} onChange={e => setEditingCoupon({ ...editingCoupon, discount_value: parseFloat(e.target.value) })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-text-main">أقصى عدد مرات استخدام</label>
                                    <input type="number" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none"
                                        value={editingCoupon.max_usages || ''} onChange={e => setEditingCoupon({ ...editingCoupon, max_usages: e.target.value ? parseInt(e.target.value) : null })} placeholder="غير محدود" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-text-main">تاريخ الانتهاء</label>
                                    <input type="date" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none"
                                        value={editingCoupon.expires_at ? editingCoupon.expires_at.split('T')[0] : ''} onChange={e => setEditingCoupon({ ...editingCoupon, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                                </div>
                            </div>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" className="w-6 h-6 accent-primary rounded-lg cursor-pointer transition-all"
                                    checked={editingCoupon.is_active} onChange={e => setEditingCoupon({ ...editingCoupon, is_active: e.target.checked })} />
                                <span className="text-sm font-bold text-text-main">تفعيل الكوبون</span>
                            </label>

                            <div className="flex gap-4 justify-end pt-6 border-t border-border-color">
                                <button type="button" onClick={() => setEditingCoupon(null)} className="px-8 py-3 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all">إلغاء</button>
                                <button disabled={loading} type="submit" className="px-10 py-3 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 disabled:opacity-50">
                                    {loading ? 'جاري الحفظ...' : 'حفظ الكوبون'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stats Modal */}
            {viewingStats && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-fadeIn overflow-hidden">
                        <div className="p-6 border-b border-border-color flex justify-between items-center bg-indigo-600 text-white">
                            <div>
                                <h3 className="font-black text-xl flex items-center gap-2">
                                    <span className="material-symbols-outlined">monitoring</span>
                                    إحصائيات الكوبون
                                </h3>
                                <p className="text-sm text-indigo-100 mt-1 font-mono">{viewingStats.code}</p>
                            </div>
                            <button onClick={() => setViewingStats(null)} className="text-indigo-200 hover:text-white transition-colors rounded-full p-1 bg-indigo-700 hover:bg-indigo-800">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-8 text-right bg-gray-50" dir="rtl">
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div className="bg-white p-6 rounded-2xl border border-border-color shadow-sm flex flex-col items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-4xl text-blue-500 bg-blue-50 p-3 rounded-full">group</span>
                                    <span className="text-text-sub text-sm font-bold">المشتركين النشطين</span>
                                    <span className="text-3xl font-black text-text-main">
                                        {stats[viewingStats.id]?.active_users || 0}
                                    </span>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-border-color shadow-sm flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-full h-1 bg-emerald-500"></div>
                                    <span className="material-symbols-outlined text-4xl text-emerald-500 bg-emerald-50 p-3 rounded-full">payments</span>
                                    <span className="text-text-sub text-sm font-bold">الدخل الشهري المستمر</span>
                                    <span className="text-2xl font-black text-emerald-600">
                                        {stats[viewingStats.id]?.mrr || 0} <span className="text-sm">{formatCurrency('EGP')}</span>
                                    </span>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-border-color shadow-sm flex flex-col items-center justify-center gap-2">
                                    <span className="material-symbols-outlined text-4xl text-indigo-500 bg-indigo-50 p-3 rounded-full">account_balance_wallet</span>
                                    <span className="text-text-sub text-sm font-bold">إجمالي الأرباح الكلية</span>
                                    <span className="text-2xl font-black text-indigo-600">
                                        {stats[viewingStats.id]?.total_revenue || 0} <span className="text-sm">{formatCurrency('EGP')}</span>
                                    </span>
                                </div>
                            </div>
                            
                            <div className="bg-white p-6 rounded-2xl border border-border-color shadow-sm">
                                <h4 className="font-bold mb-4 border-b border-border-color pb-2">تفاصيل الكوبون الأساسية</h4>
                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
                                        <span className="text-text-sub">قيمة الخصم:</span>
                                        <span className="font-bold">{viewingStats.discount_type === 'percentage' ? `${viewingStats.discount_value}%` : `${viewingStats.discount_value} ${formatCurrency('EGP')}`}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dashed border-gray-200 pb-2 pr-4">
                                        <span className="text-text-sub">الاستخدامات الكلية:</span>
                                        <span className="font-bold">{viewingStats.used_count} من {viewingStats.max_usages || 'غير محدود'}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
                                        <span className="text-text-sub">تاريخ الإنشاء:</span>
                                        <span className="font-bold">{new Date(viewingStats.created_at).toLocaleDateString('ar-EG')}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-dashed border-gray-200 pb-2 pr-4">
                                        <span className="text-text-sub">تاريخ الانتهاء:</span>
                                        <span className="font-bold">{viewingStats.expires_at ? new Date(viewingStats.expires_at).toLocaleDateString('ar-EG') : 'مفتوح / دائم'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
