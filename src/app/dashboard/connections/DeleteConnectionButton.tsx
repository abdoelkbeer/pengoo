'use client';

import React, { useState } from 'react';

export default function DeleteConnectionButton({ connectionId }: { connectionId: string }) {
    const [status, setStatus] = useState<'idle' | 'deleting' | 'deleted'>('idle');

    const handleDelete = async () => {
        if (!confirm('هل أنت متأكد من حذف هذا الاتصال؟')) return;
        setStatus('deleting');

        try {
            const res = await fetch('/api/whatsapp/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ connectionId })
            });
            const data = await res.json();
            if (data.success) {
                setStatus('deleted');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setStatus('idle');
                alert('فشل حذف الاتصال: ' + (data.error || 'خطأ غير معروف'));
            }
        } catch (err) {
            setStatus('idle');
            alert('حدث خطأ أثناء الحذف');
        }
    };

    if (status === 'deleted') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                تم المسح بنجاح
            </span>
        );
    }

    if (status === 'deleting') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-400 text-xs font-medium">
                <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                جاري المسح...
            </span>
        );
    }

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={handleDelete}
                className="flex h-8 items-center gap-1.5 rounded-lg px-3 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors text-xs font-medium"
                title="حذف الاتصال"
            >
                <span className="material-symbols-outlined text-lg">delete</span>
                <span className="hidden lg:inline">حذف</span>
            </button>
        </div>
    );
}
