import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * Handle overdue invoices and suspend subscriptions
 */
export async function GET(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createAdminClient();
        const now = new Date().toISOString();

        // 0. Find the Free plan
        const { data: freePlan } = await supabase
            .from('plans')
            .select('id, max_whatsapp_numbers')
            .eq('slug', 'free')
            .single();

        // 1. Mark pending invoices as overdue if past due_date
        const { error: overdueError } = await supabase
            .from('invoices')
            .update({ status: 'overdue' })
            .eq('status', 'pending')
            .lt('due_date', now);

        if (overdueError) throw overdueError;

        // 2. Find subscriptions with overdue invoices
        const { data: overdueInvoices } = await supabase
            .from('invoices')
            .select('subscription_id, user_id, due_date')
            .eq('status', 'overdue');

        const downgradedCount = [];

        for (const inv of (overdueInvoices || [])) {
            if (!inv.subscription_id) continue;

            const dueDate = new Date(inv.due_date);
            const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            // If overdue more than 3 days, set subscription status to 'past_due' (warning)
            if (daysOverdue > 3 && daysOverdue <= 7) {
                await supabase
                    .from('subscriptions')
                    .update({ status: 'past_due' })
                    .eq('id', inv.subscription_id)
                    .eq('status', 'active');
            }

            // If overdue more than 7 days, downgrade subscription
            if (daysOverdue > 7 && freePlan) {
                const { error: suspendError } = await supabase
                    .from('subscriptions')
                    .update({
                        status: 'active',
                        plan_id: freePlan.id,
                        messages_used: 0 // Reset messages used for the free plan
                    })
                    .eq('id', inv.subscription_id);

                if (!suspendError) {
                    downgradedCount.push(inv.subscription_id);

                    // Downgrade whatsapp connections if they exceed the free plan limit
                    const maxNumbers = freePlan.max_whatsapp_numbers || 0;
                    const { data: connections } = await supabase
                        .from('whatsapp_connections')
                        .select('id')
                        .eq('user_id', inv.user_id)
                        .eq('status', 'CONNECTED')
                        .order('created_at', { ascending: true });

                    if (connections && connections.length > maxNumbers) {
                        const connectionsToDisconnect = connections.slice(maxNumbers);
                        const idsToDisconnect = connectionsToDisconnect.map(c => c.id);

                        if (idsToDisconnect.length > 0) {
                            await supabase
                                .from('whatsapp_connections')
                                .update({ status: 'DISCONNECTED' })
                                .in('id', idsToDisconnect);
                        }
                    }
                }
            }
        }

        return NextResponse.json({
            status: 'success',
            downgraded_count: downgradedCount.length
        });

    } catch (error: any) {
        console.error('Cron: check-overdue error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
