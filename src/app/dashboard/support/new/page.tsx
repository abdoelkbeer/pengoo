'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function NewTicketPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
    });

    const categories = [
        { value: 'technical', label: 'مشكلة فنية', icon: 'build', desc: 'أعطال، أخطاء تقنية، أو مشاكل في الأداء' },
        { value: 'billing', label: 'اشتراكات وفواتير', icon: 'payments', desc: 'استفسارات حول الدفع أو الاشتراكات' },
        { value: 'connections', label: 'مشاكل الاتصال', icon: 'phonelink_ring', desc: 'مشاكل في ربط واتساب أو ووكومرس' },
        { value: 'general', label: 'استفسار عام', icon: 'help', desc: 'أسئلة عامة أو اقتراحات' },
    ];

    const priorities = [
        { value: 'low', label: 'منخفضة', color: 'bg-slate-100 text-slate-600 border-slate-200', desc: 'يمكن الانتظار' },
        { value: 'medium', label: 'متوسطة', color: 'bg-blue-50 text-blue-700 border-blue-200', desc: 'تحتاج حل قريب' },
        { value: 'high', label: 'عالية', color: 'bg-orange-50 text-orange-700 border-orange-200', desc: 'تؤثر على العمل' },
        { value: 'critical', label: 'حرجة', color: 'bg-red-50 text-red-700 border-red-200', desc: 'توقف كامل' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.subject.trim() || !formData.description.trim()) return;

        setIsSubmitting(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/auth/login');
                return;
            }

            const { data: ticket, error } = await supabase
                .from('support_tickets')
                .insert({
                    user_id: user.id,
                    subject: formData.subject,
                    description: formData.description,
                    category: formData.category,
                    priority: formData.priority,
                    status: 'open',
                })
                .select()
                .single();

            if (error) throw error;

            // Also insert the description as the first message
            if (ticket) {
                await supabase
                    .from('ticket_messages')
                    .insert({
                        ticket_id: ticket.id,
                        sender_id: user.id,
                        sender_type: 'user',
                        message: formData.description,
                    });

                router.push(`/dashboard/support/${ticket.id}`);
            }
        } catch (err) {
            console.error('Error creating ticket:', err);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-8 pb-20">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <a className="hover:text-primary transition-colors" href="/dashboard">الرئيسية</a>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <a className="hover:text-primary transition-colors" href="/dashboard/support">الدعم الفني</a>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="text-slate-900 font-medium">تذكرة جديدة</span>
                    </nav>
                    <h2 className="text-3xl font-bold text-slate-900">إنشاء تذكرة دعم</h2>
                    <p className="text-slate-500 mt-1">صِف مشكلتك وسنعمل على حلها في أسرع وقت.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Category Selection */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                        <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-lg">category</span>
                            نوع المشكلة
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">اختر التصنيف الأنسب لمشكلتك لنوجهها للفريق المناسب</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {categories.map((cat) => (
                                <label
                                    key={cat.value}
                                    className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.category === cat.value
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="category"
                                        value={cat.value}
                                        checked={formData.category === cat.value}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="sr-only"
                                    />
                                    <div className={`p-2 rounded-lg ${formData.category === cat.value ? 'bg-primary/10 text-primary' : 'bg-slate-50 text-slate-400'} transition-colors`}>
                                        <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-slate-900">{cat.label}</span>
                                        <p className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</p>
                                    </div>
                                    {formData.category === cat.value && (
                                        <span className="absolute top-3 left-3 material-symbols-outlined text-primary text-lg">check_circle</span>
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Priority Selection */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6">
                        <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-orange-500 text-lg">priority_high</span>
                            مستوى الأولوية
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">حدد مدى تأثير المشكلة على عملك</p>
                        <div className="flex flex-wrap gap-3">
                            {priorities.map((pri) => (
                                <label
                                    key={pri.value}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all text-sm font-medium ${formData.priority === pri.value
                                        ? `${pri.color} border-current shadow-sm`
                                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="priority"
                                        value={pri.value}
                                        checked={formData.priority === pri.value}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                        className="sr-only"
                                    />
                                    <span>{pri.label}</span>
                                    <span className="text-[10px] opacity-70">({pri.desc})</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Subject & Description */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-6 space-y-5">
                        <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-500 text-lg">edit_note</span>
                            تفاصيل المشكلة
                        </h3>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-700">عنوان التذكرة <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="مثال: لا يمكنني ربط رقم واتساب..."
                                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-700 font-medium"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-semibold text-slate-700">وصف المشكلة <span className="text-red-500">*</span></label>
                            <textarea
                                required
                                rows={6}
                                placeholder="اشرح مشكلتك بالتفصيل... ما الذي حدث؟ ما الخطوات التي اتبعتها؟ ما النتيجة المتوقعة؟"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-slate-700 font-medium resize-none leading-relaxed"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end gap-3 pt-2">
                        <a href="/dashboard/support" className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors text-sm">
                            إلغاء
                        </a>
                        <button
                            type="submit"
                            disabled={isSubmitting || !formData.subject.trim() || !formData.description.trim()}
                            className="px-8 py-3 rounded-xl bg-primary text-white font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="sidebar-loading-spinner text-white"></span>
                                    جاري الإرسال...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">send</span>
                                    إرسال التذكرة
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
