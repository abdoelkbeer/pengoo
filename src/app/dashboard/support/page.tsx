// @ts-nocheck
import React from 'react';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function SupportPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch tickets with unread message counts
    const { data: tickets } = await supabase
        .from('support_tickets')
        .select(`
            *,
            ticket_messages (
                sender_type,
                is_read
            )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

    // Fetch FAQ articles
    const { data: faqArticles } = await supabase
        .from('faq_articles')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

    // Stats
    const totalTickets = tickets?.length || 0;
    const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
    const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
    const resolvedTickets = tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0;

    const statusConfig = {
        open: { label: 'مفتوحة', color: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'bg-blue-500' },
        in_progress: { label: 'قيد المعالجة', color: 'bg-yellow-50 text-yellow-700 border-yellow-100', dot: 'bg-yellow-500' },
        resolved: { label: 'تم الحل', color: 'bg-green-50 text-green-700 border-green-100', dot: 'bg-green-500' },
        closed: { label: 'مغلقة', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
    };

    const priorityConfig = {
        low: { label: 'منخفضة', color: 'text-slate-500' },
        medium: { label: 'متوسطة', color: 'text-blue-600' },
        high: { label: 'عالية', color: 'text-orange-600' },
        critical: { label: 'حرجة', color: 'text-red-600' },
    };

    const categoryConfig = {
        technical: { label: 'فني', icon: 'build' },
        billing: { label: 'اشتراكات', icon: 'payments' },
        connections: { label: 'اتصالات', icon: 'phonelink_ring' },
        general: { label: 'عام', icon: 'help' },
    };

    return (
        <div className="p-4 md:p-8 pb-20">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                            <a className="hover:text-primary transition-colors" href="/dashboard">الرئيسية</a>
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                            <span className="text-slate-900 font-medium">الدعم الفني</span>
                        </nav>
                        <h2 className="text-3xl font-bold text-slate-900">مركز الدعم الفني</h2>
                        <p className="text-slate-500 mt-1">تواصل مع فريق الدعم وتابع تذاكرك أو تصفّح الأسئلة الشائعة.</p>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/dashboard/support/new" className="bg-primary hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            تذكرة جديدة
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex items-center gap-4 group hover:border-primary/30 transition-all">
                        <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-100 transition-colors">
                            <span className="material-symbols-outlined">confirmation_number</span>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-medium mb-0.5">إجمالي التذاكر</p>
                            <h3 className="text-2xl font-bold text-slate-900">{totalTickets}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex items-center gap-4 group hover:border-primary/30 transition-all">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:bg-amber-100 transition-colors">
                            <span className="material-symbols-outlined">pending</span>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-medium mb-0.5">مفتوحة</p>
                            <h3 className="text-2xl font-bold text-slate-900">{openTickets}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex items-center gap-4 group hover:border-primary/30 transition-all">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:bg-purple-100 transition-colors">
                            <span className="material-symbols-outlined">autorenew</span>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-medium mb-0.5">قيد المعالجة</p>
                            <h3 className="text-2xl font-bold text-slate-900">{inProgressTickets}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-soft flex items-center gap-4 group hover:border-primary/30 transition-all">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:bg-green-100 transition-colors">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs font-medium mb-0.5">تم الحل</p>
                            <h3 className="text-2xl font-bold text-slate-900">{resolvedTickets}</h3>
                        </div>
                    </div>
                </div>

                {/* Quick Help Banner */}
                <div className="bg-gradient-to-l from-primary to-blue-600 rounded-2xl p-6 md:p-8 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
                    <div className="absolute -left-10 -top-10 size-40 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute right-20 bottom-0 size-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-bold mb-2">كيف يمكننا مساعدتك؟</h3>
                            <p className="text-blue-100 text-sm max-w-lg">تصفّح الأسئلة الشائعة للحصول على إجابات فورية، أو افتح تذكرة دعم وسيتواصل معك فريقنا في أقرب وقت.</p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-end gap-3 w-full md:w-auto">
                            <a href="#faq" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">quiz</span>
                                الأسئلة الشائعة
                            </a>
                            <Link href="/dashboard/support/new" className="bg-white text-primary hover:bg-slate-50 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                                افتح تذكرة
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Tickets Table - 2/3 */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">inbox</span>
                                    تذاكر الدعم
                                </h3>
                                <Link href="/dashboard/support/new" className="text-primary text-sm font-medium hover:underline flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">add</span>
                                    تذكرة جديدة
                                </Link>
                            </div>
                            {tickets && tickets.length > 0 ? (
                                <div className="divide-y divide-slate-50">
                                    {tickets.map((ticket) => {
                                        const status = statusConfig[ticket.status] || statusConfig.open;
                                        const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
                                        const category = categoryConfig[ticket.category] || categoryConfig.general;
                                        const unreadCount = ticket.ticket_messages?.filter(
                                            (m: any) => m.sender_type === 'support' && !m.is_read
                                        ).length || 0;

                                        return (
                                            <Link
                                                key={ticket.id}
                                                href={`/dashboard/support/${ticket.id}`}
                                                className="flex items-center gap-4 p-5 hover:bg-slate-50/70 transition-colors group cursor-pointer relative"
                                            >
                                                <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors relative">
                                                    <span className="material-symbols-outlined">{category.icon}</span>
                                                    {unreadCount > 0 && (
                                                        <span className="absolute -top-1 -right-1 size-3 bg-red-500 border-2 border-white rounded-full"></span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className={`font-bold text-slate-900 truncate text-sm ${unreadCount > 0 ? 'text-primary' : ''}`}>
                                                            {ticket.subject}
                                                            {unreadCount > 0 && <span className="mr-2 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded-md">جديد</span>}
                                                        </h4>
                                                        <span className={`text-[10px] font-bold ${priority.color}`}>● {priority.label}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 truncate">{ticket.description}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${status.color}`}>
                                                        <span className={`size-1.5 rounded-full ${status.dot}`}></span>
                                                        {status.label}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">
                                                        {new Date(ticket.created_at).toLocaleDateString('ar-SA')}
                                                    </span>
                                                </div>
                                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors text-lg">chevron_left</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="py-16 text-center">
                                    <div className="mx-auto mb-4 size-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-3xl text-slate-300">inbox</span>
                                    </div>
                                    <h4 className="font-bold text-slate-700 mb-1">لا توجد تذاكر بعد</h4>
                                    <p className="text-sm text-slate-500 mb-4">لم تقم بإنشاء أي تذكرة دعم فني حتى الآن.</p>
                                    <Link href="/dashboard/support/new" className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors">
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        إنشاء أول تذكرة
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* FAQ Sidebar - 1/3 */}
                    <div className="space-y-6" id="faq">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                            <h3 className="font-bold text-lg text-slate-900 mb-1 flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">lightbulb</span>
                                الأسئلة الشائعة
                            </h3>
                            <p className="text-xs text-slate-500 mb-5">إجابات سريعة على أكثر الأسئلة شيوعاً</p>
                            <div className="space-y-3">
                                {faqArticles && faqArticles.length > 0 ? (
                                    faqArticles.map((faq) => (
                                        <details key={faq.id} className="group rounded-xl border border-slate-100 overflow-hidden hover:border-primary/20 transition-colors">
                                            <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer text-sm font-bold text-slate-800 hover:text-primary transition-colors select-none list-none [&::-webkit-details-marker]:hidden">
                                                <span className="flex-1">{faq.question}</span>
                                                <span className="material-symbols-outlined text-sm text-slate-400 group-open:rotate-180 transition-transform duration-200">expand_more</span>
                                            </summary>
                                            <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                                                {faq.answer}
                                            </div>
                                        </details>
                                    ))
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">لا توجد أسئلة شائعة متاحة حالياً.</p>
                                )}
                            </div>
                        </div>

                        {/* FAQ Articles rendered here */}
                    </div>
                </div>
            </div>
        </div>
    );
}
