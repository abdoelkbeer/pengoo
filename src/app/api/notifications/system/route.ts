import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Returns plan info + recent activity for the header
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current plan
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('*, plans(name)')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .order('starts_at', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        const planName = subscription?.plans?.name || 'مجاني';

        // Get recent activity
        const recentActivity: any[] = [];

        // Recent messages sent
        const { data: recentMessages } = await supabase
            .from('message_logs')
            .select('recipient_phone, status, sent_at')
            .eq('user_id', user.id)
            .order('sent_at', { ascending: false })
            .limit(3);

        if (recentMessages) {
            for (const msg of recentMessages) {
                const time = msg.sent_at ? new Date(msg.sent_at).toLocaleString('ar-EG', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : '';
                recentActivity.push({
                    type: 'message',
                    title: msg.status === 'SENT' ? 'تم إرسال رسالة بنجاح' : msg.status === 'FAILED' ? 'فشل إرسال رسالة' : 'رسالة قيد الانتظار',
                    description: `إلى ${msg.recipient_phone}`,
                    time,
                });
            }
        }

        // Recent connection changes
        const { data: recentConnections } = await supabase
            .from('whatsapp_connections')
            .select('session_name, status, updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(2);

        if (recentConnections) {
            for (const conn of recentConnections) {
                const time = conn.updated_at ? new Date(conn.updated_at).toLocaleString('ar-EG', {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : '';
                recentActivity.push({
                    type: 'connection',
                    title: conn.status === 'CONNECTED' ? 'تم ربط واتساب بنجاح' : 'تم قطع اتصال واتساب',
                    description: conn.session_name || 'رقم واتساب',
                    time,
                });
            }
        }

        // Sort by most recent
        recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        return NextResponse.json({
            planName,
            recentActivity: recentActivity.slice(0, 5),
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
