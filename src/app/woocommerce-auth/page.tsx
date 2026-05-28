'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { BrandLogo } from '@/components/BrandLogo';

function WooCommerceAuthContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const storeUrl = searchParams.get('store_url');
    const tempToken = searchParams.get('temp_token');
    const returnUrl = searchParams.get('return_url');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!storeUrl || !tempToken) {
            setStatus('error');
            setErrorMessage('بيانات الربط غير مكتملة. ابدأ الربط مرة أخرى من إضافة بينجو داخل ووردبريس.');
            return;
        }

        const exchangeKeys = async () => {
            try {
                // Use server-side API route to avoid CORS issues
                const response = await fetch('/api/woocommerce/exchange-keys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        store_url: storeUrl,
                        temp_token: tempToken,
                        return_url: returnUrl,
                    }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // If user not authenticated, redirect to login with callback
                    if (response.status === 401) {
                        const currentUrl = window.location.href;
                        window.location.href = `/auth/login?redirect=${encodeURIComponent(currentUrl)}`;
                        return;
                    }
                    throw new Error(data.error || 'تعذر تأكيد الربط بين بينجو والمتجر.');
                }

                setStatus('success');

                // Auto-redirect back to WordPress after 3 seconds
                if (returnUrl) {
                    setTimeout(() => {
                        window.location.href = returnUrl;
                    }, 3000);
                }
            } catch (err: any) {
                setStatus('error');
                setErrorMessage(err.message || 'حدث خطأ في الاتصال أثناء ربط بينجو بالمتجر.');
            }
        };

        exchangeKeys();
    }, [storeUrl, tempToken]);

    const displayUrl = storeUrl ? new URL(storeUrl).hostname : '';

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '20px',
        }}>
            <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: '0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04)',
                maxWidth: '420px',
                width: '100%',
                textAlign: 'center',
                border: '1px solid #e5e7eb',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '20px',
                }}>
                    <BrandLogo />
                </div>

                <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                    ربط بينجو بالمتجر
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 28px' }}>
                    {displayUrl ? `جاري ربط ${displayUrl} بمنصة بينجو` : 'جاري ربط متجرك بمنصة بينجو...'}
                </p>

                {/* Loading */}
                {status === 'loading' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '40px', height: '40px',
                            border: '3px solid #f1f5f9', borderTop: '3px solid #2e69ff',
                            borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                        }} />
                        <div>
                            <p style={{ color: '#334155', fontSize: '14px', fontWeight: 600, margin: '0 0 4px' }}>بينجو يجهز مفاتيح الربط الآمنة...</p>
                            <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>سيتم الأمر خلال لحظات</p>
                        </div>
                        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    </div>
                )}

                {/* Success */}
                {status === 'success' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px', height: '56px',
                            background: '#f0fdf4', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                                <path d="M20 6L9 17l-5-5" />
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>تم ربط بينجو بنجاح</h2>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>متجرك متصل الآن بمنصة بينجو. سيتم الرجوع تلقائياً...</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px' }}>
                            {returnUrl && (
                                <a href={returnUrl} style={{
                                    display: 'block', padding: '12px',
                                    background: '#2e69ff', color: '#ffffff',
                                    borderRadius: '10px', textDecoration: 'none',
                                    fontWeight: 700, fontSize: '14px',
                                    boxShadow: '0 2px 8px rgba(46,105,255,.25)',
                                }}>
                                    العودة إلى ووردبريس
                                </a>
                            )}
                            <a href="/dashboard/connections" style={{
                                display: 'block', padding: '12px',
                                background: '#f8fafc', color: '#2e69ff',
                                borderRadius: '10px', textDecoration: 'none',
                                fontWeight: 600, fontSize: '14px',
                                border: '1px solid #e5e7eb',
                            }}>
                                فتح لوحة بينجو
                            </a>
                        </div>
                    </div>
                )}

                {/* Error */}
                {status === 'error' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px', height: '56px',
                            background: '#fef2f2', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>تعذر ربط بينجو</h2>
                            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>لم نتمكن من ربط بينجو بمتجرك</p>
                        </div>
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca',
                            borderRadius: '8px', padding: '10px 14px',
                            color: '#dc2626', fontSize: '12px', width: '100%',
                            boxSizing: 'border-box' as const, wordBreak: 'break-word' as const,
                            textAlign: 'left',
                        }}>
                            {errorMessage}
                        </div>

                        <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '12px', width: '100%', boxSizing: 'border-box' as const }}>
                            <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 4px', fontWeight: 600 }}>خطوات التحقق:</p>
                            <ul style={{ color: '#94a3b8', fontSize: '11px', margin: 0, paddingLeft: '16px', textAlign: 'left', lineHeight: 1.7 }}>
                                <li>تأكد أن إضافة بينجو مفعلة داخل ووردبريس</li>
                                <li>تأكد أن رابط المتجر متاح للعامة</li>
                                <li>جرّب الربط اليدوي من لوحة بينجو</li>
                            </ul>
                        </div>

                        <a href="/dashboard/connections/woocommerce" style={{
                            display: 'block', width: '100%', padding: '12px',
                            background: '#f8fafc', color: '#475569',
                            borderRadius: '10px', textDecoration: 'none',
                            fontWeight: 600, fontSize: '14px',
                            border: '1px solid #e5e7eb', boxSizing: 'border-box' as const,
                        }}>
                            تجربة الربط اليدوي
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function WooCommerceAuthPage() {
    return (
        <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#94a3b8', fontSize: '14px' }}>
                جاري تحميل بينجو...
            </div>
        }>
            <WooCommerceAuthContent />
        </Suspense>
    );
}
