import React from 'react';

interface WhatsAppPreviewProps {
    message: string;
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    currency?: string;
    buttons?: { confirm?: boolean; cancel?: boolean; support?: boolean } | any[] | null;
}

export default function WhatsAppPreview({ 
    message, 
    isOpen, 
    onClose, 
    title = "معاينة الرسالة", 
    currency = 'ر.س',
    buttons = null
}: WhatsAppPreviewProps) {
    if (!isOpen) return null;

    // Simulate variables replacement for a more realistic preview
    const previewMessage = message
        ?.replace(/{customer_name}/g, 'أحمد محمد')
        ?.replace(/{order_id}/g, '#10042')
        ?.replace(/{order_total}/g, `150 ${currency}`)
        ?.replace(/{product_list}/g, '• منتج 1\n• منتج 2');

    // Helper to render buttons based on type
    const renderButtons = () => {
        if (!buttons) return null;

        // Legacy boolean object support
        if (!Array.isArray(buttons)) {
            if (!(buttons.confirm || buttons.cancel || buttons.support)) return null;
            return (
                <div className="self-end w-[90%] flex flex-col gap-1 mt-1">
                    {buttons.confirm && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center text-sm font-bold text-[#00a884] shadow-sm">
                            تأكيد الطلب
                        </div>
                    )}
                    {buttons.cancel && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center text-sm font-bold text-rose-500 shadow-sm">
                            إلغاء الطلب
                        </div>
                    )}
                    {buttons.support && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 text-center text-sm font-bold text-blue-500 shadow-sm">
                            خدمة العملاء
                        </div>
                    )}
                </div>
            );
        }

        // New array-based buttons support
        if (buttons.length === 0) return null;
        return (
            <div className="self-end w-[90%] flex flex-col gap-1 mt-1">
                {buttons.map((btn: any, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200 text-center text-sm font-bold text-[#00a884] shadow-sm">
                        {btn.text || "زر بدون نص"}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl overflow-hidden w-full max-w-sm flex flex-col shadow-2xl shadow-black/40 scale-in-center animate-in zoom-in-95 duration-200">

                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">معاينة الرسالة</h3>
                        <p className="text-xs text-slate-500 font-medium">{title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>

                {/* Mobile Mockup */}
                <div className="p-6 bg-slate-50 flex justify-center">
                    <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[40px] border-[8px] border-slate-900 shadow-xl overflow-hidden flex flex-col">

                        {/* Notch */}
                        <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
                            <div className="w-32 h-6 bg-slate-900 rounded-b-3xl"></div>
                        </div>

                        {/* WhatsApp Header */}
                        <div className="bg-[#075E54] text-white p-3 pt-8 pb-3 flex items-center gap-3 z-10 shadow-md">
                            <div className="flex items-center gap-1 cursor-pointer">
                                <span className="material-symbols-outlined text-xl rtl:-scale-x-100">arrow_back</span>
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
                                    <span className="material-symbols-outlined text-white/80">storefront</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-[15px] leading-tight">متجرك</h4>
                                <p className="text-[11px] text-white/80">متصل الآن</p>
                            </div>
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-xl">videocam</span>
                                <span className="material-symbols-outlined text-xl">call</span>
                                <span className="material-symbols-outlined text-xl">more_vert</span>
                            </div>
                        </div>

                        {/* WhatsApp Chat Background */}
                        <div className="flex-1 bg-[#E5DDD5] relative p-4 flex flex-col overflow-y-auto" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'cover', backgroundBlendMode: 'overlay', backgroundColor: 'rgba(255,255,255,0.7)' }}>
                            <div className="bg-[#E1F5FE] text-slate-600 text-[11px] px-3 py-1.5 rounded-lg mx-auto mb-4 shadow-sm w-fit font-medium">
                                اليوم
                            </div>

                            {/* Message Bubble */}
                            <div className="bg-[#DCF8C6] p-2 pb-1.5 rounded-xl rounded-tr-none w-[90%] self-end shadow-sm relative group mb-2">
                                <p className="text-[14px] text-slate-800 leading-relaxed whitespace-pre-wrap font-sans" dir="rtl">{previewMessage}</p>
                                <div className="flex items-center justify-end gap-1 mt-1 opacity-80">
                                    <span className="text-[10px] text-slate-500">10:42 م</span>
                                </div>
                                {/* Tail */}
                                <div className="absolute top-0 -right-2 w-3 h-3 text-[#DCF8C6]">
                                    <svg viewBox="0 0 8 13" width="8" height="13" className="fill-current">
                                        <path opacity=".13" d="M5.188 1H0v11.193l6.467-8.625C7.526 2.156 6.958 1 5.188 1z"></path>
                                        <path fill="currentColor" d="M5.188 0H0v11.193l6.467-8.625C7.526 1.156 6.958 0 5.188 0z"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Buttons Preview */}
                            {renderButtons()}
                        </div>

                        {/* WhatsApp Input */}
                        <div className="bg-[#F0F0F0] p-2 flex gap-2 items-end z-10">
                            <div className="flex-1 bg-white rounded-full min-h-[40px] flex items-center px-3 gap-2">
                                <span className="material-symbols-outlined text-slate-400 text-xl">mood</span>
                                <input type="text" placeholder="اكتب رسالة..." className="flex-1 bg-transparent border-none text-[15px] outline-none placeholder:text-slate-400" disabled />
                                <span className="material-symbols-outlined text-slate-400 text-xl transform -rotate-45">attachment</span>
                                <span className="material-symbols-outlined text-slate-400 text-xl">camera_alt</span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#00897B] flex items-center justify-center text-white shrink-0">
                                <span className="material-symbols-outlined text-xl">mic</span>
                            </div>
                        </div>

                    </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex justify-center">
                    <p className="text-xs text-slate-500 text-center flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">info</span>
                        الكلمات بين الأقواس سيتم استبدالها تلقائياً ببيانات العميل الحقيقية
                    </p>
                </div>
            </div>
        </div>
    );
}
