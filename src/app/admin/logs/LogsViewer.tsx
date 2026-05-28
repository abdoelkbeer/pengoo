'use client';

import { useState, useEffect } from 'react';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export default function LogsViewer() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState<string>('');
    const [filterSource, setFilterSource] = useState<string>('');
    const [settings, setSettings] = useState({ enable_system_logs: true, log_level: 'INFO' });
    const [savingSettings, setSavingSettings] = useState(false);

    useEffect(() => {
        fetchSettings();
        fetchLogs();
    }, [filterLevel, filterSource]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data.settings) {
                setSettings({
                    enable_system_logs: data.settings.enable_system_logs ?? true,
                    log_level: data.settings.log_level ?? 'INFO'
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let url = '/api/admin/logs?limit=100';
            if (filterLevel) url += `&level=${filterLevel}`;
            if (filterSource) url += `&source=${filterSource}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.logs) {
                setLogs(data.logs);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        if (!confirm('هل أنت متأكد من مسح جميع السجلات؟')) return;
        try {
            const res = await fetch('/api/admin/logs', { method: 'DELETE' });
            if (res.ok) {
                setLogs([]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const saveSettings = async (newToggleStatus: boolean, newLevel: string) => {
        setSavingSettings(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        enable_system_logs: newToggleStatus,
                        log_level: newLevel
                    }
                })
            });
            if (res.ok) {
                setSettings({ enable_system_logs: newToggleStatus, log_level: newLevel });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSavingSettings(false);
        }
    };

    const getLevelColors = (level: string) => {
        switch (level) {
            case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
            case 'ERROR': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'WARN': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'INFO': return 'bg-blue-100 text-blue-800 border-blue-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Sidebar Controls */}
            <div className="lg:col-span-1 space-y-6">

                {/* Settings Card */}
                <div className="bg-white border border-border-color rounded-3xl p-6 shadow-sm">
                    <h3 className="text-text-main text-lg font-black mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">settings</span>
                        إعدادات السجلات
                    </h3>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer w-full group">
                            <span className="text-sm font-bold text-gray-700">تفعيل حفظ السجلات</span>
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={settings.enable_system_logs}
                                    onChange={(e) => saveSettings(e.target.checked, settings.log_level)}
                                    disabled={savingSettings}
                                />
                                <div className={`block w-10 h-6 rounded-full transition-colors ${settings.enable_system_logs ? 'bg-primary' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${settings.enable_system_logs ? 'transform translate-x-4' : ''}`}></div>
                            </div>
                        </label>

                        <div className="pt-2">
                            <label className="block text-xs font-bold text-gray-500 mb-2">مستوى تسجيل الأخطاء (أدنى مستوى للحفظ)</label>
                            <select
                                value={settings.log_level}
                                onChange={(e) => saveSettings(settings.enable_system_logs, e.target.value)}
                                disabled={savingSettings || !settings.enable_system_logs}
                                className="w-full bg-gray-50 border border-border-color rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary disabled:opacity-50"
                            >
                                <option value="INFO">INFO (التفاصيل الدقيقة)</option>
                                <option value="WARN">WARN (التحذيرات والأخطاء)</option>
                                <option value="ERROR">ERROR (الأخطاء الفادحة فقط)</option>
                                <option value="CRITICAL">CRITICAL (الحرجة فقط)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white border border-border-color rounded-3xl p-6 shadow-sm">
                    <h3 className="text-text-main text-lg font-black mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">filter_list</span>
                        فلاتر البحث
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">نوع السجل</label>
                            <select
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                className="w-full bg-gray-50 border border-border-color rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-primary"
                            >
                                <option value="">الجميع</option>
                                <option value="INFO">INFO</option>
                                <option value="WARN">WARN</option>
                                <option value="ERROR">ERROR</option>
                                <option value="CRITICAL">CRITICAL</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-2">المصدر (Source)</label>
                            <input
                                type="text"
                                placeholder="مثال: webhook, worker..."
                                value={filterSource}
                                onChange={(e) => setFilterSource(e.target.value)}
                                className="w-full bg-gray-50 border border-border-color rounded-xl px-4 py-2 text-sm font-medium outline-none focus:border-primary"
                            />
                        </div>

                        <button
                            onClick={fetchLogs}
                            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl py-2 text-sm font-bold transition-colors flex justify-center items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[18px]">sync</span>
                            تحديث السجلات
                        </button>
                    </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-red-800 text-lg font-black mb-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-600">delete_forever</span>
                        إدارة السجلات
                    </h3>
                    <p className="text-xs text-red-600 mb-4 font-medium leading-relaxed">
                        قد يستهلك حفظ السجلات مساحة كبيرة في قاعدة البيانات. يُفضل مسحها دورياً في حال تم حل جميع المشاكل التقنية.
                    </p>
                    <button
                        onClick={clearLogs}
                        className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-bold shadow-md transition-colors flex justify-center items-center gap-2"
                    >
                        مسح جميع السجلات القديمة
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="lg:col-span-3 bg-white border border-border-color rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
                <div className="p-6 border-b border-border-color/50 bg-gray-50 flex justify-between items-center">
                    <h3 className="text-text-main text-lg font-black">قائمة السجلات</h3>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 text-xs font-bold rounded-full">
                        {loading ? 'جاري التحميل...' : `${logs.length} سجل (آخر 100)`}
                    </span>
                </div>

                <div className="flex-1 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full p-12">
                            <span className="material-symbols-outlined text-4xl text-gray-300 animate-spin">refresh</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-16 text-center text-text-sub h-full">
                            <span className="material-symbols-outlined text-5xl mb-3 opacity-20">check_circle</span>
                            <p className="font-bold text-lg text-gray-600">لا توجد سجلات حالياً</p>
                            <p className="text-sm">النظام يعمل بشكل مستقر أو لا تطابق السجلات الحالية الفلتر المختار.</p>
                        </div>
                    ) : (
                        <table className="w-full text-right text-sm">
                            <thead className="bg-gray-100/50 text-gray-500 font-bold border-b border-border-color/50">
                                <tr>
                                    <th className="px-6 py-4">التوقيت</th>
                                    <th className="px-6 py-4">المستوى</th>
                                    <th className="px-6 py-4">المصدر</th>
                                    <th className="px-6 py-4 max-w-md">الرسالة / البيانات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-color/30">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs font-mono" dir="ltr">
                                            {new Date(log.created_at).toLocaleString('en-GB')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-md text-xs font-black border ${getLevelColors(log.level)}`}>
                                                {log.level}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-700">
                                            {log.source}
                                        </td>
                                        <td className="px-6 py-4 min-w-[300px]">
                                            <p className="font-bold text-gray-800 mb-1">{log.message}</p>
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <pre className="bg-gray-100 p-3 rounded-lg text-xs font-mono text-gray-600 mt-2 overflow-x-auto max-h-32 border border-gray-200" dir="ltr">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

        </div>
    );
}
