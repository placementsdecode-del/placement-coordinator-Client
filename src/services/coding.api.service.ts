import { apiFetch } from './api-client';
export type CodingResult = { id: string; problemId: string; languageId: number; mode: 'run' | 'submit'; active: boolean; status: string; passed: number; total: number; output: string };
export type CodingProblem = { id: string; title: string; description: string; topic: string; difficulty: string; sample: { input: string; output: string } };
export const getCodingProblems = () => apiFetch<{ configured: boolean; languages: { id: number; name: string; starter: string }[]; problems: CodingProblem[]; recent: CodingResult[] }>('/api/coding/problems');
export const submitCode = (payload: { problemId: string; languageId: number; source: string; mode: 'run' | 'submit'; requestId: string }) => apiFetch<{ submission: CodingResult }>('/api/coding/submissions', { method: 'POST', body: JSON.stringify(payload) });
export const getCodingResult = (id: string) => apiFetch<{ submission: CodingResult }>(`/api/coding/submissions/${id}`);
