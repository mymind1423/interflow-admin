import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from './AdminAuthContext';
import { adminApi } from '../api/adminApi';

const AdminNotificationContext = createContext();

export function useAdminNotifications() {
    return useContext(AdminNotificationContext);
}

export function AdminNotificationProvider({ children }) {
    const { admin } = useAdminAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        if (!admin) return;
        try {
            const data = await adminApi.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.isRead).length);
        } catch (err) {
            console.error("Failed to load notifications", err);
        }
    }, [admin]);

    useEffect(() => {
        if (admin) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [admin, fetchNotifications]);

    const markAsRead = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        try {
            await adminApi.markNotificationRead(id);
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        try {
            await adminApi.markAllNotificationsRead();
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    return (
        <AdminNotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications }}>
            {children}
        </AdminNotificationContext.Provider>
    );
}
