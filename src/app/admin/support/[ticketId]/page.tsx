import { createAdminClient } from '@/utils/supabase/admin';
import { notFound } from 'next/navigation';
import TicketDetailClient from './TicketDetailClient';

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
    const admin = createAdminClient();
    const { ticketId } = await params;

    // Fetch the ticket with user info
    const { data: ticket, error: ticketError } = await admin
        .from('support_tickets')
        .select(`
            *,
            user_profiles (
                id,
                full_name
            )
        `)
        .eq('id', ticketId)
        .single();

    if (ticketError || !ticket) {
        notFound();
    }

    // Try to get email from auth if needed (since it's not in user_profiles)
    if (ticket.user_profiles && ticket.user_id) {
        const { data: { user: authUser } } = await admin.auth.admin.getUserById(ticket.user_id);
        if (authUser) {
            (ticket.user_profiles as any).email = authUser.email;
        }
    }

    // Fetch messages for the ticket
    const { data: messages } = await admin
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

    return (
        <div className="animate-fade-in pl-0 pb-12">
            <TicketDetailClient
                initialTicket={ticket}
                initialMessages={messages || []}
            />
        </div>
    );
}
