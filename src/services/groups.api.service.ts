import { apiFetch } from '@/services/api-client';
import type { StudentGroup, GroupInvitation } from '@/types/community';
export const listGroups = () => apiFetch<{ groups: StudentGroup[] }>('/api/groups');
export const listGroupInvitations = () => apiFetch<{ invitations: GroupInvitation[] }>('/api/groups/invitations');
export const createGroup = (payload: { name: string; description: string; students: string[] }) => apiFetch<{ message: string }>('/api/groups', { method: 'POST', body: JSON.stringify(payload) });
export const inviteToGroup = (id: string, students: string[]) => apiFetch<{ message: string }>(`/api/groups/${id}/invitations`, { method: 'POST', body: JSON.stringify({ students }) });
export const respondToGroupInvitation = (id: string, status: 'accepted' | 'declined') => apiFetch<{ message: string }>(`/api/groups/${id}/invitations/me`, { method: 'PATCH', body: JSON.stringify({ status }) });
