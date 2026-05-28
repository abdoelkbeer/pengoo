'use client';

import React, { useState } from 'react';

type User = {
    id: string;
    full_name: string;
    user_email: string;
    wallet_balance: number;
    created_at: string;
};

export default function AdminUsersClient({ initialUsers }: { initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleAdjust = async () => {
        const amount = parseInt(adjustmentAmount);
        if (isNaN(amount) || amount === 0) {
            showMessage('يرجى إدخال رقم صحيح', 'error');
            return;
        }

        if (!selectedUser) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/credits`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, description })
            });

            const data = await res.json();
            if (data.success) {
                // Update local state
                setUsers(users.map(u => u.id === selectedUser.id ? { ...u, wallet_balance: data.new_balance } : u));
                showMessage(`تم تحديث رصيد ${selectedUser.full_name || selectedUser.user_email} بنجاح`);
                setSelectedUser(null);
                setAdjustmentAmount('');
                setDescription('');
            } else {
                showMessage(data.error || 'حدث خطأ', 'error');
            }
        } catch (error) {
            showMessage('فشل الاتصال بالخادم', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            {message && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${message.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
                    {message.text}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">المستخدم</th>
                            <th className="px-6 py-4">تاريخ التسجيل</th>
                            <th className="px-6 py-4">الرصيد المتبقي</th>
                            <th className="px-6 py-4">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900">{user.full_name || 'بدون اسم'}</div>
                                    <div className="text-slate-500 text-xs mt-1">{user.user_email}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-500">
                                    {new Date(user.created_at).toLocaleDateString('ar-EG')}
                                </td>
                                <td className="px-6 py-4 font-mono font-bold text-slate-900">
                                    {user.wallet_balance || 0}
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setSelectedUser(user)}
                                        className="text-primary font-medium hover:text-blue-700 hover:underline text-sm"
                                    >
                                        تعديل الرصيد
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal for adjusting balance */}
            {selectedUser && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-[fadeSlideDown_0.2s_ease]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">تعديل رصيد الرسائل</h3>
                            <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-sm text-slate-500">المستخدم:</p>
                            <p className="font-bold text-slate-900">{selectedUser.full_name || selectedUser.user_email}</p>
                            <div className="mt-2 flex justify-between text-sm">
                                <span className="text-slate-500">الرصيد الحالي:</span>
                                <span className="font-mono font-bold">{selectedUser.wallet_balance || 0} رسالة</span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">الكمية (للإضافة أو الخصم)</label>
                                <input
                                    type="number"
                                    placeholder="مثال: 500 للشحن، أو -50 للخصم"
                                    value={adjustmentAmount}
                                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 outline-none rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-slate-900 dir-ltr text-right"
                                />
                                <p className="text-xs text-slate-500 mt-1">استخدم السالب (-) للخصم والموجب (+) للإضافة</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">سبب التعديل (يظهر للمستخدم)</label>
                                <input
                                    type="text"
                                    placeholder="مثال: هدية ترحيبية، تصحيح خطأ..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 outline-none rounded-xl focus:ring-2 focus:ring-primary focus:border-primary text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="flex-1 py-3 bg-slate-100 font-bold text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleAdjust}
                                disabled={loading || !adjustmentAmount}
                                className="flex-1 py-3 bg-primary font-bold text-white rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? 'جاري التنفيذ...' : 'تأكيد العملية'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
