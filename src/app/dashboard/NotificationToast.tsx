'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Notification } from '@/hooks/useNotifications';

export default function NotificationToast() {
    const [activeNotif, setActiveNotif] = useState<Notification | null>(null);

    useEffect(() => {
        const handleNewNotif = (event: any) => {
            const notif = event.detail as Notification;
            setActiveNotif(notif);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                setActiveNotif(prev => prev?.id === notif.id ? null : prev);
            }, 5000);
        };

        window.addEventListener('new-notification', handleNewNotif);
        return () => window.removeEventListener('new-notification', handleNewNotif);
    }, []);

    const getIcon = (type: string) => {
        if (type === 'success') return { icon: 'check_circle', color: 'text-green-500', bg: 'bg-green-50' };
        if (type === 'warning') return { icon: 'warning', color: 'text-amber-500', bg: 'bg-amber-50' };
        if (type === 'error') return { icon: 'error', color: 'text-red-500', bg: 'bg-red-50' };
        return { icon: 'info', color: 'text-blue-500', bg: 'bg-blue-50' };
    };

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000] pointer-events-none">
            <AnimatePresence>
                {activeNotif && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%', scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
                        exit={{ opacity: 0, y: -20, x: '-50%', scale: 0.95 }}
                        style={{ left: '50%', transform: 'translateX(-50%)' }}
                        className="fixed top-6 w-80 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 flex gap-4 pointer-events-auto cursor-pointer"
                        onClick={() => {
                            if (activeNotif.link) window.location.href = activeNotif.link;
                            setActiveNotif(null);
                        }}
                    >
                        <div className={`flex-none size-10 rounded-xl flex items-center justify-center ${getIcon(activeNotif.type).bg} ${getIcon(activeNotif.type).color}`}>
                            <span className="material-symbols-outlined">{getIcon(activeNotif.type).icon}</span>
                        </div>
                        <div className="flex-1 text-right">
                            <h4 className="text-sm font-bold text-slate-900">{activeNotif.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{activeNotif.message}</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); setActiveNotif(null); }}
                            className="flex-none text-slate-300 hover:text-slate-500 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">close</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
