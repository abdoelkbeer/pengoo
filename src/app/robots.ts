import { createClient } from '@/utils/supabase/server'
import { MetadataRoute } from 'next'

export default async function robots(): Promise<MetadataRoute.Robots> {
    const supabase = await createClient()
    const { data: settings } = await supabase
        .from('platform_settings')
        .select('seo_canonical_url, seo_robots_txt, seo_indexing_enabled')
        .limit(1)
        .maybeSingle()

    const baseUrl = settings?.seo_canonical_url || 'https://pengoo-platform.com'
    const indexingEnabled = settings?.seo_indexing_enabled !== false

    // If custom robots.txt content is provided, parse it
    if (settings?.seo_robots_txt) {
        const lines = settings.seo_robots_txt.split('\n')
        const rules: { userAgent: string; allow?: string[]; disallow?: string[] }[] = []
        let currentRule: { userAgent: string; allow: string[]; disallow: string[] } | null = null

        for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed.toLowerCase().startsWith('user-agent:')) {
                if (currentRule) rules.push(currentRule)
                currentRule = {
                    userAgent: trimmed.split(':').slice(1).join(':').trim(),
                    allow: [],
                    disallow: [],
                }
            } else if (trimmed.toLowerCase().startsWith('allow:') && currentRule) {
                currentRule.allow.push(trimmed.split(':').slice(1).join(':').trim())
            } else if (trimmed.toLowerCase().startsWith('disallow:') && currentRule) {
                currentRule.disallow.push(trimmed.split(':').slice(1).join(':').trim())
            }
        }
        if (currentRule) rules.push(currentRule)

        return {
            rules: rules.length > 0 ? rules : [{ userAgent: '*', allow: ['/'] }],
            sitemap: `${baseUrl}/sitemap.xml`,
        }
    }

    // Default robots.txt
    if (!indexingEnabled) {
        return {
            rules: [{ userAgent: '*', disallow: ['/'] }],
        }
    }

    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/'],
                disallow: ['/dashboard/', '/admin/', '/api/', '/auth/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    }
}
