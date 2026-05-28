'use client';

import Script from 'next/script';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

export function RecaptchaV3Fields({ action }: { action: string }) {
  const tokenRef = useRef<HTMLInputElement>(null);
  const actionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tokenInput = tokenRef.current;
    if (!siteKey || !tokenInput) return;

    const form = tokenInput.form;
    if (!form) return;

    let submittingWithToken = false;

    const handleSubmit = (event: SubmitEvent) => {
      if (submittingWithToken) {
        submittingWithToken = false;
        return;
      }

      event.preventDefault();

      window.grecaptcha?.ready(() => {
        window.grecaptcha
          ?.execute(siteKey, { action })
          .then((token) => {
            tokenInput.value = token;
            if (actionRef.current) {
              actionRef.current.value = action;
            }
            submittingWithToken = true;
            form.requestSubmit();
          })
          .catch(() => {
            tokenInput.value = '';
            submittingWithToken = true;
            form.requestSubmit();
          });
      });
    };

    form.addEventListener('submit', handleSubmit);

    return () => {
      form.removeEventListener('submit', handleSubmit);
    };
  }, [action]);

  return (
    <>
      {siteKey && <Script src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`} strategy="afterInteractive" />}
      <input ref={tokenRef} type="hidden" name="g-recaptcha-response" />
      <input ref={actionRef} type="hidden" name="recaptcha-action" value={action} />
    </>
  );
}
