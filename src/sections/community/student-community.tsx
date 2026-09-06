import { GroupRoom } from './group-room';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { useState } from 'react';
import { Users } from 'lucide-react';
import { getMySection, getMyWork } from '@/services/community.api.service';
import { listGroups, listGroupInvitations, respondToGroupInvitation } from '@/services/groups.api.service';
import { useCommunityData } from './use-community-data';
import { PageSkeleton, LoadError } from '@/components/common/loading-state';
import { SectionIntro } from '@/components/common/section-intro';
import { EmptyState } from '@/components/common/empty-state';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function MySection() {
  const [opened, setOpened] = useState('');
  const [peerId, setPeerId] = useState('');
  const { data, error, loading, refresh } = useCommunityData(getMySection);
  if (!data && loading) return <PageSkeleton label="Loading your section" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  const section = data?.sections.find(s => s._id === opened);
  const peer = section?.classmates.find(p => p._id === peerId);
  return <><SectionIntro eyebrow="Your community" title={section?.name || 'My Cohorts'} description="Your learning cohorts, coordinators, and fellow students." action={<Button variant="outline" onClick={refresh}>Refresh</Button>} />
    <Breadcrumbs items={[{ label: 'My Cohorts', onClick: opened ? () => { setOpened(''); setPeerId(''); } : undefined }, ...(section ? [{ label: section.name, onClick: peer ? () => setPeerId('') : undefined }] : []), ...(peer ? [{ label: peer.name }] : [])]} />
    {peer ? <Card><CardHeader><CardTitle>{peer.name}</CardTitle><CardDescription>{peer.registrationNumber || 'Student'} · {section?.name}</CardDescription></CardHeader></Card> : section ? <><Card><CardHeader><CardTitle>Coordinators</CardTitle><CardDescription>{section.description}</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">{section.assignedTeachers.map(t => <div key={t._id} className="rounded-lg border p-4">{t.name}</div>)}{!section.assignedTeachers.length && <p>No coordinators assigned yet.</p>}</CardContent></Card><h2 className="font-semibold">Participants ({section.classmates.length})</h2><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{section.classmates.map(p => <button key={p._id} onClick={() => setPeerId(p._id)} className="rounded-lg border bg-white p-4 text-left hover:border-primary"><p className="font-semibold">{p.name}</p><p className="text-sm text-muted-foreground">{p.registrationNumber}</p></button>)}</div></> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data?.sections.map(s => <button key={s._id} onClick={() => setOpened(s._id)} className="rounded-xl border bg-white p-5 text-left hover:border-primary"><h2 className="font-semibold">{s.name}</h2><p className="mt-2 text-sm text-muted-foreground">{s.description}</p><p className="mt-3 text-sm">{s.classmates.length} participants · {s.assignedTeachers.length} coordinators</p></button>)}</div>}
    {!data?.sections.length && <EmptyState icon={Users} title="No cohorts yet" description="Your coordinator can add you to a learning cohort." />}</>;

}
const loadGroups = async () => { const [groups, invitations] = await Promise.all([listGroups(), listGroupInvitations()]); return { ...groups, ...invitations }; };
export function MyGroups({ onChanged }: { onChanged: () => void }) {
  const { data, error, loading, refresh } = useCommunityData(loadGroups);
  const [opened, setOpened] = useState(() => new URLSearchParams(window.location.search).get('item') || '');
  const [pending, setPending] = useState(''); const [actionError, setActionError] = useState('');
  async function respond(id: string, status: 'accepted' | 'declined') { setPending(id); setActionError(''); try { await respondToGroupInvitation(id, status); refresh(); onChanged(); } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to respond.'); refresh(); } finally { setPending(''); } }
  if (!data && loading) return <PageSkeleton label="Loading your groups" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  const selectedGroup = data?.groups.find(g => g._id === opened);
  if (selectedGroup) return <GroupRoom key={selectedGroup._id} group={selectedGroup} onBack={() => setOpened('')} />;
  return <><SectionIntro eyebrow="Your community" title="My Groups" description="Groups you have joined and invitations waiting for your consent." action={<Button variant="outline" disabled={loading} onClick={refresh}>Refresh</Button>} />
    {actionError && <p role="alert" className="text-destructive">{actionError}</p>}
    <Card><CardHeader><CardTitle>Pending invitations ({data?.invitations.length || 0})</CardTitle><CardDescription>Reading or deleting a notification does not accept the invitation.</CardDescription></CardHeader><CardContent className="space-y-3">{data?.invitations.length ? data.invitations.map(invite => <div key={invite._id} className="rounded-lg border p-4"><h3 className="font-semibold">{invite.name}</h3><p className="text-sm text-muted-foreground">Invited by {invite.createdBy?.name || 'Coordinator'} · {invite.description}</p><div className="mt-3 flex gap-2"><Button disabled={!!pending || loading} onClick={() => void respond(invite._id, 'accepted')}>{pending === invite._id ? 'Saving…' : 'Accept'}</Button><Button variant="outline" disabled={!!pending || loading} onClick={() => void respond(invite._id, 'declined')}>Decline</Button></div></div>) : <p className="text-sm text-muted-foreground">No pending invitations.</p>}</CardContent></Card>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data?.groups.filter(g => g.kind !== 'practice').map(group => <button key={group._id} className="rounded-xl border bg-white p-5 text-left hover:border-primary" onClick={() => setOpened(group._id)}><h2 className="font-semibold">{group.name}</h2><p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{group.description}</p><p className="mt-3 text-sm">{group.participants.length} members · {group.unreadCount || 0} unread</p></button>)}</div>{!data?.groups.some(g => g.kind !== 'practice') && <EmptyState icon={Users} title="No joined groups yet" description="Accept an invitation to start chatting with your group." />}</>;

}
export function MyAssignedWork({ kind }: { kind?: string }) {
  const { data, error, loading, refresh } = useCommunityData(getMyWork);
  if (!data && loading) return <PageSkeleton label="Loading assigned work" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  const selected = new URLSearchParams(window.location.search).get('item');
  const work = (data?.work.filter(item => kind ? item.kind === kind : item.kind !== 'assessment') || []).sort((a, b) => Number(b._id === selected) - Number(a._id === selected));
  return <><SectionIntro eyebrow="From your coordinators" title="Tasks & Activities" description="Tasks, activities, homework, and announcements from your coordinators." action={<Button variant="outline" disabled={loading} onClick={refresh}>Refresh</Button>} />
    {work.length ? work.map(item => <Card key={item._id} className={selected === item._id ? 'border-primary ring-2 ring-primary/20' : ''}><CardHeader><div className="flex flex-wrap gap-2"><Badge variant="outline">{item.kind}</Badge><Badge variant="outline">{item.status}</Badge></div><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap">{item.instructions}</p>{item.kind === 'assessment' && <p className="mt-3 text-sm text-muted-foreground">{item.durationMinutes} minutes · {item.totalMarks} marks</p>}{item.kind === "assessment" && <Button asChild variant="outline" className="mt-3"><a href="/student/assessments">Open assessments</a></Button>}</CardContent></Card>) : <EmptyState icon={Users} title="No assigned work yet" description="Published items will appear here when a coordinator assigns them to your section." />}</>;
}
