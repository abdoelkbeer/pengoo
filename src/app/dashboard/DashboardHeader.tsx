'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMobileSidebar } from './MobileSidebarContext';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';

const pageTitles: Record<string, { title: string; breadcrumb?: string[] }> = {
    '/dashboard': { title: 'لوحة التحكم' },
    '/dashboard/connections': { title: 'ربط واتساب', breadcrumb: ['ربط واتساب'] },
    '/dashboard/integrations/woocommerce': { title: 'ووكومرس', breadcrumb: ['ووكومرس'] },
    '/dashboard/notifications': { title: 'سجل الرسائل', breadcrumb: ['سجل الرسائل'] },
    '/dashboard/notifications/owner-alerts': { title: 'رسائل صاحب المتجر', breadcrumb: ['رسائل صاحب المتجر'] },
    '/dashboard/notifications/create': { title: 'إنشاء رسالة', breadcrumb: ['سجل الرسائل', 'إنشاء رسالة'] },
    '/dashboard/campaigns': { title: 'الحملات', breadcrumb: ['الحملات'] },
    '/dashboard/abandoned-cart': { title: 'السلة المتروكة', breadcrumb: ['السلة المتروكة'] },
    '/dashboard/settings': { title: 'الإعدادات', breadcrumb: ['الإعدادات'] },
    '/dashboard/plans': { title: 'الباقات والخطط', breadcrumb: ['الباقات والخطط'] },
    '/dashboard/support': { title: 'الدعم الفني', breadcrumb: ['الدعم الفني'] },
    '/dashboard/customer-messages': { title: 'رسائل العملاء', breadcrumb: ['رسائل العملاء'] },
};

const searchablePages = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: 'dashboard' },
    { href: '/dashboard/connections', label: 'ربط واتساب', icon: 'chat' },
    { href: '/dashboard/integrations/woocommerce', label: 'ووكومرس', icon: 'shopping_bag' },
    { href: '/dashboard/notifications', label: 'سجل الرسائل', icon: 'history' },
    { href: '/dashboard/notifications/create', label: 'إنشاء رسالة جديدة', icon: 'add_circle' },
    { href: '/dashboard/campaigns', label: 'الحملات التسويقية', icon: 'campaign' },
    { href: '/dashboard/abandoned-cart', label: 'السلة المتروكة', icon: 'shopping_cart_checkout' },
    { href: '/dashboard/settings', label: 'الإعدادات', icon: 'settings' },
    { href: '/dashboard/plans', label: 'الباقات والخطط', icon: 'workspace_premium' },
    { href: '/dashboard/support', label: 'الدعم الفني', icon: 'support_agent' },
    { href: '/dashboard/customer-messages', label: 'رسائل العملاء', icon: 'mark_email_read' },
];

