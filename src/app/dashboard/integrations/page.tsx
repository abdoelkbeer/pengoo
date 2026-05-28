// @ts-nocheck
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import StoreSelector from './StoreSelector';

export default async function IntegrationsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/auth/login');

    const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id);

    return (
        <div className="flex-1 px-6 py-8 md:px-10">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-black text-slate-900 mb-2">ربط متجرك</h1>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">اختر منصة متجرك الإلكتروني وابدأ أتمتة رسائل واتساب لعملائك في دقائق</p>
                </div>

                <StoreSelector stores={stores || []} />
            </div>
        </div>
    );
}
