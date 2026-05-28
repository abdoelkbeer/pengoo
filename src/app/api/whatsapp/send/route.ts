import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const apiKey = req.headers.get('x-api-key');
        const isSystemRequest = apiKey === process.env.WORKER_API_KEY;

        if (!user && !isSystemRequest) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // If system request and no user_id passed, we'll process ANY user's messages
        // Try parsing body for specific userId if needed
        let targetUserId = user?.id;
        try {
            const body = await req.clone().json();
            if (isSystemRequest && body.userId) {
                targetUserId = body.userId;
            }
        } catch(e) {}

        // 1. Atomically try to fetch and lock 20 pending messages (Update status only if it's currently PENDING)
        let query = supabase
            .from('message_logs')
            .update({ status: 'PROCESSING' })
            .eq('status', 'PENDING')
            .limit(20)
            .select('id, recipient_phone, message_body, user_id, store_id, buttons');
            
        if (targetUserId) {
            query = query.eq('user_id', targetUserId);
        }

        const { data: updatedLogs, error: updateError } = await query;

        if (updateError) throw updateError;

        if (!updatedLogs || updatedLogs.length === 0) {
            const remainingPendingQuery = supabase.from('message_logs').select('id', { count: 'exact', head: true }).eq('status', 'PENDING');
            if (targetUserId) remainingPendingQuery.eq('user_id', targetUserId);
            const { count: remainingPending } = await remainingPendingQuery;
            return NextResponse.json({
                message: 'No pending messages available for processing',
                processed: 0,
                remaining: remainingPending || 0
            });
        }

        const pendingLogs = updatedLogs; // For compatibility with the rest of the code

        // Get total remaining pending count for this user
        let remainingQuery = supabase
            .from('message_logs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDING');
            
        if (targetUserId) {
            remainingQuery = remainingQuery.eq('user_id', targetUserId);
        }
            
        const { count: remainingCount } = await remainingQuery;

        if (updateError) throw updateError;

        if (!pendingLogs || pendingLogs.length === 0) {
            return NextResponse.json({
                message: 'No pending messages',
                processed: 0,
                remaining: 0
            })
        }

        let successCount = 0;
        let failCount = 0;
        const workerUrl = process.env.WHATSAPP_WORKER_URL || 'http://localhost:3001';

        // Cache subscriptions to avoid refetching for the same user
        const userSubscriptions: Record<string, any> = {};

        // 2. Process each message
        for (const log of pendingLogs) {
            try {
                // Fetch subscription if not cached
                if (!userSubscriptions[log.user_id]) {
                    const { data: sub } = await supabase
                        .from('subscriptions')
                        .select('id, messages_used, plans(max_messages)')
                        .eq('user_id', log.user_id)
                        .eq('status', 'active')
                        .maybeSingle();
                    userSubscriptions[log.user_id] = sub || { messages_used: 0, plans: { max_messages: 0 } };
                }
                
                const subscription = userSubscriptions[log.user_id];
                const maxMessages = (subscription?.plans as any)?.max_messages || 0;
                let messagesUsed = subscription?.messages_used || 0;

                // Check limits before sending (skip if unlimited: -1 or >= 999999)
                const isUnlimited = maxMessages === -1 || maxMessages >= 999999;
                if (!isUnlimited && maxMessages > 0 && messagesUsed >= maxMessages) {
                    // Fail this message due to quota
                    await supabase
                        .from('message_logs')
                        .update({ status: 'FAILED', error_details: 'Quota exceeded' })
                        .eq('id', log.id);
                    failCount++;
                    continue; // Skip sending this and proceed to next
                }

                // Strip non-numeric characters for WhatsApp JID
                const cleanedNumber = log.recipient_phone.replace(/\D/g, '');

                // Send the message via external worker
                const response = await fetch(`${workerUrl}/api/whatsapp/send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': process.env.WORKER_API_KEY || ''
                    },
                    body: JSON.stringify({
                        userId: log.user_id,
                        to: cleanedNumber,
                        message: log.message_body,
                        buttons: log.buttons || null
                    })
                });

                if (!response.ok) {
                    throw new Error('Worker failed to send message');
                }

                // Mark as sent
                await supabase
                    .from('message_logs')
                    .update({ status: 'SENT', sent_at: new Date().toISOString() })
                    .eq('id', log.id);

                // Increment messages used
                if (subscription && subscription.id) {
                    subscription.messages_used++;
                    await supabase
                        .from('subscriptions')
                        .update({ messages_used: subscription.messages_used })
                        .eq('id', subscription.id);
                }

                successCount++;

            } catch (err: any) {
                console.error(`Failed to send message ${log.id}:`, err)

                // Mark as failed
                await supabase
                    .from('message_logs')
                    .update({ status: 'FAILED', error_details: err.message || 'Unknown error' })
                    .eq('id', log.id)

                failCount++;
            }
        }

        return NextResponse.json({
            success: true,
            processed: pendingLogs.length,
            sent: successCount,
            failed: failCount,
            remaining: (remainingCount || 0) - successCount - failCount
        })

    } catch (error: any) {
        console.error('WhatsApp Sender Engine Error:', error)
        return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 })
    }
}
