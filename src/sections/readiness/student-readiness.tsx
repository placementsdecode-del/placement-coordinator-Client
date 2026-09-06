import { useCallback, useState } from 'react';
import { getReadiness, listReadinessPolicies, setReadinessConsent } from '@/services/readiness.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { SectionIntro } from '@/components/common/section-intro';
import { PageSkeleton, LoadError } from '@/components/common/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ReadinessQuery } from '@/types/readiness';
import { FilterBar, ReadinessView } from './readiness-view';
import { EvidenceForm } from './evidence-form';
export function StudentReadiness() {
  const [query, setQuery] = useState<ReadinessQuery>({ months: '3' });
  const [logging, setLogging] = useState(false); const [pending, setPending] = useState(false); const [actionError, setActionError] = useState('');
  const load = useCallback(async () => { const [report, policies] = await Promise.all([getReadiness(query), listReadinessPolicies()]); return { report, policies: policies.policies }; }, [query]);
  const { data, error, loading, refresh } = useCommunityData(load);
  if (!data && loading) return <PageSkeleton label="Loading placement readiness" />;
  if (error || !data) return <LoadError message={error || 'Unable to load readiness'} onRetry={refresh} />;
  return <><SectionIntro eyebrow="Your placement journey" title="Progress & Readiness" description="See the evidence behind your readiness, the skills to improve, and your next learning steps." action={<div className="flex gap-2"><Button variant="outline" disabled={loading} onClick={refresh}>Refresh</Button><Button onClick={() => setLogging(value => !value)}>Log practice</Button></div>} />
    <FilterBar policies={data.policies} query={query} onChange={setQuery} />
    {loading && <p role="status" className="text-sm text-primary">Updating analytics…</p>}
    {logging && <EvidenceForm key={data.report.policy._id} policy={data.report.policy} onSaved={refresh} />}
    <ReadinessView report={data.report} />
    <Card><CardHeader><CardTitle>Future HR profile sharing</CardTitle></CardHeader><CardContent><p className="mb-3 text-sm text-muted-foreground">External HR access is not enabled. Record your preference for a future integration; you can revoke it at any time.</p><Button disabled={pending} variant="outline" onClick={async () => { setPending(true); setActionError(''); try { await setReadinessConsent(!data.report.hrSharingConsent); refresh(); } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to update preference'); } finally { setPending(false); } }}>{pending ? 'Saving…' : data.report.hrSharingConsent ? 'Revoke sharing preference' : 'Allow future HR profile sharing'}</Button>{actionError && <p role="alert" className="text-destructive">{actionError}</p>}</CardContent></Card>
  </>;
}
