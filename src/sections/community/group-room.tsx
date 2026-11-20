import { ExpandableText } from '@/components/common/expandable-text';
import { useCallback, useEffect, useState } from 'react';
import { listGroupMessages, sendGroupMessage } from '@/services/groups.api.service';
import { useCommunityData } from './use-community-data';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { StudentGroup } from '@/types/community';

type Message = Awaited<ReturnType<typeof listGroupMessages>>['messages'][number];

export function GroupRoom({ group, onBack }: { group: StudentGroup; onBack: () => void }) {
  const load = useCallback(() => listGroupMessages(group._id), [group._id]);
  const { data, error, loading, refresh } = useCommunityData(load);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [olderLoaded, setOlderLoaded] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!data) return;
    setMessages(previous => {
      const merged = new Map(previous.map(message => [message._id, message]));
      for (const message of data.messages) merged.set(message._id, message);
      return [...merged.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a._id.localeCompare(b._id));
    });
    if (!olderLoaded) setHasMore(data.hasMore);
  }, [data, olderLoaded]);
  useEffect(() => {
    if (loading) return;
    const refreshVisible = () => { if (!document.hidden) refresh(); };
    const timer = window.setInterval(refreshVisible, 5000);
    document.addEventListener('visibilitychange', refreshVisible);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refreshVisible); };
  }, [loading, refresh]);

  async function loadOlder() {
    if (!messages.length) return;
    setLoadingOlder(true); setActionError('');
    try {
      const page = await listGroupMessages(group._id, messages[0]._id);
      setMessages(previous => [...page.messages.filter(message => !previous.some(row => row._id === message._id)), ...previous]);
      setHasMore(page.hasMore); setOlderLoaded(true);
    } catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to load older messages'); }
    finally { setLoadingOlder(false); }
  }

  return <div className="space-y-4">
    <Breadcrumbs items={[{ label: group.kind === 'practice' ? 'Self-Assessment' : 'Groups', onClick: onBack }, { label: group.name }]} />
    <Card><CardHeader><CardTitle>{group.name}</CardTitle><ExpandableText text={group.description} label="description" /></CardHeader><CardContent>
      <details><summary className="cursor-pointer text-sm font-medium">Participants ({group.participants.filter(member => member.status === 'accepted').length}) · Coordinators ({group.coordinators?.length || 0})</summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {group.coordinators?.map(person => <div key={person._id} className="rounded-lg border p-3 text-sm">{person.name}<p className="text-xs text-muted-foreground">Coordinator</p></div>)}
          {group.participants.filter(member => member.status === 'accepted').map((member, index) => <div key={member.student?._id || index} className="rounded-lg border p-3 text-sm">{member.student?.name || 'Former student'}</div>)}
        </div>
      </details>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Conversation</CardTitle></CardHeader><CardContent className="space-y-4">
      {error && <div role="alert" className="text-sm text-destructive">{error} <button type="button" onClick={refresh} className="underline">Retry</button></div>}
      {hasMore && <Button variant="outline" size="sm" disabled={loadingOlder} onClick={() => void loadOlder()}>{loadingOlder ? 'Loading…' : 'Load older messages'}</Button>}
      <div role="log" aria-label="Group messages" className="max-h-[480px] space-y-3 overflow-y-auto">
        {messages.map(message => <div key={message._id} className="rounded-lg bg-muted p-3"><div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground"><span>{message.sender?.name || 'Former member'}</span><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString()}</time></div><p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.text}</p></div>)}
        {data && !messages.length && <p className="text-sm text-muted-foreground">Start a conversation. Share a question, solution, or practice prompt.</p>}
      </div>
      <form className="space-y-2" onSubmit={async event => {
        event.preventDefault(); if (!text.trim() || pending) return;
        setPending(true); setActionError('');
        try { await sendGroupMessage(group._id, text); setText(''); refresh(); }
        catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Message could not be sent'); }
        finally { setPending(false); }
      }}>
        <label className="block text-sm font-medium">Message<textarea required maxLength={5000} className="workspace-textarea mt-2 min-h-24" value={text} disabled={pending} onChange={event => setText(event.target.value)} /></label>
        <Button disabled={pending || !text.trim()}>{pending ? 'Sending…' : 'Send message'}</Button>
        {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
      </form>
    </CardContent></Card>
  </div>;
}
