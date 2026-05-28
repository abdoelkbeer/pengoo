// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import CountryCodeSelector from '@/components/CountryCodeSelector';
import { COUNTRIES } from '@/utils/countries';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
    const router = useRouter();

    // Profile State
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+20');

    // Store & Subscription State
    const [stores, setStores] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);

    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    // Delete Account State
    const [isDeleting, setIsDeleting] = useState(false);

    // Store Editing State
    const [editingStore, setEditingStore] = useState<any>(null);
    const [newStoreName, setNewStoreName] = useState('');
    const [subscription, setSubscription] = useState<any>(null);

    const supabase = createClient();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setEmail(user.email || '');

        const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        setProfile(profileData);
        setFullName(profileData?.full_name || user.user_metadata?.full_name || '');
        
        const fullPhone = profileData?.phone_number || '';
        if (fullPhone) {
            const cleanedPhone = fullPhone.startsWith('+') ? fullPhone : '+' + fullPhone;
            const countryMatch = COUNTRIES.find(c => cleanedPhone.startsWith(c.code));
            if (countryMatch) {
                setCountryCode(countryMatch.code);
                setPhone(cleanedPhone.substring(countryMatch.code.length));
            } else {
                setPhone(fullPhone);
                setCountryCode('+20');
            }
        }

        // Load active subscription
        const { data: subData } = await supabase
            .from('subscriptions')
            .select('*, plans(*)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();
            
        // Calculate unlimited status
        if (subData) {
            const maxMessages = subData.max_messages_override || subData.plans?.max_messages || 50;
            subData.isUnlimited = maxMessages >= 999999 || maxMessages === -1;
            subData.effectiveMaxMessages = maxMessages;
        }
        
        setSubscription(subData);

        // Load stores
        const { data: storesData } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        
        setStores(storesData || []);
        
        setLoading(false);
    };

    const getStoreDisplayName = (store: any) => {
        if (store.fallback_name) return store.fallback_name;
        if (store.name && store.name !== 'WooCommerce') return store.name;
        if (store.store_url) {
            try {
                return new URL(store.store_url).hostname;
            } catch (e) {
                return store.store_url;
            }
        }
        return store.store_type === 'WOOCOMMERCE' ? 'متجر ووكوميرس' : 'متجر جديد';
    };

    const handleUpdateStoreName = async () => {
        if (!editingStore) return;
        setSaving(true);
        const { error } = await supabase
            .from('stores')
            .update({ fallback_name: newStoreName })
            .eq('id', editingStore.id);
        
        if (error) {
            showMessage('فشل تحديث الاسم: ' + error.message, 'error');
        } else {
            showMessage('تم تحديث اسم المتجر بنجاح ✓');
            setStores(stores.map(s => s.id === editingStore.id ? { ...s, fallback_name: newStoreName } : s));
            setEditingStore(null);
        }
        setSaving(false);
    };

    const showMessage = (text: string, type: 'success' | 'error' = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const fullPhone = phone ? (countryCode + phone).replace(/\+/g, '') : '';
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName, phone_number: fullPhone })
            });
            const data = await res.json();
            if (data.success) {
                showMessage('تم حفظ التغييرات بنجاح ✓');
            } else {
                showMessage('فشل الحفظ: ' + data.error, 'error');
            }
        } catch (err) {
            showMessage('حدث خطأ غير متوقع', 'error');
        }
        setSaving(false);
    };

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            showMessage('يجب أن تكون كلمة المرور 6 أحرف على الأقل', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showMessage('كلمتا المرور غير متطابقتين', 'error');
            return;
        }

        setChangingPassword(true);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
            showMessage(error.message, 'error');
        } else {
            showMessage('تم تغيير كلمة المرور بنجاح ✓');
            setNewPassword('');
            setConfirmPassword('');
        }
        setChangingPassword(false);
    };

    const handleDeleteAccount = async () => {
        if (!confirm('هل أنت متأكد من رغبتك في حذف حسابك؟ هذا الإجراء لا يمكن التراجع عنه وسيتم حذف جميع بياناتك.')) return;

        setIsDeleting(true);
        // Note: Actual deletion usually requires admin privileges or calling a secure edge function
        // For demonstration purposes, we attempt to sign out and redirect
        // You should implement a proper /api/account/delete endpoint.
        try {
            await supabase.auth.signOut();
            window.location.href = '/auth/login';
        } catch (err) {
            showMessage('حدث خطأ أثناء محاولة حذف الحساب', 'error');
        }
        setIsDeleting(false);
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-10">
                <div className="flex flex-col items-center text-primary">
                    <span className="material-symbols-outlined text-4xl animate-spin mb-3">sync</span>
                    <span className="font-bold">جاري التحميل...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {message && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${message.type === 'success' ? 'bg-slate-900' : 'bg-red-600'}`}>
                    {message.text}
                </div>
            )}
            <div className="flex-1 p-4 md:p-8 pb-20 w-full bg-slate-50/30">
                <div className="max-w-5xl mx-auto space-y-10">

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
                        <div className="flex flex-col gap-1.5">
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight">الإعدادات</h1>
                            <p className="text-base text-slate-500 font-medium italic">أدر إعدادات حسابك الشخصي، المنصة، وحالة اشتراكك.</p>
                        </div>
                        <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                             <div className="px-4 py-2 bg-primary/5 text-primary text-xs font-black rounded-xl border border-primary/10">
                                الحالة الفنية: مستقرة
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Right Column: Info Cards (Most important status in RTL) */}
                        <div className="flex flex-col gap-8">
                            
                            {/* Subscription Status Card */}
                            <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20 group">
                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700"></div>
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                                
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                                <span className="material-symbols-outlined text-primary font-bold">workspace_premium</span>
                                            </div>
                                            <h4 className="text-lg font-black tracking-tight">الباقة الحالية</h4>
                                        </div>
                                        <Link href="/dashboard/plans" className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors">Upgrade</Link>
                                    </div>

                                    <div className="mb-8">
                                        <h2 className="text-4xl font-black mb-1">
                                            {subscription?.plans?.name || (profile?.subscription_plan === 'free_trial' ? 'فترة تجريبية' : 'الباقة المجانية')}
                                        </h2>
                                        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                                            <span className="material-symbols-outlined text-sm">event</span>
                                            <span>
                                                {subscription?.ends_at ? `ينتهي في ${new Date(subscription.ends_at).toLocaleDateString('ar-EG')}` : 'صلاحية محدودة للمنصة'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-400 font-bold">الاستهلاك الشهري</span>
                                            <span className={`font-black ${subscription?.isUnlimited ? 'flex items-center gap-1.5' : ''}`}>
                                                {(subscription?.messages_used || 0)} / {subscription?.isUnlimited ? <span className="font-serif text-lg leading-none">∞</span> : subscription?.effectiveMaxMessages || '50'}
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${subscription?.isUnlimited ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-primary to-purple-400'}`} 
                                                style={{ width: subscription?.isUnlimited ? '100%' : `${Math.min(100, ((subscription?.messages_used || 0) / (subscription?.effectiveMaxMessages || 50)) * 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-bold italic">
                                            {subscription?.isUnlimited ? 'تتمتع بعدد رسائل غير محدود في هذه الباقة.' : 'يتم تصفير العداد في بداية كل دورة فوترة.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Active Stores Card */}
                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/10 p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">store</span>
                                        المتاجر المتصلة
                                    </h4>
                                    <span className="size-6 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500">
                                        {stores.length}
                                    </span>
                                </div>

                                <div className="space-y-4">
                                    {stores.length > 0 ? stores.map(s => (
                                        <div key={s.id} className="group flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-primary/20 transition-all">
                                            <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-slate-400 text-xl">shopping_cart</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{getStoreDisplayName(s)}</p>
                                                    <button 
                                                        onClick={() => { setEditingStore(s); setNewStoreName(getStoreDisplayName(s)); }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-primary"
                                                    >
                                                        <span className="material-symbols-outlined text-xs">edit</span>
                                                    </button>
                                                </div>
                                                <p className="text-[9px] text-slate-400 truncate mt-0.5" dir="ltr">{s.store_url}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg border border-green-100 shrink-0">
                                                <span className="size-1 bg-green-500 rounded-full"></span>
                                                <span className="text-[9px] text-green-700 font-black uppercase tracking-widest">Active</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="py-6 flex flex-col items-center justify-center text-center px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                                            <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">add_business</span>
                                            <p className="text-xs text-slate-400 font-bold mb-3">لا توجد متاجر مربوطة حالياً</p>
                                            <Link href="/dashboard/integrations" className="text-xs font-black text-primary underline underline-offset-4">ربط متجرك الآن</Link>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-red-50/30 rounded-[2rem] border-2 border-dashed border-red-100 p-8 group transition-all hover:bg-red-50/50">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center text-red-500 group-hover:shake transition-all shadow-sm">
                                        <span className="material-symbols-outlined font-bold text-xl">warning</span>
                                    </div>
                                    <h4 className="text-lg font-black text-red-700">إجراءات حساسة</h4>
                                </div>
                                <p className="text-xs text-red-600/70 font-medium mb-6 leading-relaxed">بمجرد حذف حسابك، سيتم مسح كافة البيانات بشكل نهائي. لا تضغط على هذا الزر إلا إذا كنت متأكداً بنسبة 100%.</p>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={isDeleting}
                                    className="w-full py-4 rounded-2xl bg-white border-2 border-red-100 text-red-600 font-black hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {isDeleting ? 'جاري الحذف...' : 'حذف الحساب نهائياً'}
                                </button>
                            </div>
                        </div>

                        {/* Left Column: Settings Sections */}
                        <div className="lg:col-span-2 space-y-8">
                            
                            {/* Personal Info */}
                            <div className="group bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden transition-all hover:border-primary/20">
                                <div className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/50 px-8 py-6 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined font-bold">person</span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900">المعلومات الشخصية</h3>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Profile Details</span>
                                </div>

                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">الاسم الكامل</label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-slate-800 font-bold placeholder:text-slate-300"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    placeholder="مثال: محمد أحمد"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">البريد الإلكتروني</label>
                                            <div className="relative">
                                                <input
                                                    type="email"
                                                    className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-100 text-slate-400 font-bold outline-none cursor-not-allowed"
                                                    value={email}
                                                    readOnly
                                                />
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-lg">lock</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 md:col-span-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">رقم الهاتف المرتبط للتنبيهات</label>
                                            <div className="relative group flex items-center" dir="ltr">
                                                <div className="relative h-14 w-40 shrink-0 z-20">
                                                    <CountryCodeSelector
                                                        value={countryCode}
                                                        onChange={(val) => setCountryCode(val)}
                                                        className="h-full !rounded-l-2xl border-2 border-r-0 border-slate-100"
                                                        variant="prefix"
                                                    />
                                                </div>
                                                <div className="relative flex-1 h-14 -ml-px">
                                                    <input
                                                        type="tel"
                                                        className="w-full h-full pl-5 pr-12 rounded-r-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all outline-none text-slate-800 font-bold"
                                                        value={phone}
                                                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                                        dir="ltr"
                                                        placeholder="123456789"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">phone_iphone</span>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 leading-relaxed px-1">سوف نستخدم هذا الرقم لإرسال أهم التنبيهات الإدارية وتحديثات النظام إليك مباشرة.</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-start pt-10">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                            className="group flex items-center gap-3 px-10 py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-primary transition-all shadow-xl shadow-slate-900/10 hover:shadow-primary/20 disabled:opacity-50 active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-xl">{saving ? 'sync' : 'verified'}</span>
                                            {saving ? 'جاري الحفظ...' : 'حفظ البيانات'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Change Password Card */}
                            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/20 overflow-hidden">
                                <div className="border-b border-slate-100 bg-slate-50/30 px-8 py-6 flex items-center gap-3">
                                    <div className="size-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500">
                                        <span className="material-symbols-outlined font-bold">lock</span>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900">تغيير كلمة المرور</h3>
                                </div>

                                <div className="p-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">كلمة المرور الجديدة</label>
                                            <input
                                                type="password"
                                                className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary transition-all outline-none text-slate-800 font-bold"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-wider">تأكيد الكلمة</label>
                                            <input
                                                type="password"
                                                className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50/50 focus:bg-white focus:border-primary transition-all outline-none text-slate-800 font-bold"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="••••••••"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-start pt-8 pb-4">
                                        <button
                                            onClick={handleChangePassword}
                                            disabled={changingPassword || !newPassword || !confirmPassword}
                                            className="px-8 py-4 rounded-2xl border-2 border-slate-200 bg-white text-slate-900 font-black hover:border-primary hover:text-primary transition-all disabled:opacity-50 active:scale-95"
                                        >
                                            {changingPassword ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Store Rename Modal */}
                    {editingStore && (
                        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setEditingStore(null)}></div>
                            <div className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                                <h3 className="text-2xl font-black text-slate-900 mb-2">تعديل اسم المتجر</h3>
                                <p className="text-sm text-slate-500 mb-8 font-medium italic">سيظهر هذا الاسم في لوحة التحكم بدلاً من الرابط.</p>
                                
                                <div className="space-y-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">اسم المتجر أو اسم بديل</label>
                                        <input
                                            type="text"
                                            className="w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-primary transition-all outline-none text-slate-800 font-bold"
                                            value={newStoreName}
                                            onChange={(e) => setNewStoreName(e.target.value)}
                                            placeholder="أدخل اسم المتجر"
                                            autoFocus
                                        />
                                    </div>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleUpdateStoreName}
                                            disabled={saving}
                                            className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black hover:bg-primary transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                        </button>
                                        <button
                                            onClick={() => setEditingStore(null)}
                                            className="px-6 h-14 rounded-2xl bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-all"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div >
        </>
    );
}
