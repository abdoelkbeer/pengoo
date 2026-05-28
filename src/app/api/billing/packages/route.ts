import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const [
            { data: packages, error: pkgsError },
            { data: settings, error: settError }
        ] = await Promise.all([
            supabase.from('billing_packages').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
            supabase.from('platform_settings').select('billing_custom_enabled, billing_custom_title, billing_custom_description, billing_custom_rate').limit(1).single()
        ]);

        if (pkgsError) throw pkgsError;

        return NextResponse.json({
            packages: packages || [],
            settings: settings || null
        });
    } catch (error: any) {
        console.error('Fetch Packages Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
