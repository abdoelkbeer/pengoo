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
    paid_at: string | null;
    period_start: string;
    period_end: string;
    payment_url: string | null;
    plans: {
        name: string;
    } | null;
}

interface Props {
    initialInvoices: Invoice[];
    subscription: any;
    currency: string;
}

export default function InvoicesList({ initialInvoices, subscription, currency }: Props) {
    const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
    const [loading, setLoading] = useState<string | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'overdue': return 'bg-red-100 text-red-700 border-red-200';
            case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'مدفوعة';
            case 'pending': return 'بانتظار الدفع';
            case 'overdue': return 'متأخرة';
            case 'cancelled': return 'ملغاة';
            default: return status;
        }
    };

    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isInitializingPayment, setIsInitializingPayment] = useState(false);

    const handlePay = async (invoiceId: string) => {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        setSelectedInvoice(invoice);
        setIsInitializingPayment(true);
        try {
            const res = await fetch('/api/invoices/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: invoice.id,
                })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('حدث خطأ أثناء بدء عملية الدفع: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert('فشل الاتصال بخادم الدفع');
        } finally {
            setIsInitializingPayment(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="space-y-8" dir="rtl">
            {/* Upcoming Renewals Section */}
            {subscription && (
                <div className="bg-gradient-to-br from-primary/5 to-blue-50/30 rounded-3xl border border-primary/10 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm overflow-hidden relative">
                    {/* Background Decorative Icon */}
                    <div className="absolute top-0 right-0 p-4 text-primary/5 select-none pointer-events-none translate-x-1/4 translate-y-1/4">
                        <span className="material-symbols-outlined text-[140px] notranslate" translate="no">calendar_month</span>
                    </div>

                    <div className="flex items-center gap-6 z-10 w-full md:w-auto relative">
                        <div className="size-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary shrink-0 border border-slate-100 overflow-hidden">
                            <span className="material-symbols-outlined text-3xl notranslate" translate="no">autorenew</span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <h3 className="text-xl font-black text-slate-900 leading-none">التجديد القادم</h3>
                            <p className="text-slate-500 font-medium text-sm md:text-base">سيتم إصدار فاتورة جديدة تلقائياً في موعد التجديد.</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-center md:items-end gap-1 z-10 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-primary/5 text-center md:text-right relative">
                        <span className="text-[10px] font-black text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-lg mb-1">موعد الاستحقاق</span>
                        <span className="text-2xl font-black text-slate-900 leading-none">{formatDate(subscription.ends_at)}</span>
                        <span className="text-xs font-bold text-slate-400 mt-1">باقة {subscription.plans?.name}</span>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-black text-lg text-slate-900">سجل الفواتير</h3>
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-xs font-bold text-slate-400">آخر التحديثات</span>
                    </div>
                </div>

                {invoices.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center">
                        <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
                            <span className="material-symbols-outlined text-4xl notranslate" translate="no">description</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-1">لا توجد فواتير بعد</h3>
                        <p className="text-slate-500">سيتم إصدار فواتيرك هنا بمجرد تجديد اشتراكك.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/30 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                                    <th className="px-6 py-4">رقم الفاتورة</th>
                                    <th className="px-6 py-4">الباقة / التفاصيل</th>
                                    <th className="px-6 py-4 text-center">المبلغ</th>
                                    <th className="px-6 py-4">تاريخ الاستحقاق</th>
                                    <th className="px-6 py-4 text-center">الحالة</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-slate-50/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-mono font-black text-slate-700 group-hover:text-primary transition-colors">#{invoice.invoice_number.toString().padStart(5, '0')}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-900">{invoice.plans?.name || 'خطة الحالية'}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    الفترة: {formatDate(invoice.period_start)} - {formatDate(invoice.period_end)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-black text-slate-900">{invoice.amount.toLocaleString()}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">{formatCurrency(invoice.currency)}</span>

                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs font-bold">
                                            {formatDate(invoice.due_date)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusColor(invoice.status)}`}>
                                                {getStatusLabel(invoice.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end">
                                                {invoice.status === 'paid' ? (
                                                    <div className="flex items-center gap-1.5 text-green-600 font-black text-[10px] uppercase bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                                        <span className="material-symbols-outlined text-sm notranslate" translate="no">check_circle</span>
                                                        تم السداد
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handlePay(invoice.id)}
                                                        disabled={isInitializingPayment && selectedInvoice?.id === invoice.id || invoice.status === 'cancelled'}
                                                        className="px-6 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                                    >
                                                        {isInitializingPayment && selectedInvoice?.id === invoice.id ? (
                                                            <>
                                                                <span className="material-symbols-outlined text-[14px] animate-spin notranslate" translate="no">progress_activity</span>
                                                                جاري التحويل
                                                            </>
                                                        ) : (
                                                            'سدد الآن'
                                                        )}
                                                    </button>
                                                )}
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
