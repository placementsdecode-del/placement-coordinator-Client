import { assignGroupCoordinators } from '@/services/groups.api.service';
import type { ApiUser } from '@/types/api';
import { GroupRoom } from './group-room';
import { useState } from 'react';
import { createGroup, inviteToGroup, listGroups } from '@/services/groups.api.service';
import { useCommunityData } from './use-community-data';
import { PageSkeleton, LoadError } from '@/components/common/loading-state';
import { SectionIntro } from '@/components/common/section-intro';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { AdminStudentRow } from '@/types/admin';
export function GroupsAdmin({ students, faculty }: { students: AdminStudentRow[]; faculty: ApiUser[] }) {
  const { data, error, loading, refresh } = useCommunityData(listGroups);
  const [opened, setOpened] = useState(''); const [creating, setCreating] = useState(false);
  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState(''); const [search, setSearch] = useState(''); const [pending, setPending] = useState(false); const [message, setMessage] = useState(''); const [actionError, setActionError] = useState('');
  const group = data?.groups.find(group => group._id === target);
  const eligible = students.filter(student => student.status === 'Active' && !group?.participants.some(member => member.student?._id === student.id));
  if (!data && loading) return <PageSkeleton label="Loading groups" />;
  if (error) return <LoadError message={error} onRetry={refresh} />;
  const room = data?.groups.find(g => g._id === opened);
  if (room) return <><GroupRoom key={room._id} group={room} onBack={() => setOpened('')} /><details className="rounded-lg border bg-white p-4"><summary className="cursor-pointer font-semibold">Manage coordinators</summary><div className="mt-3 grid gap-2 sm:grid-cols-3">{faculty.map(t => { const id = t.id || t._id || ''; const ids = room.coordinators?.map(c => c._id) || []; return <label key={id} className="flex gap-2 p-2 text-sm"><input type="checkbox" disabled={pending} checked={ids.includes(id)} onChange={async e => { setPending(true); setActionError(''); try { await assignGroupCoordinators(room._id, e.target.checked ? [...ids, id] : ids.filter(i => i !== id)); refresh(); } catch (e) { setActionError(e instanceof Error ? e.message : 'Unable to assign coordinator'); } finally { setPending(false); } }} />{t.name}</label>; })}</div>{actionError && <p role="alert">{actionError}</p>}</details></>;
  return <><SectionIntro eyebrow="Student community" title="Groups" action={<Button onClick={() => setCreating(v => !v)}>{creating ? "Close" : "Create / invite"}</Button>} description="Create a group and invite students. Membership begins only after each student accepts in the app." />
    {creating && <Card><CardHeader><CardTitle>{target ? `Invite to ${group?.name}` : 'Create a group'}</CardTitle><CardDescription>Students receive in-app invitations. No email links are sent.</CardDescription></CardHeader><CardContent>
      <form className="space-y-4" onSubmit={async event => { event.preventDefault(); setPending(true); setActionError(''); setMessage(''); try { const response = target ? await inviteToGroup(target, selected) : await createGroup({ name, description, students: selected }); setMessage(response.message); setSelected([]); if (!target) { setName(''); setDescription(''); } refresh(); } catch (error) { setActionError(error instanceof Error ? error.message : 'Unable to send invitations.'); } finally { setPending(false); } }}>
        <fieldset disabled={pending} className="space-y-4"><label className="block text-sm font-medium">Group<select aria-label="Group" className="mt-1 h-11 w-full rounded-md border bg-white px-3" value={target} onChange={event => { setTarget(event.target.value); setSelected([]); }}><option value="">Create a new group</option>{data?.groups.map(group => <option key={group._id} value={group._id}>{group.name}</option>)}</select></label>
        {!target && <><label className="block text-sm font-medium">Group name<Input required maxLength={120} value={name} onChange={event => setName(event.target.value)} /></label><label className="block text-sm font-medium">Description<Input maxLength={2000} value={description} onChange={event => setDescription(event.target.value)} /></label></>}
        <Input aria-label="Search students to invite" placeholder="Search name or registration number" value={search} onChange={event => setSearch(event.target.value)} />
        <fieldset className="max-h-64 overflow-y-auto rounded-lg border p-3"><legend className="px-2 text-sm font-semibold">Invite students ({selected.length} selected)</legend>{eligible.filter(student => `${student.name} ${student.rollNo}`.toLowerCase().includes(search.toLowerCase())).map(student => <label key={student.id} className="flex items-center gap-3 p-2 text-sm"><input type="checkbox" checked={selected.includes(student.id)} onChange={event => setSelected(ids => event.target.checked ? [...ids, student.id] : ids.filter(id => id !== student.id))} /><span>{student.name} · {student.rollNo} · {student.section}</span></label>)}{!eligible.length && <p className="text-sm text-muted-foreground">No additional eligible students. Existing invitations and memberships are listed below.</p>}</fieldset>
        <Button type="submit" disabled={pending || !selected.length}>{pending ? 'Sending…' : target ? 'Send invitations' : 'Create group and invite'}</Button></fieldset>
        {actionError && <p role="alert" className="text-destructive">{actionError}</p>}{message && <p role="status" className="text-sm text-primary">{message}</p>}
      </form>
    </CardContent></Card>}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data?.groups.map(group => <button key={group._id} className="rounded-xl border bg-white p-5 text-left hover:border-primary" onClick={() => setOpened(group._id)}><h2 className="font-semibold">{group.name}</h2><p className="mt-2 text-sm text-muted-foreground">{group.description}</p><p className="mt-3 text-sm">{group.participants.filter(p => p.status === 'accepted').length} members · {group.participants.filter(p => p.status === 'pending').length} invited</p></button>)}</div>
  </>;
}
