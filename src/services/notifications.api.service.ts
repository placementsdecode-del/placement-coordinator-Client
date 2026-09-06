import { apiFetch } from '@/services/api-client';
import type { AppNotification } from '@/types/community';
export const listNotifications = () => apiFetch<{ notifications: AppNotification[]; unreadCount: number }>('/api/community/notifications');
export const setNotificationRead = (id: string, read: boolean) => apiFetch(`/api/community/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read }) });
export const deleteNotification = (id: string) => apiFetch(`/api/community/notifications/${id}`, { method: 'DELETE' });
export const markAllNotificationsRead = () => apiFetch('/api/community/notifications/read-all', { method: 'PATCH' });
