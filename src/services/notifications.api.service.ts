import { apiFetch } from '@/services/api-client';
import type { AppNotification } from '@/types/community';
export const listNotifications = (before?: string, signal?: AbortSignal) => {
  const params = new URLSearchParams({ limit: '20' });
  if (before) params.set('before', before);
  return apiFetch<{ notifications: AppNotification[]; unreadCount: number; nextCursor: string | null }>(`/api/community/notifications?${params}`, { signal });
};
export const setNotificationRead = (id: string, read: boolean) => apiFetch(`/api/community/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read }) });
export const deleteNotification = (id: string) => apiFetch(`/api/community/notifications/${id}`, { method: 'DELETE' });
export const markAllNotificationsRead = () => apiFetch('/api/community/notifications/read-all', { method: 'PATCH' });
