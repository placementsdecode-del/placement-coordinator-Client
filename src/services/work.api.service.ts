import { apiFetch } from '@/services/api-client';
import type { WorkSubmission } from '@/types/community';

export const submitWorkResponse = (id: string, response: string) => apiFetch(`/api/work/${id}/submissions`, { method: 'POST', body: JSON.stringify({ response }) });
export const getWorkSubmissions = (id: string) => apiFetch<{ submissions: WorkSubmission[] }>(`/api/work/${id}/submissions`);
export const reviewWorkResponse = (workId: string, id: string, feedback: string) => apiFetch(`/api/work/${workId}/submissions/${id}/review`, { method: 'POST', body: JSON.stringify({ feedback }) });
import type { AssignedWork } from '@/types/community';
export const listWork = () => apiFetch<{ work: AssignedWork[] }>('/api/work');
export const createWork = (payload: { title: string; instructions: string; kind: string; assignedSections: string[]; status: string }) => apiFetch<{ message: string }>('/api/work', { method: 'POST', body: JSON.stringify(payload) });
export const publishWork = (id: string) => apiFetch<{ message: string }>(`/api/work/${id}/publish`, { method: 'POST' });
