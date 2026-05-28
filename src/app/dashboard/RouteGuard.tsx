'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function RouteGuard({
    allowedTabs,
    children
}: {
    allowedTabs: string[] | null;
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!allowedTabs) return; // No restrictions or error fetching

        const navItems = [
            { id: 'dashboard', href: '/dashboard', exact: true },
            { id: 'connections', href: '/dashboard/connections' },
            { id: 'store', matchPrefix: '/dashboard/integrations' },
            { id: 'notifications', href: '/dashboard/notifications' },
            { id: 'emulator', href: '/dashboard/emulator' },
            { id: 'campaigns', href: '/dashboard/campaigns' },
            { id: 'abandoned-cart', href: '/dashboard/abandoned-cart' },
            { id: 'settings', href: '/dashboard/settings' },
            { id: 'support', href: '/dashboard/support' },
            { id: 'plans', href: '/dashboard/plans' }, // User is always allowed to view plans
        ];

        let currentTabId: string | null = null;
        for (const item of navItems) {
            if (item.exact && pathname === item.href) {
                currentTabId = item.id;
                break;
            } else if (item.matchPrefix && pathname.startsWith(item.matchPrefix)) {
                currentTabId = item.id;
                break;
            } else if (item.href && !item.exact && pathname.startsWith(item.href)) {
                currentTabId = item.id;
                break;
            }
        }

        // If a matching known tab is found, and it's not "plans" or "store", 
        // and the user's plan doesn't include it -> redirect
        if (currentTabId && currentTabId !== 'plans' && currentTabId !== 'store' && !allowedTabs.includes(currentTabId)) {
            router.replace('/dashboard/plans?upgrade_required=true');
        }
    }, [pathname, allowedTabs, router]);

    return <>{children}</>;
}
