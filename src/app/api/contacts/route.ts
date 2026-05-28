import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET contacts
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, contacts: data });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST: Add contact(s)
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { contacts, action } = body;

        // Action: import from logs
        if (action === 'import_from_logs') {
            const { data: logs, error: logsError } = await supabase
                .from('message_logs')
                .select('recipient_phone')
                .eq('user_id', user.id);

            if (logsError) return NextResponse.json({ error: logsError.message }, { status: 500 });

            const phones = Array.from(new Set(logs.map(l => l.recipient_phone)));
            const items = phones.map(p => ({ user_id: user.id, phone_number: p }));

            if (items.length === 0) return NextResponse.json({ success: true, count: 0 });

            const { error: insertError } = await supabase
                .from('contacts')
                .upsert(items, { onConflict: 'user_id,phone_number' });

            if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
            return NextResponse.json({ success: true, count: items.length });
        }

        if (!contacts || !Array.isArray(contacts)) {
            return NextResponse.json({ error: 'Invalid contacts data' }, { status: 400 });
        }

        const itemsToInsert = contacts.map((c: any) => ({
            user_id: user.id,
            phone_number: c.phone_number.replace(/\D/g, ''),
            name: c.name || null
        })).filter((c: any) => c.phone_number.length >= 8);

        if (itemsToInsert.length === 0) {
            return NextResponse.json({ error: 'No valid phone numbers provided' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('contacts')
            .upsert(itemsToInsert, { onConflict: 'user_id,phone_number' })
            .select();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, contacts: data });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE: Remove contact(s)
export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { ids } = await req.json();

        if (!ids || !Array.isArray(ids)) {
            return NextResponse.json({ error: 'Invalid contact ids' }, { status: 400 });
        }

        const { error } = await supabase
            .from('contacts')
            .delete()
            .in('id', ids)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
