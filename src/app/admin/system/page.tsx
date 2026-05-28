'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface Stats {
    server: {
        totalMemory: number;
        freeMemory: number;
        usedMemory: number;
        cpuCores: number;
        cpuModel: string;
        cpuPercent: number;
        loadAvg: number[];
        hostname: string;
        platform: string;
        arch: string;
        osUptime: number;
    };
    platform: {
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        uptime: number;
    };
    worker: {
        online: boolean;
        rss: number;
        heapTotal: number;
        heapUsed: number;
        external: number;
        uptime: number;
        sessions: number;
        cpu: { user: number; system: number };
    };
    timestamp: string;
}

function formatBytes(bytes: number) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatUptime(seconds: number) {
    if (!seconds) return '0s';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const parts = [];
    if (d > 0) parts.push(`${d} يوم`);
    if (h > 0) parts.push(`${h} ساعة`);
    if (m > 0) parts.push(`${m} دقيقة`);
    return parts.join(' و ') || 'أقل من دقيقة';
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return (
        <div className="w-full">
            <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-500">{formatBytes(value)}</span>
                <span className="font-bold text-slate-700">{pct}%</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export default function SystemMonitoringPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<string>('');

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/system/stats', { cache: 'no-store' });
            if (!res.ok) return;
            const data: Stats = await res.json();
            setStats(data);
            setLastUpdate(new Date().toLocaleTimeString('ar-EG'));
        } catch (_) {
            // silent
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 5000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const serverMemPct = stats ? Math.round((stats.server.usedMemory / stats.server.totalMemory) * 100) : 0;

    return (
        <div className="p-4 md:p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <a className="hover:text-primary transition-colors" href="/admin">لوحة الإدارة</a>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="text-slate-900 font-medium">مراقبة النظام</span>
                    </nav>
                    <h2 className="text-3xl font-bold text-slate-900">مراقبة استهلاك النظام</h2>
                    <p className="text-slate-500 mt-1">تتابع استهلاك المنصة والواتساب من موارد السيرفر بشكل لحظي.</p>
                </div>
                <div className="flex items-center gap-3">
                    {lastUpdate && (
                        <span className="text-xs text-slate-400">آخر تحديث: {lastUpdate}</span>
                    )}
                    <button
                        onClick={fetchStats}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                        تحديث
                    </button>
                </div>
            </div>

            {/* ====== Server Overview Banner ====== */}
            <div className="bg-gradient-to-l from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                        <span className="material-symbols-outlined text-2xl">dns</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-medium">السيرفر</p>
                        <h3 className="text-lg font-bold">{stats?.server.hostname || '...'}</h3>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div>
                        <p className="text-slate-400 text-xs mb-1">إجمالي الرام</p>
                        <p className="text-xl font-bold">{stats ? formatBytes(stats.server.totalMemory) : '...'}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs mb-1">الرام المستخدم</p>
                        <p className="text-xl font-bold">{stats ? formatBytes(stats.server.usedMemory) : '...'}</p>
                        <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
                            <div className={`h-full rounded-full ${serverMemPct > 80 ? 'bg-red-400' : 'bg-green-400'}`} style={{ width: `${serverMemPct}%` }} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs mb-1">المعالج</p>
                        <p className="text-xl font-bold">{stats ? `${stats.server.cpuPercent}%` : '...'}</p>
                        <p className="text-slate-500 text-[10px] mt-1">{stats ? `${stats.server.cpuCores} Core` : ''}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs mb-1">وقت تشغيل السيرفر</p>
                        <p className="text-xl font-bold">{stats ? formatUptime(stats.server.osUptime) : '...'}</p>
                    </div>
                </div>
            </div>

            {/* ====== Per-Service Usage ====== */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* --- Platform (Web) --- */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <span className="material-symbols-outlined">language</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">المنصة (Web App)</h3>
                                <p className="text-xs text-slate-400">Next.js — Port 3000</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold flex items-center gap-1.5">
                            <span className="size-2 bg-blue-500 rounded-full animate-pulse"></span>
                            يعمل
                        </span>
                    </div>
                    <div className="p-5 space-y-5">
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">الرام — RSS (الكلي)</p>
                            <ProgressBar
                                value={stats?.platform.rss || 0}
                                max={stats?.server.totalMemory || 1}
                                color="bg-blue-500"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">الرام — Heap Used</p>
                            <ProgressBar
                                value={stats?.platform.heapUsed || 0}
                                max={stats?.platform.heapTotal || 1}
                                color="bg-indigo-500"
                            />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">الرام — External</p>
                            <ProgressBar
                                value={stats?.platform.external || 0}
                                max={stats?.server.totalMemory || 1}
                                color="bg-sky-400"
                            />
                        </div>
                        <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-sm">
                            <span className="text-slate-500">وقت التشغيل</span>
                            <span className="font-bold text-slate-900">{stats ? formatUptime(stats.platform.uptime) : '...'}</span>
                        </div>
                    </div>
                </div>

                {/* --- WhatsApp Worker --- */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                    <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`size-10 rounded-xl flex items-center justify-center ${stats?.worker.online ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                                <span className="material-symbols-outlined">chat</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">موزع الواتساب (Worker)</h3>
                                <p className="text-xs text-slate-400">Node.js — Port 3001</p>
                            </div>
                        </div>
                        {stats?.worker.online ? (
                            <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold flex items-center gap-1.5">
                                <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                                يعمل
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-xs font-bold flex items-center gap-1.5">
                                <span className="size-2 bg-red-500 rounded-full"></span>
                                متوقف
                            </span>
                        )}
                    </div>
                    <div className="p-5 space-y-5">
                        {stats?.worker.online ? (
                            <>
                                <div>
                                    <p className="text-sm font-medium text-slate-700 mb-2">الرام — RSS (الكلي)</p>
                                    <ProgressBar
                                        value={stats.worker.rss}
                                        max={stats.server.totalMemory}
                                        color="bg-green-500"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700 mb-2">الرام — Heap Used</p>
                                    <ProgressBar
                                        value={stats.worker.heapUsed}
                                        max={stats.worker.heapTotal || 1}
                                        color="bg-emerald-500"
                                    />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-slate-700 mb-2">الرام — External</p>
                                    <ProgressBar
                                        value={stats.worker.external}
                                        max={stats.server.totalMemory}
                                        color="bg-teal-400"
                                    />
                                </div>
                                <div className="pt-3 border-t border-slate-50 grid grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">وقت التشغيل</span>
                                        <span className="font-bold text-slate-900">{formatUptime(stats.worker.uptime)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">الجلسات النشطة</span>
                                        <span className="font-bold text-slate-900">{stats.worker.sessions}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">cloud_off</span>
                                <p className="text-slate-500 font-medium">خدمة الواتساب غير متصلة حالياً</p>
                                <p className="text-xs text-slate-400 mt-1">تأكد من تشغيل الخدمة على Port 3001</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ====== Combined Summary Table ====== */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="font-bold text-lg text-slate-900">مقارنة الاستهلاك — المنصة vs الواتساب</h3>
                    <p className="text-xs text-slate-400 mt-1">كم كل خدمة واخدة من السيرفر</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4">المقياس</th>
                                <th className="px-6 py-4">المنصة (Web)</th>
                                <th className="px-6 py-4">الواتساب (Worker)</th>
                                <th className="px-6 py-4">المجموع</th>
                                <th className="px-6 py-4">من السيرفر</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium text-slate-900">RSS (الرام الفعلي)</td>
                                <td className="px-6 py-4 text-blue-600 font-bold">{stats ? formatBytes(stats.platform.rss) : '...'}</td>
                                <td className="px-6 py-4 text-green-600 font-bold">{stats?.worker.online ? formatBytes(stats.worker.rss) : 'غير متصل'}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{stats ? formatBytes(stats.platform.rss + (stats.worker.online ? stats.worker.rss : 0)) : '...'}</td>
                                <td className="px-6 py-4 text-slate-500">
                                    {stats ? `${Math.round(((stats.platform.rss + (stats.worker.online ? stats.worker.rss : 0)) / stats.server.totalMemory) * 100)}%` : '...'}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium text-slate-900">Heap Used</td>
                                <td className="px-6 py-4 text-blue-600 font-bold">{stats ? formatBytes(stats.platform.heapUsed) : '...'}</td>
                                <td className="px-6 py-4 text-green-600 font-bold">{stats?.worker.online ? formatBytes(stats.worker.heapUsed) : 'غير متصل'}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{stats ? formatBytes(stats.platform.heapUsed + (stats.worker.online ? stats.worker.heapUsed : 0)) : '...'}</td>
                                <td className="px-6 py-4 text-slate-500">—</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium text-slate-900">Heap Total (مخصص)</td>
                                <td className="px-6 py-4 text-blue-600 font-bold">{stats ? formatBytes(stats.platform.heapTotal) : '...'}</td>
                                <td className="px-6 py-4 text-green-600 font-bold">{stats?.worker.online ? formatBytes(stats.worker.heapTotal) : 'غير متصل'}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{stats ? formatBytes(stats.platform.heapTotal + (stats.worker.online ? stats.worker.heapTotal : 0)) : '...'}</td>
                                <td className="px-6 py-4 text-slate-500">—</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50">
                                <td className="px-6 py-4 font-medium text-slate-900">External Memory</td>
                                <td className="px-6 py-4 text-blue-600 font-bold">{stats ? formatBytes(stats.platform.external) : '...'}</td>
                                <td className="px-6 py-4 text-green-600 font-bold">{stats?.worker.online ? formatBytes(stats.worker.external) : 'غير متصل'}</td>
                                <td className="px-6 py-4 font-bold text-slate-900">{stats ? formatBytes(stats.platform.external + (stats.worker.online ? stats.worker.external : 0)) : '...'}</td>
                                <td className="px-6 py-4 text-slate-500">—</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Footer info */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pb-4">
                <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">info</span>
                    يتم التحديث تلقائياً كل 5 ثوانٍ
                </span>
                <span>•</span>
                <span>{stats?.server.cpuModel || ''}</span>
                <span>•</span>
                <span>{stats?.server.platform || ''} / {stats?.server.arch || ''}</span>
            </div>
        </div>
    );
}
