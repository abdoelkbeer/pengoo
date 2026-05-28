'use client';

import React, { useState } from 'react';
import { formatCurrency } from '@/utils/format';


interface Invoice {
    id: string;
    invoice_number: number;
    amount: number;
    currency: string;
    status: string;
    due_date: string;
    created_at: string;
    plans: { name: string } | null;
    user_profiles: { full_name: string } | null;
    user_id: string;
}

interface Props {
    initialInvoices: Invoice[];
    customers: { id: string; full_name: string }[];
    plans: { id: string; name: string; price_monthly: number; price_yearly: number }[];
}

export default function InvoicesManager({ initialInvoices, customers, plans }: Props) {
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [loading, setLoading] = useState<string | null>(null);
    const [filter, setFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        userId: '',
        planId: '',
        billingCycle: 'monthly',
        amount: 0,
        currency: 'EGP',
        dueDate: ''
    });

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const res = await fetch('/api/admin/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create',
                    data: formData
                })
            });
            const result = await res.json();
            if (result.success) {
                setIsModalOpen(false);
                window.location.reload();
            } else {
                alert('خطأ: ' + result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAction = async (invoiceId: string, action: string) => {
        if (!confirm('هل أنت متأكد من تنفيذ هذا الإجراء؟')) return;

        setLoading(invoiceId);
        try {
            const res = await fetch('/api/admin/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, invoiceId })
            });
            const result = await res.json();
            if (result.success) {
                window.location.reload();
            } else {
                alert('خطأ: ' + result.error);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(null);
        }
    };

    const formatDate = (date: string) => new Date(date).toLocaleDateString('ar-EG');

    const filteredInvoices = filter === 'all'
        ? invoices
        : invoices.filter(inv => inv.status === filter);

    return (
        <div className="space-y-6">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    {['all', 'pending', 'paid', 'overdue', 'cancelled'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                            {f === 'all' ? 'الكل' : f === 'paid' ? 'مدفوعة' : f === 'pending' ? 'بانتظار الدفع' : f === 'overdue' ? 'متأخرة' : 'ملغاة'}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined">add_notes</span>
                    إصدار فاتورة جديدة
                </button>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                <table className="w-full text-right border-collapse">
                    <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-xs font-black uppercase">
                        <tr>
                            <th className="px-6 py-4">رقم الفاتورة</th>
                            <th className="px-6 py-4">العميل</th>
                            <th className="px-6 py-4">الباقة</th>
                            <th className="px-6 py-4">المبلغ</th>
                            <th className="px-6 py-4">تاريخ الإصدار</th>
                            <th className="px-6 py-4 text-center">الحالة</th>
                            <th className="px-6 py-4">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-4xl text-gray-200">receipt_long</span>
                                        <p className="text-gray-400 font-bold">لا توجد فواتير مطابقة لهذا البحث.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredInvoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="px-6 py-4 font-mono font-black text-gray-700">#{inv.invoice_number.toString().padStart(5, '0')}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">{inv.user_profiles?.full_name || 'غير معروف'}</span>
                                        <span className="text-[10px] text-gray-400 font-mono">{inv.user_id}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-300 text-sm">inventory_2</span>
                                        <span className="font-bold text-gray-600">{inv.plans?.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-black">
                                    <span className="text-primary">{inv.amount}</span> <span className="text-[10px] text-gray-400 font-bold">{formatCurrency(inv.currency)}</span>
                                </td>

                                <td className="px-6 py-4 text-gray-500 text-sm font-medium">{formatDate(inv.created_at)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${inv.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' :
                                        inv.status === 'pending' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-red-50 text-red-700 border-red-100'
                                        }`}>
                                        {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'pending' ? 'بانتظار الدفع' : 'متأخرة'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        {inv.status !== 'paid' && (
                                            <button
                                                onClick={() => handleAction(inv.id, 'mark_paid')}
                                                disabled={loading === inv.id}
                                                className="p-2 bg-green-500 text-white rounded-xl shadow-lg shadow-green-200 hover:bg-green-600 transition-all disabled:opacity-50"
                                                title="تأكيد الدفع"
                                            >
                                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                            </button>
                                        )}
                                        {inv.status === 'pending' && (
                                            <button
                                                onClick={() => handleAction(inv.id, 'cancel')}
                                                disabled={loading === inv.id}
                                                className="p-2 border border-gray-100 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all disabled:opacity-50"
                                                title="إلغاء الفاتورة"
                                            >
                                                <span className="material-symbols-outlined text-sm">cancel</span>
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create Invoice Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">إصدار فاتورة جديدة</h3>
                                <p className="text-sm text-gray-500 font-medium">قم بتعبئة التفاصيل أدناه لإرسال فاتورة للعميل.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="size-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-gray-500 uppercase mr-1">العميل</label>
                                <select
                                    required
                                    className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold outline-none focus:border-primary transition-all"
                                    value={formData.userId}
                                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                >
                                    <option value="">اختر العميل...</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-500 uppercase mr-1">الباقة</label>
                                    <select
                                        required
                                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold outline-none focus:border-primary transition-all"
                                        value={formData.planId}
                                        onChange={(e) => {
                                            const plan = plans.find(p => p.id === e.target.value);
                                            setFormData({
                                                ...formData,
                                                planId: e.target.value,
                                                amount: formData.billingCycle === 'yearly' ? (plan?.price_yearly || 0) : (plan?.price_monthly || 0)
                                            });
                                        }}
                                    >
                                        <option value="">اختر الباقة...</option>
                                        {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-500 uppercase mr-1">دورة الفوترة</label>
                                    <select
                                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold outline-none focus:border-primary transition-all"
                                        value={formData.billingCycle}
                                        onChange={(e) => {
                                            const plan = plans.find(p => p.id === formData.planId);
                                            setFormData({
                                                ...formData,
                                                billingCycle: e.target.value,
                                                amount: e.target.value === 'yearly' ? (plan?.price_yearly || 0) : (plan?.price_monthly || 0)
                                            });
                                        }}
                                    >
                                        <option value="monthly">شهري</option>
                                        <option value="yearly">سنوي</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-500 uppercase mr-1">المبلغ</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-black outline-none focus:border-primary transition-all"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-black text-gray-500 uppercase mr-1">تاريخ الاستحقاق</label>
                                    <input
                                        type="date"
                                        className="w-full h-12 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold outline-none focus:border-primary transition-all"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isCreating}
                                    className="w-full h-14 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isCreating ? 'جاري الإصدار...' : 'تأكيد وإصدار الفاتورة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
