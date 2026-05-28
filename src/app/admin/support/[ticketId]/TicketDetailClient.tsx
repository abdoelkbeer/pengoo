'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sendSupportMessage, updateTicketStatus, updateTicketPriority, updateTicketCategory, toggleTicketStatus } from './actions';
import { createClient } from '@/utils/supabase/client';

interface Ticket {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    ticket_number: number;
    created_at: string;
    user_profiles?: { id: string, full_name: string, email?: string } | null;
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

export default function TicketDetailClient({ initialTicket, initialMessages }: { initialTicket: Ticket, initialMessages: Message[] }) {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // State for immediate UI updates
    const [currentStatus, setCurrentStatus] = useState(initialTicket.status);
    const [currentPriority, setCurrentPriority] = useState(initialTicket.priority);
    const [currentCategory, setCurrentCategory] = useState(initialTicket.category);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`ticket_messages:${initialTicket.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'ticket_messages',
                    filter: `ticket_id=eq.${initialTicket.id}`
                },
                (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages((prev) => {
                        // Avoid duplicates from optimistic updates or refreshes
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        // Also check for temp messages with same content/sender if UUIDs aren't matched yet
                        // (Simplified for now: just IDs)
                        return [...prev, newMessage];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [initialTicket.id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        const tempMessage = newMessage.trim();

        let uploadedAttachments: any[] = [];

        if (attachedFiles.length > 0) {
            setIsUploading(true);
            const supabase = createClient();
            for (const file of attachedFiles) {
                const fileName = `${Date.now()}_${file.name}`;
                const { data, error } = await supabase.storage
                    .from('support-attachments')
                    .upload(`${initialTicket.id}/${fileName}`, file);

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

        // Optimistic UI update
        const optimisticMsg: Message = {
            id: `temp-${Date.now()}`,
            ticket_id: initialTicket.id,
            sender_id: 'admin',
            sender_type: 'support',
            message: tempMessage,
            attachments: uploadedAttachments,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        setAttachedFiles([]);
        if (textareaRef.current) textareaRef.current.style.height = 'auto';

        const result = await sendSupportMessage(initialTicket.id, tempMessage, uploadedAttachments);

        if (result.success) {
            router.refresh();
            if (currentStatus === 'open' || currentStatus === 'resolved' || currentStatus === 'closed') {
                setCurrentStatus('in_progress');
            }
        } else {
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
            setNewMessage(tempMessage);
            alert('Failed to send message: ' + result.error);
        }
        setIsSending(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleToggleStatus = async () => {
        const result = await toggleTicketStatus(initialTicket.id, currentStatus);
        if (result.success) {
            const newStatus = currentStatus === 'closed' || currentStatus === 'resolved' ? 'open' : 'closed';
            setCurrentStatus(newStatus);
        } else {
            alert('Failed to update status');
        }
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value;
        const oldStatus = currentStatus;
        setCurrentStatus(newStatus);

        const result = await updateTicketStatus(initialTicket.id, newStatus);
        if (!result.success) {
            setCurrentStatus(oldStatus);
            alert('Failed to update status');
        }
    };

    const handlePriorityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPriority = e.target.value;
        const oldPriority = currentPriority;
        setCurrentPriority(newPriority);

        const result = await updateTicketPriority(initialTicket.id, newPriority);
        if (!result.success) {
            setCurrentPriority(oldPriority);
            alert('Failed to update priority');
        }
    };

    const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategory = e.target.value;
        const oldCategory = currentCategory;
        setCurrentCategory(newCategory);

        const result = await updateTicketCategory(initialTicket.id, newCategory);
        if (!result.success) {
            setCurrentCategory(oldCategory);
            alert('Failed to update category');
        }
    };

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
    };

    const status = statusConfig[currentStatus] || statusConfig.open;

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-6 md:p-8 rounded-3xl border border-border-color shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary to-orange-500"></div>
                <div className="flex flex-col gap-1 z-10 w-full">
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <Link className="hover:text-primary transition-colors font-medium" href="/admin">لوحة التحكم</Link>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <Link className="hover:text-primary transition-colors font-medium" href="/admin/support">الدعم الفني</Link>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="text-slate-900 font-bold">تذكرة #{initialTicket.ticket_number}</span>
                    </nav>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-black text-slate-900 line-clamp-2">{initialTicket.subject}</h2>
                            <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.bg} ${status.color}`}>
                                <span className={`size-2 rounded-full ${status.dot} animate-pulse`}></span>
                                {status.label}
                            </span>
                            <button
                                onClick={handleToggleStatus}
                                className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all border ${currentStatus === 'closed' || currentStatus === 'resolved'
                                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20'
                                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-sm">
                                    {currentStatus === 'closed' || currentStatus === 'resolved' ? 'settings_backup_restore' : 'done_all'}
                                </span>
                                {currentStatus === 'closed' || currentStatus === 'resolved' ? 'إعادة فتح التذكرة' : 'إغلاق التذكرة'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Chat Area - 3/4 */}
                <div className="lg:col-span-3 flex flex-col">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[600px]">
                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
                            {/* System message - ticket created */}
                            <div className="flex justify-center">
                                <div className="bg-white border border-slate-200 shadow-sm text-slate-600 text-xs px-5 py-2 rounded-full font-bold">
                                    تم إنشاء التذكرة في {new Date(initialTicket.created_at).toLocaleDateString('ar-SA')} - {new Date(initialTicket.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>

                            {/* Original Description as first message */}
                            {initialTicket.description && (
                                <div className="flex justify-start">
                                    <div className="flex gap-3 max-w-[85%] flex-row">
                                        <div className="size-10 rounded-full flex items-center justify-center shrink-0 mt-1 bg-primary/10 text-primary font-bold shadow-sm">
                                            {initialTicket.user_profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="relative">
                                            <div className="px-5 py-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed bg-white border border-slate-200 text-slate-800 shadow-sm whitespace-pre-wrap">
                                                <div className="font-bold text-xs text-primary mb-1">وصف المشكلة الأساسي</div>
                                                {initialTicket.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {messages.map((msg) => {
                                const isSupport = msg.sender_type === 'support';
                                return (
                                    <div key={msg.id} className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex gap-3 max-w-[85%] ${isSupport ? 'flex-row-reverse' : 'flex-row'}`}>
                                            {/* Avatar */}
                                            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm font-bold ${isSupport ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                                                {isSupport ? <span className="material-symbols-outlined text-lg">support_agent</span> : (initialTicket.user_profiles?.full_name?.[0]?.toUpperCase() || 'U')}
                                            </div>
                                            {/* Bubble */}
                                            <div className={`relative`}>
                                                <div className={`px-5 py-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${isSupport
                                                    ? 'bg-orange-500 text-white rounded-tl-sm'
                                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tr-sm'
                                                    }`}>
                                                    {msg.message}
                                                    {msg.attachments && msg.attachments.length > 0 && (
                                                        <div className="mt-3 flex flex-col gap-2">
                                                            {msg.attachments.map((att: any, attIdx: number) => {
                                                                const isImage = att.type?.startsWith('image/');
                                                                const url = `https://rqcragxnihfktgmajfgz.supabase.co/storage/v1/object/public/support-attachments/${att.path}`;
                                                                return (
                                                                    <div key={attIdx}>
                                                                        {isImage ? (
                                                                            <a href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-black/10 hover:border-black/20 transition-all">
                                                                                <img src={url} alt={att.name} className="max-w-full h-auto max-h-[300px] object-contain bg-slate-50" />
                                                                            </a>
                                                                        ) : (
                                                                            <a href={url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${isSupport ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
                                                                                <span className="material-symbols-outlined text-sm">download</span>
                                                                                <span className="truncate">{att.name}</span>
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={`flex items-center gap-1 mt-1.5 ${isSupport ? 'justify-end' : 'justify-start'}`}>
                                                    <span className="text-[11px] text-slate-400 font-medium">
                                                        {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {isSupport && (
                                                        <span className="material-symbols-outlined text-[14px] text-orange-400">done_all</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="border-t border-slate-200 p-4 bg-white">
                            <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                                <div className="flex-1 flex flex-col gap-2">
                                    {attachedFiles.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-slate-100/50 rounded-xl border border-slate-100">
                                            {attachedFiles.map((file, idx) => (
                                                <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                                                    <span className="material-symbols-outlined text-sm text-slate-400">
                                                        {file.type.startsWith('image/') ? 'image' : 'description'}
                                                    </span>
                                                    <span className="max-w-[100px] truncate">{file.name}</span>
                                                    <button type="button" onClick={() => removeFile(idx)} className="text-red-500 hover:text-red-700">
                                                        <span className="material-symbols-outlined text-sm">close</span>
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
                                            className="p-3.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center h-[52px] w-[52px] shrink-0"
                                            title="إرفاق ملفات"
                                        >
                                            <span className="material-symbols-outlined text-xl">attach_file</span>
                                        </button>
                                        <textarea
                                            ref={textareaRef}
                                            placeholder="اكتب ردك كدعم فني هنا..."
                                            rows={1}
                                            value={newMessage}
                                            onChange={handleTextareaInput}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                            className="flex-1 px-5 py-3.5 rounded-2xl border border-slate-200 bg-gray-50 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none text-sm resize-none leading-relaxed font-medium placeholder:text-gray-400"
                                            style={{ minHeight: '52px', maxHeight: '200px' }}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="p-3.5 rounded-2xl bg-orange-600 text-white hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none shrink-0 flex items-center justify-center h-[52px] w-[52px]"
                                >
                                    {isSending ? (
                                        <span className="sidebar-loading-spinner text-white !w-5 !h-5 border-2"></span>
                                    ) : (
                                        <span className="material-symbols-outlined text-xl" style={{ transform: 'scaleX(-1)' }}>send</span>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Ticket Control Sidebar - 1/4 */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">person</span>
                                <h4 className="font-black text-sm text-slate-900">معلومات العميل</h4>
                            </div>
                            {initialTicket.user_profiles?.id && (
                                <Link
                                    href={`/admin/customers/${initialTicket.user_profiles.id}`}
                                    className="text-primary text-[10px] font-black uppercase hover:underline"
                                >
                                    الملف الشخصي
                                </Link>
                            )}
                        </div>
                        <div className="p-5 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xl font-black shadow-inner">
                                    {initialTicket.user_profiles?.full_name?.[0] || 'U'}
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <span className="block font-bold text-slate-800 text-sm">{initialTicket.user_profiles?.full_name || 'غير معروف'}</span>
                                    <span className="block text-[11px] text-slate-500 font-medium">{initialTicket.user_profiles?.email || 'لا يوجد بريد'}</span>
                                </div>
                            </div>
                            <div className="h-px bg-slate-100"></div>
                            <div>
                                <span className="block text-xs text-slate-500 font-medium mb-1">تاريخ فتح التذكرة</span>
                                <span className="block font-bold text-slate-800 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                                    {new Date(initialTicket.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 p-5 flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500">settings</span>
                            <h4 className="font-black text-sm text-slate-900">إدارة التذكرة</h4>
                        </div>

                        <div className="p-5 space-y-5">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700">حالة التذكرة</label>
                                <select
                                    value={currentStatus}
                                    onChange={handleStatusChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'left 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                                >
                                    <option value="open">مفتوحة</option>
                                    <option value="in_progress">قيد المعالجة</option>
                                    <option value="resolved">تم الحل</option>
                                    <option value="closed">مغلقة</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700">الأولوية</label>
                                <select
                                    value={currentPriority}
                                    onChange={handlePriorityChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'left 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                                >
                                    <option value="low">منخفضة</option>
                                    <option value="medium">متوسطة</option>
                                    <option value="high">عالية</option>
                                    <option value="critical">حرجة</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-700">التصنيف</label>
                                <select
                                    value={currentCategory}
                                    onChange={handleCategoryChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'left 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                                >
                                    <option value="technical">فني</option>
                                    <option value="billing">اشتراكات</option>
                                    <option value="connections">اتصالات</option>
                                    <option value="general">عام</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
