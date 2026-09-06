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
  const { data, error, loading, refresh } = useCommunityData(getMySection);
  if (!data && loading) return <PageSkeleton label="Loading your section" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  const section = data?.section;
  return <><SectionIntro eyebrow="Your community" title={section ? `${section.name} · ${section.code}` : 'My Section'} description="Your section, coordinators, and fellow students." action={<Button variant="outline" onClick={refresh} disabled={loading}>Refresh</Button>} />
    {section ? <><Card><CardHeader><CardTitle>{section.department} · {section.batch}</CardTitle><CardDescription>Academic year {section.academicYear}</CardDescription></CardHeader><CardContent><p>{section.description}</p><p className="mt-3 text-sm">Coordinators: {section.assignedTeachers.map(teacher => teacher.name).join(', ') || 'Not assigned yet'}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Section members ({data?.classmates.length})</CardTitle><CardDescription>Basic profiles are visible only to students in this section.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data?.classmates.map(peer => <div key={peer._id} className="rounded-lg border p-4"><p className="font-semibold">{peer.name}</p><p className="text-sm text-muted-foreground">{peer.registrationNumber || 'Student'}</p></div>)}</CardContent></Card></> : <EmptyState icon={Users} title="You are not assigned to a section yet" description="Your admin or coordinator can help you get assigned. Your section will appear here." />}</>;
}
const loadGroups = async () => { const [groups, invitations] = await Promise.all([listGroups(), listGroupInvitations()]); return { ...groups, ...invitations }; };
export function MyGroups({ onChanged }: { onChanged: () => void }) {
  const { data, error, loading, refresh } = useCommunityData(loadGroups);
  const [pending, setPending] = useState(''); const [actionError, setActionError] = useState('');
  async function respond(id: string, status: 'accepted' | 'declined') { setPending(id); setActionError(''); try { await respondToGroupInvitation(id, status); refresh(); onChanged(); } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to respond.'); refresh(); } finally { setPending(''); } }
  if (!data && loading) return <PageSkeleton label="Loading your groups" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  return <><SectionIntro eyebrow="Your community" title="My Groups" description="Groups you have joined and invitations waiting for your consent." action={<Button variant="outline" disabled={loading} onClick={refresh}>Refresh</Button>} />
    {actionError && <p role="alert" className="text-destructive">{actionError}</p>}
    <Card><CardHeader><CardTitle>Pending invitations ({data?.invitations.length || 0})</CardTitle><CardDescription>Reading or deleting a notification does not accept the invitation.</CardDescription></CardHeader><CardContent className="space-y-3">{data?.invitations.length ? data.invitations.map(invite => <div key={invite._id} className="rounded-lg border p-4"><h3 className="font-semibold">{invite.name}</h3><p className="text-sm text-muted-foreground">Invited by {invite.createdBy?.name || 'Coordinator'} · {invite.description}</p><div className="mt-3 flex gap-2"><Button disabled={!!pending || loading} onClick={() => void respond(invite._id, 'accepted')}>{pending === invite._id ? 'Saving…' : 'Accept'}</Button><Button variant="outline" disabled={!!pending || loading} onClick={() => void respond(invite._id, 'declined')}>Decline</Button></div></div>) : <p className="text-sm text-muted-foreground">No pending invitations.</p>}</CardContent></Card>
    {data?.groups.length ? data.groups.map(group => <Card key={group._id}><CardHeader><CardTitle>{group.name}</CardTitle><CardDescription>{group.description ? `${group.description} · ` : ""}Created by {group.createdBy?.name || 'Coordinator'}</CardDescription></CardHeader><CardContent><p className="mb-3 text-sm font-semibold">Members ({group.participants.length})</p><div className="flex flex-wrap gap-2">{group.participants.map((member, index) => <Badge variant="outline" key={member.student?._id || index}>{member.student?.name || 'Former student'}</Badge>)}</div></CardContent></Card>) : <EmptyState icon={Users} title="No joined groups yet" description="Accept a group invitation to join and see your fellow members." />}</>;
}
export function MyAssignedWork({ kind }: { kind?: string }) {
  const { data, error, loading, refresh } = useCommunityData(getMyWork);
  if (!data && loading) return <PageSkeleton label="Loading assigned work" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  const selected = new URLSearchParams(window.location.search).get('item');
  const work = (data?.work.filter(item => !kind || item.kind === kind) || []).sort((a, b) => Number(b._id === selected) - Number(a._id === selected));
  return <><SectionIntro eyebrow="From your coordinators" title="Assigned Work" description="Published assessments, tasks, homework, activities, and announcements for your section." action={<Button variant="outline" disabled={loading} onClick={refresh}>Refresh</Button>} />
    {work.length ? work.map(item => <Card key={item._id} className={selected === item._id ? 'border-primary ring-2 ring-primary/20' : ''}><CardHeader><div className="flex flex-wrap gap-2"><Badge variant="outline">{item.kind}</Badge><Badge variant="outline">{item.status}</Badge></div><CardTitle>{item.title}</CardTitle></CardHeader><CardContent><p className="whitespace-pre-wrap">{item.instructions}</p>{item.kind === 'assessment' && <p className="mt-3 text-sm text-muted-foreground">{item.durationMinutes} minutes · {item.totalMarks} marks</p>}{item.kind === "assessment" && <Button asChild variant="outline" className="mt-3"><a href="/student/assessments">Open assessments</a></Button>}</CardContent></Card>) : <EmptyState icon={Users} title="No assigned work yet" description="Published items will appear here when a coordinator assigns them to your section." />}</>;
}
