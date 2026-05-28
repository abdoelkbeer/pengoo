'use client'

import React, { useState } from 'react'

type TabType = 'general' | 'opengraph' | 'twitter' | 'analytics' | 'advanced'

const TABS: { id: TabType; label: string; icon: string; color: string }[] = [
    { id: 'general', label: 'عام', icon: 'search', color: 'emerald' },
    { id: 'opengraph', label: 'Open Graph', icon: 'share', color: 'blue' },
    { id: 'twitter', label: 'Twitter', icon: 'tag', color: 'sky' },
    { id: 'analytics', label: 'التحليلات', icon: 'analytics', color: 'violet' },
    { id: 'advanced', label: 'متقدم', icon: 'code', color: 'amber' },
]

export default function SeoClient({ initialSettings }: { initialSettings: any }) {
    const [activeTab, setActiveTab] = useState<TabType>('general')
    const [settings, setSettings] = useState<any>(initialSettings)
    const [saving, setSaving] = useState(false)
    const [savedTab, setSavedTab] = useState<string | null>(null)
    const [showSetup, setShowSetup] = useState(!initialSettings || initialSettings.seo_title === undefined)

    const migrationSql = `ALTER TABLE platform_settings 
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS seo_canonical_url text,
  ADD COLUMN IF NOT EXISTS seo_og_title text,
  ADD COLUMN IF NOT EXISTS seo_og_description text,
  ADD COLUMN IF NOT EXISTS seo_og_image_url text,
  ADD COLUMN IF NOT EXISTS seo_og_type text DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS seo_twitter_card text DEFAULT 'summary_large_image',
  ADD COLUMN IF NOT EXISTS seo_twitter_title text,
  ADD COLUMN IF NOT EXISTS seo_twitter_description text,
  ADD COLUMN IF NOT EXISTS seo_twitter_image_url text,
  ADD COLUMN IF NOT EXISTS seo_twitter_handle text,
  ADD COLUMN IF NOT EXISTS seo_google_analytics_id text,
  ADD COLUMN IF NOT EXISTS seo_google_tag_manager_id text,
  ADD COLUMN IF NOT EXISTS seo_schema_markup text,
  ADD COLUMN IF NOT EXISTS seo_robots_txt text DEFAULT E'User-agent: *\\nAllow: /\\nDisallow: /dashboard/\\nDisallow: /admin/\\nDisallow: /api/',
  ADD COLUMN IF NOT EXISTS seo_indexing_enabled boolean DEFAULT true;`;

    const update = (key: string, value: any) => {
        setSettings((prev: any) => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: settings })
            })
            const result = await res.json()
            if (result.success) {
                setSavedTab(activeTab)
                setTimeout(() => setSavedTab(null), 3000)
            } else {
                alert('فشل الحفظ: ' + result.error)
            }
        } catch (error) {
            console.error(error)
            alert('حدث خطأ أثناء الحفظ')
        }
        setSaving(false)
    }

    const renderInput = (label: string, key: string, placeholder?: string, type: string = 'text') => (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-text-main">{label}</label>
            <input
                type={type}
                className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                value={settings[key] || ''}
                onChange={e => update(key, e.target.value)}
                placeholder={placeholder}
                dir="ltr"
            />
        </div>
    )

    const renderTextarea = (label: string, key: string, placeholder?: string, rows: number = 3, hint?: string) => (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-text-main">{label}</label>
            {hint && <p className="text-xs text-text-sub -mt-1">{hint}</p>}
            <textarea
                className="w-full p-4 rounded-xl border border-border-color bg-gray-50/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm font-mono"
                value={settings[key] || ''}
                onChange={e => update(key, e.target.value)}
                placeholder={placeholder}
                rows={rows}
                dir="ltr"
            />
        </div>
    )

    const renderToggle = (label: string, key: string, description?: string) => (
        <div className="flex items-center justify-between p-4 rounded-xl border border-border-color bg-gray-50/30">
            <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-text-main">{label}</span>
                {description && <span className="text-xs text-text-sub">{description}</span>}
            </div>
            <button
                type="button"
                onClick={() => update(key, !settings[key])}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${settings[key] ? 'bg-emerald-500' : 'bg-gray-300'}`}
            >
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${settings[key] ? 'left-0.5' : 'left-[calc(100%-1.625rem)]'}`}></span>
            </button>
        </div>
    )

    const renderGeneralTab = () => (
        <div className="space-y-6">
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                        <span className="material-symbols-outlined text-emerald-600">search</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main">إعدادات السيو الأساسية</h3>
                        <p className="text-xs text-text-sub">هذه الإعدادات تظهر في نتائج البحث</p>
                    </div>
                </div>
                {renderInput('عنوان الموقع (Title Tag)', 'seo_title', 'مثال: بينجو - أتمتة رسائل واتساب للمتاجر الإلكترونية')}
                {renderTextarea('وصف الموقع (Meta Description)', 'seo_description', 'وصف مختصر يظهر تحت العنوان في نتائج البحث - يفضل بين 120-160 حرف', 3, 'يظهر تحت العنوان في نتائج محركات البحث. يُنصح بـ 120-160 حرف.')}
                {renderInput('الكلمات المفتاحية (Keywords)', 'seo_keywords', 'واتساب, أتمتة, ووكومرس, رسائل, متجر إلكتروني')}
                {renderInput('رابط الموقع الأساسي (Canonical URL)', 'seo_canonical_url', 'https://pengoo-platform.com')}
            </div>

            {renderToggle('السماح بفهرسة محركات البحث', 'seo_indexing_enabled', 'عند الإيقاف، سيتم إضافة noindex لمنع Google من فهرسة الموقع')}

            {/* Preview */}
            <div className="bg-white rounded-2xl border border-border-color p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-text-sub">preview</span>
                    <h4 className="font-bold text-text-main">معاينة نتيجة البحث</h4>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 border border-border-color/50" dir="ltr">
                    <div className="max-w-xl">
                        <p className="text-xs text-green-700 mb-1 font-medium">{settings.seo_canonical_url || 'https://pengoo-platform.com'}</p>
                        <p className="text-lg text-blue-800 font-medium hover:underline cursor-pointer leading-snug">
                            {settings.seo_title || 'عنوان الموقع'}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed line-clamp-2">
                            {settings.seo_description || 'وصف الموقع سيظهر هنا...'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderOpenGraphTab = () => (
        <div className="space-y-6">
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <span className="material-symbols-outlined text-blue-600">share</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main">Open Graph - مشاركة عبر الوسائط الاجتماعية</h3>
                        <p className="text-xs text-text-sub">هذه البيانات تظهر عند مشاركة رابط موقعك على فيسبوك وواتساب وغيرها</p>
                    </div>
                </div>
                {renderInput('العنوان (OG Title)', 'seo_og_title', 'عنوان يظهر عند مشاركة الرابط')}
                {renderTextarea('الوصف (OG Description)', 'seo_og_description', 'وصف يظهر عند مشاركة الرابط على وسائل التواصل', 3)}
                {renderInput('رابط الصورة (OG Image URL)', 'seo_og_image_url', 'https://pengoo-platform.com/og-image.jpg')}
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-main">نوع المحتوى (OG Type)</label>
                    <select
                        className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                        value={settings.seo_og_type || 'website'}
                        onChange={e => update('seo_og_type', e.target.value)}
                    >
                        <option value="website">Website</option>
                        <option value="article">Article</option>
                        <option value="product">Product</option>
                        <option value="profile">Profile</option>
                    </select>
                </div>
            </div>

            {/* OG Preview */}
            <div className="bg-white rounded-2xl border border-border-color p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-text-sub">preview</span>
                    <h4 className="font-bold text-text-main">معاينة المشاركة على فيسبوك/واتساب</h4>
                </div>
                <div className="bg-gray-50 rounded-xl border border-border-color/50 overflow-hidden max-w-md">
                    <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        {settings.seo_og_image_url ? (
                            <img src={settings.seo_og_image_url} alt="OG Preview" className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display = 'none' }} />
                        ) : (
                            <span className="material-symbols-outlined text-6xl text-blue-300">image</span>
                        )}
                    </div>
                    <div className="p-4 border-t border-border-color/50">
                        <p className="text-xs text-text-sub uppercase tracking-wide mb-1">{settings.seo_canonical_url || 'pengoo-platform.com'}</p>
                        <p className="font-bold text-text-main text-sm leading-snug">{settings.seo_og_title || settings.seo_title || 'عنوان الموقع'}</p>
                        <p className="text-xs text-text-sub mt-1 line-clamp-2">{settings.seo_og_description || settings.seo_description || 'وصف الموقع'}</p>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderTwitterTab = () => (
        <div className="space-y-6">
            <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-sky-100 rounded-lg">
                        <span className="material-symbols-outlined text-sky-600">tag</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main">بطاقة تويتر (X)</h3>
                        <p className="text-xs text-text-sub">تخصيص شكل الموقع عند مشاركته على تويتر/X</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-text-main">نوع البطاقة (Card Type)</label>
                    <select
                        className="w-full h-12 px-4 rounded-xl border border-border-color bg-gray-50/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                        value={settings.seo_twitter_card || 'summary_large_image'}
                        onChange={e => update('seo_twitter_card', e.target.value)}
                    >
                        <option value="summary_large_image">Summary Large Image (مستحسن)</option>
                        <option value="summary">Summary</option>
                        <option value="app">App</option>
                        <option value="player">Player</option>
                    </select>
                </div>
                {renderInput('العنوان (Twitter Title)', 'seo_twitter_title', 'عنوان يظهر عند المشاركة على تويتر')}
                {renderTextarea('الوصف (Twitter Description)', 'seo_twitter_description', 'أقصى 200 حرف', 2)}
                {renderInput('رابط الصورة (Twitter Image URL)', 'seo_twitter_image_url', 'https://pengoo-platform.com/twitter-card.jpg')}
                {renderInput('حساب تويتر (@handle)', 'seo_twitter_handle', '@pengoo')}
            </div>

            {/* Twitter Preview */}
            <div className="bg-white rounded-2xl border border-border-color p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-text-sub">preview</span>
                    <h4 className="font-bold text-text-main">معاينة بطاقة تويتر/X</h4>
                </div>
                <div className="bg-gray-50 rounded-2xl border border-border-color/50 overflow-hidden max-w-md">
                    <div className="aspect-video bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
                        {settings.seo_twitter_image_url ? (
                            <img src={settings.seo_twitter_image_url} alt="Twitter Preview" className="w-full h-full object-cover" onError={(e: any) => { e.target.style.display = 'none' }} />
                        ) : (
                            <span className="material-symbols-outlined text-6xl text-sky-300">image</span>
                        )}
                    </div>
                    <div className="p-4 border-t border-border-color/50">
                        <p className="font-bold text-text-main text-sm">{settings.seo_twitter_title || settings.seo_title || 'عنوان الموقع'}</p>
                        <p className="text-xs text-text-sub mt-1 line-clamp-2">{settings.seo_twitter_description || settings.seo_description || 'وصف الموقع'}</p>
                        <p className="text-xs text-text-sub mt-2 flex items-center gap-1">
                            {settings.seo_canonical_url || 'pengoo-platform.com'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderAnalyticsTab = () => (
        <div className="space-y-6">
            <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-violet-100 rounded-lg">
                        <span className="material-symbols-outlined text-violet-600">analytics</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main">Google Analytics</h3>
                        <p className="text-xs text-text-sub">تتبع زوار موقعك وسلوكهم باستخدام Google Analytics 4</p>
                    </div>
                </div>
                {renderInput('معرف Google Analytics (Measurement ID)', 'seo_google_analytics_id', 'G-XXXXXXXXXX')}
                <div className="flex items-start gap-3 p-4 bg-violet-100/40 rounded-xl">
                    <span className="material-symbols-outlined text-violet-500 mt-0.5">info</span>
                    <div className="text-xs text-violet-800 leading-relaxed">
                        يمكنك العثور على Measurement ID من إعدادات Google Analytics 4 &gt; Data Streams &gt; Web Stream &gt; Measurement ID
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <span className="material-symbols-outlined text-indigo-600">integration_instructions</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main">Google Tag Manager</h3>
                        <p className="text-xs text-text-sub">إدارة جميع أدوات التتبع من مكان واحد</p>
                    </div>
                </div>
                {renderInput('معرف Tag Manager (Container ID)', 'seo_google_tag_manager_id', 'GTM-XXXXXXX')}
                <div className="flex items-start gap-3 p-4 bg-indigo-100/40 rounded-xl">
                    <span className="material-symbols-outlined text-indigo-500 mt-0.5">info</span>
                    <div className="text-xs text-indigo-800 leading-relaxed">
                        يمكنك العثور على Container ID في Google Tag Manager &gt; Admin &gt; Container Settings
                    </div>
                </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <span className="material-symbols-outlined text-amber-600">tips_and_updates</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main">نصائح للتحليلات</h3>
                    </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-amber-100">
                        <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">check_circle</span>
                        <span className="text-xs text-text-sub">استخدم GA4 لتتبع الأحداث والتحويلات</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-amber-100">
                        <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">check_circle</span>
                        <span className="text-xs text-text-sub">GTM يسمح بإضافة Facebook Pixel وأدوات أخرى</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-amber-100">
                        <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">check_circle</span>
                        <span className="text-xs text-text-sub">تأكد من ربط GA بـ Google Search Console</span>
                    </div>
                    <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-amber-100">
                        <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">check_circle</span>
                        <span className="text-xs text-text-sub">راقب Core Web Vitals لتحسين الأداء</span>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderAdvancedTab = () => (
        <div className="space-y-6">
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg">
                        <span className="material-symbols-outlined text-amber-600">data_object</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main">البيانات المنظمة (Schema Markup / JSON-LD)</h3>
                        <p className="text-xs text-text-sub">يساعد محركات البحث على فهم محتوى موقعك بشكل أفضل</p>
                    </div>
                </div>
                {renderTextarea('JSON-LD Schema Markup', 'seo_schema_markup', `{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "بينجو",
  "applicationCategory": "BusinessApplication",
  "description": "منصة أتمتة رسائل واتساب للمتاجر الإلكترونية",
  "operatingSystem": "Web"
}`, 10, 'أدخل كود JSON-LD صالح. يُستخدم لإظهار Rich Snippets في نتائج البحث.')}
                <div className="flex items-start gap-3 p-4 bg-amber-100/40 rounded-xl">
                    <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
                    <div className="text-xs text-amber-800 leading-relaxed">
                        تأكد من صحة كود JSON قبل الحفظ. يمكنك التحقق باستخدام أداة <a href="https://search.google.com/test/rich-results" target="_blank" className="underline font-bold">Rich Results Test</a> من Google.
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 border border-border-color rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-200 rounded-lg">
                        <span className="material-symbols-outlined text-gray-600">robot_2</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main">ملف Robots.txt</h3>
                        <p className="text-xs text-text-sub">تحكم في أي الصفحات تسمح لمحركات البحث بزيارتها</p>
                    </div>
                </div>
                {renderTextarea('محتوى robots.txt', 'seo_robots_txt', `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/
Disallow: /auth/

Sitemap: ${settings.seo_canonical_url || 'https://pengoo-platform.com'}/sitemap.xml`, 8)}
            </div>

            <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-100 rounded-lg">
                        <span className="material-symbols-outlined text-teal-600">checklist</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-text-main">قائمة فحص السيو</h3>
                        <p className="text-xs text-text-sub">تأكد من استكمال جميع العناصر</p>
                    </div>
                </div>
                <div className="space-y-2.5">
                    {[
                        { check: !!settings.seo_title, label: 'عنوان الموقع (Title)' },
                        { check: !!settings.seo_description, label: 'وصف الموقع (Meta Description)' },
                        { check: !!settings.seo_keywords, label: 'الكلمات المفتاحية' },
                        { check: !!settings.seo_canonical_url, label: 'الرابط الأساسي (Canonical URL)' },
                        { check: !!settings.seo_og_title || !!settings.seo_og_description, label: 'بطاقة Open Graph' },
                        { check: !!settings.seo_og_image_url, label: 'صورة Open Graph' },
                        { check: !!settings.seo_twitter_title || !!settings.seo_twitter_description, label: 'بطاقة Twitter/X' },
                        { check: !!settings.seo_google_analytics_id, label: 'Google Analytics' },
                        { check: !!settings.seo_schema_markup, label: 'Schema Markup / JSON-LD' },
                        { check: settings.seo_indexing_enabled !== false, label: 'الفهرسة مفعلة' },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/80 transition-colors">
                            <span className={`material-symbols-outlined text-sm ${item.check ? 'text-emerald-500' : 'text-gray-300'}`}>
                                {item.check ? 'check_circle' : 'radio_button_unchecked'}
                            </span>
                            <span className={`text-sm ${item.check ? 'text-text-main font-medium' : 'text-text-sub'}`}>{item.label}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-teal-200/50">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-teal-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-l from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                                style={{
                                    width: `${[
                                        !!settings.seo_title,
                                        !!settings.seo_description,
                                        !!settings.seo_keywords,
                                        !!settings.seo_canonical_url,
                                        !!settings.seo_og_title || !!settings.seo_og_description,
                                        !!settings.seo_og_image_url,
                                        !!settings.seo_twitter_title || !!settings.seo_twitter_description,
                                        !!settings.seo_google_analytics_id,
                                        !!settings.seo_schema_markup,
                                        settings.seo_indexing_enabled !== false,
                                    ].filter(Boolean).length * 10}%`
                                }}
                            ></div>
                        </div>
                        <span className="text-sm font-black text-teal-600">
                            {[
                                !!settings.seo_title,
                                !!settings.seo_description,
                                !!settings.seo_keywords,
                                !!settings.seo_canonical_url,
                                !!settings.seo_og_title || !!settings.seo_og_description,
                                !!settings.seo_og_image_url,
                                !!settings.seo_twitter_title || !!settings.seo_twitter_description,
                                !!settings.seo_google_analytics_id,
                                !!settings.seo_schema_markup,
                                settings.seo_indexing_enabled !== false,
                            ].filter(Boolean).length}/10
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general': return renderGeneralTab()
            case 'opengraph': return renderOpenGraphTab()
            case 'twitter': return renderTwitterTab()
            case 'analytics': return renderAnalyticsTab()
            case 'advanced': return renderAdvancedTab()
        }
    }

    if (showSetup) {
        return (
            <div className="bg-white rounded-3xl border border-border-color p-8 shadow-sm animate-fadeIn text-center space-y-8 max-w-2xl mx-auto">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl">database</span>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-text-main">تجهيز قاعدة البيانات</h3>
                        <p className="text-text-sub mt-2">نحتاج لإضافة بعض الأعمدة الجديدة لجدول الإعدادات لتفعيل ميزات السيو.</p>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-2xl p-6 text-left relative group">
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(migrationSql);
                                alert('تم نسخ الكود!');
                            }}
                            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg"
                        >
                            <span className="material-symbols-outlined text-sm">content_copy</span>
                        </button>
                    </div>
                    <pre className="text-emerald-400 text-xs font-mono overflow-auto max-h-48 leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
                        {migrationSql}
                    </pre>
                </div>

                <div className="flex flex-col gap-4">
                    <div className="flex items-start gap-3 text-right bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <span className="material-symbols-outlined text-blue-500">info</span>
                        <p className="text-xs text-blue-800 leading-relaxed">
                            قم بنسخ الكود أعلاه وتشغيله في <b>SQL Editor</b> في لوحة تحكم <b>Supabase</b> الخاصة بك، ثم قم بتحديث هذه الصفحة.
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex-1 bg-primary text-white py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            تم التشغيل، حدث الصفحة
                        </button>
                        <button
                            onClick={() => setShowSetup(false)}
                            className="px-8 bg-gray-100 text-text-sub py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                        >
                            تخطي الآن
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Tabs Navigation */}
            <div className="bg-white rounded-2xl border border-border-color p-2 shadow-sm">
                <div className="flex flex-wrap gap-1.5">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-2.5 px-5 rounded-xl font-bold text-sm transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-text-sub hover:text-text-main hover:bg-gray-50'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-3xl border border-border-color p-8 shadow-sm animate-fadeIn">
                {renderTabContent()}
            </div>

            {/* Save Button */}
            <div className="sticky bottom-4 z-20">
                <div className="bg-white/80 backdrop-blur-lg rounded-2xl border border-border-color p-4 shadow-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {savedTab && (
                            <div className="flex items-center gap-2 text-emerald-600 animate-fadeIn">
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                <span className="text-sm font-bold">تم الحفظ بنجاح!</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-8 py-3 rounded-xl font-black shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>جاري الحفظ...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">save</span>
                                <span>حفظ التغييرات</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
