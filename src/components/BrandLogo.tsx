'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

type BrandSettings = {
  logo_url: string | null;
  site_name: string | null;
};

const DEFAULT_LOGO_URL = 'https://rqcragxnihfktgmajfgz.supabase.co/storage/v1/object/public/platform/branding/logo-pengo-v2.png';
const DEFAULT_SITE_NAME = 'بينجو';

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

  return (
    <img
      src={settings?.logo_url || DEFAULT_LOGO_URL}
      alt={settings?.site_name || DEFAULT_SITE_NAME}
      className={`h-10 w-auto object-contain ${className}`}
    />
  );
}
