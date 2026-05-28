import AdminSidebar from './AdminSidebar'
import { createAdminClient } from '@/utils/supabase/admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = createAdminClient()
    const { data: settings } = await supabase.from('platform_settings').select('*').limit(1).single()

    return (
        <div className="flex bg-gray-50/50 min-h-screen" dir="rtl">
            <AdminSidebar settings={settings} />
            <main className="flex-1 mr-[300px] p-8 lg:p-10 h-screen overflow-y-auto custom-scrollbar relative">
                <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>

                <div className="max-w-[1400px] mx-auto space-y-8 pb-10 relative z-10 w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
