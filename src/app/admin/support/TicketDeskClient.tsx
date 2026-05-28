'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    ticket_number: number;
    created_at: string;
    user_profiles?: { full_name: string } | null;
}

interface TicketDeskClientProps {
    initialTickets: Ticket[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    open: { label: 'مفتوحة', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' },
    in_progress: { label: 'قيد المعالجة', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-100' },
    resolved: { label: 'تم الحل', color: 'text-green-700', bg: 'bg-green-50 border-green-100' },
    closed: { label: 'مغلقة', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: 'منخفضة', color: 'text-slate-500' },
    medium: { label: 'متوسطة', color: 'text-blue-600' },
    high: { label: 'عالية', color: 'text-orange-600' },
    critical: { label: 'حرجة', color: 'text-red-600' },
};

const categoryConfig: Record<string, { label: string }> = {
    technical: { label: 'فني' },
    billing: { label: 'اشتراكات' },
    connections: { label: 'اتصالات' },
    general: { label: 'عام' },
};

const ITEMS_PER_PAGE = 10;

export default function TicketDeskClient({ initialTickets }: TicketDeskClientProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    const stats = useMemo(() => {
        return {
            total: initialTickets.length,
            open: initialTickets.filter(t => t.status === 'open').length,
            inProgress: initialTickets.filter(t => t.status === 'in_progress').length,
            resolved: initialTickets.filter(t => t.status === 'resolved').length
        };
    }, [initialTickets]);

    const filteredTickets = useMemo(() => {
        return initialTickets.filter(ticket => {
            const matchesSearch =
                ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                ticket.ticket_number.toString().includes(searchTerm) ||
                (ticket.user_profiles?.full_name && ticket.user_profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
            const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
            const matchesCategory = categoryFilter === 'all' || ticket.category === categoryFilter;

            return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
        });
    }, [initialTickets, searchTerm, statusFilter, priorityFilter, categoryFilter]);

    const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);

    // Reset to page 1 when filters change
    useMemo(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, priorityFilter, categoryFilter]);

    const paginatedTickets = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTickets.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTickets, currentPage]);

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {/* Total */}
                <div
                    onClick={() => setStatusFilter('all')}
                    className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group overflow-hidden relative font-display cursor-pointer select-none ${statusFilter === 'all' ? 'border-primary ring-2 ring-primary/10' : 'border-border-color'}`}
                >
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/5 rounded-full group-hover:scale-150 transition-transform z-0 pointer-events-none"></div>
                    <div className="relative z-10">
                        <span className="material-symbols-outlined text-primary mb-2">assignment</span>
                        <p className="text-text-sub text-xs font-bold">إجمالي التذاكر</p>
                        <p className="text-3xl font-black text-text-main mt-1">{stats.total}</p>
                    </div>
                </div>
                {/* Open */}
                <div
                    onClick={() => setStatusFilter('open')}
                    className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group overflow-hidden relative font-display cursor-pointer select-none ${statusFilter === 'open' ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-border-color'}`}
                >
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-50 rounded-full group-hover:scale-150 transition-transform z-0 pointer-events-none opacity-60"></div>
                    <div className="relative z-10">
                        <span className="material-symbols-outlined text-blue-500 mb-2">radio_button_unchecked</span>
                        <p className="text-text-sub text-xs font-bold">التذاكر المفتوحة</p>
                        <p className="text-3xl font-black text-text-main mt-1">{stats.open}</p>
                    </div>
                </div>
                {/* In Progress */}
                <div
                    onClick={() => setStatusFilter('in_progress')}
                    className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group overflow-hidden relative font-display cursor-pointer select-none ${statusFilter === 'in_progress' ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-border-color'}`}
                >
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-50 rounded-full group-hover:scale-150 transition-transform z-0 pointer-events-none opacity-60"></div>
                    <div className="relative z-10">
                        <span className="material-symbols-outlined text-orange-500 mb-2">pending</span>
                        <p className="text-text-sub text-xs font-bold">قيد المعالجة</p>
                        <p className="text-3xl font-black text-text-main mt-1">{stats.inProgress}</p>
                    </div>
                </div>
                {/* Resolved */}
                <div
                    onClick={() => setStatusFilter('resolved')}
                    className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group overflow-hidden relative font-display cursor-pointer select-none ${statusFilter === 'resolved' ? 'border-green-500 ring-2 ring-green-500/10' : 'border-border-color'}`}
                >
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-green-50 rounded-full group-hover:scale-150 transition-transform z-0 pointer-events-none opacity-60"></div>
                    <div className="relative z-10">
                        <span className="material-symbols-outlined text-green-500 mb-2">check_circle</span>
                        <p className="text-text-sub text-xs font-bold">تم حلها</p>
                        <p className="text-3xl font-black text-text-main mt-1">{stats.resolved}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-border-color shadow-sm overflow-hidden flex flex-col">
                {/* Filters Header */}
                <div className="p-6 border-b border-border-color bg-gray-50/30 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h3 className="text-lg font-black text-text-main flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">filter_list</span>
                            البحث والفلترة
                        </h3>
                        <div className="flex gap-2">
                            <span className="bg-orange-50 border border-orange-100 text-orange-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-sm">search</span>
                                نتائج البحث: {filteredTickets.length}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl pointer-events-none">search</span>
                            <input
                                type="text"
                                placeholder="ابحث برقم التذكرة، العنوان، اسم المستخدم..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium placeholder:text-gray-400"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'left 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                        >
                            <option value="all">كل الحالات</option>
                            <option value="open">مفتوحة</option>
                            <option value="in_progress">قيد المعالجة</option>
                            <option value="resolved">تم الحل</option>
                            <option value="closed">مغلقة</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'left 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                        >
                            <option value="all">كل الأولويات</option>
                            <option value="low">منخفضة</option>
                            <option value="medium">متوسطة</option>
                            <option value="high">عالية</option>
                            <option value="critical">حرجة</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium appearance-none cursor-pointer"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'left 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
                        >
                            <option value="all">كل التصنيفات</option>
                            <option value="technical">فني</option>
                            <option value="billing">اشتراكات</option>
                            <option value="connections">اتصالات</option>
                            <option value="general">عام</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-200 sticky top-0 z-10 text-xs">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap w-24">رقم التذكرة</th>
                                <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">الموضوع</th>
                                <th className="px-6 py-4 whitespace-nowrap">المستخدم</th>
                                <th className="px-6 py-4 whitespace-nowrap">الحالة</th>
                                <th className="px-6 py-4 whitespace-nowrap">الأولوية</th>
                                <th className="px-6 py-4 whitespace-nowrap">التصنيف</th>
                                <th className="px-6 py-4 whitespace-nowrap">التاريخ</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {paginatedTickets.length > 0 ? (
                                paginatedTickets.map(ticket => {
                                    const status = statusConfig[ticket.status] || statusConfig.open;
                                    const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
                                    const category = categoryConfig[ticket.category] || categoryConfig.general;

                                    return (
                                        <tr key={ticket.id} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-bold text-gray-900">
                                                #{ticket.ticket_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-900 line-clamp-1">{ticket.subject}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex justify-center items-center text-[10px] font-bold">
                                                        {ticket.user_profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="font-medium text-gray-700">{ticket.user_profiles?.full_name || 'غير معروف'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${status.bg} ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`font-bold text-[11px] uppercase ${priority.color}`}>
                                                    {priority.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-medium text-[11px]">
                                                {category.label}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500 font-medium text-[11px] whitespace-nowrap">
                                                {new Date(ticket.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Link
                                                    href={`/admin/support/${ticket.id}`}
                                                    className="inline-flex items-center justify-center p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-primary hover:text-white hover:shadow-md transition-all group-hover:bg-primary/10 group-hover:text-primary"
                                                    title="عرض التذكرة"
                                                >
                                                    <span className="material-symbols-outlined text-lg">visibility</span>
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <span className="material-symbols-outlined text-5xl text-gray-300">search_off</span>
                                            <p className="text-gray-500 font-medium">لا توجد تذاكر تطابق معايير البحث</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
                        <p className="text-sm text-gray-500 font-medium">
                            عرض <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> إلى <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredTickets.length)}</span> من <span className="font-bold text-gray-900">{filteredTickets.length}</span> تذكرة
                        </p>
                        <div className="flex gap-1" dir="ltr">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>

                            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                                // Show roughly current page in middle
                                let pageNum = currentPage;
                                if (totalPages <= 5) pageNum = idx + 1;
                                else if (currentPage <= 3) pageNum = idx + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + idx;
                                else pageNum = currentPage - 2 + idx;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${currentPage === pageNum
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
