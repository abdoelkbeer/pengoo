import React from 'react';
import { createClient } from '@/utils/supabase/server';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    // Verify if the user is an admin
    const isAdmin = user?.email === 'gamal13@gmail.com' || user?.user_metadata?.role === 'admin';
    if (!isAdmin) {
        return (
            <div className="p-8 pb-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
                <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">lock</span>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">غير مصرح لك للوصول</h2>
                <p className="text-slate-500">هذه الصفحة مخصصة لمديري النظام فقط.</p>
            </div>
        );
    }
    // Fetch all users
    const { data: rawUsers, error } = await supabase
        .from('users')
        .select(`
            id, 
            full_name, 
            user_email, 
            created_at,
            user_credits (balance)
        `)
        .order('created_at', { ascending: false });

    // Map the shape to what AdminUsersClient expects
    const users = (rawUsers || []).map(u => ({
        id: u.id,
        full_name: u.full_name,
        user_email: u.user_email,
        created_at: u.created_at,
        wallet_balance: Array.isArray(u.user_credits) 
            ? ((u.user_credits[0] as any)?.balance || 0) 
            : ((u.user_credits as any)?.balance || 0)
    }));

    if (error) {
        console.error('Error fetching users:', error);
    }

    return (
        <div className="p-4 md:p-8 pb-20">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                        <a className="hover:text-primary transition-colors" href="/dashboard">الرئيسية</a>
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                        <span className="text-slate-900 font-medium">إدارة الأعضاء</span>
                    </nav>
                    <h2 className="text-3xl font-bold text-slate-900">إدارة الأعضاء والأرصدة</h2>
                    <p className="text-slate-500 mt-1">تصفح مستخدمي المنصة وقم بتعديل أرصدتهم يدوياً عند الحاجة.</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <AdminUsersClient initialUsers={users || []} />
                </div>
            </div>
        </div>
    );
}
