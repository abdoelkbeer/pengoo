import React from 'react';
import { createClient } from '@/utils/supabase/server';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';
import { redirect } from 'next/navigation';
import OnboardingController from './OnboardingController';
import RouteGuard from './RouteGuard';
import { MobileSidebarProvider } from './MobileSidebarContext';
import NotificationToast from './NotificationToast';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login');
    }

    const { data: settings } = await supabase.from('platform_settings').select('*').limit(1).single();

    // Fetch stores to show connection status in sidebar
    const { data: stores } = await supabase.from('stores').select('store_type, is_active').eq('user_id', user.id);

    // Fetch whatsapp connections to show connection status
    const { data: whatsappConnections } = await supabase.from('whatsapp_connections').select('status, engine_type').eq('user_id', user.id);
    const hasMetaConnection = whatsappConnections?.some(c => c.engine_type === 'META') || false;

    // Fetch user's active subscription and plan details
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select(`
            plan_id,
            is_trial,
            trial_ends_at,
            plans (
                allowed_tabs
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('starts_at', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    // Default to all tabs allowed if no restriction is found (e.g. legacy users or no plan yet)
    // In a strict setup, you might default to an empty array.
    const plansData = subscription?.plans as any;
    const allowedTabs = plansData?.allowed_tabs || null;

    return (
        <MobileSidebarProvider>
            <div className="flex h-screen w-full overflow-hidden">
                {/* Onboarding Wizard & FAB */}
                <OnboardingController user={user} />

                {/* Fixed Sidebar */}
                <DashboardSidebar
                    user={user}
                    settings={settings}
                    stores={stores || []}
                    whatsappStatus={whatsappConnections?.[0]?.status || 'DISCONNECTED'}
                    allowedTabs={allowedTabs}
                    hasMetaConnection={hasMetaConnection}
                />

                {/* Main content area - offset by sidebar width */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden mr-0 md:mr-72">
                    {/* Fixed Header */}
                    <DashboardHeader user={user} hasMetaConnection={hasMetaConnection} />

                    {/* Scrollable page content */}
                    <div className="flex-1 overflow-y-auto bg-slate-50">
                        <RouteGuard allowedTabs={allowedTabs}>
                            {children}
                        </RouteGuard>
                    </div>
                </div>
                <NotificationToast />
            </div>
        </MobileSidebarProvider>
    );
}
