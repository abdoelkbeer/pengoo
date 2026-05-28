// @ts-nocheck
import { createAdminClient } from '@/utils/supabase/admin'
import PackagesManager from './PackagesManager';

export default async function BillingPackagesPage() {
    let packages: any[] = []
    let settings: any = null
    let error: any = false;

    try {
        const admin = createAdminClient()
        const [ { data: pkgs, error: fetchError }, { data: sett } ] = await Promise.all([
            admin.from('billing_packages').select('*').order('sort_order', { ascending: true }),
            admin.from('platform_settings').select('*').limit(1).single()
        ]);

        if (fetchError) {
            if (fetchError.code === '42P01') {
                error = "Table 'billing_packages' missing. Please run the SQL migration.";
            } else {
                throw fetchError;
            }
        }
        packages = pkgs || [];
        settings = sett || null;
    } catch (e) {
        console.error("Admin Billing Packages Page Error:", e);
        error = error || "فشل تحميل البيانات. تأكد من إعدادات SUPABASE_SERVICE_ROLE_KEY وتشغيل الـ SQL.";
    }

    return (
        <div className="space-y-10 pb-20 animate-fade-in">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                        <span className="material-symbols-outlined text-2xl">reorder</span>
                    </div>
                    <h2 className="text-text-main text-3xl font-black tracking-tight">باقات شحن الرصيد</h2>
                </div>
                <p className="text-text-sub text-base font-medium max-w-2xl">إدارة باقات شحن رصيد الرسائل (التي تظهر للمستخدمين في صفحة الرصيد).</p>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined font-bold">error</span>
                        <p className="font-black text-lg">تنبيه هام: يتطلب تشغيل ملف الـ SQL</p>
                    </div>
                    <p className="font-medium text-sm opacity-90 leading-relaxed">
                        الجدول الخاص بالباقات `billing_packages` غير موجود في قاعدة البيانات الخاصة بك.
                        <br />
                        يرجى التوجه إلى (Supabase Dashboard) ثم (SQL Editor) وتشغيل الكود المكتوب في ملف `migration_billing_packages.sql` الذي قمت بإنشائه لك.
                    </p>
                    <div className="mt-2 text-xs font-mono bg-white/50 p-3 rounded-lg border border-red-100">
                        Error Detail: {error === true ? 'Check Console' : error}
                    </div>
                </div>
            )}

            <section>
                <PackagesManager initialPackages={packages} initialSettings={settings} />
            </section>
        </div>
    )
}
