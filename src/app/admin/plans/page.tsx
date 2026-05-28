// @ts-nocheck
import { createAdminClient } from '@/utils/supabase/admin'
import PlansManager from './PlansManager';

function formatDate(dateStr: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function PlansPage() {
    let plans: any[] = []
    let subscriptions: any[] = []
    let currency = 'EGP'
    let error = false;

    try {
        const admin = createAdminClient()
        const [{ data: plansData }, { data: subsData }, { data: settings }] = await Promise.all([
            admin.from('plans').select('*').order('sort_order', { ascending: true }),
            admin.from('subscriptions')
                .select('id, status, starts_at, ends_at, created_at, user_profiles!inner(id, full_name), plans!inner(name)')
                .order('created_at', { ascending: false })
                .limit(50),
            admin.from('platform_settings').select('currency').limit(1).maybeSingle(),
        ])

        currency = settings?.currency || 'EGP';

        // Enrich plans with subscription counts
        const subsByPlan = new Map<string, number>()
        for (const sub of subsData ?? []) {
            if (sub.status === 'active') {
                const key = sub.plans?.name
                subsByPlan.set(key, (subsByPlan.get(key) ?? 0) + 1)
            }
        }

        const { data: authUsers } = await admin.auth.admin.listUsers()
        const emailMap = new Map(authUsers?.users?.map((u: any) => [u.id, u.email]) ?? [])

        plans = (plansData ?? []).map((p: any) => ({
            ...p,
            subscriberCount: subsByPlan.get(p.name) ?? 0,
            featuresArr: Array.isArray(p.features) ? p.features : [],
        }))
        subscriptions = (subsData ?? []).map((s: any) => ({
            ...s,
            ownerName: s.user_profiles?.full_name ?? 'مستخدم',
            ownerEmail: emailMap.get(s.user_profiles?.id) ?? '—',
            planName: s.plans?.name ?? '—',
        }))
    } catch (e) {
        console.error("Plans Page Error:", e);
        error = true;
    }

    const statusMap: Record<string, { label: string; cls: string }> = {
        active: { label: 'نشط', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
        expired: { label: 'منتهي', cls: 'bg-red-50 text-red-600 border-red-100' },
        cancelled: { label: 'ملغي', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    }

    return (
        <div className="space-y-10 pb-20 animate-fade-in">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                        <span className="material-symbols-outlined text-2xl">workspace_premium</span>
                    </div>
                    <h2 className="text-text-main text-3xl font-black tracking-tight">الخطط والاشتراكات</h2>
                </div>
                <p className="text-text-sub text-base font-medium max-w-2xl">إدارة باقات الاشتراك، تحديد الأسعار، ومراقبة المستخدمين المسجلين في كل خطة.</p>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                    <span className="material-symbols-outlined">error</span>
                    <p className="font-bold">فشل تحميل البيانات. تأكد من إعدادات SUPABASE_SERVICE_ROLE_KEY.</p>
                </div>
            )}

            {/* Interactive Plans Management Section */}
            <section>
                <PlansManager initialPlans={plans} currency={currency} />
            </section>

            {/* Active Subscriptions Detailed Table */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-text-main text-xl font-black flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-2xl">supervised_user_circle</span>
                        أحدث الاشتراكات النشطة
                    </h3>
                </div>

                <div className="bg-white border border-border-color rounded-3xl shadow-sm overflow-hidden">
                    {subscriptions.length === 0 ? (
                        <div className="p-16 text-center text-text-sub flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-6xl opacity-20">history</span>
                            <p className="font-bold">لا توجد اشتراكات مسجلة حالياً</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-separate border-spacing-0">
                                <thead className="bg-gray-50/50 text-text-sub text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-border-color">المستخدم</th>
                                        <th className="px-6 py-4 border-b border-border-color text-center">الخطة</th>
                                        <th className="px-6 py-4 border-b border-border-color text-center">الحالة</th>
                                        <th className="px-6 py-4 border-b border-border-color">تاريخ البدء</th>
                                        <th className="px-6 py-4 border-b border-border-color">تاريخ الانتهاء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-color/50">
                                    {subscriptions.map((sub) => {
                                        const sm = statusMap[sub.status] ?? { label: sub.status, cls: 'bg-gray-100 text-gray-600 border-gray-200' }
                                        return (
                                            <tr key={sub.id} className="hover:bg-primary/5 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-500 border border-white shadow-sm">
                                                            {sub.ownerName.charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-text-main group-hover:text-primary transition-colors">{sub.ownerName}</span>
                                                            <span className="text-xs text-text-sub">{sub.ownerEmail}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className="inline-block bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-black border border-amber-100">
                                                        {sub.planName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black border ${sm.cls}`}>
                                                        {sm.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-medium text-text-main">{formatDate(sub.starts_at)}</p>
                                                    <p className="text-[10px] text-text-sub">وقت البدء</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <p className="text-sm font-medium text-text-main">{sub.ends_at ? formatDate(sub.ends_at) : 'لا ينتهي'}</p>
                                                    <p className="text-[10px] text-text-sub">تاريخ التجديد/الانتهاء</p>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
