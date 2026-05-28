import { createAdminClient } from '@/utils/supabase/admin'
import TicketDeskClient from './TicketDeskClient'

export default async function SupportPage() {
    const admin = createAdminClient()
    const { data: tickets } = await admin.from('support_tickets').select('*, user_profiles(full_name)').order('created_at', { ascending: false })

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl border border-border-color shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary to-orange-500"></div>
                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <span className="material-symbols-outlined text-2xl">support_agent</span>
                        </div>
                        <h2 className="text-text-main text-3xl font-black tracking-tight font-display">مكتب الدعم والمساعدة</h2>
                    </div>
                    <p className="text-text-sub text-base font-medium max-w-xl leading-relaxed">إدارة تذاكر الدعم الفني، التواصل مع العملاء وحل المشكلات التقنية.</p>
                </div>
            </header>

            <TicketDeskClient initialTickets={tickets || []} />
        </div>
    )
}
