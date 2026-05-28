// @ts-nocheck
import { createAdminClient } from '@/utils/supabase/admin'
import CreditsManager from './CreditsManager'

export default async function CreditsPage() {
    const admin = createAdminClient()
    const [
        { data: profiles },
        { data: subscriptions },
        { data: plans },
        { data: authUsers }
    ] = await Promise.all([
        admin.from('user_profiles').select('id, full_name, created_at'),
        admin.from('subscriptions').select('user_id, messages_used, max_messages_override, plan_id'),
        admin.from('plans').select('id, name, max_messages'),
        admin.auth.admin.listUsers()
    ])

    const emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email]) ?? [])

    const users = profiles?.map(p => {
        const sub = subscriptions?.find(s => s.user_id === p.id)
        const plan = plans?.find(pl => pl.id === sub?.plan_id)

        const planLimit = plan?.max_messages || 0;
        const overrideLimit = sub?.max_messages_override;
        const currentLimit = (overrideLimit !== null && overrideLimit !== undefined) ? overrideLimit : planLimit;

        return {
            ...p,
            email: emailMap.get(p.id) || '—',
            messagesUsed: sub?.messages_used || 0,
            messagesLimit: currentLimit,
            planName: plan?.name || 'بدون خطة'
        }
    })

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl border border-border-color shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary to-indigo-500"></div>
                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <span className="material-symbols-outlined text-2xl">toll</span>
                        </div>
                        <h2 className="text-text-main text-3xl font-black tracking-tight font-display">إدارة الأرصدة والرسائل</h2>
                    </div>
                    <p className="text-text-sub text-base font-medium max-w-xl leading-relaxed">منح أرصدة إضافية للمستخدمين، تعديل حدود الإرسال، ومراقبة الاستهلاك الفعلي.</p>
                </div>
            </header>

            <CreditsManager initialUsers={users || []} />
        </div>
    )
}
