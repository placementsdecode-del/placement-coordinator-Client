import { apiFetch } from '@/services/api-client';
import type { AssignedWork } from '@/types/community';
export const listWork = () => apiFetch<{ work: AssignedWork[] }>('/api/work');
export const createWork = (payload: { title: string; instructions: string; kind: string; assignedSections: string[]; status: string }) => apiFetch<{ message: string }>('/api/work', { method: 'POST', body: JSON.stringify(payload) });
export const publishWork = (id: string) => apiFetch<{ message: string }>(`/api/work/${id}/publish`, { method: 'POST' });
