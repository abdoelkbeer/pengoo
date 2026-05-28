import LogsViewer from './LogsViewer'

export const metadata = {
    title: 'سجل النظام والأخطاء - لوحة الإدارة',
}

export default function LogsPage() {
    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 border-border-color border rounded-3xl p-8 shadow-sm">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-red-500 via-orange-500 to-purple-500"></div>
                <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-red-400 text-3xl">bug_report</span>
                            <h2 className="text-white text-3xl font-black font-display tracking-tight">سجل النظام (System Logs)</h2>
                        </div>
                        <p className="text-gray-300 text-base font-medium max-w-xl leading-relaxed">
                            تابع جميع أحداث النظام، المشاكل التقنية، وأخطاء الربط في مكان واحد. يمكنك تشخيص الأخطاء وحل المشاكل بشكل أسرع من خلال البحث والفلترة.
                        </p>
                    </div>
                </div>
            </div>

            {/* Client component for the table & settings */}
            <LogsViewer />
        </div>
    )
}
