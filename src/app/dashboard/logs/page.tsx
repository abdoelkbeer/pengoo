// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function Page() {
    const [logs, setLogs] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [sentCount, setSentCount] = useState(0);
    const [failedCount, setFailedCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [phoneFilter, setPhoneFilter] = useState('');

    const supabase = createClient();

    useEffect(() => {
        loadLogs(statusFilter, phoneFilter, page);
    }, [page]);

    const loadLogs = async (filterStatus = '', filterPhone = '', currentPage = 1) => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const from = (currentPage - 1) * ITEMS_PER_PAGE;
        const to = from + ITEMS_PER_PAGE - 1;

        // Build query
        let query = supabase
            .from('message_logs')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('sent_at', { ascending: false })
            .range(from, to);

        if (filterStatus) {
            query = query.eq('status', filterStatus);
        }
        if (filterPhone) {
            query = query.ilike('recipient_phone', `%${filterPhone}%`);
        }

        const { data, count } = await query;
        setLogs(data || []);
        setTotal(count || 0);

        // Stats
        const { count: sent } = await supabase
            .from('message_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'SENT');
        setSentCount(sent || 0);

        const { count: failed } = await supabase
            .from('message_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'FAILED');
        setFailedCount(failed || 0);

        setLoading(false);
    };

    const handleFilter = () => {
        setPage(1);
        loadLogs(statusFilter, phoneFilter, 1);
    };

    const handleReset = () => {
        setStatusFilter('');
        setPhoneFilter('');
        setPage(1);
        loadLogs('', '', 1);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-10">
                <div className="flex flex-col items-center text-primary">
                    <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
                    <span className="font-bold">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex-1 flex flex-col h-full w-full bg-background-light">
                <div className="p-8 flex flex-col gap-6 max-w-[1400px] w-full mx-auto">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-1">إجمالي الرسائل</p>
                            <p className="text-2xl font-bold text-slate-900">{total}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-1">تم الإرسال</p>
                            <p className="text-2xl font-bold text-green-600">{sentCount}</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium mb-1">فشل الإرسال</p>
                            <p className="text-2xl font-bold text-red-600">{failedCount}</p>
                        </div>
                    </div>

                    <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700">الحالة</label>
                                <div className="relative">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                                    >
                                        <option value="">الكل</option>
                                        <option value="SENT">تم الإرسال</option>
                                        <option value="FAILED">فشل</option>
                                        <option value="PENDING">قيد الانتظار</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 pointer-events-none text-[20px]">expand_more</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-semibold text-slate-700">رقم الواتساب</label>
                                <div className="relative">
                                    <input
                                        value={phoneFilter}
                                        onChange={(e) => setPhoneFilter(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="بحث برقم الهاتف"
                                        type="text"
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">search</span>
                                </div>
                            </div>

                            <button
                                onClick={handleFilter}
                                className="h-[42px] bg-primary hover:bg-blue-600 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-primary/30 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                                <span>تطبيق التصفية</span>
                            </button>

                            <button
                                onClick={handleReset}
                                className="h-[42px] bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-sm transition-colors hover:bg-slate-50 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">restart_alt</span>
                                <span>إعادة تعيين</span>
                            </button>
                        </div>
                    </section>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">التوقيت</th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">المستلم</th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">المحتوى</th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">الحالة</th>
                                        <th className="py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">تفاصيل الخطأ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {logs.length > 0 ? logs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-slate-900">{new Date(log.sent_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="text-xs text-slate-500">{new Date(log.sent_at).toLocaleDateString('ar-SA')}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <span className="text-sm font-medium text-slate-700" dir="ltr">{log.recipient_phone}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-sm text-slate-600 line-clamp-1 max-w-[200px] block">{log.message_body?.substring(0, 50)}{log.message_body?.length > 50 ? '...' : ''}</span>
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                {log.status === 'SENT' ? (
                                                    <span
                                                        title="تم إرسال الرسالة بنجاح وبشكل نهائي"
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 cursor-help"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        تم الإرسال
                                                    </span>
                                                ) : log.status === 'FAILED' ? (
                                                    <span
                                                        title={`فشل الإرسال: ${log.error_details || 'خطأ في الاتصال بالواتساب'}`}
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100 cursor-help"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                                        فشل الإرسال
                                                    </span>
                                                ) : (
                                                    <span
                                                        title="الرسالة قيد الانتظار في طابور الإرسال، سيتم إرسالها فور توفر اتصال نشط"
                                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 cursor-help"
                                                    >
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                                        قيد المعالجة
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 whitespace-nowrap">
                                                <span className="text-xs text-red-500">{log.error_details || '-'}</span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="p-4 bg-slate-50 rounded-full">
                                                        <span className="material-symbols-outlined text-4xl text-slate-300">inbox</span>
                                                    </div>
                                                    <p className="text-slate-500 font-medium">لا توجد سجلات إرسال</p>
                                                    <p className="text-slate-400 text-sm">ستظهر الرسائل المرسلة هنا تلقائياً</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-white border-t border-slate-100 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-slate-500">
                                عرض <span className="font-medium text-slate-900">{logs.length}</span> من أصل <span className="font-medium text-slate-900">{total}</span> سجل
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(page => Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                    title="الصفحة السابقة"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                                </button>
                                <span className="text-sm font-medium text-slate-700 bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-200">
                                    الصفحة {page} من {Math.max(1, Math.ceil(total / ITEMS_PER_PAGE))}
                                </span>
                                <button
                                    onClick={() => setPage(page => page + 1)}
                                    disabled={page >= Math.ceil(total / ITEMS_PER_PAGE)}
                                    className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                                    title="الصفحة التالية"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
