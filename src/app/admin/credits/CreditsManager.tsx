'use client';

import React, { useState } from 'react';

export default function CreditsManager({ initialUsers }: { initialUsers: any[] }) {
    const [users, setUsers] = useState<any[]>(initialUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [amount, setAmount] = useState(100);
    const [loading, setLoading] = useState(false);

    const filteredUsers = users.filter((u: any) =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreditUpdate = async (type: string) => {
        if (!selectedUser) return;
        setLoading(true);

        try {
            const res = await fetch('/api/admin/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser.id, amount, type })
            });
            const result = await res.json();
            if (result.success) {
                // Update local state
                const updatedUsers = users.map(u => {
                    if (u.id === selectedUser.id) {
                        return { ...u, messagesLimit: result.newLimit };
                    }
                    return u;
                });
                setUsers(updatedUsers);
                setSelectedUser({ ...selectedUser, messagesLimit: result.newLimit });
                alert('تم التعديل بنجاح!');
            } else {
                alert('خطأ: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Selection List */}
            <div className="bg-white rounded-3xl border border-border-color shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="p-6 border-b border-border-color bg-gray-50/30">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-sub">search</span>
                        <input type="text" placeholder="البحث واختيار مستخدم لزيادة رصيده..."
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-color bg-white outline-none focus:border-primary transition-all text-sm"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                    {filteredUsers.map(user => (
                        <button key={user.id} onClick={() => setSelectedUser(user)}
                            className={`w-full flex items-center justify-between p-4 rounded-2xl mb-2 transition-all border
                                ${selectedUser?.id === user.id ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-transparent hover:bg-gray-50'}`}>
                            <div className="flex items-center gap-3 text-right">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm
                                    ${selectedUser?.id === user.id ? 'bg-primary text-white' : 'bg-gray-100 text-text-sub'}`}>
                                    {user.full_name?.[0] || 'U'}
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-text-main line-clamp-1">{user.full_name}</p>
                                    <p className="text-[10px] text-text-sub font-medium truncate">{user.email} • {user.planName}</p>
                                </div>
                            </div>
                            <div className="text-left shrink-0">
                                <p className="text-xs font-black text-primary">{user.messagesLimit.toLocaleString()}</p>
                                <p className="text-[9px] text-text-sub font-bold uppercase">رصيد متاح</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Credit Control Panel */}
            <div className="bg-white rounded-3xl border border-border-color shadow-sm p-8 flex flex-col justify-center min-h-[400px]">
                {!selectedUser ? (
                    <div className="flex flex-col items-center justify-center text-center py-10 opacity-40">
                        <span className="material-symbols-outlined text-7xl mb-4">account_balance_wallet</span>
                        <p className="font-black text-lg">اختر مستخدماً للتحكم في رصيده</p>
                    </div>
                ) : (
                    <div className="space-y-10 animate-fade-in">
                        <div className="text-center">
                            <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-6 border border-primary/20 shadow-inner">
                                <span className="material-symbols-outlined text-4xl">toll</span>
                            </div>
                            <h3 className="text-2xl font-black text-text-main underline decoration-primary/20 underline-offset-8 decoration-4 mb-2">{selectedUser.full_name}</h3>
                            <p className="text-text-sub text-sm font-medium">{selectedUser.email}</p>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 border border-border-color flex justify-between items-center text-center">
                            <div className="flex-1">
                                <p className="text-[10px] text-text-sub font-black uppercase mb-1">الرصيد الكلي الحالي</p>
                                <p className="text-2xl font-black text-primary">{selectedUser.messagesLimit.toLocaleString()}</p>
                            </div>
                            <div className="w-px h-8 bg-gray-200"></div>
                            <div className="flex-1">
                                <p className="text-[10px] text-text-sub font-black uppercase mb-1">المستهلك حتى الآن</p>
                                <p className="text-2xl font-black text-text-main">{selectedUser.messagesUsed.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-black text-text-main block">أدخل القيمة المراد تعديلها:</label>
                            <input type="number" step="10" className="w-full h-16 text-center text-3xl font-black rounded-2xl border border-border-color bg-white outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                                value={amount} onChange={e => setAmount(Math.max(0, parseInt(e.target.value) || 0))} />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed border-border-color">
                            <button onClick={() => handleCreditUpdate('add')} disabled={loading}
                                className="h-16 rounded-2xl bg-primary text-white font-black hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex flex-col items-center justify-center">
                                <span className="text-lg">إضافة للرصيد</span>
                                <span className="text-[10px] opacity-70">إضافة القيمة للحد الحالي</span>
                            </button>
                            <button onClick={() => handleCreditUpdate('set')} disabled={loading}
                                className="h-16 rounded-2xl bg-gray-100 text-text-main border border-border-color font-black hover:bg-gray-200 transition-all flex flex-col items-center justify-center">
                                <span className="text-lg">تحديد الحد الكلي</span>
                                <span className="text-[10px] opacity-70">تعيين القيمة كحد نهائي</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
