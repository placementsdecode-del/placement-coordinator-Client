import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { listNotifications, setNotificationRead, deleteNotification, markAllNotificationsRead } from '@/services/notifications.api.service';
import { respondToGroupInvitation } from '@/services/groups.api.service';
import type { AppNotification } from '@/types/community';
import type { NavLabel } from '@/types/student';
import { Button } from '@/components/ui/button';
import { SkeletonRows } from '@/components/common/loading-state';
import { notifyCommunityChanged } from './community-events';
export function NotificationCenter({ onNavigate }: { onNavigate: (nav: NavLabel) => void }) {
  const [open, setOpen] = useState(false); const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [pending, setPending] = useState(false);
  const alive = useRef(false); const fetching = useRef(false); const trigger = useRef<HTMLButtonElement>(null);
  const refresh = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try { const result = await listNotifications(); if (alive.current) { setItems(result.notifications); setError(''); } }
    catch (error) { if (alive.current) setError(error instanceof Error ? error.message : 'Unable to load notifications.'); }
    finally { fetching.current = false; if (alive.current) setLoading(false); }
  }, []);
  useEffect(() => {
    alive.current = true; void refresh();
    const reload = () => { if (!document.hidden) void refresh(); };
    const interval = window.setInterval(reload, 30000);
    window.addEventListener('community-changed', reload); window.addEventListener('focus', reload);
    return () => { alive.current = false; clearInterval(interval); window.removeEventListener('community-changed', reload); window.removeEventListener('focus', reload); };
  }, [refresh]);
  function close() { setOpen(false); trigger.current?.focus(); }
  async function act(action: () => Promise<unknown>) {
    setPending(true); setError('');
    try { await action(); await refresh(); notifyCommunityChanged(); }
    catch (error) { setError(error instanceof Error ? error.message : 'Unable to update notification.'); }
    finally { setPending(false); }
  }
  const unread = items.filter(item => !item.read).length;
  return <><Button ref={trigger} variant="outline" className="relative" size="icon" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} aria-expanded={open} aria-controls="notification-panel" onClick={() => { setOpen(value => !value); void refresh(); }}><Bell className="h-4 w-4" />{unread > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1.5 text-xs text-white">{unread > 99 ? '99+' : unread}</span>}</Button>
    {open && <section id="notification-panel" aria-label="Notifications" onKeyDown={event => { if (event.key === 'Escape') close(); }} className="fixed inset-x-3 top-20 z-50 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-xl border bg-white p-4 shadow-lg sm:left-auto sm:right-5 sm:w-[440px]">
      <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Notifications ({unread} unread)</h2><Button variant="ghost" size="icon" aria-label="Close notifications" onClick={close}><X className="h-4 w-4" /></Button></div>
      <div className="mb-3 flex flex-wrap gap-2"><Button variant="outline" disabled={pending || !unread} onClick={() => void act(markAllNotificationsRead)}>Mark all read</Button><Button variant="ghost" disabled={pending || loading} onClick={() => void refresh()}>Refresh</Button></div>
      {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
      {loading ? <SkeletonRows rows={3} /> : items.length ? items.map(item => <article key={item._id} className={`mb-3 rounded-lg border p-3 ${item.read ? '' : 'border-primary/40 bg-primary/5'}`}>
        <div className="flex items-start gap-2"><h3 className="flex-1 font-semibold">{item.title}</h3>{!item.read && <span className="text-xs font-semibold text-primary">Unread</span>}</div><p className="mt-1 text-sm text-muted-foreground">{item.message}</p><time className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</time>
        {item.kind === 'invitation' && item.invitationStatus === 'pending' ? <div className="mt-2 flex gap-2"><Button disabled={pending} onClick={() => void act(() => respondToGroupInvitation(item.sourceId, 'accepted'))}>Accept</Button><Button variant="outline" disabled={pending} onClick={() => void act(() => respondToGroupInvitation(item.sourceId, 'declined'))}>Decline</Button></div> : item.kind === 'invitation' && <p className="mt-2 text-sm font-medium">Invitation {item.invitationStatus || 'no longer available'}</p>}
        <div className="mt-2 flex flex-wrap gap-2"><Button variant="ghost" disabled={pending} onClick={() => { onNavigate(item.kind === 'invitation' ? 'My Groups' : 'Assigned Work'); if (item.kind !== 'invitation') window.history.replaceState({}, '', `${window.location.pathname}?item=${encodeURIComponent(item.sourceId)}`); close(); }}>Open</Button><Button variant="ghost" disabled={pending} onClick={() => void act(() => setNotificationRead(item._id, !item.read))}>{item.read ? 'Mark unread' : 'Mark read'}</Button><Button variant="destructive" disabled={pending} onClick={() => void act(() => deleteNotification(item._id))}>Delete</Button></div>
      </article>) : <p className="py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>}
    </section>}</>;
}
