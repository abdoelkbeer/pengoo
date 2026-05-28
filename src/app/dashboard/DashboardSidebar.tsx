'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { createClient } from '@/utils/supabase/client';
import { useMobileSidebar } from './MobileSidebarContext';

export default function DashboardSidebar({
    user,
    settings,
    stores = [],
    whatsappStatus = 'DISCONNECTED',
    allowedTabs = null,
    hasMetaConnection = false
}: {
    user: any;
    settings?: any;
    stores?: any[];
    whatsappStatus?: string;
    allowedTabs?: any;
    hasMetaConnection?: boolean;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { isOpen, setIsOpen } = useMobileSidebar();
    const [isPending, startTransition] = useTransition();
    const [pendingPath, setPendingPath] = React.useState<string | null>(null);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/auth/login';
    };

    const handleNavigation = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
        e.preventDefault();
        setPendingPath(href);
        startTransition(() => {
            router.push(href);
            setIsOpen(false); // Close sidebar on mobile after navigation
        });
    };

    React.useEffect(() => {
        if (!isPending) {
            setPendingPath(null);
        }
    }, [isPending]);

    const navItems = [
        { id: 'dashboard', href: '/dashboard', label: 'لوحة التحكم', icon: 'dashboard', exact: true, description: 'نظرة عامة على أداء متجرك، الإحصائيات السريعة، وحالة الربط.' },
        { id: 'connections', href: '/dashboard/connections', label: 'ربط واتساب', icon: 'chat', description: 'إدارة أرقام واتساب الخاصة بك وربطها بالمنصة بسهولة لمزامنة الرسائل.' },
        { id: 'store', href: '/dashboard/integrations', label: 'ربط متجرك', icon: 'store', matchPrefix: '/dashboard/integrations', description: 'اربط متجرك (سلة، زد، ووكومرس، شوبيفاي) لاستقبال الطلبات وتفعيل التنبيهات.' },
        { id: 'customer-messages', href: '/dashboard/customer-messages', label: 'رسائل العملاء', icon: 'mark_email_read', description: 'أتمتة الرسائل للعملاء بناءً على تغير حالات الطلب.' },
        { id: 'admin-alerts', href: '/dashboard/notifications/owner-alerts', label: 'رسائل صاحب المتجر', icon: 'notifications_active', description: 'تخصيص الإشعارات التي تصلك كصاحب متجر فور حدوث أحداث هامة (طلب جديد، إلخ).' },
        { id: 'notifications', href: '/dashboard/notifications', label: 'سجل الرسائل', icon: 'history', matchExactPaths: ['/dashboard/notifications', '/dashboard/notifications/create', '/dashboard/notifications/admin'], description: 'سجل كامل لمتابعة جميع الرسائل المرسلة للعملاء وحالة تسليمها.' },
        { id: 'emulator', href: '/dashboard/emulator', label: 'جرّب ترسل مجانا', icon: 'science', description: 'أداة لاختبار إرسال رسائل واتساب مجاناً والتأكد من شكل الرسالة النهائي.' },
        { id: 'contacts', href: '/dashboard/contacts', label: 'جهات الاتصال', icon: 'contacts', description: 'إدارة وتنظيم كافة بيانات عملائك أو المجموعات المستهدفة لحملاتك.' },
        { id: 'campaigns', href: '/dashboard/campaigns', label: 'الحملات', icon: 'campaign', description: 'إنشاء حملات تسويقية مجدولة وفورية عبر واتساب لزيادة مبيعاتك.' },
        { id: 'abandoned-cart', href: '/dashboard/abandoned-cart', label: 'السلة المتروكة', icon: 'shopping_cart_checkout', description: 'تتبع السلات المتروكة وإرسال حملات تذكيرية لاسترجاع العملاء وزيادة التحويل.' },
    ];

    const isAdmin = user?.email === 'gamal13@gmail.com' || user?.user_metadata?.role === 'admin';

    const bottomItems = [
        ...(hasMetaConnection ? [{ id: 'billing', href: '/dashboard/billing', label: 'رصيد الرسائل', icon: 'account_balance_wallet', description: 'متابعة رصيد رسائلك، شحن الرصيد، واستعراض تفاصيل الاستهلاك.' }] : []),
        { id: 'plans', href: '/dashboard/plans', label: 'الباقات والخطط', icon: 'workspace_premium', description: 'استعراض باقتك الحالية، إدارة اشتراكك، والترقية لباقات بمميزات أكثر.' },
        { id: 'invoices', href: '/dashboard/invoices', label: 'الفواتير والمدفوعات', icon: 'receipt_long', description: 'سجل بجميع مدفوعاتك السابقة وإدارة بطاقات الدفع الخاصة بك بسهولة.' },
        { id: 'settings', href: '/dashboard/settings', label: 'الإعدادات', icon: 'settings', description: 'تخصيص إعدادات حسابك، المنصة، كلمة المرور، والمظهر المفضل.' },
        { id: 'support', href: '/dashboard/support', label: 'الدعم الفني', icon: 'support_agent', description: 'تواصل مع فريق الدعم الفني لحل أي مشكلة تواجهك بسرعة وفعالية.' },
        // Only include admin section if the user is an admin
        ...(isAdmin ? [{ id: 'admin-users', href: '/dashboard/admin/users', label: 'إدارة الأعضاء', icon: 'manage_accounts', description: 'إدارة المستخدمين والصلاحيات داخل حسابك.' }] : []),
    ];

    const filterAllowed = (items: typeof navItems) => {
        if (!allowedTabs) return items; // show all if no restrictions
        return items.filter(item => {
            if (['plans', 'invoices', 'admin-alerts', 'store', 'billing', 'admin-users', 'customer-messages'].includes(item.id)) return true; // always show these
            return allowedTabs.includes(item.id);
        });
    };

    const isActive = (item: any) => {
        if (item.matchExactPaths) return item.matchExactPaths.includes(pathname);
        if (item.exact) return pathname === item.href;
        const prefix = item.matchPrefix || item.href;
        return pathname === prefix || pathname.startsWith(prefix + '/');
    };

    const isItemPending = (item: typeof navItems[0]) => {
        if (!isPending || !pendingPath) return false;
        return pendingPath === item.href;
    };

    const renderNavLink = (item: typeof navItems[0]) => {
        const active = isActive(item);
        const pending = isItemPending(item);

        const isTopFeatured = ['dashboard', 'connections', 'store', 'admin-alerts', 'customer-messages'].includes(item.id);
        const isBottomItem = ['billing', 'plans', 'invoices', 'settings', 'support', 'admin-users'].includes(item.id);
        const shouldDim = !isTopFeatured && !isBottomItem;

        // Determine if we should show a status dot
        let statusDot = null;
        if (item.href === '/dashboard/connections') {
            const isConnected = whatsappStatus === 'CONNECTED';
            statusDot = (
                <span className={`size-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`} title={isConnected ? 'متصل' : 'غير متصل'}></span>
            );
        } else if (item.id === 'store') {
            const isStoreConnected = stores.some(s => s.is_active);
            if (isStoreConnected) {
                statusDot = (
                    <span className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" title="متصل"></span>
                );
            }
        }

        const linkClasses = `flex items-center gap-3 px-4 rounded-xl transition-all duration-200 group relative ${
            active 
                ? 'bg-primary/10 text-primary font-bold py-3 opacity-100' 
                : `text-slate-600 hover:bg-slate-50 ${shouldDim ? 'py-2.5 opacity-60 hover:opacity-100 text-sm' : 'py-3 font-medium'}`
        } ${pending ? '!opacity-50' : ''}`;

        const iconClasses = `material-symbols-outlined transition-colors ${
            active 
                ? 'text-primary' 
                : `text-slate-400 group-hover:text-primary ${shouldDim ? 'text-[20px]' : ''}`
        }`;

        return (
            <a
                key={item.href}
                href={item.href}
                onClick={(e) => handleNavigation(e, item.href)}
                className={linkClasses}
            >
                <span className={iconClasses}>{item.icon}</span>
                <span className="whitespace-nowrap flex-1 truncate">{item.label}</span>
                <div className="mr-auto flex items-center gap-2">
                    {pending ? (
                        <span className="sidebar-loading-spinner text-primary"></span>
                    ) : statusDot}
                    <SidebarTooltip item={item} />
                </div>
            </a>
        );
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/50 z-[60] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`w-72 bg-white border-l border-slate-200 flex flex-col z-[70] h-screen fixed top-0 right-0 transition-transform duration-300 md:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 md:p-6 flex items-center justify-between gap-3 border-b border-slate-100 min-h-[85px]">
                    <div className="flex items-center gap-3">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt={settings.site_name || 'Logo'} className="max-h-12 w-auto object-contain" />
                        ) : (
                            <>
                                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <span className="material-symbols-outlined text-2xl">link</span>
                                </div>
                                <div className="overflow-hidden">
                                    <h1 className="text-xl font-bold text-slate-900 leading-none truncate">{settings?.site_name || 'بينجو'}</h1>
                                    <p className="text-xs text-slate-500 font-medium mt-1">لوحة التحكم</p>
                                </div>
                            </>
                        )}
                    </div>
                    {/* Close button for mobile */}
                    <button
                        className="md:hidden p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-lg"
                        onClick={() => setIsOpen(false)}
                    >
                        <span className="material-symbols-outlined text-xl leading-none">close</span>
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
                    {filterAllowed(navItems).map(renderNavLink)}
                </nav>
                <div className="px-4 pb-2 flex flex-col gap-1.5 border-t border-slate-100 pt-3">
                    {filterAllowed(bottomItems).map(renderNavLink)}
                </div>
                <div className="p-4 border-t border-slate-100 bg-white">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-slate-200">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                            {user?.user_metadata?.full_name?.charAt(0) || 'م'}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold text-slate-900 truncate">{user?.user_metadata?.full_name || 'مستخدم جديد'}</span>
                            <span className="text-xs text-slate-500 truncate">{user?.email}</span>
                        </div>
                        <button onClick={handleSignOut} className="mr-auto text-slate-400 hover:text-red-500 transition-colors p-1" title="تسجيل الخروج">
                            <span className="material-symbols-outlined font-medium">logout</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

function SidebarTooltip({ item }: { item: any }) {
    const [isHovered, setIsHovered] = React.useState(false);
    const [coords, setCoords] = React.useState({ top: 0, right: 0 });
    const triggerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (isHovered && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top + rect.height / 2,
                right: window.innerWidth - rect.left + 15
            });
        }
    }, [isHovered]);

    return (
        <div 
            ref={triggerRef}
            className="relative flex items-center justify-center p-1 rounded hover:bg-slate-200/50 transition-colors cursor-help"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        >
            <div className="w-4 h-4 rounded-full border border-slate-300 text-slate-400 flex items-center justify-center text-[10px] font-bold italic hover:border-primary hover:text-primary transition-colors hover:bg-primary/5">
                i
            </div>
            
            {isHovered && typeof window !== 'undefined' && createPortal(
                <div 
                    className="fixed w-72 bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-4 z-[9999]"
                    style={{ 
                        top: `${coords.top}px`, 
                        right: `${coords.right}px`,
                        transform: 'translateY(-50%)'
                    }}
                >
                    <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2 text-base">
                        <span className="material-symbols-outlined text-primary text-lg">{item.icon}</span>
                        {item.label}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed whitespace-normal break-words font-normal">
                        {item.description || 'شرح لهذه الخاصية غير متوفر حالياً.'}
                    </p>
                    {/* Removed video until custom videos are ready */}

                    {/* Triangle pointer */}
                    <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-r border-t border-slate-100 rotate-45 shadow-[2px_-2px_2px_rgba(0,0,0,0.02)]"></div>
                </div>,
                document.body
            )}
        </div>
    );
}

