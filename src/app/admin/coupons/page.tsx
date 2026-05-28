import CouponsManager from './CouponsManager';

export default function CouponsPage() {
    return (
        <div className="space-y-10 pb-20 animate-fade-in">
            <header className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                        <span className="material-symbols-outlined text-2xl">confirmation_number</span>
                    </div>
                    <h2 className="text-text-main text-3xl font-black tracking-tight">إدارة الكوبونات</h2>
                </div>
                <p className="text-text-sub text-base font-medium max-w-2xl">تحكم في أكواد الخصم، نسب الخصم، وصلاحية الكوبونات المتاحة للمستخدمين.</p>
            </header>

            <CouponsManager />
        </div>
    );
}
