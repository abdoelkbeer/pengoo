'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/BrandLogo';

export default function WooCommerceAuthPage() {
    const searchParams = useSearchParams();
    const storeUrl = searchParams.get('store_url');
    const tempToken = searchParams.get('temp_token');
    const returnUrl = searchParams.get('return_url');

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [keys, setKeys] = useState<{ ck: string; cs: string } | null>(null);

    useEffect(() => {
        if (!storeUrl || !tempToken) {
            setStatus('error');
            setErrorMessage('بيانات الربط غير مكتملة. ابدأ الربط مرة أخرى من إضافة بينجو داخل ووردبريس.');
            return;
        }

        const exchangeKeys = async () => {
            setStatus('loading');
            try {
                const cleanUrl = storeUrl.replace(/\/$/, '');
                const endpoint = `${cleanUrl}/wp-json/pengoo/v1/exchange-keys`;

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ temp_token: tempToken }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'تعذر تأكيد الربط بين بينجو والمتجر.');
                }

                setKeys({ ck: data.consumer_key, cs: data.consumer_secret });

                // Save the keys to Pengoo and auto-register webhooks.
                const saveRes = await fetch('/api/stores', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        store_url: data.store_url || cleanUrl,
                        consumer_key: data.consumer_key,
                        consumer_secret: data.consumer_secret,
                    }),
                });

                if (!saveRes.ok) {
                    const saveData = await saveRes.json();
                    console.error('Failed to save store to Pengoo:', saveData.error);
                }

                setStatus('success');

            } catch (err: any) {
                setStatus('error');
                setErrorMessage(err.message || 'حدث خطأ في الاتصال أثناء ربط بينجو بالمتجر.');
            }
        };

        exchangeKeys();
    }, [storeUrl, tempToken]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            maxWidth: '448px',
            margin: '0 auto',
            padding: '24px',
            textAlign: 'center',
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '24px',
            }}>
                <BrandLogo />
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>ربط بينجو بالمتجر</h1>

            {status === 'loading' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        border: '3px solid #e2e8f0',
                        borderTop: '3px solid #2e69ff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                    <p style={{ color: '#64748b' }}>بينجو يجهز مفاتيح الربط الآمنة مع {storeUrl}...</p>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {status === 'success' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '32px', width: '100%' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: '#f0fdf4',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '18px', color: '#0f172a', margin: 0 }}>تم ربط بينجو بنجاح</p>
                    <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>متجرك متصل الآن بمنصة بينجو.</p>

                    <div style={{
                        width: '100%',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'left',
                        marginTop: '16px',
                    }}>
                        <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>بيانات ربط بينجو الداخلية</p>
                        <p style={{ fontSize: '13px', color: '#475569', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: '8px' }}>CK: {keys?.ck}</p>
                        <p style={{ fontSize: '13px', color: '#475569', fontFamily: 'monospace', wordBreak: 'break-all' }}>CS: {keys?.cs}</p>
                    </div>

                    {returnUrl ? (
                        <a href={returnUrl} style={{
                            display: 'block',
                            width: '100%',
                            padding: '12px',
                            marginTop: '16px',
                            background: 'linear-gradient(135deg, #2e69ff, #1a4fd8)',
                            color: '#fff',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            textAlign: 'center',
                        }}>العودة إلى ووردبريس</a>
                    ) : (
                        <Link href="/dashboard/connections" style={{
                            display: 'block',
                            width: '100%',
                            padding: '12px',
                            marginTop: '16px',
                            background: 'linear-gradient(135deg, #2e69ff, #1a4fd8)',
                            color: '#fff',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            textAlign: 'center',
                        }}>فتح اتصالات بينجو</Link>
                    )}
                </div>
            )}

            {status === 'error' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '32px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        background: '#fef2f2',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: '18px', color: '#0f172a', margin: 0 }}>تعذر ربط بينجو</p>
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        color: '#dc2626',
                        fontSize: '13px',
                        width: '100%',
                        boxSizing: 'border-box' as const,
                        wordBreak: 'break-word' as const,
                    }}>
                        {errorMessage}
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center' }}>
                        تأكد أن روابط ووردبريس الدائمة مفعلة وأن المتجر متاح من الرابط التالي: <br /><code>{storeUrl}</code>
                    </p>
                    <Link href="/dashboard/connections" style={{
                        display: 'block',
                        width: '100%',
                        padding: '12px',
                        background: '#f8fafc',
                        color: '#475569',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        textAlign: 'center',
                        border: '1px solid #e2e8f0',
                    }}>إلغاء والعودة</Link>
                </div>
            )}
        </div>
    );
}
