'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
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
    updated_at: string;
}

interface Message {
    id: string;
    ticket_id: string;
    sender_id: string;
    sender_type: 'user' | 'support';
    message: string;
    attachments?: any[];
    is_read?: boolean;
    created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; dot: string; bg: string }> = {
    open: { label: 'مفتوحة', color: 'text-blue-700', dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-100' },
    in_progress: { label: 'قيد المعالجة', color: 'text-yellow-700', dot: 'bg-yellow-500', bg: 'bg-yellow-50 border-yellow-100' },
    resolved: { label: 'تم الحل', color: 'text-green-700', dot: 'bg-green-500', bg: 'bg-green-50 border-green-100' },
    closed: { label: 'مغلقة', color: 'text-slate-600', dot: 'bg-slate-400', bg: 'bg-slate-100 border-slate-200' },
};

const priorityConfig: Record<string, { label: string; color: string; icon: string }> = {
    low: { label: 'منخفضة', color: 'text-slate-500', icon: 'remove' },
    medium: { label: 'متوسطة', color: 'text-blue-600', icon: 'drag_handle' },
    high: { label: 'عالية', color: 'text-orange-600', icon: 'priority_high' },
    critical: { label: 'حرجة', color: 'text-red-600', icon: 'error' },
};

const categoryConfig: Record<string, { label: string; icon: string }> = {
    technical: { label: 'فني', icon: 'build' },
    billing: { label: 'اشتراكات', icon: 'payments' },
    connections: { label: 'اتصالات', icon: 'phonelink_ring' },
    general: { label: 'عام', icon: 'help' },
};

export default function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
    const router = useRouter();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [ticketId, setTicketId] = useState<string>('');
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        params.then(p => {
            setTicketId(p.ticketId);
        });
    }, [params]);

    useEffect(() => {
        if (!ticketId) return;

        const loadData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/auth/login'); return; }
            setUserId(user.id);

            const { data: ticketData } = await supabase
                .from('support_tickets')
                .select('*')
                .eq('id', ticketId)
                .single();

            if (!ticketData) { router.push('/dashboard/support'); return; }
            setTicket(ticketData);

            const { data: messagesData } = await supabase
                .from('ticket_messages')
                .select('*')
                .eq('ticket_id', ticketId)
                .order('created_at', { ascending: true });

            setMessages(messagesData || []);
            setIsLoading(false);

            // Mark admin messages as read
            if (messagesData) {
                const unreadAdminMessages = messagesData.filter(m => m.sender_type === 'support' && !m.is_read);
                if (unreadAdminMessages.length > 0) {
                    await supabase
                        .from('ticket_messages')
                        .update({ is_read: true })
                        .eq('ticket_id', ticketId)
                        .eq('sender_type', 'support');
                }
            }
        };

        loadData();
    }, [ticketId, router]);

    useEffect(() => {
        if (!ticketId) return;

        const supabase = createClient();
        const channel = supabase
            .channel(`ticket_messages:${ticketId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${ticketId}`
                },
                async (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });

                    // If it's from support, mark it as read immediately
                    if (newMessage.sender_type === 'support') {
                        await supabase
                            .from('ticket_messages')
                            .update({ is_read: true })
                            .eq('id', newMessage.id);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [ticketId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticket || !userId) return;
        setIsSending(true);
        const tempMessage = newMessage.trim();

        try {
            const supabase = createClient();

            let uploadedAttachments: any[] = [];
            if (attachedFiles.length > 0) {
                setIsUploading(true);
                for (const file of attachedFiles) {
                    const fileName = `${Date.now()}_${file.name}`;
                    const { data, error: uploadError } = await supabase.storage
                        .from('support-attachments')
                        .upload(`${ticket.id}/${fileName}`, file);

                    if (data) {
                        uploadedAttachments.push({
                            name: file.name,
                            path: data.path,
                            type: file.type,
                            size: file.size
                        });
                    }
                }
                setIsUploading(false);
            }

            const { data, error } = await supabase
                .from('ticket_messages')
                .insert({
                    ticket_id: ticket.id,
                    sender_id: userId,
                    sender_type: 'user',
                    message: tempMessage,
                    attachments: uploadedAttachments,
                    is_read: false
                })
                .select()
                .single();

            if (error) throw error;
            if (data && ticket) {
                setMessages(prev => [...prev, data]);
                setNewMessage('');
                setAttachedFiles([]);
                // Reset textarea height
                if (textareaRef.current) textareaRef.current.style.height = 'auto';

                // If ticket was resolved/closed, reopen it
                if (ticket.status === 'resolved' || ticket.status === 'closed') {
                    await supabase
                        .from('support_tickets')
                        .update({ status: 'open', updated_at: new Date().toISOString() })
                        .eq('id', ticket.id);
                    setTicket({ ...ticket, status: 'open' });
                }
            }
        } catch (err) {
            console.error('Error sending message:', err);
        } finally {
            setIsSending(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleCloseTicket = async () => {
        if (!ticket) return;
        const supabase = createClient();
        await supabase
            .from('support_tickets')
            .update({ status: 'closed', updated_at: new Date().toISOString() })
            .eq('id', ticket.id);
        setTicket({ ...ticket, status: 'closed' });
    };

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        // Auto-resize
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
    };

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 pb-20">
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="h-8 w-64 skeleton-shimmer rounded-lg"></div>
                    <div className="h-6 w-96 skeleton-shimmer rounded-lg"></div>
                    <div className="bg-white rounded-2xl border border-slate-100 h-96 skeleton-shimmer"></div>
                </div>
            </div>
        );
    }

    if (!ticket) return null;

    const status = statusConfig[ticket.status] || statusConfig.open;
    const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
    const category = categoryConfig[ticket.category] || categoryConfig.general;
    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

    return (
        <div className="p-4 md:p-8 pb-20">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <a className="hover:text-primary transition-colors" href="/dashboard">الرئيسية</a>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <Link className="hover:text-primary transition-colors" href="/dashboard/support">الدعم الفني</Link>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="text-slate-900 font-medium">تذكرة #{ticket.ticket_number}</span>
                    </nav>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h2 className="text-2xl font-bold text-slate-900">{ticket.subject}</h2>
                        <div className="flex items-center gap-2">
                            {!isClosed && (
                                <button
                                    onClick={handleCloseTicket}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors text-sm flex items-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                    إغلاق التذكرة
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Chat Area - 3/4 */}
                    <div className="lg:col-span-3 flex flex-col">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft flex flex-col overflow-hidden" style={{ minHeight: '500px' }}>
                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: '60vh' }}>
                                {/* System message - ticket created */}
                                <div className="flex justify-center">
                                    <div className="bg-slate-50 border border-slate-100 text-slate-500 text-[11px] px-4 py-1.5 rounded-full font-medium">
                                        تم إنشاء التذكرة في {new Date(ticket.created_at).toLocaleDateString('ar-SA')} - {new Date(ticket.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {messages.map((msg) => {
                                    const isUser = msg.sender_type === 'user';
                                    return (
                                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex gap-2.5 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                                {/* Avatar */}
                                                <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isUser ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-600'}`}>
                                                    <span className="material-symbols-outlined text-sm">{isUser ? 'person' : 'support_agent'}</span>
                                                </div>
                                                {/* Bubble */}
                                                <div className={`relative`}>
                                                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
                                                        ? 'bg-primary text-white rounded-tr-md'
                                                        : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-md'
                                                        }`}>
                                                        {msg.message}
                                                        {msg.attachments && msg.attachments.length > 0 && (
                                                            <div className="mt-2 flex flex-col gap-2">
                                                                {msg.attachments.map((att: any, attIdx: number) => {
                                                                    const isImage = att.type?.startsWith('image/');
                                                                    const url = `https://rqcragxnihfktgmajfgz.supabase.co/storage/v1/object/public/support-attachments/${att.path}`;
                                                                    return (
                                                                        <div key={attIdx}>
                                                                            {isImage ? (
                                                                                <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-black/5 hover:border-black/10 transition-all">
                                                                                    <img src={url} alt={att.name} className="max-w-full h-auto max-h-[200px] object-contain" />
                                                                                </a>
                                                                            ) : (
                                                                                <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[11px] font-bold transition-all ${isUser ? 'bg-white/20 border-white/20 text-white hover:bg-white/30' : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50'}`}>
                                                                                    <span className="material-symbols-outlined text-sm">download</span>
                                                                                    <span className="truncate max-w-[120px]">{att.name}</span>
                                                                                </a>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        {isUser && (
                                                            <span className="material-symbols-outlined text-[12px] text-blue-400">done_all</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="size-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                                            <span className="material-symbols-outlined text-2xl text-slate-300">chat</span>
                                        </div>
                                        <p className="text-sm text-slate-500">لا توجد رسائل بعد. ابدأ المحادثة!</p>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input */}
                            <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                                {isClosed ? (
                                    <div className="text-center py-3">
                                        <p className="text-sm text-slate-500 mb-2">هذه التذكرة مغلقة. أرسل رسالة لإعادة فتحها.</p>
                                    </div>
                                ) : null}
                                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                                    <div className="flex-1 flex flex-col gap-2">
                                        {attachedFiles.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-1 p-2 bg-white/50 rounded-xl border border-slate-100">
                                                {attachedFiles.map((file, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700">
                                                        <span className="material-symbols-outlined text-sm text-slate-400">
                                                            {file.type.startsWith('image/') ? 'image' : 'description'}
                                                        </span>
                                                        <span className="max-w-[80px] truncate">{file.name}</span>
                                                        <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                                                            <span className="material-symbols-outlined text-xs">close</span>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="relative flex items-end gap-2">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                multiple
                                                className="hidden"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-2.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center h-[44px] w-[44px] shrink-0"
                                                title="إرفاق ملفات"
                                            >
                                                <span className="material-symbols-outlined text-xl">attach_file</span>
                                            </button>
                                            <textarea
                                                ref={textareaRef}
                                                placeholder="اكتب رسالتك هنا..."
                                                rows={1}
                                                value={newMessage}
                                                onChange={handleTextareaInput}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        handleSendMessage(e);
                                                    }
                                                }}
                                                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm resize-none leading-relaxed"
                                                style={{ minHeight: '44px', maxHeight: '150px' }}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending}
                                        className="p-3 rounded-xl bg-primary text-white hover:bg-blue-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
                                    >
                                        {isSending ? (
                                            <span className="sidebar-loading-spinner text-white"></span>
                                        ) : (
                                            <span className="material-symbols-outlined text-lg" style={{ transform: 'scaleX(-1)' }}>send</span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Info Sidebar - 1/4 */}
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 space-y-4">
                            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-lg">info</span>
                                معلومات التذكرة
                            </h4>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">الحالة</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${status.bg} ${status.color}`}>
                                        <span className={`size-1.5 rounded-full ${status.dot}`}></span>
                                        {status.label}
                                    </span>
                                </div>

                                <div className="h-px bg-slate-50"></div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">الأولوية</span>
                                    <span className={`text-xs font-bold flex items-center gap-1 ${priority.color}`}>
                                        <span className="material-symbols-outlined text-sm">{priority.icon}</span>
                                        {priority.label}
                                    </span>
                                </div>

                                <div className="h-px bg-slate-50"></div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">التصنيف</span>
                                    <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm text-slate-400">{category.icon}</span>
                                        {category.label}
                                    </span>
                                </div>

                                <div className="h-px bg-slate-50"></div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">تاريخ الإنشاء</span>
                                    <span className="text-xs text-slate-700 font-medium">
                                        {new Date(ticket.created_at).toLocaleDateString('ar-SA')}
                                    </span>
                                </div>

                                <div className="h-px bg-slate-50"></div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-500">الرسائل</span>
                                    <span className="text-xs text-slate-700 font-bold">{messages.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5 space-y-3">
                            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500 text-lg">bolt</span>
                                إجراءات سريعة
                            </h4>
                            <Link href="/dashboard/support/new" className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm text-slate-700 font-medium transition-colors w-full">
                                <span className="material-symbols-outlined text-sm text-primary">add</span>
                                تذكرة جديدة
                            </Link>
                            <Link href="/dashboard/support" className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-sm text-slate-700 font-medium transition-colors w-full">
                                <span className="material-symbols-outlined text-sm text-slate-400">arrow_back</span>
                                جميع التذاكر
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
