'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

type TabType = 'services' | 'packages' | 'faqs';

export default function AdminLandingPage() {
    const [activeTab, setActiveTab] = useState<TabType>('services');
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{ services: any[], packages: any[], faqs: any[] }>({ services: [], packages: [], faqs: [] });
    const [editingItem, setEditingItem] = useState<any>(null);
    const [currency, setCurrency] = useState('EGP');
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [
            { data: services },
            { data: packages },
            { data: faqs }
        ] = await Promise.all([
            supabase.from('landing_services').select('*').order('sorted_order', { ascending: true }),
            supabase.from('landing_packages').select('*').order('sorted_order', { ascending: true }),
            supabase.from('landing_faqs').select('*').order('sorted_order', { ascending: true })
        ]);

        setData({
            services: services || [],
            packages: packages || [],
            faqs: faqs || []
        });

        // Load global currency
        const { data: platformSettings } = await supabase
            .from('platform_settings')
            .select('currency')
            .limit(1)
            .maybeSingle();
        if (platformSettings?.currency) {
            setCurrency(platformSettings.currency);
        }

        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const action = editingItem.id ? 'update' : 'create';
        const typeMap: Record<string, string> = {
            services: 'service',
            packages: 'package',
            faqs: 'faq'
        };

        let payloadData = { ...editingItem };
        delete payloadData.id;
        delete payloadData.created_at;
        delete payloadData.updated_at;

        if (activeTab === 'packages' && typeof payloadData.features === 'string') {
            payloadData.features = payloadData.features.split('\n').filter((f: string) => f.trim());
        }

        try {
            const res = await fetch('/api/admin/landing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: typeMap[activeTab],
                    action,
                    data: payloadData,
                    id: editingItem.id
                })
            });
            const result = await res.json();
            if (result.success) {
                setEditingItem(null);
                fetchData();
            } else {
                alert('فشل الحفظ: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('حدث خطأ');
        }
    };

    const handleMove = async (id: string, direction: 'up' | 'down') => {
        const currentList = [...data[activeTab]];
        const index = currentList.findIndex(item => item.id === id);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === currentList.length - 1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const [movedItem] = currentList.splice(index, 1);
        currentList.splice(newIndex, 0, movedItem);

        // Update sorted_order for all affected items
        const typeMap: Record<string, string> = {
            services: 'service',
            packages: 'package',
            faqs: 'faq'
        };

        try {
            await Promise.all(currentList.map((item, i) =>
                fetch('/api/admin/landing', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: typeMap[activeTab],
                        action: 'update',
                        id: item.id,
                        data: { sorted_order: i }
                    })
                })
            ));
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من الحذف؟')) return;
        const typeMap: Record<string, string> = {
            services: 'service',
            packages: 'package',
            faqs: 'faq'
        };

        try {
            const res = await fetch('/api/admin/landing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: typeMap[activeTab],
                    action: 'delete',
                    id
                })
            });
            const result = await res.json();
            if (result.success) {
                fetchData();
            } else {
                alert('فشل الحذف');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getEmptyItem = () => {
        if (activeTab === 'services') return { title: '', description: '', icon: 'star', sorted_order: data.services.length };
        if (activeTab === 'packages') return { title: '', description: '', price: 0, features: '', is_popular: false, sorted_order: data.packages.length };
        if (activeTab === 'faqs') return { question: '', answer: '', sorted_order: data.faqs.length };
        return {};
    };

    const renderTabs = () => (
        <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8 border border-border-color w-fit">
            <button
                className={`py-2 px-6 rounded-xl font-bold text-sm transition-all ${activeTab === 'services' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-sub hover:text-text-main'}`}
                onClick={() => setActiveTab('services')}
            >
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">category</span>
                    <span>الخدمات</span>
                </div>
            </button>
            <button
                className={`py-2 px-6 rounded-xl font-bold text-sm transition-all ${activeTab === 'packages' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-sub hover:text-text-main'}`}
                onClick={() => setActiveTab('packages')}
            >
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">featured_play_list</span>
                    <span>الباقات</span>
                </div>
            </button>
            <button
                className={`py-2 px-6 rounded-xl font-bold text-sm transition-all ${activeTab === 'faqs' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-text-sub hover:text-text-main'}`}
                onClick={() => setActiveTab('faqs')}
            >
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">quiz</span>
                    <span>الأسئلة الشائعة</span>
                </div>
            </button>
        </div>
    );

    const renderServices = () => (
        <div className="grid gap-4">
            {data.services.map((item: any, idx) => (
                <div key={item.id} className="bg-surface p-4 rounded-xl border border-border-color flex justify-between items-center shadow-sm group">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col gap-0.5">
                            <button onClick={() => handleMove(item.id, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-primary disabled:opacity-0 transition-colors">
                                <span className="material-symbols-outlined text-lg leading-none">expand_less</span>
                            </button>
                            <button onClick={() => handleMove(item.id, 'down')} disabled={idx === data.services.length - 1} className="text-gray-300 hover:text-primary disabled:opacity-0 transition-colors">
                                <span className="material-symbols-outlined text-lg leading-none">expand_more</span>
                            </button>
                        </div>
                        <span className="material-symbols-outlined text-primary text-2xl bg-primary/5 p-2 rounded-lg">{item.icon}</span>
                        <div>
                            <h4 className="font-bold text-text-main">{item.title}</h4>
                            <p className="text-sm text-text-sub line-clamp-1">{item.description}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setEditingItem(item)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">تعديل</button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">حذف</button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderPackages = () => (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.packages.map((item: any, idx) => (
                <div key={item.id} className="bg-surface p-6 rounded-2xl border border-border-color flex flex-col shadow-sm relative group overflow-hidden">
                    <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleMove(item.id, 'up')} disabled={idx === 0} className="w-8 h-8 rounded-full bg-white border border-border-color flex items-center justify-center text-text-sub hover:text-primary shadow-sm disabled:opacity-0 transition-all">
                            <span className="material-symbols-outlined text-lg">expand_less</span>
                        </button>
                        <button onClick={() => handleMove(item.id, 'down')} disabled={idx === data.packages.length - 1} className="w-8 h-8 rounded-full bg-white border border-border-color flex items-center justify-center text-text-sub hover:text-primary shadow-sm disabled:opacity-0 transition-all">
                            <span className="material-symbols-outlined text-lg">expand_more</span>
                        </button>
                    </div>
                    {item.is_popular && <span className="absolute top-0 right-1/2 translate-x-1/2 bg-primary text-white text-[10px] font-black px-4 py-1 rounded-b-xl shadow-lg shadow-primary/20">مميز كالأكثر طلباً</span>}
                    <div className="mt-4">
                        <h4 className="font-bold text-xl text-text-main text-center mb-1">{item.title}</h4>
                        <p className="text-center text-xs text-text-sub mb-4 min-h-[40px] px-2">{item.description}</p>
                    </div>
                    <div className="text-center mb-6 bg-gray-50/50 py-4 rounded-2xl border border-border-color/50">
                        <span className="text-3xl font-black text-primary">{item.price}</span>
                        <span className="text-sm text-text-sub font-bold mr-1"> {currency}</span>
                    </div>
                    <ul className="text-xs space-y-2.5 mb-8 flex-1 text-text-sub">
                        {(item.features || []).map((f: string, i: number) => (
                            <li key={i} className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-green-500 text-[14px]">check_circle</span>
                                {f}
                            </li>
                        ))}
                    </ul>
                    <div className="flex justify-between gap-3 mt-auto">
                        <button onClick={() => setEditingItem({ ...item, features: (item.features || []).join('\n') })} className="flex-1 py-2.5 text-blue-600 bg-blue-50 border border-blue-100 rounded-xl font-bold hover:bg-blue-100 transition-all">تعديل</button>
                        <button onClick={() => handleDelete(item.id)} className="flex-1 py-2.5 text-red-600 bg-red-50 border border-red-100 rounded-xl font-bold hover:bg-red-100 transition-all">حذف</button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderFaqs = () => (
        <div className="space-y-4">
            {data.faqs.map((item: any, idx) => (
                <div key={item.id} className="bg-surface p-5 rounded-2xl border border-border-color shadow-sm flex gap-4">
                    <div className="flex flex-col gap-0.5 justify-center">
                        <button onClick={() => handleMove(item.id, 'up')} disabled={idx === 0} className="text-gray-300 hover:text-primary disabled:opacity-0 transition-colors">
                            <span className="material-symbols-outlined text-lg leading-none">expand_less</span>
                        </button>
                        <button onClick={() => handleMove(item.id, 'down')} disabled={idx === data.faqs.length - 1} className="text-gray-300 hover:text-primary disabled:opacity-0 transition-colors">
                            <span className="material-symbols-outlined text-lg leading-none">expand_more</span>
                        </button>
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-text-main text-lg">{item.question}</h4>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingItem(item)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                            </div>
                        </div>
                        <p className="text-sm text-text-sub leading-relaxed">{item.answer}</p>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderForm = () => {
        if (!editingItem) return null;

        return (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-fadeIn">
                    <div className="p-6 border-b border-border-color flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-black text-xl">{editingItem.id ? 'تعديل' : 'إضافة'} {activeTab === 'services' ? 'خدمة' : activeTab === 'packages' ? 'باقة' : 'سؤال'}</h3>
                        <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-black transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <form onSubmit={handleSave} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">

                        {(activeTab === 'services' || activeTab === 'packages') && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-text-main">العنوان</label>
                                <input required type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all"
                                    value={editingItem.title} onChange={e => setEditingItem({ ...editingItem, title: e.target.value })} />
                            </div>
                        )}

                        {(activeTab === 'services' || activeTab === 'packages') && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-text-main">الوصف</label>
                                <textarea className="w-full p-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all min-h-[90px]"
                                    value={editingItem.description} onChange={e => setEditingItem({ ...editingItem, description: e.target.value })} />
                            </div>
                        )}

                        {activeTab === 'services' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-text-main">الأيقونة (Material Symbols)</label>
                                <div className="flex gap-4">
                                    <input type="text" className="flex-1 h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all"
                                        value={editingItem.icon} onChange={e => setEditingItem({ ...editingItem, icon: e.target.value })} placeholder="مثال: check_circle" />
                                    <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                                        <span className="material-symbols-outlined">{editingItem.icon}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'packages' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-text-main">السعر ({currency})</label>
                                <input required type="number" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all"
                                    value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })} />
                            </div>
                        )}

                        {activeTab === 'packages' && (
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-bold text-text-main">أهم المميزات (كل ميزة في سطر)</label>
                                <textarea className="w-full p-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all min-h-[120px]"
                                    value={editingItem.features} onChange={e => setEditingItem({ ...editingItem, features: e.target.value })} />
                            </div>
                        )}

                        {activeTab === 'packages' && (
                            <label className="flex items-center gap-3 cursor-pointer mt-2 bg-primary/5 p-4 rounded-xl border border-primary/10">
                                <input type="checkbox" className="w-6 h-6 accent-primary rounded-lg cursor-pointer transition-all"
                                    checked={editingItem.is_popular} onChange={e => setEditingItem({ ...editingItem, is_popular: e.target.checked })} />
                                <span className="text-sm font-black text-primary uppercase">تعليم كـ "الأكثر طلباً"</span>
                            </label>
                        )}

                        {activeTab === 'faqs' && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-text-main">السؤال</label>
                                    <input required type="text" className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all"
                                        value={editingItem.question} onChange={e => setEditingItem({ ...editingItem, question: e.target.value })} />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-bold text-text-main">الإجابة</label>
                                    <textarea required className="w-full p-4 rounded-xl border border-border-color bg-gray-50 outline-none focus:border-primary transition-all min-h-[120px]"
                                        value={editingItem.answer} onChange={e => setEditingItem({ ...editingItem, answer: e.target.value })} />
                                </div>
                            </>
                        )}

                        <div className="flex justify-between items-center gap-4 pt-4 border-t border-border-color">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-bold text-orange-600">ترتيب العرض</label>
                                <input type="number" className="w-20 h-10 px-3 rounded-lg border border-border-color bg-orange-50 outline-none focus:border-primary"
                                    value={editingItem.sorted_order} onChange={e => setEditingItem({ ...editingItem, sorted_order: parseInt(e.target.value) })} />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setEditingItem(null)} className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all">إلغاء</button>
                                <button type="submit" className="px-8 py-2.5 rounded-xl bg-primary text-white font-black hover:bg-primary/90 transition-all shadow-xl shadow-primary/20">حفظ</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    if (loading && data.services.length === 0) return (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="font-black text-primary animate-pulse">جاري جلب المحتوى...</p>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl border border-border-color shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary to-blue-400"></div>
                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <span className="material-symbols-outlined text-2xl">web</span>
                        </div>
                        <h2 className="text-text-main text-3xl font-black tracking-tight font-display">تخصيص الواجهة</h2>
                    </div>
                    <p className="text-text-sub text-base font-medium max-w-xl leading-relaxed">تحكم كامل في محتويات الصفحة الهبوط: الخدمات، تفاصيل الباقات، والأسئلة الشائعة.</p>
                </div>
                <button onClick={() => setEditingItem(getEmptyItem())} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] z-10">
                    <span className="material-symbols-outlined text-lg">add</span>
                    <span>إضافة عنصر جديد</span>
                </button>
            </header>

            <div className="bg-white rounded-3xl border border-border-color p-8 shadow-sm">
                {renderTabs()}

                <div className="animate-fadeIn">
                    {activeTab === 'services' && (
                        data.services.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                                <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">category</span>
                                <p className="text-text-sub font-bold">لا توجد خدمات مضافة حالياً</p>
                            </div>
                        ) : renderServices()
                    )}
                    {activeTab === 'packages' && (
                        data.packages.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                                <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">featured_play_list</span>
                                <p className="text-text-sub font-bold">لا توجد باقات مضافة حالياً</p>
                            </div>
                        ) : renderPackages()
                    )}
                    {activeTab === 'faqs' && (
                        data.faqs.length === 0 ? (
                            <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                                <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">quiz</span>
                                <p className="text-text-sub font-bold">لا توجد أسئلة مضافة حالياً</p>
                            </div>
                        ) : renderFaqs()
                    )}
                </div>
            </div>

            {renderForm()}
        </div>
    );
}
