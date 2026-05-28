import { createAdminClient } from '@/utils/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/utils/format'

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const admin = createAdminClient()
    const { id: userId } = await params

    const [
        { data: profile },
        { data: subscription },
        { data: invoices },
        { data: authUser }
    ] = await Promise.all([
        admin.from('user_profiles').select('*').eq('id', userId).single(),
        admin.from('subscriptions').select('*, plans(*)').eq('user_id', userId).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        admin.from('invoices').select('*, plans(name)').eq('user_id', userId).order('created_at', { ascending: false }),
        admin.auth.admin.getUserById(userId)
    ])

    if (!profile) return notFound()

    const formatDate = (date: string) => new Date(date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });

    // Calculate upcoming invoice
    const upcomingDate = subscription?.ends_at ? new Date(subscription.ends_at) : null;

    return (
        <div className="p-8 space-y-8 animate-fade-in">
            {/* Breadcrumbs & Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm font-bold text-text-sub">
                    <Link href="/admin/customers" className="hover:text-primary transition-colors">العملاء</Link>
                    <span className="material-symbols-outlined text-xs">chevron_left</span>
                    <span className="text-text-main">{profile.full_name}</span>
                </div>

                <header className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl border border-border-color shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary to-blue-500"></div>
                    <div className="flex items-center gap-6 z-10">
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-black shadow-inner">
                            {profile.full_name?.[0] || 'U'}
                        </div>
                        <div className="flex flex-col gap-1">
                            <h2 className="text-text-main text-3xl font-black tracking-tight font-display">{profile.full_name}</h2>
                            <p className="text-text-sub text-base font-medium">{authUser.user?.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${subscription ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {subscription ? 'مشترك نشط' : 'بدون اشتراك'}
                                </span>
                                <span className="px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                                    ID: {userId.slice(0, 8)}...
                                </span>
                            </div>
                        </div>
                    </div>
                </header>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Subscriptions & Limits */}
                <div className="lg:col-span-1 space-y-8">
                    <section className="bg-white rounded-3xl border border-border-color shadow-sm p-6 space-y-6">
                        <h3 className="font-black text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">workspace_premium</span>
                            تفاصيل الاشتراك
                        </h3>

                        {subscription ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-xs font-black text-gray-400 uppercase mb-1">الباقة الحالية</p>
                                    <p className="text-xl font-black text-primary">{subscription.plans?.name}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-black text-gray-400 uppercase mb-1">الاستهلاك</p>
                                        <p className="text-lg font-black">{subscription.messages_used}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <p className="text-xs font-black text-gray-400 uppercase mb-1">الحد الأقصى</p>
                                        <p className="text-lg font-black">{subscription.max_messages_override || subscription.plans?.max_messages}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <p className="text-xs font-black text-blue-400 uppercase mb-1 text-center">تاريخ التجديد القادم</p>
                                    <p className="text-lg font-black text-blue-700 text-center">{formatDate(subscription.ends_at)}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <span className="material-symbols-outlined text-4xl mb-2">subtitles_off</span>
                                <p className="font-bold">لا يوجد اشتراك نشط</p>
                            </div>
                        )}
                    </section>

                    <section className="bg-white rounded-3xl border border-border-color shadow-sm p-6 space-y-6">
                        <h3 className="font-black text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">calendar_today</span>
                            الفاتورة القادمة المتوقعة
                        </h3>
                        {upcomingDate ? (
                            <div className="p-6 bg-gradient-to-br from-primary/5 to-blue-50 rounded-3xl border border-primary/10 flex flex-col items-center text-center gap-4">
                                <div className="size-16 rounded-full bg-white shadow-sm flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-3xl">receipt_long</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-500">من المتوقع إصدارها في:</p>
                                    <p className="text-2xl font-black text-gray-900 mt-1">{formatDate(upcomingDate.toISOString())}</p>
                                </div>
                                <div className="w-full h-px bg-gray-200"></div>
                                <div className="flex justify-between w-full text-xs font-black uppercase text-gray-400">
                                    <span>المبلغ المتوقع</span>
                                    <span className="text-primary">{subscription?.plans?.price_monthly} {formatCurrency(profile.currency || 'EGP')}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 py-4 font-bold">لا توجد فواتير قادمة متوقعة.</p>
                        )}
                    </section>
                </div>

                {/* Right Column: Invoices History */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="bg-white rounded-3xl border border-border-color shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-6 border-b border-border-color flex justify-between items-center">
                            <h3 className="font-black text-lg flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">history</span>
                                سجل الفواتير
                            </h3>
                            <Link
                                href="/admin/invoices"
                                className="text-primary text-xs font-black hover:underline"
                            >
                                عرض الكل
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-gray-50 text-text-sub text-[10px] font-black uppercase tracking-wider">
                                        <th className="px-6 py-4">رقم الفاتورة</th>
                                        <th className="px-6 py-4">التاريخ</th>
                                        <th className="px-6 py-4">المبلغ</th>
                                        <th className="px-6 py-4 text-center">الحالة</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-color">
                                    {invoices?.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4 font-mono font-black text-gray-700">#{inv.invoice_number.toString().padStart(5, '0')}</td>
                                            <td className="px-6 py-4 text-xs font-medium text-gray-500">
                                                {formatDate(inv.created_at)}
                                            </td>
                                            <td className="px-6 py-4 font-black">
                                                <span className="text-primary">{inv.amount}</span> <span className="text-[10px] text-gray-400 uppercase">{formatCurrency(inv.currency)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase
                                                    ${inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                        inv.status === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                                    {inv.status === 'paid' ? 'مدفوعة' : inv.status === 'pending' ? 'نشطة' : 'متأخرة'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-left">
                                                <button className="p-2 text-gray-300 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-lg">download</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {(!invoices || invoices.length === 0) && (
                            <div className="py-20 text-center flex flex-col items-center">
                                <span className="material-symbols-outlined text-6xl text-gray-100 mb-4">description</span>
                                <p className="text-gray-400 font-bold">لا يوجد فواتير مسجلة لهذا العميل</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}
