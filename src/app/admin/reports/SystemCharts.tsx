'use client';

import React from 'react';
import { formatCurrency } from '@/utils/format';


interface ChartDataPoint {
    label: string;
    value: number;
}

interface ChartProps {
    title: string;
    data: ChartDataPoint[];
    color?: string;
    type?: 'line' | 'bar';
}

export function SystemChart({ title, data, color = '#3b82f6', type = 'line' }: ChartProps) {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value), 10);
    const height = 150;
    const width = 400;
    const padding = 20;

    const points = data.map((d, i) => ({
        x: padding + (i * (width - 2 * padding)) / (data.length - 1 || 1),
        y: height - padding - (d.value / maxValue) * (height - 2 * padding),
        value: d.value,
        label: d.label
    }));

    const linePath = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;

    return (
        <div className="bg-white border border-border-color rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h4 className="font-bold text-text-main">{title}</h4>
                <span className="text-xs font-bold text-text-sub bg-gray-50 px-3 py-1 rounded-full border border-border-color">آخر 30 يوم</span>
            </div>

            <div className="relative h-[150px] w-full">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                        <line
                            key={p}
                            x1={padding}
                            y1={padding + p * (height - 2 * padding)}
                            x2={width - padding}
                            y2={padding + p * (height - 2 * padding)}
                            stroke="#f1f5f9"
                            strokeWidth="1"
                        />
                    ))}

                    {type === 'line' ? (
                        <>
                            {/* Area under line */}
                            <path
                                d={`${linePath} L ${points[points.length - 1].x},${height - padding} L ${points[0].x},${height - padding} Z`}
                                fill={color}
                                fillOpacity="0.05"
                            />
                            {/* Main line */}
                            <path
                                d={linePath}
                                fill="none"
                                stroke={color}
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* Points */}
                            {points.map((p, i) => (
                                <circle
                                    key={i}
                                    cx={p.x}
                                    cy={p.y}
                                    r="4"
                                    fill="white"
                                    stroke={color}
                                    strokeWidth="2"
                                    className="hover:r-6 transition-all cursor-pointer"
                                >
                                    <title>{p.label}: {p.value}</title>
                                </circle>
                            ))}
                        </>
                    ) : (
                        /* Bar Chart */
                        <g>
                            {points.map((p, i) => {
                                const barWidth = (width - 2 * padding) / data.length * 0.7;
                                return (
                                    <rect
                                        key={i}
                                        x={p.x - barWidth / 2}
                                        y={p.y}
                                        width={barWidth}
                                        height={height - padding - p.y}
                                        fill={color}
                                        rx="4"
                                        className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                    >
                                        <title>{p.label}: {p.value}</title>
                                    </rect>
                                );
                            })}
                        </g>
                    )}
                </svg>
            </div>

            {/* Labels */}
            <div className="flex justify-between mt-4">
                <span className="text-[10px] text-text-sub font-bold">{data[0].label}</span>
                <span className="text-[10px] text-text-sub font-bold">{data[Math.floor(data.length / 2)].label}</span>
                <span className="text-[10px] text-text-sub font-bold">{data[data.length - 1].label}</span>
            </div>
        </div>
    );
}

export function SystemStatsGrid({ data, currency = 'EGP' }: { data: any, currency?: string }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="المعدل الشهري المتوقع" value={`${data.estimatedMRR} ${formatCurrency(currency)}`} icon="payments" color="blue" />

            <StatCard label="نمو المستخدمين (هذا الشهر)" value={`+${data.monthlyUserGrowth}`} icon="trending_up" color="green" />
            <StatCard label="الدقة في الإرسال" value={`${data.successRate}%`} icon="verified" color="purple" />
            <StatCard label="نشاط المتاجر" value={`${data.activeStoresCount}`} icon="store" color="amber" />
            <StatCard label="معدل استرداد السلال" value={`${data.recoveryRate}%`} icon="shopping_cart_checkout" color="green" />
            <StatCard label="تذاكر دعم مفتوحة" value={`${data.openTickets}`} icon="headset_mic" color="blue" />
            <StatCard label="أخطاء النظام (اليوم)" value={`${data.criticalErrors}`} icon="warning" color={data.criticalErrors > 0 ? 'red' : 'green'} />
        </div>
    );
}

function StatCard({ label, value, icon, color }: any) {
    const colors: any = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-500' },
        green: { bg: 'bg-green-50', text: 'text-green-600', icon: 'text-green-500' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-500' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'text-amber-500' },
        red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-500' },
    };
    const c = colors[color] || colors.blue;

    return (
        <div className="bg-white p-6 rounded-3xl border border-border-color shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-4 relative z-10">
                <div className={`${c.bg} ${c.icon} p-3 rounded-2xl`}>
                    <span className="material-symbols-outlined text-2xl">{icon}</span>
                </div>
                <div>
                    <p className="text-sm font-bold text-text-sub mb-1">{label}</p>
                    <h3 className={`text-2xl font-black ${c.text}`}>{value}</h3>
                </div>
            </div>
            <div className={`absolute -right-4 -bottom-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500 ${c.text}`}>
                <span className="material-symbols-outlined text-8xl">{icon}</span>
            </div>
        </div>
    );
}
