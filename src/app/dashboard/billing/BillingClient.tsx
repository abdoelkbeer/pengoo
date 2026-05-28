'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BillingClient({ initialBalance, transactions }: { initialBalance: number, transactions: any[] }) {
    const router = useRouter();
    const [balance, setBalance] = useState(initialBalance);
    const [loading, setLoading] = useState(false);
    const [fetchingPackages, setFetchingPackages] = useState(true);
    const [packages, setPackages] = useState<any[]>([]);
    const [settings, setSettings] = useState<any>({
        billing_custom_enabled: true,
        billing_custom_title: 'شحن مرن مخصص',
        billing_custom_description: 'هل تريد شحن مبلغ محدد غير موجود في الباقات؟ أدخل المبلغ بالدولار وسنقوم بحساب عدد الرسائل المضافة لمحفظتك. (كل 1$ = 100 رسالة).',
        billing_custom_rate: 100
    });
    const [customAmount, setCustomAmount] = useState('');
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/billing/packages');
                const data = await res.json();
                if (data.packages) {
                    setPackages(data.packages);
                }
                if (data.settings) {
                    setSettings(data.settings);
                }
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setFetchingPackages(false);
            }
        };
        fetchData();
    }, []);

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 5000);
    };

    const handleRecharge = async (params: { packageId?: string, messages?: number, price?: number }) => {
        const { packageId, messages, price } = params;
        const confirmText = packageId 
            ? `هل أنت متأكد من رغبتك في شراء هذه الباقة؟` 
            : `هل أنت متأكد من رغبتك في شحن محفظتك بـ ${messages?.toLocaleString()} رسالة مقابل ${price}$؟`;
            
        if (!confirm(confirmText)) return;
        
        setLoading(true);
        try {
            const res = await fetch('/api/billing/recharge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    packageId, 
                    messages_count: messages, 
                    amount_dollars: price 
                })
            });

            const data = await res.json();
            if (data.success) {
                setBalance(data.new_balance);
                showMessage('تم شحن رصيدك بنجاح! 🎉');
                router.refresh(); 
            } else {
                showMessage(data.error || 'فشلت عملية الشحن، يرجى المحاولة لاحقاً.', 'error');
            }
        } catch (error) {
            showMessage('حدث خطأ في الاتصال بالسيرفر.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCustomRecharge = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(customAmount);
        if (isNaN(amount) || amount <= 0) {
            showMessage('يرجى إدخال مبلغ صحيح.', 'error');
            return;
        }

        const messages = Math.floor(amount * (settings?.billing_custom_rate || 100));
        handleRecharge({ messages, price: amount });
    };

    return (
        <div className="space-y-10 animate-fade-in">
            {message && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${message.type === 'error' ? 'bg-red-600' : 'bg-slate-900'}`}>
                    {message.text}
                </div>
            )}

            {/* Current Balance Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                        <span className="material-symbols-outlined text-4xl text-blue-300">account_balance_wallet</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm mb-1">الرصيد المتبقي (رسائل)</p>
                        <h3 className="text-4xl font-black">{balance.toLocaleString()}</h3>
                    </div>
                </div>
                {balance <= 500 && (
                    <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium">
                        <span className="material-symbols-outlined shrink-0 text-red-400">warning</span>
                        رصيدك منخفض، يرجى الشحن لضمان استمرار الرسائل التلقائية.
                    </div>
                )}
            </div>

            {/* Packages Grid */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">inventory_2</span>
                    باقات شحن الرصيد
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {fetchingPackages ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-[400px] animate-pulse"></div>
                        ))
                    ) : packages.length > 0 ? (
                        packages.map((pkg) => (
                            <div key={pkg.id} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all flex flex-col group">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-3xl">{pkg.icon || 'star_outline'}</span>
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-1">{pkg.name}</h4>
                                <div className="flex items-end gap-1 mb-6">
                                    <span className="text-3xl font-black text-slate-900">${pkg.price}</span>
                                    <span className="text-slate-500 font-medium">/ لمرة واحدة</span>
                                </div>
                                
                                <ul className="flex flex-col gap-3 mb-8 flex-1 text-slate-600 text-sm">
                                    <li className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500 text-lg shrink-0">check_circle</span> <b>{pkg.messages.toLocaleString()}</b> رسالة واتساب</li>
                                    <li className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500 text-lg shrink-0">check_circle</span> رصيد صالح للأبد ولا تنتهي صلاحيته</li>
                                    <li className="flex items-center gap-3"><span className="material-symbols-outlined text-green-500 text-lg shrink-0">check_circle</span> خصم تلقائي بدون تدخل منك</li>
                                </ul>

                                <button 
                                    disabled={loading}
                                    onClick={() => handleRecharge({ packageId: pkg.id })}
                                    className="w-full py-3.5 rounded-xl bg-slate-50 text-slate-900 font-bold hover:bg-primary hover:text-white border border-slate-200 hover:border-primary transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                                    شراء الباقة
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-3 text-center py-10 text-slate-500">
                            لا توجد باقات متاحة حالياً.
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Recharge */}
            {settings.billing_custom_enabled && (
                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden">
                    <span className="material-symbols-outlined absolute -left-10 -top-10 text-[200px] text-blue-500/5 rotate-12 pointer-events-none">payments</span>

                    <div className="flex-1 relative z-10">
                        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">tune</span>
                            {settings.billing_custom_title}
                        </h3>
                        <p className="text-slate-600 text-sm leading-relaxed max-w-md">
                            {settings.billing_custom_description}
                        </p>
                    </div>
                    
                    <div className="flex w-full md:w-auto items-center gap-3 relative z-10 bg-white p-2 border border-slate-200 shadow-sm rounded-2xl shrink-0">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                placeholder="المبلغ (دولار)"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                min="1"
                                className="w-[140px] pl-8 pr-4 py-3 bg-slate-50 border-none focus:ring-2 focus:ring-primary rounded-xl text-slate-900 font-bold outline-none"
                            />
                        </div>
                        <button
                            disabled={loading || !customAmount}
                            onClick={handleCustomRecharge}
                            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                        >
                            شحن الآن
                        </button>
                    </div>
                </div>
            )}

            {/* Transaction History */}
            <div>
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">history</span>
                    سجل العمليات
                </h3>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {transactions && transactions.length > 0 ? (
                        <table className="w-full text-right text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                                <tr>
                                    <th className="px-6 py-4">التاريخ</th>
                                    <th className="px-6 py-4">الوصف</th>
                                    <th className="px-6 py-4">النوع</th>
                                    <th className="px-6 py-4 font-bold">الرصيد المضاف/المخصوم</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((tx, idx) => {
                                    const date = new Date(tx.created_at).toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' });
                                    const isPositive = tx.amount > 0;
                                    return (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600">{date}</td>
                                            <td className="px-6 py-4 text-slate-900 font-medium">{tx.description || '-'}</td>
                                            <td className="px-6 py-4 text-slate-500">
                                                {tx.type === 'admin_adjustment' ? 'تعديل من الإدارة' :
                                                 tx.type === 'recharge_custom' ? 'شحن مخصص' :
                                                 tx.type === 'recharge_package' ? 'شراء باقة' : 'استهلاك رسائل'}
                                            </td>
                                            <td className={`px-6 py-4 font-bold font-mono ${isPositive ? 'text-green-600' : 'text-slate-900'}`} dir="ltr">
                                                {isPositive ? '+' : ''}{tx.amount}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                            <span className="material-symbols-outlined text-4xl mb-3 text-slate-300">receipt_long</span>
                            <p>لا توجد أي حركات مالية مسجلة في محفظتك حتى الآن.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
