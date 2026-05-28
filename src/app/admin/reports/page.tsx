// @ts-nocheck
import { createAdminClient } from '@/utils/supabase/admin'
import { SystemChart, SystemStatsGrid } from './SystemCharts'

export default async function ReportsPage() {
    let data: any = {
        totalUsers: 0, totalStores: 0, totalMessages: 0, todayMessages: 0,
        sentMessages: 0, failedMessages: 0, pendingMessages: 0,
        topUsers: [], userGrowth: [], messageVolume: [],
        estimatedMRR: 0, monthlyUserGrowth: 0, successRate: 0, activeStoresCount: 0,
        recoveryRate: 0, criticalErrors: 0, openTickets: 0
    }

    let currency = 'EGP';

    try {
        const admin = createAdminClient()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const monthAgo = new Date()
        monthAgo.setDate(monthAgo.getDate() - 30)

        const [
            { count: totalUsers },
            { count: totalStores },
            { count: totalMessages },
            { count: todayMessages },
            { count: sentMessages },
            { count: failedMessages },
            { count: pendingMessages },
            { data: messageLogs },
            { data: userProfilesMonth },
            { data: activeSubscriptions },
            { data: allPlans },
            { data: settings },
            { count: totalCarts },
            { count: recoveredCarts },
            { count: criticalErrors },
            { count: openTickets }
        ] = await Promise.all([
            admin.from('user_profiles').select('*', { count: 'exact', head: true }),
            admin.from('stores').select('*', { count: 'exact', head: true }),
            admin.from('message_logs').select('*', { count: 'exact', head: true }),
            admin.from('message_logs').select('*', { count: 'exact', head: true }).gte('sent_at', today.toISOString()),
            admin.from('message_logs').select('*', { count: 'exact', head: true }).eq('status', 'SENT'),
            admin.from('message_logs').select('*', { count: 'exact', head: true }).eq('status', 'FAILED'),
            admin.from('message_logs').select('*', { count: 'exact', head: true }).eq('status', 'PENDING'),
            admin.from('message_logs').select('user_id, sent_at, status').gte('sent_at', monthAgo.toISOString()),
            admin.from('user_profiles').select('id, full_name, created_at').gte('created_at', monthAgo.toISOString()),
            admin.from('subscriptions').select('plan_id, status'),
            admin.from('plans').select('id, price_monthly'),
            admin.from('platform_settings').select('currency').limit(1).maybeSingle(),
            admin.from('abandoned_carts').select('*', { count: 'exact', head: true }),
            admin.from('abandoned_carts').select('*', { count: 'exact', head: true }).eq('status', 'RECOVERED'),
            admin.from('system_logs').select('*', { count: 'exact', head: true }).in('level', ['ERROR', 'CRITICAL']).gte('created_at', today.toISOString()),
            admin.from('support_tickets').select('*', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        ])

        currency = settings?.currency || 'EGP';

        // User Growth calculation
        const growthMap = new Map<string, number>()
        for (let i = 0; i < 30; i++) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            growthMap.set(d.toISOString().split('T')[0], 0)
        }
        userProfilesMonth?.forEach(u => {
            const date = u.created_at.split('T')[0]
            if (growthMap.has(date)) growthMap.set(date, (growthMap.get(date) || 0) + 1)
        })
        const userGrowth = Array.from(growthMap.entries())
            .map(([label, value]) => ({ label: label.split('-').slice(1).join('/'), value }))
            .reverse()

        // Message Volume calculation
        const volumeMap = new Map<string, number>()
        for (let i = 0; i < 30; i++) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            volumeMap.set(d.toISOString().split('T')[0], 0)
        }
        messageLogs?.forEach(log => {
            const date = log.sent_at?.split('T')[0]
            if (volumeMap.has(date)) volumeMap.set(date, (volumeMap.get(date) || 0) + 1)
        })
        const messageVolume = Array.from(volumeMap.entries())
            .map(([label, value]) => ({ label: label.split('-').slice(1).join('/'), value }))
            .reverse()

        // Top users by message volume
        const userMsgCount = new Map<string, number>()
        for (const log of messageLogs ?? []) {
            userMsgCount.set(log.user_id, (userMsgCount.get(log.user_id) ?? 0) + 1)
        }
        const topUserIds = [...userMsgCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

        let topUsers: any[] = []
        if (topUserIds.length > 0) {
            const { data: profiles } = await admin.from('user_profiles').select('id, full_name').in('id', topUserIds.map(([id]) => id))
            const { data: authUsers } = await admin.auth.admin.listUsers()
            const emailMap = new Map(authUsers?.users?.map((u: any) => [u.id, u.email]) ?? [])
            topUsers = topUserIds.map(([id, count]) => {
                const profile = profiles?.find((p: any) => p.id === id)
                return { name: profile?.full_name ?? 'مستخدم', email: emailMap.get(id) ?? '—', count }
            })
        }

        // MRR Calculation
        let estimatedMRR = 0
        activeSubscriptions?.filter(s => s.status === 'active')?.forEach(sub => {
            const plan = allPlans?.find(p => p.id === sub.plan_id)
            if (plan) estimatedMRR += plan.price_monthly
        })

        const successRate = totalMessages > 0 ? Math.round((sentMessages / totalMessages) * 100) : 0
        const recoveryRate = totalCarts > 0 ? Math.round((recoveredCarts / totalCarts) * 100) : 0

        data = {
            totalUsers: totalUsers ?? 0, totalStores: totalStores ?? 0,
            totalMessages: totalMessages ?? 0, todayMessages: todayMessages ?? 0,
            sentMessages: sentMessages ?? 0, failedMessages: failedMessages ?? 0,
            pendingMessages: pendingMessages ?? 0, topUsers,
            userGrowth, messageVolume,
            estimatedMRR, monthlyUserGrowth: userProfilesMonth?.length || 0,
            successRate, activeStoresCount: totalStores ?? 0,
            recoveryRate, criticalErrors: criticalErrors ?? 0, openTickets: openTickets ?? 0
        }
    } catch (e) {
        console.error('Reports Data Error:', e)
    }

    const sentPct = data.totalMessages > 0 ? Math.round((data.sentMessages / data.totalMessages) * 100) : 0
    const failedPct = data.totalMessages > 0 ? Math.round((data.failedMessages / data.totalMessages) * 100) : 0
    const pendingPct = data.totalMessages > 0 ? Math.round((data.pendingMessages / data.totalMessages) * 100) : 0

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl border border-border-color shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary to-purple-500"></div>
                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <span className="material-symbols-outlined text-2xl">analytics</span>
                        </div>
                        <h2 className="text-text-main text-3xl font-black tracking-tight font-display">التقارير والإحصائيات</h2>
                    </div>
                    <p className="text-text-sub text-base font-medium max-w-xl leading-relaxed">تحليل كامل لأداء المنصة، نمو المستخدمين، وحجم الرسائل والعمليات.</p>
                </div>
            </header>

            <SystemStatsGrid data={data} currency={currency} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SystemChart title="نمو المستخدمين الجدد" data={data.userGrowth} color="#3b82f6" type="line" />
                <SystemChart title="حجم الرسائل المرسلة" data={data.messageVolume} color="#8b5cf6" type="bar" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Messages by Status */}
                <div className="bg-white border border-border-color rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <span className="material-symbols-outlined text-primary">pie_chart</span>
                        <h3 className="text-text-main text-xl font-black">حالة الرسائل الكلية</h3>
                    </div>
                    <div className="space-y-6">
                        {[
                            { label: 'تم الإرسال بنجاح', count: data.sentMessages, pct: sentPct, cls: 'bg-green-500', icon: 'check_circle' },
                            { label: 'فشل في الإرسال', count: data.failedMessages, pct: failedPct, cls: 'bg-red-500', icon: 'error' },
                            { label: 'في انتظار المعالجة', count: data.pendingMessages, pct: pendingPct, cls: 'bg-amber-400', icon: 'schedule' },
                        ].map((item) => (
                            <div key={item.label} className="group">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`material-symbols-outlined text-sm ${item.cls.replace('bg-', 'text-')}`}>{item.icon}</span>
                                        <span className="text-sm font-bold text-text-sub group-hover:text-text-main transition-colors">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-black text-text-main">{item.count.toLocaleString('ar-EG')} <span className="text-xs text-text-sub font-normal">({item.pct}%)</span></span>
                                </div>
                                <div className="w-full bg-gray-50 rounded-full h-3 overflow-hidden border border-gray-100 p-0.5">
                                    <div className={`${item.cls} h-full rounded-full transition-all duration-1000 ease-out shadow-sm`} style={{ width: `${item.pct}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {data.totalMessages === 0 && (
                        <p className="text-center text-text-sub text-sm mt-8 py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">لا توجد رسائل مسجلة بعد</p>
                    )}
                </div>

                {/* Top Users */}
                <div className="bg-white border border-border-color rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-8">
                        <span className="material-symbols-outlined text-primary">leaderboard</span>
                        <h3 className="text-text-main text-xl font-black">المستخدمون الأكثر نشاطاً</h3>
                    </div>
                    {data.topUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-text-sub bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <span className="material-symbols-outlined text-5xl mb-3 opacity-20">person_off</span>
                            <p className="font-bold">لا توجد بيانات نشاط حالياً</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.topUsers.map((user: any, idx: number) => (
                                <div key={user.email} className="flex items-center gap-5 p-4 rounded-2xl border border-transparent hover:border-border-color hover:bg-gray-50 transition-all group">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg
                                        ${idx === 0 ? 'bg-gradient-to-br from-amber-300 to-amber-500 shadow-amber-200' :
                                            idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 shadow-gray-200' :
                                                idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 shadow-orange-200' :
                                                    'bg-gradient-to-br from-blue-300 to-blue-500 shadow-blue-200'}`}>
                                        {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-base font-black text-text-main truncate group-hover:text-primary transition-colors">{user.name}</p>
                                        <p className="text-xs text-text-sub truncate font-medium">{user.email}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-black text-primary">{user.count.toLocaleString('ar-EG')}</p>
                                        <p className="text-[10px] text-text-sub font-bold uppercase">رسالة</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
