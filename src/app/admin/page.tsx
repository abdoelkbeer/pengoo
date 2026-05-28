import { createAdminClient } from '@/utils/supabase/admin'
import InteractiveTicketDesk from './InteractiveTicketDesk';

function StatCard({ icon, iconBg, iconColor, label, value, trend, desc }: {
  icon: string, iconBg: string, iconColor: string, label: string, value: string | number, trend?: string, desc?: string
}) {
  return (
    <div className="bg-surface rounded-2xl p-6 border border-border-color shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-white/0 rounded-full -mr-16 -mt-16 transform group-hover:scale-110 transition-transform duration-500"></div>

      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 rounded-xl ${iconBg} ${iconColor} shadow-inner`}>
          <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>
        {trend && (
          <span className="flex items-center text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold gap-1 shadow-sm border border-emerald-100">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-text-sub text-sm font-medium mb-1">{label}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-text-main text-4xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600">
            {value}
          </p>
          {desc && <span className="text-xs text-text-sub font-medium">{desc}</span>}
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 60) return `منذ ${diffMins} د`
  if (diffHours < 24) return `منذ ${diffHours} س`

  return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
}

export default async function AdminDashboardPage() {
  let stats = { totalCustomers: 0, totalMessages: 0, activeConnections: 0, activeSubscriptions: 0, totalCreditsPurchased: 0, estimatedMRR: 0, currency: 'EGP', customerTrend: '+0%', mrrTrend: '+0%', subscriptionTrend: '+0' }
  let recentTickets: any[] = []
  let recentUsers: any[] = []
  let settingsError = false

  try {
    const admin = createAdminClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const firstOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const firstOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)

    // First batch: raw counts and latest lists
    const [
      { count: totalCustomers },
      { count: lastMonthCustomers },
      { count: totalMessages },
      { count: activeConnections },
      { count: activeSubscriptions },
      { count: lastMonthSubscriptions },
      { data: tickets },
      { data: users }
    ] = await Promise.all([
      admin.from('user_profiles').select('*', { count: 'exact', head: true }),
      admin.from('user_profiles').select('*', { count: 'exact', head: true }).lt('created_at', firstOfCurrentMonth.toISOString()),
      admin.from('message_logs').select('*', { count: 'exact', head: true }).gte('sent_at', today.toISOString()),
      admin.from('whatsapp_connections').select('*', { count: 'exact', head: true }).eq('status', 'CONNECTED'),
      admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      admin.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active').lt('created_at', firstOfCurrentMonth.toISOString()),
      admin.from('support_tickets').select('id, ticket_number, subject, status, created_at, priority, user_profiles!inner(full_name)').order('created_at', { ascending: false }).limit(6),
      admin.from('user_profiles').select('id, full_name, created_at, email').order('created_at', { ascending: false }).limit(4),
    ])

    // Second batch: Revenue calculation (MRR and Credits)
    let estimatedMRR = 0;
    let lastMonthMRR = 0;

    // Fetch active subscriptions and join with plans to get the price
    const { data: activeSubsData } = await admin
      .from('subscriptions')
      .select('billing_cycle, created_at, plans!inner(price_monthly, price_yearly)')
      .eq('status', 'active');

    if (activeSubsData) {
      activeSubsData.forEach((sub: any) => {
        const monthlyValue = sub.billing_cycle === 'yearly' ? (sub.plans.price_yearly / 12) : sub.plans.price_monthly;
        estimatedMRR += monthlyValue;

        if (new Date(sub.created_at) < firstOfCurrentMonth) {
          lastMonthMRR += monthlyValue;
        }
      });
    }

    // Attempt to calculate total purchased credits
    const startOfMonth = firstOfCurrentMonth.toISOString();
    const { data: creditStats } = await admin.from('credit_transactions').select('amount').gte('amount', 0).gte('created_at', startOfMonth);
    const totalCreditsPurchased = creditStats?.reduce((acc, curr) => acc + curr.amount, 0) || 0;

    // Calculate Trends
    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? `+${current}` : '+0%';
      const diff = current - previous;
      const percent = Math.round((diff / previous) * 100);
      return percent >= 0 ? `+${percent}%` : `${percent}%`;
    };

    const calcRawDiff = (current: number, previous: number) => {
      const diff = current - previous;
      return diff >= 0 ? `+${diff}` : `${diff}`;
    };

    stats = {
      totalCustomers: totalCustomers ?? 0,
      totalMessages: totalMessages ?? 0,
      activeConnections: activeConnections ?? 0,
      activeSubscriptions: activeSubscriptions ?? 0,
      estimatedMRR: estimatedMRR,
      totalCreditsPurchased: totalCreditsPurchased,
      currency: 'EGP',
      customerTrend: calcTrend(totalCustomers ?? 0, lastMonthCustomers ?? 0),
      mrrTrend: calcTrend(estimatedMRR, lastMonthMRR),
      subscriptionTrend: calcRawDiff(activeSubscriptions ?? 0, lastMonthSubscriptions ?? 0)
    };
    recentTickets = tickets ?? []
    recentUsers = users ?? []

    // Fetch currency
    const { data: settings } = await admin.from('platform_settings').select('currency').limit(1).maybeSingle();
    stats.currency = settings?.currency || 'EGP';

  } catch (e) {
    console.error("Admin Dashboard Error:", e)
    settingsError = true
  }

  const currency = stats.currency || 'EGP';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {settingsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 shadow-sm">
          <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
          <div>
            <h4 className="font-bold">خطأ في الاتصال بقاعدة البيانات</h4>
            <p className="text-sm opacity-90">يبدو أن `SUPABASE_SERVICE_ROLE_KEY` غير مفعل بالكامل أو هناك خطأ في الاتصال.</p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-white border border-border-color rounded-3xl p-8 shadow-sm">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-400 to-purple-500"></div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-text-main text-3xl font-black font-display tracking-tight">النظرة العامة والأرباح</h2>
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-emerald-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                النظام مستقر ويعمل
              </span>
            </div>
            <p className="text-text-sub text-base font-medium max-w-xl leading-relaxed">
              مرحباً بك في لوحة تحكم شبكة بينجو. تابع سير العمليات والإيرادات الحالية واتخذ إجراءات سريعة.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <a href="/admin/reports" className="px-5 py-2.5 bg-white border border-border-color rounded-xl text-sm font-bold text-text-main hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-colors hover:border-gray-300 group">
              <span className="material-symbols-outlined text-text-sub group-hover:text-primary transition-colors text-[20px]">insights</span>
              استكشاف الأرباح
            </a>
          </div>
        </div>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon="monetization_on" iconBg="bg-emerald-50" iconColor="text-emerald-600"
          label="الدخل المتكرر الشهري (MRR)"
          value={`${stats.estimatedMRR.toLocaleString('ar-EG')} ${currency}`}
          trend={stats.mrrTrend}
          desc="مقّدر"
        />
        <StatCard
          icon="loyalty" iconBg="bg-blue-50" iconColor="text-blue-600"
          label="إجمالي المشتركين"
          value={stats.activeSubscriptions.toLocaleString('ar-EG')}
          trend={stats.subscriptionTrend}
          desc="هذا الشهر"
        />
        <StatCard
          icon="payments" iconBg="bg-purple-50" iconColor="text-purple-600"
          label="أرصدة الرسائل المباعة"
          value={stats.totalCreditsPurchased.toLocaleString('ar-EG')}
          desc="رسالة مضافة الشهر الحالي"
        />
        <StatCard
          icon="group" iconBg="bg-amber-50" iconColor="text-amber-600"
          label="إجمالي العملاء المسجلين"
          value={stats.totalCustomers.toLocaleString('ar-EG')}
          trend={stats.customerTrend}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Interactive Tickets Panel */}
          <div className="bg-surface rounded-3xl border border-border-color shadow-sm flex flex-col overflow-hidden">
            <div className="p-6 border-b border-border-color/50 flex justify-between items-center bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg border border-border-color shadow-sm">
                  <span className="material-symbols-outlined text-primary text-xl">support_agent</span>
                </div>
                <div>
                  <h3 className="text-text-main text-lg font-bold">مكتب الدعم المباشر</h3>
                  <p className="text-xs text-text-sub font-medium mt-0.5">يمكنك تغيير حالة التذكرة مباشرة من هنا لتسريع العمل</p>
                </div>
              </div>
            </div>

            {/* Embed the highly interactive Client Component instead of static table */}
            <InteractiveTicketDesk initialTickets={recentTickets} />

            {recentTickets.length > 0 && (
              <div className="p-4 border-t border-border-color/50 bg-gray-50/30 text-center">
                <a className="text-sm font-bold text-primary hover:text-blue-700 transition-colors inline-block w-full" href="/admin/support">
                  الانتقال إلى لوحة الدعم الفني الكاملة &uarr;
                </a>
              </div>
            )}
          </div>

          {/* Platform Health/Operational Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transform group-hover:scale-125 transition-transform duration-700 ease-out"></div>
              <span className="material-symbols-outlined text-white/30 text-6xl absolute left-4 bottom-4">check_circle</span>
              <h4 className="text-sm font-bold text-white/90 mb-1">جلسات واتساب النشطة</h4>
              <p className="text-4xl font-black">{stats.activeConnections}</p>
              <p className="text-xs text-white/80 mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> الاتصال المباشر مستقر</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transform group-hover:scale-125 transition-transform duration-700 ease-out"></div>
              <span className="material-symbols-outlined text-white/30 text-6xl absolute left-4 bottom-4">send</span>
              <h4 className="text-sm font-bold text-white/90 mb-1">حمولة الرسائل (آخر 24 ساعة)</h4>
              <p className="text-4xl font-black">{stats.totalMessages.toLocaleString('ar-EG')}</p>
              <p className="text-xs text-white/80 mt-2">عبر محرك الإرسال</p>
            </div>
          </div>
        </div>

        {/* Side Panel Column */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Action Center Card */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-7 text-white shadow-xl relative overflow-hidden ring-1 ring-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/30 blur-3xl rounded-full -mr-16 -mt-16"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-blue-400 text-2xl">rocket_launch</span>
                <h3 className="text-lg font-bold text-white">إجراءات التحكم</h3>
              </div>

              <div className="space-y-3">
                <button className="group flex items-center justify-between w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all hover:translate-x-1 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-emerald-400 group-hover:text-emerald-300 transition-colors">add_circle</span>
                    <span className="font-bold text-sm text-gray-100">منح رصيد لمستخدم</span>
                  </div>
                </button>

                <a href="/admin/billing-packages" className="group flex items-center justify-between w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all hover:translate-x-1">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-400 group-hover:text-amber-300 transition-colors">account_balance_wallet</span>
                    <span className="font-bold text-sm text-gray-100">إدارة باقات شحن الرصيد</span>
                  </div>
                </a>

                <a href="/admin/plans" className="group flex items-center justify-between w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all hover:translate-x-1">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-purple-400 group-hover:text-purple-300 transition-colors">edit_note</span>
                    <span className="font-bold text-sm text-gray-100">تعديل باقات الاشتراك</span>
                  </div>
                </a>

                <a href="/admin/stores" className="group flex items-center justify-between w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all hover:translate-x-1">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-blue-400 group-hover:text-blue-300 transition-colors">desktop_windows</span>
                    <span className="font-bold text-sm text-gray-100">مراقبة الجلسات المفتوحة</span>
                  </div>
                </a>

                <a href="/admin/logs" className="group flex items-center justify-between w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl p-4 transition-all hover:translate-x-1">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-400 group-hover:text-red-300 transition-colors">bug_report</span>
                    <span className="font-bold text-sm text-red-100">سجل النظام والأخطاء</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Recent Registrations Card */}
          <div className="bg-surface rounded-3xl border border-border-color shadow-sm p-6 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-text-main text-base font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">person_add</span>
                أحدث التسجيلات
              </h3>
            </div>

            <div className="space-y-4 flex-1">
              {recentUsers.length === 0 ? (
                <p className="text-text-sub text-sm text-center py-4">لا يوجد مستخدمين جدد</p>
              ) : (
                recentUsers.map((user) => (
                  <div key={user.id} className="group relative flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-primary/20 transition-all cursor-pointer overflow-hidden">
                    {/* Hover Action Banner for User */}
                    <div className="absolute inset-0 bg-primary/5 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-200 z-10 backdrop-blur-[1px]">
                      <button className="text-primary hover:text-blue-700 bg-white rounded-lg px-3 py-1 text-[11px] font-bold shadow-sm border border-primary/20">عرض التفاصيل</button>
                    </div>

                    <div className="flex items-center gap-3 relative z-0 group-hover:opacity-50 transition-opacity duration-200 w-full">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0 border border-blue-100">
                        {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-text-main truncate block">{user.full_name || 'مستخدم جديد'}</span>
                          <span className="text-[10px] font-medium text-text-sub bg-gray-100 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                            {formatDate(user.created_at)}
                          </span>
                        </div>
                        <span className="text-xs text-text-sub truncate block">{user.email}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <a href="/admin/customers" className="mt-4 pt-4 border-t border-border-color/50 text-sm font-bold text-center text-primary hover:bg-primary/5 py-2 rounded-xl transition-colors block w-full">
              عرض دليل العملاء الكامل
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
