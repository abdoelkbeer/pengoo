'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PackagesManager({ initialPackages, initialSettings }: { initialPackages: any[], initialSettings: any }) {
    const router = useRouter();
    const [packages, setPackages] = useState(initialPackages);
    const [settings, setSettings] = useState(initialSettings || {
        billing_custom_enabled: true,
        billing_custom_title: 'شحن مرن مخصص',
        billing_custom_description: 'أدخل المبلغ بالدولار وسنقوم بحساب الرصيد.',
        billing_custom_rate: 100
    });

    const [activeTab, setActiveTab] = useState<'packages' | 'settings'>('packages');
    const [loading, setLoading] = useState(false);
    const [editingPkg, setEditingPkg] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        messages: 1000,
        price: 10,
        icon: 'star_outline',
        is_active: true,
        sort_order: 0
    });

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: settings.id,
                    data: {
                        billing_custom_enabled: settings.billing_custom_enabled,
                        billing_custom_title: settings.billing_custom_title,
                        billing_custom_description: settings.billing_custom_description,
                        billing_custom_rate: settings.billing_custom_rate
                    }
                })
            });

            if (res.ok) {
                alert('تم حفظ الإعدادات بنجاح');
                router.refresh();
            }
        } catch (error) {
            alert('حدث خطأ أثناء حفظ الإعدادات');
        } finally {
            setLoading(false);
        }
    };

    const openModal = (pkg: any = null) => {
        if (pkg) {
            setEditingPkg(pkg);
            setFormData({
                name: pkg.name,
                messages: pkg.messages,
                price: pkg.price,
                icon: pkg.icon || 'star_outline',
                is_active: pkg.is_active,
                sort_order: pkg.sort_order || 0
            });
        } else {
            setEditingPkg(null);
            setFormData({
                name: '',
                messages: 1000,
                price: 10,
                icon: 'star_outline',
                is_active: true,
                sort_order: packages.length + 1
            });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/admin/billing-packages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingPkg ? { id: editingPkg.id, ...formData } : formData)
            });

            if (res.ok) {
                router.refresh();
                setIsModalOpen(false);
                window.location.reload(); 
            }
        } catch (error) {
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/billing-packages?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                window.location.reload();
            }
        } catch (error) {
            alert('حدث خطأ أثناء الحذف');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-border-color gap-8">
                <button 
                    onClick={() => setActiveTab('packages')}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'packages' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`}
                >
                    باقات الشحن الثابتة
                    {activeTab === 'packages' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></span>}
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'settings' ? 'text-primary' : 'text-text-sub hover:text-text-main'}`}
                >
                    إعدادات الشحن المخصص (اليدوي)
                    {activeTab === 'settings' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"></span>}
                </button>
            </div>

            {activeTab === 'packages' ? (
                <>
                    <div className="flex justify-end">
                        <button 
                            onClick={() => openModal()}
                            className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined">add</span>
                            إضافة باقة جديدة
                        </button>
                    </div>

                    <div className="bg-white border border-border-color rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-separate border-spacing-0">
                                <thead className="bg-gray-50/50 text-text-sub text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-border-color">الاسم</th>
                                        <th className="px-6 py-4 border-b border-border-color text-center">الرسائل</th>
                                        <th className="px-6 py-4 border-b border-border-color text-center">السعر ($)</th>
                                        <th className="px-6 py-4 border-b border-border-color text-center">الحالة</th>
                                        <th className="px-6 py-4 border-b border-border-color text-center">الترتيب</th>
                                        <th className="px-6 py-4 border-b border-border-color">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-color/50">
                                    {packages.map((pkg) => (
                                        <tr key={pkg.id} className="hover:bg-primary/5 transition-colors group text-sm font-medium">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="material-symbols-outlined text-slate-400">{pkg.icon || 'star_outline'}</span>
                                                    {pkg.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">{pkg.messages.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-center font-bold font-mono">${pkg.price}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black border ${pkg.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                                                    {pkg.is_active ? 'نشطة' : 'متوقفة'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">{pkg.sort_order}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openModal(pkg)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">edit</span>
                                                    </button>
                                                    <button onClick={() => handleDelete(pkg.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <form onSubmit={handleSaveSettings} className="bg-white border border-border-color rounded-3xl p-8 shadow-sm space-y-6 max-w-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">عنوان قسم الشحن المخصص</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-base"
                                value={settings.billing_custom_title}
                                onChange={e => setSettings({...settings, billing_custom_title: e.target.value})}
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">وصف الشحن المخصص (الكلام المكتوب)</label>
                            <textarea 
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-base"
                                value={settings.billing_custom_description}
                                onChange={e => setSettings({...settings, billing_custom_description: e.target.value})}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">معدل الشحن (رسالة لكل 1 دولار)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">رسالة</span>
                                <input 
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none text-base font-bold"
                                    value={settings.billing_custom_rate}
                                    onChange={e => setSettings({...settings, billing_custom_rate: parseInt(e.target.value)})}
                                    required
                                    min="1"
                                />
                            </div>
                            <p className="mt-2 text-xs text-text-sub">مثلاً: 100 تعني أن كل دولار يشحن للمستخدم 100 رسالة.</p>
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                            <div className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={settings.billing_custom_enabled}
                                    onChange={e => setSettings({...settings, billing_custom_enabled: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                            <span className="text-sm font-bold text-slate-700">تفعيل الشحن المخصص للمستخدمين</span>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                        <button 
                            type="submit" disabled={loading}
                            className="bg-primary text-white px-10 py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
                        >
                            {loading ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                        </button>
                    </div>
                </form>
            )}

            {/* Modal for Packages */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-slate-800">{editingPkg ? 'تعديل الباقة' : 'باقة جديدة'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="material-symbols-outlined text-gray-400 hover:text-gray-600">close</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">اسم الباقة</label>
                                <input 
                                    type="text" required
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">عدد الرسائل</label>
                                    <input 
                                        type="number" required min="1"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.messages}
                                        onChange={e => setFormData({...formData, messages: parseInt(e.target.value)})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">السعر ($)</label>
                                    <input 
                                        type="number" required min="0" step="0.01"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">الأيقونة (Material Symbol)</label>
                                    <input 
                                        type="text"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.icon}
                                        onChange={e => setFormData({...formData, icon: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">الترتيب</label>
                                    <input 
                                        type="number"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary outline-none"
                                        value={formData.sort_order}
                                        onChange={e => setFormData({...formData, sort_order: parseInt(e.target.value)})}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 py-2">
                                <input 
                                    type="checkbox" id="is_active"
                                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-slate-700">باقة نشطة (تظهر للمستخدمين)</label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="submit" disabled={loading}
                                    className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'جاري الحفظ...' : 'حفظ الباقة'}
                                </button>
                                <button
                                    type="button" onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-gray-100 transition-colors"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
