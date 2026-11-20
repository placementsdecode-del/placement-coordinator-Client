import { ExpandableText } from '@/components/common/expandable-text';
import { WorkReviews } from './work-reviews';
import { ResourcePanel } from '@/components/common/resource-panel';
import type { ResourceStatus } from '@/hooks/use-api-resource';
import { useState } from 'react';
import { listWork, createWork, publishWork } from '@/services/work.api.service';
import { useCommunityData } from './use-community-data';
import { EmptyState } from '@/components/common/empty-state';
import { SectionIntro } from '@/components/common/section-intro';
import { PageSkeleton, LoadError } from '@/components/common/loading-state';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { SectionRow } from '@/types/admin';
export function WorkAdmin({ sections, sectionsStatus, initialKind = 'task' }: { sections: SectionRow[]; sectionsStatus: ResourceStatus; initialKind?: string }) {
  const { data, error, loading, refresh } = useCommunityData(listWork);
  const [reviewing, setReviewing] = useState('');
  const [title, setTitle] = useState(''); const [instructions, setInstructions] = useState(''); const [kind, setKind] = useState(initialKind); const [audience, setAudience] = useState<string[]>([]);
  const [pending, setPending] = useState(false); const [message, setMessage] = useState(''); const [actionError, setActionError] = useState('');
  async function save(action: () => Promise<{ message: string }>, reset = false) { setPending(true); setActionError(''); setMessage(''); try { const response = await action(); setMessage(response.message); if (reset) { setTitle(''); setInstructions(''); } refresh(); } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to save.'); } finally { setPending(false); } }
  if (!data && loading) return <PageSkeleton label="Loading section work" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  return <><SectionIntro eyebrow="Section assignments" title="Publish work" description="Save a draft or publish to the selected sections. Published work appears in students’ notifications and Assigned Work." />
    <Card className="workspace-form-panel"><CardContent className="p-4 sm:p-5">
      <form onSubmit={event => {
        event.preventDefault();
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
        void save(() => createWork({ title, instructions, kind, assignedSections: audience, status: submitter?.value || 'draft' }), true);
      }}>
        <fieldset disabled={pending} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,22rem)_minmax(0,13rem)]">
            <label className="block min-w-0 space-y-1 text-sm font-medium">
              <span>Title</span>
              <Input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} />
            </label>
            <label className="block min-w-0 space-y-1 text-sm font-medium">
              <span>Type</span>
              <select aria-label="Type" className="compact-select" value={kind} onChange={event => setKind(event.target.value)}>
                {['task', 'homework', 'activity', 'announcement'].map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </label>
          </div>
          <label className="block space-y-1 text-sm font-medium">
            <span>Instructions</span>
            <textarea required maxLength={10000} className="workspace-textarea" value={instructions} onChange={event => setInstructions(event.target.value)} />
          </label>
          <ResourcePanel resource={sectionsStatus} label="Cohort choices">
            <fieldset className="max-w-2xl rounded-md border p-2 sm:p-3">
              <legend className="px-2 text-sm font-semibold">Assigned sections</legend>
              <div className="grid gap-1 sm:grid-cols-2">
                {sections.filter(section => section.status === 'Active').map(section => <label key={section.id} className="flex min-w-0 items-start gap-2 p-2 text-sm">
                  <input type="checkbox" className="mt-1 shrink-0" checked={audience.includes(section.id)} onChange={event => setAudience(ids => event.target.checked ? [...ids, section.id] : ids.filter(id => id !== section.id))} />
                  <span className="min-w-0 break-words">{section.name} · {section.code}</span>
                </label>)}
              </div>
            </fieldset>
          </ResourcePanel>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" value="draft" variant="outline" disabled={!audience.length || pending}>Save draft</Button>
            <Button type="submit" value="published" disabled={!audience.length || pending}>{pending ? 'Saving…' : 'Publish and notify'}</Button>
          </div>
        </fieldset>
      </form>
    </CardContent></Card>
    {actionError && <p role="alert" className="text-destructive">{actionError}</p>}{message && <p role="status" className="text-primary">{message}</p>}
    {data && !data.work.length && <div className="workspace-form-panel"><EmptyState title="No assignments yet" description="Drafts and published work appear here after you save them." /></div>}
    {data?.work.map(item => <Card className="workspace-form-panel" key={item._id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.kind} · {item.status} · {item.assignedSections?.map(section => `${section.name} (${section.code})`).join(', ')}</p><div className="my-3"><ExpandableText text={item.instructions} label="instructions" /></div>{item.status === 'published' && item.kind !== 'announcement' && <Button variant="outline" onClick={() => setReviewing(reviewing === item._id ? '' : item._id)}>{reviewing === item._id ? 'Close responses' : 'View responses'}</Button>}{reviewing === item._id && <WorkReviews workId={item._id} />}{item.status === 'draft' && <Button disabled={pending} onClick={() => void save(() => publishWork(item._id))}>Publish and notify</Button>}</CardContent></Card>)}
  </>;
}
