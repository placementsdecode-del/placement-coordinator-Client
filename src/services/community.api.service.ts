import { apiFetch } from '@/services/api-client';
import type { CommunitySection, Peer, AssignedWork } from '@/types/community';
export const getMySection = () => apiFetch<{ sections: (CommunitySection & { classmates: Peer[] })[]; section: CommunitySection | null; classmates: Peer[] }>('/api/community/section');
export const getMySectionSummary = () => apiFetch<{ section: CommunitySection | null }>('/api/community/section?view=summary');
export const getMyWork = (signal?: AbortSignal) => apiFetch<{ work: AssignedWork[] }>('/api/community/work', { signal });
