import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { store_id } = body;

        if (!store_id) {
            return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get store details
        const { data: store, error: storeError } = await supabase
            .from('stores')
            .select('*')
            .eq('id', store_id)
            .eq('user_id', user.id)
            .single();

        if (storeError || !store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        const cleanUrl = store.store_url.replace(/\/$/, '');
        const endpoint = `${cleanUrl}/wp-json/pengoo/v1/store-languages`;

        try {
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                // Use a short timeout so we don't hang UI
                signal: AbortSignal.timeout(10000)
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`WordPress returned ${res.status}: ${text}`);
            }

            const data = await res.json();
            
            if (data.success && (data.languages || data.store_languages)) {
                const languages = data.languages || data.store_languages;
                
                // Update the database
                const { error: updateError } = await supabase
                    .from('stores')
                    .update({
                        store_languages: languages,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', store.id);

                if (updateError) {
                    throw new Error('Failed to update database');
                }

                return NextResponse.json({
                    success: true,
                    store_languages: languages
                });
            } else {
                throw new Error('Invalid response from plugin: ' + JSON.stringify(data));
            }

        } catch (fetchError: any) {
            console.error('[Sync Languages] Fetch Error:', fetchError);
            return NextResponse.json({ 
                error: 'Could not connect to WordPress plugin. Make sure the Pengoo plugin is installed and activated.'
            }, { status: 502 });
        }

    } catch (error: any) {
        console.error('[Sync Languages] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
