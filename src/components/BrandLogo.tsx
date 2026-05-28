'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type BrandSettings = {
  logo_url: string | null;
  site_name: string | null;
};

export function BrandLogo({ className = '' }: { className?: string }) {
  const [settings, setSettings] = useState<BrandSettings | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    supabase
      .from('platform_settings')
      .select('logo_url, site_name')
      .limit(1)
      .single()
      .then(({ data }) => {
        if (mounted) {
          setSettings(data);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (settings?.logo_url) {
    return (
      <img
        src={settings.logo_url}
        alt={settings.site_name || 'Pengoo'}
        className={`h-10 w-auto object-contain ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="size-8 text-primary">
        <svg className="h-full w-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
          <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" fill="currentColor" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold tracking-tight">{settings?.site_name || 'بينجو'}</h2>
    </div>
  );
}
