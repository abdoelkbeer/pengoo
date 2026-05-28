import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { connectionId } = await req.json();

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 });
        }

        // Send delete request to the worker first
        const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3001';
        await fetch(`${workerUrl}/api/whatsapp/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.WORKER_API_KEY || ''
            },
            body: JSON.stringify({ userId: user.id })
        }).catch(err => console.error('Worker delete failed:', err));

        // Delete related message logs first to satisfy foreign key constraints
        const { error: logsError } = await supabase
            .from('message_logs')
            .delete()
            .eq('connection_id', connectionId)
            .eq('user_id', user.id);

        if (logsError) {
            console.error('Failed to clear connection message logs:', logsError);
            // We can continue or block, but usually we want to clear them.
        }

        const { error } = await supabase
            .from('whatsapp_connections')
            .delete()
            .eq('id', connectionId)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