export default function DashboardHeader({ user, hasMetaConnection = false }: { user: any; hasMetaConnection?: boolean }) {
    const pathname = usePathname();
    const router = useRouter();
    const { setIsOpen } = useMobileSidebar();
    const currentPage = pageTitles[pathname] || { title: 'لوحة التحكم' };
    const initials = user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'م';

    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
    const [notifPos, setNotifPos] = useState({ top: 0, left: 0 });
    const [credits, setCredits] = useState<number | null>(null);
    const [planName, setPlanName] = useState<string>('مجاني');

    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotifications();

    const searchRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);
    const notifRef = useRef<HTMLDivElement>(null);
    const notifBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        // Fetch credits only if Meta API is connected
        if (hasMetaConnection) {
            fetch('/api/credits').then(r => r.json()).then(d => {
                if (d.balance !== undefined) setCredits(d.balance);
            }).catch(() => { });
        }

        // Fetch plan info
        fetch('/api/notifications/system').then(r => r.json()).then(d => {
            if (d.planName) setPlanName(d.planName);
        }).catch(() => { });
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
            if (userRef.current && !userRef.current.contains(e.target as Node)) setUserDropdownOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const filteredPages = searchQuery.trim()
        ? searchablePages.filter(p => p.label.includes(searchQuery))
        : searchablePages;

    const handleNavigate = (href: string) => {
        router.push(href);
        setSearchOpen(false);
        setSearchQuery('');
    };

    const notifIcon = (type: string) => {
        if (type === 'success') return { icon: 'check_circle', bg: 'bg-green-50 text-green-500', border: 'border-green-100' };
        if (type === 'warning') return { icon: 'warning', bg: 'bg-amber-50 text-amber-500', border: 'border-amber-100' };
        if (type === 'error') return { icon: 'error', bg: 'bg-red-50 text-red-500', border: 'border-red-100' };
        return { icon: 'info', bg: 'bg-blue-50 text-blue-500', border: 'border-blue-100' };
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'الآن';
        if (diffInSeconds < 3600) return `منذ ${Math.floor(diffInSeconds / 60)} دقيقة`;
        if (diffInSeconds < 86400) return `منذ ${Math.floor(diffInSeconds / 3600)} ساعة`;
        return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
    };

    return (
        <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shrink-0 relative z-50 w-full max-w-[100vw]">
            {/* Right side: Breadcrumb */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsOpen(true)}
                    className="md:hidden p-1 -mr-1 text-slate-500 hover:text-primary transition-colors flex items-center justify-center"
                    aria-label="القائمة الرئيسية"
                >
                    <span className="material-symbols-outlined text-2xl">menu</span>
                </button>
                <span className="text-slate-400 text-sm font-medium hidden sm:inline-block">لوحة التحكم</span>
                {currentPage.breadcrumb && currentPage.breadcrumb.map((crumb, i) => (
                    <React.Fragment key={i}>
                        <span className="material-symbols-outlined text-slate-300 text-base hidden sm:inline-block">chevron_left</span>
                        <span className="text-slate-900 text-sm font-bold truncate max-w-[120px] sm:max-w-none">{crumb}</span>
                    </React.Fragment>
                ))}
            </div>

            {/* Left side: Search + Credits + Notifications + Avatar */}
            <div className="flex items-center gap-3">
                {/* Search */}
                <div ref={searchRef} className="relative hidden md:block">
                    <span className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 material-symbols-outlined text-lg">search</span>
                    <input
                        className="w-48 bg-slate-50 border border-slate-100 rounded-lg py-2 pr-10 pl-4 text-sm placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                        placeholder="بحث..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                        onFocus={() => setSearchOpen(true)}
                    />
                    {searchOpen && (
                        <div className="absolute top-full mt-2 left-0 right-0 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] overflow-hidden">
                            <div className="p-2 max-h-64 overflow-y-auto">
                                {filteredPages.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-400">لا توجد نتائج</div>
                                ) : (
                                    filteredPages.map(page => (
                                        <button
                                            key={page.href}
                                            onClick={() => handleNavigate(page.href)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-right hover:bg-slate-50 transition-colors ${pathname === page.href ? 'bg-primary/5 text-primary' : 'text-slate-700'}`}
                                        >
                                            <span className="material-symbols-outlined text-lg text-slate-400">{page.icon}</span>
                                            <span className="text-sm font-medium">{page.label}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Onboarding Wizard Trigger */}
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-onboarding-wizard'))}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-full text-primary transition-colors cursor-pointer"
                    title="دليل الإعداد"
                >
                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                    <span className="text-sm font-bold">إعداد المتجر</span>
                </button>

                {/* Credits Badge */}
                {credits !== null && hasMetaConnection && (
                    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full cursor-default" title="رصيد الكريدت">
                        <span className="material-symbols-outlined text-amber-500 text-base">toll</span>
                        <span className="text-sm font-bold text-amber-700">{credits.toLocaleString()}</span>
                    </div>
                )}

                {/* Notifications */}
                <div ref={notifRef} className="relative">
                    <button
                        ref={notifBtnRef}
                        onClick={() => {
                            if (!notifDropdownOpen && notifBtnRef.current) {
                                const rect = notifBtnRef.current.getBoundingClientRect();
                                setNotifPos({ top: rect.bottom + 8, left: rect.left });
                            }
                            setNotifDropdownOpen(!notifDropdownOpen);
                            setUserDropdownOpen(false);
                            setSearchOpen(false);
                        }}
                        className="relative p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-50 transition-colors"
                        aria-label="الإشعارات"
                    >
                        <span className="material-symbols-outlined text-xl">notifications</span>
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 size-4 bg-red-500 text-[10px] text-white font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                    <AnimatePresence>
                        {notifDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                style={{ top: notifPos.top, left: notifPos.left }}
                                className="fixed w-80 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-[99999] overflow-hidden"
                            >
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900 text-sm">الإشعارات</h3>
                                        {unreadCount > 0 && (
                                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                                                {unreadCount} جديد
                                            </span>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                                            className="text-xs text-primary hover:underline font-medium"
                                        >
                                            تحديد الكل كمقروء
                                        </button>
                                    )}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map((item: Notification) => {
                                            const ni = notifIcon(item.type);
                                            return (
                                                <div
                                                    key={item.id}
                                                    onClick={() => {
                                                        if (!item.is_read) markAsRead(item.id);
                                                        if (item.link) router.push(item.link);
                                                        setNotifDropdownOpen(false);
                                                    }}
                                                    className={`p-4 flex gap-3 hover:bg-slate-50/80 transition-all border-b border-slate-50 items-start cursor-pointer group relative ${!item.is_read ? 'bg-primary/[0.02]' : ''}`}
                                                >
                                                    {!item.is_read && (
                                                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-primary rounded-full"></span>
                                                    )}
                                                    <div className={`flex-none p-2 rounded-xl h-fit flex items-center justify-center border ${ni.bg} ${ni.border} group-hover:scale-110 transition-transform`}>
                                                        <span className="material-symbols-outlined text-lg">{ni.icon}</span>
                                                    </div>
                                                    <div className="text-right flex-1 min-w-0 pr-1">
                                                        <div className="flex justify-between items-start">
                                                            <p className={`text-sm font-bold truncate ${!item.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                                                {item.title}
                                                            </p>
                                                            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap mr-2">
                                                                {formatTime(item.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                                                            {item.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="py-12 px-6 text-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined text-3xl text-slate-300">notifications_off</span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-900">لا توجد إشعارات</p>
                                            <p className="text-xs text-slate-400 mt-1">سنخطرك عندما يحدث شيء جديد</p>
                                        </div>
                                    )}
                                </div>
                                {notifications.length > 0 && (
                                    <div className="p-3 border-t border-slate-100 text-center bg-slate-50/30">
                                        <button
                                            onClick={() => { router.push('/dashboard/notifications/admin'); setNotifDropdownOpen(false); }}
                                            className="text-xs font-bold text-slate-600 hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
                                        >
                                            عرض كل الإشعارات
                                            <span className="material-symbols-outlined text-base">arrow_left</span>
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* User Dropdown */}
                <div ref={userRef} className="relative">
                    <button
                        onClick={() => { setUserDropdownOpen(!userDropdownOpen); setNotifDropdownOpen(false); }}
                        className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs cursor-pointer hover:bg-primary/20 transition-colors"
                        title={user?.user_metadata?.full_name || user?.email}
                    >
                        {initials}
                    </button>
                    {userDropdownOpen && (
                        <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-[60] overflow-hidden">
                            <div className="p-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {initials}
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-slate-900 truncate">{user?.user_metadata?.full_name || 'مستخدم'}</p>
                                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-2">
                                {credits !== null && hasMetaConnection && (
                                    <div className="flex items-center justify-between px-3 py-2.5 mb-1 bg-amber-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-base text-amber-500">toll</span>
                                            <span className="text-sm font-medium text-amber-800">رصيد الكريدت</span>
                                        </div>
                                        <span className="text-base font-black text-amber-700">{credits.toLocaleString()}</span>
                                    </div>
                                )}
                                <a href="/dashboard/plans" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-700">
                                    <span className="material-symbols-outlined text-lg text-amber-500">workspace_premium</span>
                                    <div>
                                        <span className="text-sm font-medium block">الباقة الحالية</span>
                                        <span className="text-xs text-slate-400">{planName} — ترقية الآن</span>
                                    </div>
                                </a>
                                <a href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-700">
                                    <span className="material-symbols-outlined text-lg text-slate-400">settings</span>
                                    <span className="text-sm font-medium">الإعدادات</span>
                                </a>
                                <a href="/dashboard/support" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-slate-700">
                                    <span className="material-symbols-outlined text-lg text-slate-400">support_agent</span>
                                    <span className="text-sm font-medium">الدعم الفني</span>
                                </a>
                            </div>
                            <div className="p-2 border-t border-slate-100">
                                <button
                                    onClick={async () => {
                                        const { createClient } = await import('@/utils/supabase/client');
                                        const supabase = createClient();
                                        await supabase.auth.signOut();
                                        window.location.href = '/auth/login';
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-red-600"
                                >
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                    <span className="text-sm font-medium">تسجيل الخروج</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
