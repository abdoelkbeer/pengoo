// @ts-nocheck
import { createAdminClient } from '@/utils/supabase/admin'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
    const admin = createAdminClient()
    let initialSettings = {
        site_name: 'بينجو',
        contact_email: 'info@pengoo-platform.com',
        maintenance_mode: false,
        footer_text: '© 2026 بينجو - جميع الحقوق محفوظة',
        support_phone: '',
        min_tokens_required: 0
    }

    try {
        const { data } = await admin.from('platform_settings').select('*').limit(1).single()
        if (data) initialSettings = data
    } catch (e) {
        console.error('Settings load error:', e)
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl border border-border-color shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary to-rose-500"></div>
                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <span className="material-symbols-outlined text-2xl">settings</span>
                        </div>
                        <h2 className="text-text-main text-3xl font-black tracking-tight font-display">إعدادات المنصة</h2>
                    </div>
                    <p className="text-text-sub text-base font-medium max-w-xl leading-relaxed">تحكم في المتغيرات العامة للمنصة، معلومات التواصل، وحالة الصيانة.</p>
                </div>
            </header>

            <SettingsClient initialSettings={initialSettings} />
        </div>
    )
}
