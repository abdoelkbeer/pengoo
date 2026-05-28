'use client'

import { usePathname } from 'next/navigation'

const navItems = [
    { href: '/admin', icon: 'dashboard', label: 'لوحة القيادة المتقدمة' },
    { href: '/admin/customers', icon: 'group', label: 'دليل العملاء' },
    { href: '/admin/plans', icon: 'workspace_premium', label: 'الخطط والاشتراكات' },
    { href: '/admin/coupons', icon: 'confirmation_number', label: 'الكوبونات والخصومات' },
    { href: '/admin/sessions', icon: 'devices', label: 'جلسات واتساب' },
    { href: '/admin/stores', icon: 'storefront', label: 'المتاجر الإلكترونية' },
    { href: '/admin/reports', icon: 'analytics', label: 'تحليلات النظام' },
    { href: '/admin/invoices', icon: 'receipt_long', label: 'إدارة الفواتير' },
    { href: '/admin/support', icon: 'support_agent', label: 'مكتب الدعم' },
    { href: '/admin/billing-packages', icon: 'payments', label: 'باقات شحن الرصيد' },
    { href: '/admin/credits', icon: 'toll', label: 'إدارة الرصيد' },
    { href: '/admin/security', icon: 'security', label: 'الإعدادات والأمان' },
    { href: '/admin/logs', icon: 'bug_report', label: 'سجل النظام والأخطاء' },
    { href: '/admin/landing', icon: 'web', label: 'تخصيص الواجهة' },
    { href: '/admin/seo', icon: 'travel_explore', label: 'تحسين محركات البحث' },
    { href: '/admin/system', icon: 'monitoring', label: 'مراقبة استهلاك النظام' },
]

export default function AdminSidebar({ settings }: { settings?: any }) {
    const pathname = usePathname()

    const isActive = (href: string) => {
        if (href === '/admin') return pathname === '/admin'
        return pathname.startsWith(href)
    }

    return (
        <aside className="w-[300px] bg-white border-l border-border-color flex flex-col justify-between h-screen fixed right-0 top-0 z-50 shadow-[2px_0_24px_-12px_rgba(0,0,0,0.1)]">
            <div className="flex flex-col h-full">

                {/* Admin Profile & Branding */}
                <div className="p-6 border-b border-border-color">
                    <div className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-border-color/50 min-h-[70px] justify-center">
                        {settings?.logo_url ? (
                            <img src={settings.logo_url} alt={settings.site_name || 'Logo'} className="max-h-12 w-auto object-contain" />
                        ) : (
                            <>
                                <div className="relative shrink-0">
                                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-white text-[20px]">admin_panel_settings</span>
                                    </div>
                                    <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white shadow-sm ring-1 ring-green-600/20"></span>
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <h1 className="text-text-main text-[15px] font-bold leading-tight truncate">إدارة {settings?.site_name || 'منصة بينجو'}</h1>
                                    <p className="text-primary text-xs font-bold mt-1 tracking-wide">مدير نظام ممتاز</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar">
                    <p className="text-xs font-bold text-text-sub uppercase tracking-wider mb-4 px-3 opacity-60">القائمة الرئيسية</p>

                    {navItems.map((item) => {
                        const active = isActive(item.href)
                        return (
                            <a
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${active
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'hover:bg-gray-50 text-text-sub hover:text-text-main font-medium'
                                    }`}
                            >
                                {active && (
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-primary rounded-l-full"></span>
                                )}

                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${active ? 'bg-primary/10' : 'bg-transparent group-hover:bg-gray-200/50'
                                    }`}>
                                    <span className={`material-symbols-outlined text-[20px] transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'
                                        }`}>
                                        {item.icon}
                                    </span>
                                </div>
                                <span className="text-[14px]">{item.label}</span>
                            </a>
                        )
                    })}
                </nav>

                {/* Footer Action */}
                <div className="p-5 border-t border-border-color/50 bg-gray-50/30">
                    <a
                        href="/dashboard"
                        className="flex items-center justify-center gap-2.5 w-full bg-white border border-border-color hover:border-gray-300 hover:bg-gray-50 text-text-main text-[14px] font-bold py-3 rounded-xl transition-all shadow-sm group"
                    >
                        <span className="material-symbols-outlined text-[18px] text-text-sub group-hover:-translate-x-1 transition-transform">arrow_forward</span>
                        الخروج للوحة المستخدم
                    </a>
                </div>
            </div>
        </aside>
    )
}
