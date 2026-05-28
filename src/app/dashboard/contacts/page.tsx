// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import CountryCodeSelector from '@/components/CountryCodeSelector';

export default function ContactsPage() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [countryCode, setCountryCode] = useState('+20');
    const [newPhone, setNewPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const supabase = createClient();

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/contacts');
            const data = await res.json();
            if (data.success) {
                setContacts(data.contacts || []);
            }
        } catch (err) {
            showMsg('خطأ في تحميل جهات الاتصال');
        }
        setLoading(false);
    };

    const showMsg = (msg: string) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 3000);
    };

    const handleAddContact = async () => {
        if (!newPhone.trim()) {
            showMsg('يرجى إدخال رقم الهاتف');
            return;
        }
        setIsSaving(true);
        try {
            const fullPhone = `${countryCode}${newPhone.replace(/\D/g, '')}`.replace(/\+/g, '');
            const data = await res.json();
            if (data.success) {
                showMsg('تمت إضافة جهة الاتصال بنجاح');
                setShowAddModal(false);
                setNewPhone('');
                setNewName('');
                fetchContacts();
            } else {
                showMsg('خطأ: ' + data.error);
            }
        } catch (err) {
            showMsg('حدث خطأ غير متوقع');
        }
        setIsSaving(false);
    };

    const handleImportFromLogs = async () => {
        if (!confirm('هل تود استيراد جميع الأرقام التي أرسلت إليها رسائل مسبقاً؟ قد يستغرق هذا بضع ثوانٍ.')) return;
        setIsImporting(true);
        try {
            const res = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'import_from_logs' })
            });
            const data = await res.json();
            if (data.success) {
                showMsg(`تم استيراد ${data.count} رقم بنجاح`);
                fetchContacts();
            } else {
                showMsg('فشل الاستيراد: ' + data.error);
            }
        } catch (err) {
            showMsg('حدث خطأ أثناء الاستيراد');
        }
        setIsImporting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف جهة الاتصال هذه؟')) return;
        try {
            const res = await fetch('/api/contacts', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: [id] })
            });
            const data = await res.json();
            if (data.success) {
                showMsg('تم الحذف بنجاح');
                setContacts(contacts.filter(c => c.id !== id));
            }
        } catch (err) {
            showMsg('حدث خطأ أثناء الحذف');
        }
    };

    const filteredContacts = contacts.filter(c =>
        c.phone_number.includes(searchTerm) ||
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="flex-1 flex flex-col p-8 gap-6 max-w-6xl mx-auto w-full pb-24">
            {message && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-4">
                    {message}
                </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-slate-900">جهات الاتصال</h1>
                    <p className="text-sm text-slate-500">إدارة أرقام الواتساب المحفوظة للحملات</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleImportFromLogs}
                        disabled={isImporting}
                        className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                        <span className={`material-symbols-outlined text-xl ${isImporting ? 'animate-spin' : ''}`}>sync</span>
                        <span>{isImporting ? 'جاري الاستيراد...' : 'استيراد من السجل'}</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-xl">person_add</span>
                        <span>إضافة جهة اتصال</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="relative">
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input
                        type="text"
                        placeholder="ابحث بالاسم أو الرقم..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-12 pl-4 py-3 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-20 text-center">
                        <span className="material-symbols-outlined text-4xl text-primary animate-spin">sync</span>
                        <p className="text-slate-500 mt-2 font-medium">جاري التحميل...</p>
                    </div>
                ) : filteredContacts.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="size-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl text-slate-400">contacts</span>
                        </div>
                        <p className="text-slate-500 font-medium">{searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد جهات اتصال محفوظة'}</p>
                        {!searchTerm && <p className="text-slate-400 text-sm mt-1">ابدأ بإضافة أرقام يدوياً أو استوردها من سجل الرسائل</p>}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500">الاسم</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 text-left">رقم الهاتف</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500">تاريخ الحفظ</th>
                                    <th className="py-4 px-6 text-xs font-bold text-slate-500 text-center w-20">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredContacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-4 px-6 font-bold text-slate-800">{contact.name || '—'}</td>
                                        <td className="py-4 px-6 text-slate-600 font-mono text-left" dir="ltr">{contact.phone_number}</td>
                                        <td className="py-4 px-6 text-sm text-slate-400">
                                            {new Date(contact.created_at).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button
                                                onClick={() => handleDelete(contact.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="حذف"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Contact Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-900">إضافة جهة اتصال جديدة</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200/50 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">الاسم (اختياري)</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="مثال: محمد أحمد"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:bg-white focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">رقم الهاتف</label>
                                <div className="relative group flex items-center" dir="ltr">
                                    <div className="relative h-[48px] w-40 shrink-0 z-20">
                                        <CountryCodeSelector
                                            value={countryCode}
                                            onChange={(val) => setCountryCode(val)}
                                            className="h-full"
                                            variant="prefix"
                                        />
                                    </div>
                                    <div className="relative flex-1 h-[48px] -ml-px">
                                        <input
                                            type="tel"
                                            className="w-full h-full pl-4 pr-10 rounded-r-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-700 font-bold"
                                            value={newPhone}
                                            onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                                            dir="ltr"
                                            placeholder="10XXXXXXXX"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors text-lg">phone_iphone</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-2 flex gap-3">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleAddContact}
                                    disabled={isSaving}
                                    className="flex-[2] py-3 px-4 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isSaving ? 'جاري الحفظ...' : 'حفظ جهة الاتصال'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
