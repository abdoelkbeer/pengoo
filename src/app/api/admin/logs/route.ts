import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limitStr = searchParams.get('limit') || '100';
        const limit = parseInt(limitStr, 10);

        const supabase = createAdminClient();

        let query = supabase.from('system_logs').select('*');

        // Apply level filter
        const level = searchParams.get('level');
        if (level && ['INFO', 'WARN', 'ERROR', 'CRITICAL'].includes(level)) {
            query = query.eq('level', level);
        }

        // Apply source filter
        const source = searchParams.get('source');
        if (source) {
            query = query.eq('source', source);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);

        if (error) {
            throw error;
        }

        return NextResponse.json({ logs: data });
    } catch (error: any) {
        console.error('Admin Logs API error (GET):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = createAdminClient();

        // This will delete all logs
        const { error } = await supabase.from('system_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to delete all

        if (error) {
            throw error;
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Admin Logs API error (DELETE):', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
