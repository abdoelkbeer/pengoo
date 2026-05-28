'use client';
// @ts-nocheck
import React, { useState, Suspense } from 'react';
import { login, loginWithGoogle } from './actions';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ReCAPTCHA from 'react-google-recaptcha';
import { BrandLogo } from '@/components/BrandLogo';

const translateError = (err: string | null) => {
  if (!err) return null;
  const errors: { [key: string]: string } = {
    'Invalid login credentials': 'بيانات تسجيل الدخول غير صحيحة. يرجى التأكد من البريد الإلكتروني وكلمة المرور.',
    'Email not confirmed': 'لم يتم تأكيد بريدك الإلكتروني بعد. يرجى مراجعة بريدك الوارد.',
    'User not found': 'المستخدم غير موجود.',
    'Invalid reCAPTCHA': 'فشل التحقق من reCAPTCHA. يرجى المحاولة مرة أخرى.',
    'Missing Fields': 'يرجى ملء جميع الحقول المطلوبة.',
    'An unexpected error occurred. Please try again.': 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى لاحقاً.'
  };
  return errors[err] || err;
};

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const [showPassword, setShowPassword] = useState(false);

  const translatedError = translateError(error);

  return (
    <>

      <div className="flex flex-1 h-screen w-full">
        <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-20 py-10 bg-white relative overflow-y-auto z-10">
          <div className="absolute top-8 right-8 lg:right-12">
            <BrandLogo />
          </div>
          <div className="w-full max-w-[420px] flex flex-col gap-6">
            <div className="flex flex-col gap-2 mb-4">
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight text-slate-900">مرحباً بعودتك</h1>
              <p className="text-slate-500 text-base">يرجى إدخال بياناتك لتسجيل الدخول</p>
              {error && (
                <div className="flex items-start gap-3 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-semibold shadow-sm animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-red-500 shrink-0">error</span>
                  <div className="flex-1 mt-0.5">{translatedError || error}</div>
                </div>
              )}
              {message && (
                <div className="flex items-start gap-3 bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 text-sm font-semibold shadow-sm animate-in fade-in slide-in-from-top-2">
                  <span className="material-symbols-outlined text-green-500 shrink-0">check_circle</span>
                  <div className="flex-1 mt-0.5">{message}</div>
                </div>
              )}
            </div>
            <form action={loginWithGoogle}>
              <button type="submit" className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 text-slate-700 transition-all hover:bg-slate-50 focus:ring-4 focus:ring-slate-100 font-bold text-sm">
                <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M12.0003 20.45c4.656 0 8.5566-3.2196 9.9723-7.6433H12.0003v-3.7227h13.9304c.1353.649.208 1.325.208 2.0298 0 7.6896-5.3887 13.3333-13.6284 13.3333C5.9038 24.4473 1.0003 19.5438 1.0003 13.5s4.9035-10.9473 11.0003-10.9473c2.8688 0 5.4842 1.0175 7.5186 2.6865l-2.9248 2.925C15.6987 7.4243 14.0205 6.4678 12.0003 6.4678c-3.874 0-7.0003 3.1263-7.0003 7.0003s3.1263 7.0003 7.0003 7.0003z" fill="currentColor"></path>
                </svg>
                <span>المتابعة باستخدام جوجل</span>
              </button>
            </form>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-xs font-medium text-slate-400 uppercase">أو المتابعة عبر البريد الإلكتروني</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>
            <form className="flex flex-col gap-4" action={login}>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-slate-700" htmlFor="email">البريد الإلكتروني</label>
                <input className="w-full rounded-xl border border-slate-200 bg-background-light px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all" id="email" name="email" placeholder="name@company.com" type="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700" htmlFor="password">كلمة المرور</label>
                  <a className="text-sm font-medium text-primary hover:text-blue-700 transition-colors" href="/auth/forgot-password">هل نسيت كلمة المرور؟</a>
                </div>
                <div className="relative">
                  <input className="w-full rounded-xl border border-slate-200 bg-background-light px-4 py-3.5 pl-12 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all" id="password" name="password" placeholder="أدخل كلمة المرور" type={showPassword ? "text" : "password"} required />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" type="button">
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/50" id="remember" type="checkbox" />
                <label className="mr-2 text-sm text-slate-600 font-medium" htmlFor="remember">تذكرني لمدة 30 يوماً</label>
              </div>
              <div className="flex justify-center my-2 scale-90 sm:scale-100 origin-center">
                <ReCAPTCHA
                  sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"}
                  hl="ar"
                />
              </div>
              <button className="mt-2 w-full rounded-xl bg-primary py-3.5 text-white font-bold text-sm shadow-lg shadow-primary/30 hover:bg-blue-600 hover:shadow-primary/40 focus:ring-4 focus:ring-primary/30 active:scale-[0.98] transition-all" type="submit">
                تسجيل الدخول
              </button>
            </form>
            <Link href="/auth/register" className="flex items-center justify-center w-full rounded-xl border border-primary py-3.5 text-primary font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">
              إنشاء حساب جديد
            </Link>
            <div className="text-center text-sm font-medium text-slate-600 mt-2">
              ليس لديك حساب؟
              <a className="text-primary hover:text-blue-700 mr-1 font-bold" href="/auth/register">سجل مجاناً</a>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center gap-6" dir="ltr">
              <span className="text-slate-400 text-xs">Protected by reCAPTCHA</span>
              <a className="text-slate-400 text-xs hover:text-slate-600" href="/privacy">Privacy</a>
              <a className="text-slate-400 text-xs hover:text-slate-600" href="/terms">Terms</a>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex flex-1 bg-background-light relative items-center justify-center p-8 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&amp;w=2029&amp;auto=format&amp;fit=crop')] bg-cover bg-center opacity-[0.03]" data-alt="Abstract gradient mesh background texture"></div>
          <div className="absolute -top-[20%] -right-[10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] mix-blend-multiply"></div>
          <div className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[100px] mix-blend-multiply"></div>
          <div className="relative z-10 max-w-lg w-full flex flex-col gap-10">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl border border-white/50 shadow-2xl shadow-slate-200/50">
              <div className="mb-6 size-14 rounded-2xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-3xl">chat</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                بينجو: ربط سلس بين ووكومرس وواتساب
              </h3>
              <p className="text-slate-600 leading-relaxed mb-6">
                أتمتة إشعارات العملاء واستعادة السلال المتروكة ودعم عملائك مباشرة حيث يتواجدون.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">تحديثات فورية للطلبات</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">استعادة السلال المتروكة</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="size-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <span className="material-symbols-outlined text-sm font-bold">check</span>
                  </div>
                  <span className="text-sm font-medium text-slate-700">دعم عبر الشات بوت 24/7</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4 pr-4 border-r-2 border-primary/30">
              <p className="text-lg font-medium text-slate-700 italic">"غيّر بينجو طريقة تواصلنا مع عملائنا. زاد معدل الاستعادة لدينا بنسبة 40% في أسبوعين فقط."</p>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-slate-200 overflow-hidden">
                  <img className="w-full h-full object-cover" data-alt="Portrait of a smiling man in a suit" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHllw3C1fZ51hjWXfctSFVQM0--7PAMe7EuHzpdPQd4mMpOmTYx0uqKyDr_yCkBLIL6JqJy4JX4TAf4SzOrnzuzIxqEsbmUNUpGWA4ehb5BPp5OPtQIxBVLQuhyCM25-YMnPodc0zaAWGNYwsXZh83IhvZdo7twAt7XuYjZT9A3njv5el197s2RqGzpD43Q7Bi149WGITj186lHYiEcTb6InZZsP4DoE6bPJYI8KBGQB51JU8ovVexM_xHcu81whqGuU7n9Cozt_ut" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">أحمد السيد</p>
                  <p className="text-xs text-slate-500">المدير التنفيذي، حلول التجارة الإلكترونية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div >


    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}
