import React from 'react';
import { createClient } from '@/utils/supabase/server';
import PendingMessagesBanner from './PendingMessagesBanner';

export default async function Page() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>يرجى تسجيل الدخول للوصول إلى لوحة التحكم.</div>;
    }

    // ====== Parallel Data Fetching ======
    const [
        { data: platformSettings },
        { data: subscription },
        notificationsResponse,
        connectionsCountResponse,
        { data: activeStores },
        { data: connectionData },
        { data: recentLogs },
        campaignsCountResponse
    ] = await Promise.all([
        supabase.from('platform_settings').select('currency').limit(1).maybeSingle(),
        supabase.from('subscriptions').select('*, plans(*)').eq('user_id', user.id).eq('status', 'active').order('starts_at', { ascending: false }).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('notification_rules').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('whatsapp_connections').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'CONNECTED'),
        supabase.from('stores').select('id').eq('user_id', user.id).eq('is_active', true),
        supabase.from('whatsapp_connections').select('phone_number, status').eq('user_id', user.id).order('status', { ascending: true }).order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('message_logs').select('*').eq('user_id', user.id).order('sent_at', { ascending: false }).limit(5),
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['SCHEDULED', 'ACTIVE'])
    ]);

    const notificationsCount = notificationsResponse.count || 0;
    const activeConnections = connectionsCountResponse.count || 0;
    const campaignsCount = campaignsCountResponse.count || 0;

    const currency = platformSettings?.currency || 'EGP';

    const rawSubscription: any = subscription;
    const plan = rawSubscription?.plans;
    const planName = plan?.name || 'مجاني';

    // Use overrides from subscription if they exist, otherwise fallback to plan defaults
    const maxMessages = rawSubscription?.max_messages_override || plan?.max_messages || 500;
    const isUnlimited = maxMessages >= 999999 || maxMessages === -1;
    const messagesUsed = rawSubscription?.messages_used || 0;
    const messagesRemaining = isUnlimited ? maxMessages : Math.max(0, maxMessages - messagesUsed);

    const maxWhatsapp = rawSubscription?.max_whatsapp_numbers_override || plan?.max_whatsapp_numbers || 1;

    const renewalDate = rawSubscription?.ends_at
        ? new Date(rawSubscription.ends_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;

    const isStoreConnected = activeStores && activeStores.length > 0;

    // ====== Onboarding Checklist ======
    const isWhatsappConnected = activeConnections > 0;
    const hasNotificationRules = notificationsCount > 0;
    const onboardingComplete = isWhatsappConnected && isStoreConnected && hasNotificationRules;
    const onboardingDoneCount = [isWhatsappConnected, isStoreConnected, hasNotificationRules].filter(Boolean).length;

    // ====== Messages usage percentage ======
    const usagePercent = isUnlimited ? 0 : maxMessages > 0 ? Math.min(100, Math.round((messagesUsed / maxMessages) * 100)) : 0;

    return (
        <>
            <div className="p-4 md:p-8 pb-20">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900">مرحباً بك، {user?.user_metadata?.full_name?.split(' ')[0] || 'أهلاً'} 👋</h2>
                            <p className="text-slate-500 mt-1">إليك نظرة عامة على نشاط متجرك وحالة الاتصال اليوم.</p>
                        </div>
                        <div className="flex gap-3">
                            <a href="/dashboard/logs?export=csv" className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                تحميل التقارير
                            </a>
                            <a href="/dashboard/campaigns" className="bg-primary hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                حملة جديدة
                            </a>
                        </div>
                    </div>

                    {/* Plan Banner — Dynamic */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-l from-primary to-blue-700 rounded-2xl px-6 py-5 text-white shadow-lg shadow-blue-200 gap-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-12">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                    <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                                </div>
                                <div>
                                    <p className="text-blue-100 text-xs font-medium">باقتك الحالية</p>
                                    <h3 className="text-lg font-bold">باقة {planName}</h3>
                                </div>
                            </div>
                            <div className="hidden md:flex items-center gap-8">
                                <div className="text-center">
                                    <p className="text-blue-100 text-xs">{isUnlimited ? 'رسائل غير محدودة' : 'الرسائل المتبقية'}</p>
                                    <p className={`text-xl font-bold ${isUnlimited ? 'font-serif text-3xl leading-5 mt-1' : ''}`}>
                                        {isUnlimited ? '∞' : `${messagesRemaining.toLocaleString()}/${maxMessages.toLocaleString()}`}
                                    </p>
                                    {!isUnlimited && (
                                        <div className="w-20 h-1.5 bg-white/20 rounded-full mt-1.5 mx-auto overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${usagePercent > 80 ? 'bg-red-400' : 'bg-white/80'}`} style={{ width: `${100 - usagePercent}%` }}></div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-blue-100 text-xs">الأرقام المتاحة</p>
                                    <p className="text-xl font-bold">
                                        {activeConnections || 0}/{maxWhatsapp >= 999999 ? '∞' : maxWhatsapp}
                                    </p>
                                </div>
                                {renewalDate && (
                                    <div className="text-center">
                                        <p className="text-blue-100 text-xs">تاريخ التجديد</p>
                                        <p className="text-sm font-bold">{renewalDate}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <a href="/dashboard/plans" className="flex items-center gap-2 bg-white text-primary font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors shadow-sm shrink-0">
                            <span className="material-symbols-outlined text-lg">upgrade</span>
                            ترقية الباقة
                        </a>
                    </div>

                    {/* Pending Messages Banner */}
                    <PendingMessagesBanner />

                    {/* Setup Guide — Vertical Checklist (only when incomplete) */}
                    {!onboardingComplete && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                        <span className="material-symbols-outlined">rocket_launch</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">ابدأ رحلتك مع بينجو</h3>
                                        <p className="text-xs text-slate-500">أكمل الخطوات التالية لتفعيل متجرك بالكامل</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 bg-primary/5 text-primary px-3 py-1.5 rounded-full text-xs font-bold border border-primary/10">
                                    <span>{onboardingDoneCount} / 3 مهام مكتملة</span>
                                    <div className="w-16 h-1.5 bg-primary/10 rounded-full overflow-hidden shrink-0">
                                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(onboardingDoneCount / 3) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {/* Step 1 */}
                                <div className="p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`mt-0.5 flex items-center justify-center size-7 rounded-full border-2 text-xs font-bold shrink-0 ${isWhatsappConnected ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 text-slate-400'}`}>
                                            {isWhatsappConnected ? <span className="material-symbols-outlined text-sm">check</span> : '1'}
                                        </div>
                                        <div className={isWhatsappConnected ? 'opacity-60' : ''}>
                                            <h4 className={`font-bold text-[15px] ${isWhatsappConnected ? 'text-slate-500 line-through' : 'text-slate-900'}`}>ربط رقم واتساب</h4>
                                            {!isWhatsappConnected && <p className="text-slate-500 text-sm mt-1">اربط رقمك لتبدأ بإرسال واستقبال الرسائل التلقائية.</p>}
                                        </div>
                                    </div>
                                    {!isWhatsappConnected && (
                                        <a href="/dashboard/connections" className="bg-primary hover:bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors shrink-0 shadow-sm">
                                            ربط الآن
                                        </a>
                                    )}
                                </div>
                                {/* Step 2 */}
                                <div className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div className={`mt-0.5 flex items-center justify-center size-7 rounded-full border-2 text-xs font-bold shrink-0 ${isStoreConnected ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 text-slate-400'}`}>
                                        {isStoreConnected ? <span className="material-symbols-outlined text-sm">check</span> : '2'}
                                    </div>
                                    <div className={`flex-1 ${isStoreConnected ? 'opacity-60' : ''}`}>
                                        <h4 className={`font-bold text-[15px] ${isStoreConnected ? 'text-slate-500 line-through' : 'text-slate-900'}`}>ربط متجرك الإلكتروني</h4>
                                        {!isStoreConnected && <p className="text-slate-500 text-sm mt-1 mb-3">اختر منصة متجرك لربطها فوراً مع واتساب.</p>}
                                        {!isStoreConnected && (
                                            <div className="flex flex-wrap gap-2">
                                                <a href="/dashboard/integrations/woocommerce" className="text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium">ووكومرس</a>
                                                <a href="/dashboard/integrations/salla" className="text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium">سلة</a>
                                                <a href="/dashboard/integrations" className="text-xs border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg font-medium">منصات أخرى</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Step 3 */}
                                <div className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                                    <div className={`mt-0.5 flex items-center justify-center size-7 rounded-full border-2 text-xs font-bold shrink-0 ${hasNotificationRules ? 'border-green-500 bg-green-500 text-white' : 'border-slate-300 text-slate-400'}`}>
                                        {hasNotificationRules ? <span className="material-symbols-outlined text-sm">check</span> : '3'}
                                    </div>
                                    <div className={`flex-1 ${hasNotificationRules ? 'opacity-60' : ''}`}>
                                        <h4 className={`font-bold text-[15px] ${hasNotificationRules ? 'text-slate-500 line-through' : 'text-slate-900'}`}>إنشاء أول رسالة تلقائية</h4>
                                        {!hasNotificationRules && <p className="text-slate-500 text-sm mt-1 mb-3">أعد رسالة ترحيب أو إشعار عند تغيير حالة الطلب.</p>}
                                        {!hasNotificationRules && (
                                            <a href="/dashboard/customer-messages" className="text-xs bg-primary/5 hover:bg-primary/10 text-primary px-4 py-1.5 rounded-lg font-bold inline-block border border-primary/10">إنشاء رسالة</a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex flex-col gap-3 group hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-100 transition-colors">
                                    <span className="material-symbols-outlined text-xl">wifi</span>
                                </div>
                                <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg ${activeConnections > 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                    {activeConnections > 0 ? 'متصل' : 'غير متصل'}
                                </span>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-medium mb-0.5">أرقام واتساب</p>
                                <h3 className="text-xl font-bold text-slate-900">{activeConnections} <span className="text-sm text-slate-400 font-medium">/ {maxWhatsapp}</span></h3>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex flex-col gap-3 group hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-100 transition-colors">
                                    <span className="material-symbols-outlined text-xl">storefront</span>
                                </div>
                                <span className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg ${isStoreConnected ? 'text-green-600 bg-green-50' : 'text-slate-400 bg-slate-50'}`}>
                                    {isStoreConnected ? 'نشط' : 'غير مربوط'}
                                </span>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-medium mb-0.5">المتاجر المربوطة</p>
                                <h3 className="text-xl font-bold text-slate-900">{isStoreConnected ? `${activeStores.length} متجر` : 'غير مربوط'}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex flex-col gap-3 group hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <span className="material-symbols-outlined text-xl">mark_email_read</span>
                                </div>
                                <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">
                                    {notificationsCount || 0} قاعدة
                                </span>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-medium mb-0.5">رسائل تلقائية</p>
                                <h3 className="text-xl font-bold text-slate-900">{notificationsCount || 0}</h3>
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex flex-col gap-3 group hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start">
                                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-600 group-hover:bg-orange-100 transition-colors">
                                    <span className="material-symbols-outlined text-xl">campaign</span>
                                </div>
                                <span className="flex items-center gap-1 text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">
                                    {campaignsCount || 0} حملة
                                </span>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs font-medium mb-0.5">الحملات النشطة</p>
                                <h3 className="text-xl font-bold text-slate-900">{campaignsCount || 0}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            {/* Connection Status */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="font-bold text-lg text-slate-900">حالة الاتصال</h3>
                                    <a href="/dashboard/connections" className="text-primary text-sm font-medium hover:underline">إدارة الاتصالات</a>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="relative">
                                        <div className={`size-14 rounded-full flex items-center justify-center ${connectionData?.status === 'CONNECTED' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                                            <span className="material-symbols-outlined text-2xl">{connectionData?.status === 'CONNECTED' ? 'check_circle' : 'phonelink_off'}</span>
                                        </div>
                                        <span className={`absolute bottom-0 right-0 size-3.5 border-2 border-white rounded-full ${connectionData?.status === 'CONNECTED' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                    </div>
                                    <div className="flex-1 text-center sm:text-right">
                                        <h4 className="font-bold text-slate-900">
                                            {connectionData?.status === 'CONNECTED' ? `الرقم المتصل: ${connectionData.phone_number || 'غير معروف'}` : 'لا يوجد اتصال حالي'}
                                        </h4>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {connectionData?.status === 'CONNECTED' ? 'الجلسة نشطة ويتم إرسال الرسائل بنجاح.' : 'يرجى ربط رقم واتساب للبدء في الإرسال.'}
                                        </p>
                                    </div>
                                    <a href="/dashboard/connections" className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors text-center block">
                                        {connectionData?.status === 'CONNECTED' ? 'إدارة الاتصال' : 'ربط الآن'}
                                    </a>
                                </div>
                            </div>

                            {/* Recent Logs */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                                <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-slate-900">آخر الإرساليات</h3>
                                    <a href="/dashboard/logs" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm">filter_list</span>
                                        عرض الكل
                                    </a>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-right">
                                        <thead className="bg-slate-50 text-slate-500 font-medium">
                                            <tr>
                                                <th className="px-6 py-3.5">المستلم</th>
                                                <th className="px-6 py-3.5">الرسالة</th>
                                                <th className="px-6 py-3.5">الوقت</th>
                                                <th className="px-6 py-3.5">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {recentLogs && recentLogs.length > 0 ? recentLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-3.5 font-medium text-slate-900" dir="ltr">{log.recipient_phone}</td>
                                                    <td className="px-6 py-3.5 text-slate-600 max-w-[160px] truncate">{log.message_body?.substring(0, 30)}...</td>
                                                    <td className="px-6 py-3.5 text-slate-500 text-xs whitespace-nowrap">{new Date(log.sent_at).toLocaleDateString('ar-SA')} - {new Date(log.sent_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</td>
                                                    <td className="px-6 py-3.5">
                                                        {log.status === 'SENT' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                                <span className="size-1.5 rounded-full bg-green-500"></span>
                                                                تم الإرسال
                                                            </span>
                                                        ) : log.status === 'FAILED' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                                <span className="size-1.5 rounded-full bg-red-500"></span>
                                                                فشل
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-100">
                                                                <span className="size-1.5 rounded-full bg-yellow-500"></span>
                                                                قيد الانتظار
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                                        لا توجد إرساليات سابقة حتى الآن.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {recentLogs && recentLogs.length > 0 && (
                                    <div className="p-4 border-t border-slate-50 text-center">
                                        <a href="/dashboard/logs" className="text-sm font-medium text-primary hover:text-blue-700">عرض كل السجلات</a>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Messages Usage Card */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                                <h3 className="font-bold text-sm text-slate-900 mb-3">استهلاك الرسائل</h3>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-500">المستخدمة</span>
                                    <span className={`text-xs font-bold text-slate-700 ${isUnlimited ? 'flex items-center gap-1.5' : ''}`}>
                                        {messagesUsed.toLocaleString()} من {isUnlimited ? <span className="font-serif text-lg leading-none">∞</span> : maxMessages.toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${isUnlimited ? 'bg-green-500' : usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: isUnlimited ? '100%' : `${usagePercent}%` }}></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-2">{isUnlimited ? 'تتمتع برسائل غير محدودة في باقتك' : usagePercent > 80 ? '⚠️ رصيدك على وشك النفاد — رقّي باقتك' : `متبقي ${messagesRemaining.toLocaleString()} رسالة`}</p>
                                {usagePercent > 80 && !isUnlimited && (
                                    <a href="/dashboard/plans" className="mt-3 block text-center text-xs font-bold text-primary bg-primary/10 py-2 rounded-lg hover:bg-primary/20 transition-colors">ترقية الباقة الآن</a>
                                )}
                            </div>

                            {/* Integrations Suggestions */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                                <h3 className="font-bold text-sm text-slate-900 mb-4">استخدم بينجو مع</h3>
                                <div className="space-y-3">
                                    <a href="/dashboard/integrations" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                                        <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <span className="material-symbols-outlined text-lg">shopping_bag</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">ووكومرس · سلة · زد</h4>
                                            <p className="text-[11px] text-slate-400">ربط تلقائي مع إشعارات الطلبات</p>
                                        </div>
                                    </a>
                                    <a href="/dashboard/emulator" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                                        <div className="w-9 h-9 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <span className="material-symbols-outlined text-lg">science</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">جرّب الإرسال مجاناً</h4>
                                            <p className="text-[11px] text-slate-400">اختبر رسائلك بدون أي تكلفة</p>
                                        </div>
                                    </a>
                                    <a href="/dashboard/abandoned-cart" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                                        <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <span className="material-symbols-outlined text-lg">shopping_cart_checkout</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">السلة المتروكة</h4>
                                            <p className="text-[11px] text-slate-400">استرجع المبيعات المفقودة تلقائياً</p>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            {/* Help Card */}
                            <div className="bg-primary/5 rounded-2xl border border-primary/10 p-5">
                                <div className="flex gap-3">
                                    <div className="mt-1 text-primary">
                                        <span className="material-symbols-outlined">support_agent</span>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">هل تحتاج مساعدة؟</h4>
                                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">فريقنا جاهز لمساعدتك في إعداد متجرك وربط واتساب.</p>
                                        <a href="/dashboard/support" className="mt-3 text-xs font-bold text-primary hover:text-blue-700 block">تواصل مع الدعم ←</a>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-400">
                                <a className="hover:text-slate-600" href="/privacy">سياسة الخصوصية</a>
                                <span className="text-slate-300">•</span>
                                <a className="hover:text-slate-600" href="/terms">شروط الاستخدام</a>
                                <span>•</span>
                                <span>بينجو © 2026</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
