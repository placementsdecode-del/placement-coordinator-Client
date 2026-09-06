import { useState } from 'react';
import { listWork, createWork, publishWork } from '@/services/work.api.service';
import { useCommunityData } from './use-community-data';
import { SectionIntro } from '@/components/common/section-intro';
import { PageSkeleton, LoadError } from '@/components/common/loading-state';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { SectionRow } from '@/types/admin';
export function WorkAdmin({ sections, initialKind = 'task' }: { sections: SectionRow[]; initialKind?: string }) {
  const { data, error, loading, refresh } = useCommunityData(listWork);
  const [title, setTitle] = useState(''); const [instructions, setInstructions] = useState(''); const [kind, setKind] = useState(initialKind); const [audience, setAudience] = useState<string[]>([]);
  const [pending, setPending] = useState(false); const [message, setMessage] = useState(''); const [actionError, setActionError] = useState('');
  async function save(action: () => Promise<{ message: string }>, reset = false) { setPending(true); setActionError(''); setMessage(''); try { const response = await action(); setMessage(response.message); if (reset) { setTitle(''); setInstructions(''); } refresh(); } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to save.'); } finally { setPending(false); } }
  if (!data && loading) return <PageSkeleton label="Loading section work" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  return <><SectionIntro eyebrow="Section assignments" title="Publish work" description="Save a draft or publish to the selected sections. Published work appears in students’ notifications and Assigned Work." />
    <Card><CardContent className="p-5"><form className="space-y-4" onSubmit={event => { event.preventDefault(); const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement; void save(() => createWork({ title, instructions, kind, assignedSections: audience, status: submitter?.value || 'draft' }), true); }}><fieldset disabled={pending} className="space-y-4">
      <label className="block text-sm font-medium">Title<Input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} /></label>
      <label className="block text-sm font-medium">Type<select aria-label="Type" className="h-11 w-full rounded-md border bg-white px-3" value={kind} onChange={event => setKind(event.target.value)}>{['task', 'homework', 'activity', 'announcement'].map(type => <option key={type}>{type}</option>)}</select></label>
      <label className="block text-sm font-medium">Instructions<textarea required maxLength={10000} className="min-h-32 w-full rounded-md border p-3" value={instructions} onChange={event => setInstructions(event.target.value)} /></label>
      <fieldset className="rounded-md border p-3"><legend className="px-2 text-sm font-semibold">Assigned sections</legend>{sections.filter(section => section.status === 'Active').map(section => <label key={section.id} className="flex gap-3 p-2 text-sm"><input type="checkbox" checked={audience.includes(section.id)} onChange={event => setAudience(ids => event.target.checked ? [...ids, section.id] : ids.filter(id => id !== section.id))} />{section.name} · {section.code}</label>)}</fieldset>
      <div className="flex gap-2"><Button variant="outline" type="submit" value="draft" disabled={!audience.length || pending}>Save draft</Button><Button type="submit" value="published" disabled={!audience.length || pending}>{pending ? 'Saving…' : 'Publish and notify'}</Button></div>
    </fieldset></form></CardContent></Card>
    {actionError && <p role="alert" className="text-destructive">{actionError}</p>}{message && <p role="status" className="text-primary">{message}</p>}
    {data?.work.map(item => <Card key={item._id}><CardHeader><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{item.kind} · {item.status} · {item.assignedSections?.map(section => `${section.name} (${section.code})`).join(', ')}</p><p className="my-3 whitespace-pre-wrap">{item.instructions}</p>{item.status === 'draft' && <Button disabled={pending} onClick={() => void save(() => publishWork(item._id))}>Publish and notify</Button>}</CardContent></Card>)}
  </>;
}
