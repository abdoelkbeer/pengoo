'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateTicketStatus(ticketId: string, status: string) {
    const admin = createAdminClient();

    const { error } = await admin
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

    if (error) {
        console.error('Error updating ticket status:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/support/${ticketId}`);
    revalidatePath('/admin/support');
    return { success: true };
}

export async function updateTicketPriority(ticketId: string, priority: string) {
    const admin = createAdminClient();

    const { error } = await admin
        .from('support_tickets')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

    if (error) {
        console.error('Error updating ticket priority:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/support/${ticketId}`);
    revalidatePath('/admin/support');
    return { success: true };
}

export async function updateTicketCategory(ticketId: string, category: string) {
    const admin = createAdminClient();

    const { error } = await admin
        .from('support_tickets')
        .update({ category, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

    if (error) {
        console.error('Error updating ticket category:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/support/${ticketId}`);
    revalidatePath('/admin/support');
    return { success: true };
}

export async function toggleTicketStatus(ticketId: string, currentStatus: string) {
    const admin = createAdminClient();
    const newStatus = currentStatus === 'closed' || currentStatus === 'resolved' ? 'open' : 'closed';

    const { error } = await admin
        .from('support_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', ticketId);

    if (error) {
        console.error('Error toggling ticket status:', error);
        return { success: false, error: error.message };
    }

    revalidatePath(`/admin/support/${ticketId}`);
    revalidatePath('/admin/support');
    return { success: true };
}

export async function sendSupportMessage(ticketId: string, message: string, attachments: any[] = []) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    const admin = createAdminClient();

    const { error: messageError } = await admin
        .from('ticket_messages')
        .insert({
            ticket_id: ticketId,
            sender_id: user.id,
            sender_type: 'support',
            message: message.trim(),
            attachments: attachments || [],
            is_read: false,
        });

    if (messageError) {
        console.error('Error sending support message:', messageError);
        return { success: false, error: messageError.message };
    }

    // Auto update ticket to 'in_progress' if it's currently 'open' when admin replies
    const { data: ticket } = await admin.from('support_tickets').select('status').eq('id', ticketId).single();
    if (ticket && (ticket.status === 'open' || ticket.status === 'resolved' || ticket.status === 'closed')) {
        await admin
            .from('support_tickets')
            .update({ status: 'in_progress', updated_at: new Date().toISOString() })
            .eq('id', ticketId);
    }

    revalidatePath(`/admin/support/${ticketId}`);
    revalidatePath('/admin/support');
    return { success: true };
}
