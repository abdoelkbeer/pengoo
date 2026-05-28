// @ts-nocheck
import { createAdminClient } from '@/utils/supabase/admin'
import StoreActions from './StoreActions';

export default async function StoresPage() {
    const admin = createAdminClient()
    const { data: stores } = await admin.from('stores').select('*, user_profiles(full_name)')

    return (
        <div className="space-y-8 animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-8 rounded-3xl border border-border-color shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-primary to-emerald-500"></div>
                <div className="flex flex-col gap-1 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                            <span className="material-symbols-outlined text-2xl">storefront</span>
                        </div>
                        <h2 className="text-text-main text-3xl font-black tracking-tight font-display">المتاجر المتصلة</h2>
                    </div>
                    <p className="text-text-sub text-base font-medium max-w-xl leading-relaxed">إدارة المتاجر الإلكترونية المتصلة بالمنصة، تتبع النوع (Shopify, WooCommerce) وحالة المزامنة.</p>
                </div>
            </header>

            <div className="bg-white rounded-3xl border border-border-color shadow-sm overflow-hidden">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 text-text-sub text-xs uppercase font-black tracking-wider">
                            <th className="px-6 py-4 border-b border-border-color">اسم المتجر</th>
                            <th className="px-6 py-4 border-b border-border-color">العميل</th>
                            <th className="px-6 py-4 border-b border-border-color">النوع</th>
                            <th className="px-6 py-4 border-b border-border-color">تاريخ الربط</th>
                            <th className="px-6 py-4 border-b border-border-color">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color">
                        {stores?.map(store => (
                            <tr key={store.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm font-bold text-text-main">{store.store_name || store.store_url}</td>
                                <td className="px-6 py-4 text-xs font-bold text-text-sub">{store.user_profiles?.full_name || 'مستخدم'}</td>
                                <td className="px-6 py-4">
                                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-indigo-100 italic">
                                        {store.store_type || 'WooCommerce'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-text-sub">{new Date(store.created_at).toLocaleDateString('ar-EG')}</td>
                                <td className="px-6 py-4 flex gap-2">
                                    <button className="p-2 text-text-sub hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="تفاصيل">
                                        <span className="material-symbols-outlined text-lg">visibility</span>
                                    </button>
                                    <StoreActions storeId={store.id} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {(!stores || stores.length === 0) && (
                    <div className="py-20 text-center text-text-sub font-bold italic">لا توجد متاجر مربوطة حالياً</div>
                )}
            </div>
        </div>
    )
}
