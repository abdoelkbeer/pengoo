import React from 'react';
import { BrandLogo } from '@/components/BrandLogo';

export default function Page({ searchParams }: { searchParams: { message?: string, error?: string } }) {
    return (
        <>

            <div className="flex flex-1 h-screen w-full">
                <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-20 py-10 bg-white relative overflow-y-auto z-10">
                    <div className="absolute top-8 right-8 lg:right-12">
                        <BrandLogo />
                    </div>
                    <div className="w-full max-w-[420px] flex flex-col gap-6">
                        <div className="flex flex-col gap-2 mb-4 text-center">
                            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-3xl">lock_reset</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-slate-900">إعادة تعيين كلمة المرور</h1>
                            <p className="text-slate-500 text-base mt-2">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.</p>
                            {searchParams?.error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl border border-red-200 text-sm font-semibold mt-4">
                                    {searchParams.error}
                                </div>
                            )}
                            {searchParams?.message && (
                                <div className="bg-green-50 text-green-600 p-3 rounded-xl border border-green-200 text-sm font-semibold mt-4">
                                    {searchParams.message}
                                </div>
                            )}
                        </div>
                        <form className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700" htmlFor="email">البريد الإلكتروني</label>
                                <input className="w-full rounded-xl border border-slate-200 bg-background-light px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all" id="email" name="email" placeholder="name@company.com" type="email" required />
                            </div>
                            <button className="mt-4 w-full rounded-xl bg-primary py-3.5 text-white font-bold text-sm shadow-lg shadow-primary/30 hover:bg-blue-600 hover:shadow-primary/40 focus:ring-4 focus:ring-primary/30 active:scale-[0.98] transition-all" type="submit">
                                إرسال رابط استعادة الحساب
                            </button>
                        </form>
                        <div className="text-center text-sm font-medium text-slate-600 mt-2">
                            <a className="text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2" href="/auth/login">
                                <span className="material-symbols-outlined text-sm rtl:rotate-180">arrow_back</span>
                                العودة لتسجيل الدخول
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
