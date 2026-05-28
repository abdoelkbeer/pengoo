import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import UserEditorModal from './UserEditorModal'

export default async function CustomersPage() {
    const admin = createAdminClient()

    // Fetch profiles, subscriptions, and plans
    const [
        { data: profiles },
        { data: subscriptions },
        { data: plans },
        { data: authUsers }
    ] = await Promise.all([
        admin.from('user_profiles').select('*').order('created_at', { ascending: false }),
        admin.from('subscriptions').select('*').order('created_at', { ascending: false }),
        admin.from('plans').select('id, name, price_monthly, max_messages, max_whatsapp_numbers, max_stores'),
        admin.auth.admin.listUsers()
    ])

    const emailMap = new Map(authUsers?.users?.map(u => [u.id, u.email]) ?? [])

    const customers = profiles?.map(profile => {
        // Find all subscriptions for this user
        const userSubs = subscriptions?.filter(s => s.user_id === profile.id) || [];
        
        // Prioritize active subscription, otherwise take the most recent one
        const sub = userSubs.find(s => s.status === 'active') || userSubs[0];
        const plan = plans?.find(p => p.id === sub?.plan_id)

        const planLimit = plan?.max_messages || 0;
        const overrideLimit = sub?.max_messages_override;
        const currentLimit = overrideLimit !== null && overrideLimit !== undefined ? overrideLimit : planLimit;

        return {
            ...profile,
            email: emailMap.get(profile.id) || '—',
            planName: plan?.name || 'بدون خطة',
            planStatus: sub?.status || 'inactive',
            messagesUsed: sub?.messages_used || 0,
            messagesLimit: currentLimit,
            planDetails: plan,
            subscription: sub
        }
    })

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl border border-border-color shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary to-green-500"></div>
                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <span className="material-symbols-outlined text-2xl">group</span>
                        </div>
                        <h2 className="text-text-main text-3xl font-black tracking-tight font-display">إدارة العملاء</h2>
                    </div>
                    <p className="text-text-sub text-base font-medium max-w-xl leading-relaxed">قائمة شاملة بجميع مستخدمي المنصة، خطط اشتراكهم، وحالة استهلاكهم للرسائل.</p>
                </div>
                <div className="z-10">
                    <UserEditorModal mode="create" plans={plans || []} />
                </div>
            </header>

            <div className="bg-white rounded-3xl border border-border-color shadow-sm overflow-hidden">
                <div className="p-6 border-b border-border-color bg-gray-50/30 flex flex-col md:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-sub">search</span>
                        <input type="text" placeholder="البحث بالاسم أو البريد الإلكتروني..."
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all text-sm" />
                    </div>
                    <div className="flex gap-2">
                        <select className="h-11 px-4 rounded-xl border border-border-color bg-white outline-none text-sm font-bold">
                            <option>جميع الخطط</option>
                            {plans?.map(p => <option key={p.id}>{p.name}</option>)}
                        </select>
                        <select className="h-11 px-4 rounded-xl border border-border-color bg-white outline-none text-sm font-bold">
                            <option>جميع الحالات</option>
                            <option>نشط</option>
                            <option>غير نشط</option>
                            <option>تجريبي</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 text-text-sub text-xs uppercase font-black tracking-wider">
                                <th className="px-6 py-4">العميل</th>
                                <th className="px-6 py-4">الخطة الحالية</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">استهلاك الرسائل</th>
                                <th className="px-6 py-4">تاريخ الانضمام</th>
                                <th className="px-6 py-4">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-color">
                            {customers?.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
                                                {customer.full_name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-text-main group-hover:text-primary transition-colors">{customer.full_name || 'مستخدم غير معروف'}</p>
                                                <p className="text-xs text-text-sub font-medium">{customer.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-black border border-blue-100">
                                            <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                                            {customer.planName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase
                                            ${customer.planStatus === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {customer.planStatus === 'active' ? 'نشط' : 'منتهي'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-32">
                                            <div className="flex justify-between text-[10px] font-bold text-text-sub mb-1">
                                                <span>{customer.messagesUsed.toLocaleString()}</span>
                                                <span>/ {customer.messagesLimit.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div className="bg-primary h-full rounded-full"
                                                    style={{ width: `${Math.min((customer.messagesUsed / (customer.messagesLimit || 1)) * 100, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-text-sub">
                                        {new Date(customer.created_at).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <Link href={`/admin/customers/${customer.id}`} className="p-2 text-text-sub hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="تفاصيل">
                                                <span className="material-symbols-outlined text-lg">visibility</span>
                                            </Link>

                                            {customer.subscription && (
                                                <UserEditorModal
                                                    mode="edit"
                                                    plans={plans || []}
                                                    userId={customer.id}
                                                    userName={customer.full_name}
                                                    userEmail={customer.email}
                                                    userPhone={customer.phone_number}
                                                    currentPlanId={customer.subscription.plan_id}
                                                    currentStatus={customer.subscription.status}
                                                    currentStartsAt={customer.subscription.starts_at}
                                                    currentEndsAt={customer.subscription.ends_at}
                                                    currentMessages={customer.planDetails?.max_messages || 0}
                                                    currentWhatsapp={customer.planDetails?.max_whatsapp_numbers || 0}
                                                    currentStores={customer.planDetails?.max_stores || 0}
                                                    overrides={{
                                                        max_messages_override: customer.subscription.max_messages_override,
                                                        max_whatsapp_numbers_override: customer.subscription.max_whatsapp_numbers_override,
                                                        max_stores_override: customer.subscription.max_stores_override
                                                    }}
                                                />
                                            )}

                                            <button className="p-2 text-text-sub hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="حظر">
                                                <span className="material-symbols-outlined text-lg">block</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {(!customers || customers.length === 0) && (
                    <div className="py-20 text-center flex flex-col items-center">
                        <span className="material-symbols-outlined text-6xl text-gray-200 mb-4 block">person_off</span>
                        <p className="text-text-sub font-bold text-lg">لا يوجد عملاء مسجلين حالياً</p>
                    </div>
                )}

                <div className="p-6 border-t border-border-color bg-gray-50/30 flex justify-between items-center">
                    <p className="text-xs font-bold text-text-sub">عرض {customers?.length || 0} عميل</p>
                    <div className="flex gap-2">
                        <button className="p-2 border border-border-color rounded-lg bg-white text-text-sub disabled:opacity-50" disabled>
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                        <button className="p-2 border border-border-color rounded-lg bg-white text-text-sub disabled:opacity-50" disabled>
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
