// @ts-nocheck
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import NewConnectionButton from './NewConnectionButton';
import DeleteConnectionButton from './DeleteConnectionButton';

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: connections } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

    const activeCount = connections?.filter(c => c.status === 'CONNECTED').length || 0;
    const totalCount = connections?.length || 0;

    // Get today's message count from message_logs
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayMessages } = await supabase
        .from('message_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('sent_at', today.toISOString());

    // Get total messages count
    const { count: totalMessages } = await supabase
        .from('message_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

    return (
        <>
            <div className="flex flex-col gap-8 p-8">

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">الأرقام المتصلة</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">قم بإدارة أرقام واتساب الخاصة بك وحالات اتصالها</p>
                    </div>
                    <NewConnectionButton />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-850 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">الأرقام النشطة</span>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</span>
                            </div>
                            <div className={`rounded-lg p-2 ${activeCount > 0 ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-400'}`}>
                                <span className="material-symbols-outlined">{activeCount > 0 ? 'check_circle' : 'cancel'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-850 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">رسائل اليوم</span>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{todayMessages || 0}</span>
                            </div>
                            <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                <span className="material-symbols-outlined">send</span>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-850 dark:border-slate-800">
                        <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">إجمالي الرسائل</span>
                                <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalMessages || 0}</span>
                            </div>
                            <div className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                                <span className="material-symbols-outlined">forum</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-850 dark:border-slate-800">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">اسم الاتصال</th>
                                    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">رقم الهاتف</th>
                                    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">الحالة</th>
                                    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">آخر نشاط</th>
                                    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {totalCount === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-12 text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-slate-50 rounded-full">
                                                <span className="material-symbols-outlined text-4xl text-slate-300">phonelink_off</span>
                                            </div>
                                            <p className="font-medium">لا توجد اتصالات حالياً</p>
                                            <p className="text-sm text-slate-400">اضغط على "ربط رقم جديد" للبدء</p>
                                        </div>
                                    </td></tr>
                                ) : (
                                    connections?.map(conn => (
                                        <tr key={conn.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${conn.status === 'CONNECTED' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-200 text-slate-500'}`}>
                                                        <span className="material-symbols-outlined">{conn.status === 'CONNECTED' ? 'support_agent' : 'phonelink_off'}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900 dark:text-white">{conn.session_name || 'بدون اسم'}</span>
                                                        <span className="text-xs text-slate-500">{conn.engine_type === 'META' ? 'Meta API (الرسمي)' : 'WhatsApp Web'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-slate-600 dark:text-slate-300" dir="ltr">{conn.phone_number ? `+${conn.phone_number}` : '-'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {conn.status === 'CONNECTED' ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-green-600 dark:bg-green-400"></span>متصل
                                                    </span>
                                                ) : conn.status === 'QR_READY' ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-bold text-yellow-700">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-yellow-600 animate-pulse"></span>بانتظار المسح
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-400"></span>غير متصل
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-500 dark:text-slate-400">{new Date(conn.updated_at).toLocaleDateString('ar-EG')} - {new Date(conn.updated_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1">
                                                    {conn.status !== 'CONNECTED' && (
                                                        <NewConnectionButton />
                                                    )}
                                                    <DeleteConnectionButton connectionId={conn.id} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 dark:border-slate-800">
                        <span className="text-xs text-slate-500 dark:text-slate-400">عرض {totalCount} من أصل {totalCount} نتائج</span>
                    </div>
                </div>

            </div>
        </>
    );
}
