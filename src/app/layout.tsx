import "./globals.css";
import React from "react";
import { createClient } from "@/utils/supabase/server";
import { Metadata } from "next";
import Script from "next/script";

async function getSeoSettings() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("platform_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();

  const title = settings?.seo_title || settings?.site_name || "الصفحة الرئيسية - بينجو";
  const description = settings?.seo_description || "بينجو | منصة أتمتة رسائل واتساب للمتاجر الإلكترونية";
  const keywords = settings?.seo_keywords || undefined;
  const canonicalUrl = settings?.seo_canonical_url || undefined;
  const indexingEnabled = settings?.seo_indexing_enabled !== false;

  const metadata: Metadata = {
    title,
    description,
    keywords: keywords ? keywords.split(",").map((k: string) => k.trim()) : undefined,
    icons: settings?.favicon_url ? { icon: settings.favicon_url, shortcut: settings.favicon_url } : { icon: "/favicon.ico" },
    robots: indexingEnabled
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : { index: false, follow: false },
    ...(canonicalUrl && {
      metadataBase: new URL(canonicalUrl),
      alternates: { canonical: "/" },
    }),
  };

  // Open Graph
  if (settings?.seo_og_title || settings?.seo_og_description || settings?.seo_og_image_url) {
    metadata.openGraph = {
      type: (settings?.seo_og_type as any) || "website",
      title: settings?.seo_og_title || title,
      description: settings?.seo_og_description || description,
      ...(canonicalUrl && { url: canonicalUrl }),
      ...(settings?.seo_og_image_url && {
        images: [{ url: settings.seo_og_image_url, width: 1200, height: 630 }],
      }),
      siteName: settings?.site_name || "بينجو",
      locale: "ar_SA",
    };
  }

  // Twitter Card
  if (settings?.seo_twitter_title || settings?.seo_twitter_description || settings?.seo_twitter_image_url) {
    metadata.twitter = {
      card: (settings?.seo_twitter_card as any) || "summary_large_image",
      title: settings?.seo_twitter_title || title,
      description: settings?.seo_twitter_description || description,
      ...(settings?.seo_twitter_image_url && {
        images: [settings.seo_twitter_image_url],
      }),
      ...(settings?.seo_twitter_handle && {
        creator: settings.seo_twitter_handle,
        site: settings.seo_twitter_handle,
      }),
    };
  }

  return metadata;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSeoSettings();
  const gaId = settings?.seo_google_analytics_id;
  const gtmId = settings?.seo_google_tag_manager_id;
  const schemaMarkup = settings?.seo_schema_markup;

  return (
    <html lang="ar" dir="rtl" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;700;800&family=Noto+Sans+Arabic:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />

        {/* Google Analytics */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}

        {/* Google Tag Manager */}
        {gtmId && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}

        {/* JSON-LD Schema Markup (sanitized and validated) */}
        {schemaMarkup && (() => {
          try {
            // 1. Remove any potential script tag attempts to prevent injection
            // JSON-LD is already inside a script tag, so we must ensure no closing </script> exists
            const sanitized = schemaMarkup.replace(/<\/?script[^>]*>/gi, '');

            // 2. Validate that it's actually valid JSON before rendering
            const parsed = JSON.parse(sanitized);

            return (
              <script
                type="application/ld+json"
                id="schema-markup"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(parsed) }}
              />
            );
          } catch (e) {
            console.error('[SEO] Invalid or unsafe schema markup detected:', e);
            return null;
          }
        })()}
      </head>
      <body className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-body antialiased overflow-x-hidden" suppressHydrationWarning>
        {/* GTM noscript fallback */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        {children}
      </body>
    </html>
  );
}
