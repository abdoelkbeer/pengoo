// @ts-nocheck
import { createAdminClient } from '@/utils/supabase/admin'
import SeoClient from './SeoClient'

export default async function SeoPage() {
    const admin = createAdminClient()
    let initialSettings: any = {}

    try {
        const { data } = await admin.from('platform_settings').select('*').limit(1).single()
        if (data) initialSettings = data
    } catch (e) {
        console.error('SEO settings load error:', e)
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl border border-border-color shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-green-500 via-emerald-400 to-teal-500"></div>
                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl">
                            <span className="material-symbols-outlined text-2xl">travel_explore</span>
                        </div>
                        <h2 className="text-text-main text-3xl font-black tracking-tight font-display">تحسين محركات البحث</h2>
                    </div>
                    <p className="text-text-sub text-base font-medium max-w-xl leading-relaxed">تحكم كامل في إعدادات السيو، بطاقات التواصل الاجتماعي، التحليلات، وفهرسة محركات البحث.</p>
                </div>
            </header>

            <SeoClient initialSettings={initialSettings} />
        </div>
    )
}
