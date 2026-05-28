import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

/**
 * POST /api/whatsapp/retry-pending
 * 
 * Handles stuck PENDING/PROCESSING messages:
 *   { action: 'retry' }    - Force-send all pending messages via the worker
 *   { action: 'fail_old' } - Mark all PENDING/PROCESSING messages as FAILED
 */
export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let body: any = {};
        try { body = await req.json(); } catch (e) { }
        const action = body.action || 'retry';

        if (action === 'retry') {
            // 1. First reset any stuck PROCESSING messages back to PENDING
            await supabase
                .from('message_logs')
                .update({ status: 'PENDING', retry_count: 0, error_details: null })
                .eq('user_id', user.id)
                .eq('status', 'PROCESSING');

            // 2. Reset retry_count on any PENDING messages so they get picked up
            await supabase
                .from('message_logs')
                .update({ retry_count: 0, error_details: null })
                .eq('user_id', user.id)
                .eq('status', 'PENDING');

            // 3. Get count of pending messages
            const { count: pendingCount } = await supabase
                .from('message_logs')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'PENDING');

            if (!pendingCount || pendingCount === 0) {
                return NextResponse.json({
                    success: true,
                    message: 'لا توجد رسائل معلقة.',
                    sent: 0,
                    pendingCount: 0
                });
            }

            // 4. Check if WhatsApp is connected
            const { data: connection } = await supabase
                .from('whatsapp_connections')
                .select('id, status, engine_type')
                .eq('user_id', user.id)
                .in('status', ['CONNECTED'])
                .limit(1)
                .maybeSingle();

            // 5. Try to force-send via the worker or Next.js send endpoint
            const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3001';
            let workerAlive = false;

            try {
                const healthCheck = await fetch(`${workerUrl}/`, { 
                    signal: AbortSignal.timeout(3000) 
                });
                workerAlive = healthCheck.ok;
            } catch (e) {
                workerAlive = false;
            }

            if (!connection) {
                return NextResponse.json({
                    success: false,
                    message: `يوجد ${pendingCount} رسالة معلقة، لكن لا يوجد اتصال واتساب نشط. يرجى ربط رقم واتساب أولاً من صفحة الاتصالات.`,
                    sent: 0,
                    pendingCount: pendingCount,
                    reason: 'NO_CONNECTION'
                });
            }

            if (!workerAlive) {
                return NextResponse.json({
                    success: false,
                    message: `يوجد ${pendingCount} رسالة معلقة، لكن خدمة الإرسال (Worker) غير متصلة. يرجى تشغيل الـ Worker أولاً.`,
                    sent: 0,
                    pendingCount: pendingCount,
                    reason: 'WORKER_DOWN'
                });
            }

            // 6. Actually trigger sending by calling the send endpoint
            let totalSent = 0;
            let totalFailed = 0;
            let hasMore = true;

            // Process in batches
            while (hasMore) {
                try {
                    const sendRes = await fetch(`${new URL(req.url).origin}/api/whatsapp/send`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': process.env.WORKER_API_KEY || '',
                            'cookie': req.headers.get('cookie') || ''
                        },
                        body: JSON.stringify({ userId: user.id })
                    });

                    const sendData = await sendRes.json();
                    totalSent += sendData.sent || 0;
                    totalFailed += sendData.failed || 0;
                    hasMore = (sendData.remaining || 0) > 0 && (sendData.sent || 0) > 0;
                } catch (e) {
                    hasMore = false;
                }
            }

            // 7. Get final pending count
            const { count: finalPending } = await supabase
                .from('message_logs')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'PENDING');

            const totalProcessed = totalSent + totalFailed;
            let message = '';
            if (totalSent > 0 && totalFailed === 0) {
                message = `✅ تم إرسال ${totalSent} رسالة بنجاح!`;
            } else if (totalSent > 0 && totalFailed > 0) {
                message = `تم إرسال ${totalSent} رسالة، وفشلت ${totalFailed} رسالة.`;
            } else if (totalFailed > 0) {
                message = `فشل إرسال ${totalFailed} رسالة. تحقق من حالة اتصال واتساب.`;
            } else if (finalPending && finalPending > 0) {
                message = `الرسائل جاهزة للإرسال (${finalPending} رسالة). سيتم معالجتها تلقائياً بواسطة الـ Worker.`;
            } else {
                message = 'تمت معالجة جميع الرسائل.';
            }

            return NextResponse.json({
                success: true,
                message,
                sent: totalSent,
                failed: totalFailed,
                pendingCount: finalPending || 0
            });

        } else if (action === 'fail_old') {
            // Mark ALL pending/processing messages as FAILED
            const { data: failed, error } = await supabase
                .from('message_logs')
                .update({ status: 'FAILED', error_details: 'تم إلغاؤها يدوياً من لوحة التحكم' })
                .eq('user_id', user.id)
                .in('status', ['PENDING', 'PROCESSING'])
                .select('id');

            return NextResponse.json({
                success: true,
                message: (failed?.length || 0) > 0
                    ? `تم إلغاء ${failed?.length} رسالة معلقة.`
                    : 'لا توجد رسائل معلقة.',
                cancelled: failed?.length || 0
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error: any) {
        console.error('Retry Pending Error:', error);
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * GET /api/whatsapp/retry-pending
 * Returns count of stuck messages for the current user.
 */
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { count: pendingCount } = await supabase
            .from('message_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'PENDING');

        const { count: processingCount } = await supabase
            .from('message_logs')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'PROCESSING');

        // Also check if WhatsApp is connected
        const { data: connection } = await supabase
            .from('whatsapp_connections')
            .select('status')
            .eq('user_id', user.id)
            .in('status', ['CONNECTED'])
            .limit(1)
            .maybeSingle();

        // Check if worker is alive
        const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3001';
        let workerAlive = false;
        try {
            const healthCheck = await fetch(`${workerUrl}/`, { 
                signal: AbortSignal.timeout(2000) 
            });
            workerAlive = healthCheck.ok;
        } catch (e) {
            workerAlive = false;
        }

        return NextResponse.json({
            pending: pendingCount || 0,
            processing: processingCount || 0,
            total_stuck: (pendingCount || 0) + (processingCount || 0),
            whatsapp_connected: !!connection,
            worker_alive: workerAlive
        });

    } catch (error: any) {
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
    }
}
