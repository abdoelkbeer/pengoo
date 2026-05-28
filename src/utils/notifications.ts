import { createAdminClient } from './supabase/admin';

export type NotificationType = 'success' | 'warning' | 'error' | 'info';

export interface NotificationConfig {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    data?: any;
}

/**
 * Creates a new notification for a specific user.
 * This utility uses the admin client to bypass RLS, making it suitable for 
 * use in webhooks, workers, and background processes.
 */
export async function createNotification({
    userId,
    type,
    title,
    message,
    link,
    data = {}
}: NotificationConfig) {
    const supabase = createAdminClient();

    const { data: notification, error } = await supabase
        .from('notifications')
        .insert([
            {
                user_id: userId,
                type,
                title,
                message,
                link,
                data,
                is_read: false
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error creating notification:', error);
        throw error;
    }

    return notification;
}

/**
 * Triggers a system alert (warning/error) for the user.
 */
export async function triggerSystemAlert(userId: string, title: string, message: string, type: NotificationType = 'warning') {
    return createNotification({
        userId,
        type,
        title,
        message,
        data: { source: 'system' }
    });
}

/**
 * Triggers a success notification (e.g., order processed, connection successful).
 */
export async function triggerSuccessNotification(userId: string, title: string, message: string, link?: string) {
    return createNotification({
        userId,
        type: 'success',
        title,
        message,
        link,
        data: { source: 'activity' }
    });
}
