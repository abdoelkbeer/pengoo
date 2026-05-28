'use client';

import React from 'react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminNotificationsPage() {
    const {
        notifications,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const getIcon = (type: string) => {
        if (type === 'success') return { icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-100' };
        if (type === 'warning') return { icon: 'warning', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' };
        if (type === 'error') return { icon: 'error', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100' };
        return { icon: 'info', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' };
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('ar-EG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-10 h-full">
                <div className="flex flex-col items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
                    <span className="material-symbols-outlined text-5xl text-primary animate-spin mb-4">notifications</span>
                    <span className="font-bold text-slate-700 text-lg">جاري تحميل الإشعارات...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-slate-50">
            <div className="p-8 max-w-4xl mx-auto w-full">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-1 flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary text-4xl">notifications_active</span>
                            مركز الإشعارات
                        </h1>
                        <p className="text-slate-500 font-medium">تابع آخر التحديثات والتنبيهات الخاصة بمتجرك في مكان واحد.</p>
                    </div>
                    {notifications.length > 0 && (
                        <div className="flex gap-3">
                            <button
                                onClick={markAllAsRead}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">done_all</span>
                                تحديد الكل كمقروء
                            </button>
                        </div>
                    )}
                </div>

                {/* Notifications List */}
                <div className="flex flex-col gap-4">
                    <AnimatePresence initial={false}>
                        {notifications.length > 0 ? (
                            notifications.map((notif) => {
                                const ui = getIcon(notif.type);
                                return (
                                    <motion.div
                                        key={notif.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: 50 }}
                                        className={`bg-white rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md relative overflow-hidden group ${!notif.is_read ? 'border-primary/20 bg-primary/[0.01]' : 'border-slate-100'}`}
                                    >
                                        {!notif.is_read && (
                                            <div className="absolute top-0 right-0 w-1.5 h-full bg-primary"></div>
                                        )}
                                        <div className="flex gap-4">
                                            <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border ${ui.bg} ${ui.color} ${ui.border}`}>
                                                <span className="material-symbols-outlined text-2xl">{ui.icon}</span>
                                            </div>
                                            <div className="flex-1 text-right">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className={`font-bold text-lg ${!notif.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                        {notif.title}
                                                    </h3>
                                                    <span className="text-xs text-slate-400 font-medium">{formatDate(notif.created_at)}</span>
                                                </div>
                                                <p className="text-slate-500 leading-relaxed mb-4">{notif.message}</p>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-2">
                                                        {notif.link && (
                                                            <a
                                                                href={notif.link}
                                                                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors"
                                                            >
                                                                عرض التفاصيل
                                                            </a>
                                                        )}
                                                        {!notif.is_read && (
                                                            <button
                                                                onClick={() => markAsRead(notif.id)}
                                                                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                                                            >
                                                                تحديد كمقروء
                                                            </button>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => deleteNotification(notif.id)}
                                                        className="size-8 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        title="حذف"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="py-24 bg-white rounded-3xl border border-slate-100 flex flex-col items-center gap-4 text-center">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                                    <span className="material-symbols-outlined text-5xl text-slate-300">notifications_none</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-xl text-slate-800">لا توجد إشعارات حالياً</h3>
                                    <p className="text-slate-500 mt-2">عندما يرسل لك النظام تنبيهاً جديداً، سيظهر هنا بالتفصيل.</p>
                                </div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
