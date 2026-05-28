'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';

export type Notification = {
    id: string;
    user_id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    link?: string;
    data?: any;
    is_read: boolean;
    created_at: string;
};

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    const supabase = createClient();

    const fetchNotifications = useCallback(async () => {
        try {
            const response = await fetch('/api/notifications/admin');
            const data = await response.json();
            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.notifications.filter((n: Notification) => !n.is_read).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('admin_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);

                    // Show a toast if possible (can be handled in the component)
                    window.dispatchEvent(new CustomEvent('new-notification', { detail: newNotif }));
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'notifications'
                },
                (payload) => {
                    const updatedNotif = payload.new as Notification;
                    setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));

                    // Recalculate unread count
                    setNotifications(prev => {
                        setUnreadCount(prev.filter(n => !n.is_read).length);
                        return prev;
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            const response = await fetch('/api/notifications/admin', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch('/api/notifications/admin', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAllAsRead: true })
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const response = await fetch('/api/notifications/admin', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (response.ok) {
                const deletedNotif = notifications.find(n => n.id === id);
                setNotifications(prev => prev.filter(n => n.id !== id));
                if (deletedNotif && !deletedNotif.is_read) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        refresh: fetchNotifications
    };
}
