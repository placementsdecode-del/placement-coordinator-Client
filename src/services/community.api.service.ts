import { apiFetch } from '@/services/api-client';
import type { CommunitySection, Peer, AssignedWork } from '@/types/community';
export const getMySection = () => apiFetch<{ sections: (CommunitySection & { classmates: Peer[] })[]; section: CommunitySection | null; classmates: Peer[] }>('/api/community/section');
export const getMyWork = () => apiFetch<{ work: AssignedWork[] }>('/api/community/work');
