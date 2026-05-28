'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

const statusLabels: Record<string, { label: string; className: string; icon: string }> = {
    open: { label: 'مفتوح', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'radio_button_unchecked' },
    in_progress: { label: 'قيد المعالجة', className: 'bg-orange-50 text-orange-700 border-orange-200', icon: 'pending' },
    resolved: { label: 'تم الحل', className: 'bg-green-50 text-green-700 border-green-200', icon: 'check_circle' },
    closed: { label: 'مغلق', className: 'bg-gray-50 text-gray-700 border-gray-200', icon: 'cancel' },
};

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

export default function InteractiveTicketDesk({ initialTickets }: { initialTickets: any[] }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const supabase = createClient();

    const handleStatusChange = async (ticketId: string, newStatus: string) => {
        setUpdatingId(ticketId);
        try {
            // Optimistic Update
            setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));

            // Actually call the API (needs to be an API route to use admin privileges usually, 
            // but assuming the admin has RLS access to update support_tickets here, 
            // if not we'll need an API route. Let's try direct client update first.
            const { error } = await supabase
                .from('support_tickets')
                .update({ status: newStatus })
                .eq('id', ticketId);

            if (error) {
                console.error("Error updating ticket", error);
                // Revert string
                setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: initialTickets.find(org => org.id === ticketId).status } : t));
                alert("حدث خطأ أثناء تحديث التذكرة.");
            }
        } finally {
            setUpdatingId(null);
        }
    };

    if (tickets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center border border-border-color mb-4 shadow-inner">
                    <span className="material-symbols-outlined text-3xl text-gray-300">task_alt</span>
                </div>
                <h3 className="text-text-main font-bold text-lg mb-1">لا توجد تذاكر معلقة</h3>
                <p className="text-sm text-text-sub max-w-xs">لقد قمت بإنجاز جميع مهام الدعم الفني! استمتع بوقتك.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-right whitespace-nowrap">
                <thead className="bg-gray-50/80 text-text-sub text-[11px] uppercase tracking-wider font-bold border-b border-border-color/50">
                    <tr>
                        <th className="px-6 py-4 rounded-tr-lg w-20">الرقم</th>
                        <th className="px-6 py-4">العميل</th>
                        <th className="px-6 py-4">الموضوع</th>
                        <th className="px-6 py-4">الحالة (تفاعلية)</th>
                        <th className="px-6 py-4 rounded-tl-lg">التوقيت</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border-color/50">
                    {tickets.map((ticket: any) => {
                        const st = statusLabels[ticket.status] ?? { label: ticket.status, className: 'bg-gray-50 text-gray-700 border-gray-200', icon: 'info' }
                        const initials = (ticket.user_profiles?.full_name ?? '؟').charAt(0)
                        const isUpdating = updatingId === ticket.id;

                        return (
                            <tr key={ticket.id} className={`hover:bg-primary/5 transition-colors group ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-mono text-text-sub group-hover:text-primary transition-colors cursor-pointer bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded">
                                        #{ticket.ticket_number?.toString().padStart(4, '0') || ticket.id.substring(0, 6)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {ticket.user_profiles?.avatar_url ? (
                                            <img src={ticket.user_profiles.avatar_url} alt="Avatar" className="w-8 h-8 rounded-full border border-border-color object-cover" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/10 shadow-sm shrink-0">
                                                {initials}
                                            </div>
                                        )}
                                        <span className="font-bold text-sm text-text-main hover:text-primary cursor-pointer transition-colors max-w-[150px] truncate block" title={ticket.user_profiles?.full_name}>
                                            {ticket.user_profiles?.full_name ?? 'مستخدم غير معروف'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-gray-800 max-w-[200px] truncate block hover:text-primary cursor-pointer transition-colors" title={ticket.subject}>
                                        {ticket.subject}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative group/select">
                                        <select
                                            value={ticket.status}
                                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                            className={`appearance-none bg-transparent outline-none cursor-pointer pr-8 pl-4 py-1.5 ${st.className} border rounded-full text-xs font-bold transition-all hover:shadow-md hover:scale-105 active:scale-95`}
                                        >
                                            <option value="open">مفتوح</option>
                                            <option value="in_progress">قيد المعالجة</option>
                                            <option value="resolved">تم الحل</option>
                                            <option value="closed">مغلق</option>
                                        </select>
                                        <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[16px] text-current opacity-70">
                                            {st.icon}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-text-sub flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md max-w-fit">
                                        <span className={`material-symbols-outlined text-[14px] ${isUpdating ? 'animate-spin' : 'opacity-70'}`}>
                                            {isUpdating ? 'sync' : 'schedule'}
                                        </span>
                                        {formatDate(ticket.created_at)}
                                    </span>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
}
