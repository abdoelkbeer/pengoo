'use client';

import { useState } from 'react';

export default function StoreActions({ storeId }: { storeId: string }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm('هل أنت متأكد من حذف هذا المتجر؟ سيؤدي ذلك لقطع الاتصال نهائياً.')) return;

        setLoading(true);
        try {
            const res = await fetch('/api/admin/stores/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ storeId })
            });

            if (res.ok) {
                window.location.reload();
            } else {
                const err = await res.json();
                alert('خطأ: ' + (err.error || 'فشل الحذف'));
            }
        } catch (error) {
            console.error(error);
            alert('حدث خطأ فني');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={loading}
            className={`p-2 rounded-lg transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'text-text-sub hover:text-red-600 hover:bg-red-50'}`}
            title="حذف المتجر"
        >
            <span className="material-symbols-outlined text-lg">
                {loading ? 'sync' : 'delete'}
            </span>
        </button>
    );
}
