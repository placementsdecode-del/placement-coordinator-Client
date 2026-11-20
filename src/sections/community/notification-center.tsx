import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { listNotifications, setNotificationRead, deleteNotification, markAllNotificationsRead } from '@/services/notifications.api.service';
import { respondToGroupInvitation } from '@/services/groups.api.service';
import type { AppNotification } from '@/types/community';
import type { NavLabel } from '@/types/student';
import { Button } from '@/components/ui/button';
import { SkeletonRows } from '@/components/common/loading-state';
import { notifyCommunityChanged } from './community-events';

export function NotificationCenter({ onNavigate }: { onNavigate: (nav: NavLabel, itemId?: string) => void }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const request = useRef<AbortController | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);

  const refresh = useCallback(async (before?: string) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError('');
    try {
      const page = await listNotifications(before, controller.signal);
      if (controller.signal.aborted) return;
      setItems(previous => before ? [...previous, ...page.notifications.filter(item => !previous.some(row => row._id === item._id))] : page.notifications);
      setUnread(page.unreadCount);
      setNextCursor(page.nextCursor);
      setLoaded(true);
    } catch (error) {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Unable to load notifications.');
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => { request.current?.abort(); request.current = null; };
  }, [refresh]);

  useEffect(() => {
    if (open) {
      panel.current?.focus();
      return;
    }
    const refreshVisible = () => {
      if (!document.hidden && !request.current) void refresh();
    };
    const interval = window.setInterval(refreshVisible, 90000 + Math.random() * 30000);
    window.addEventListener('community-changed', refreshVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('community-changed', refreshVisible);
    };
  }, [open, refresh]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  async function act(action: () => Promise<unknown>, communityChanged = false) {
    setPending(true);
    setError('');
    try {
      await action();
      await refresh();
      if (communityChanged) notifyCommunityChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update notification.');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        ref={trigger}
        variant="outline"
        className="relative"
        size="icon"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => {
          if (open) close();
          else {
            setOpen(true);
            if (!request.current) void refresh();
          }
        }}
      >
        <Bell aria-hidden="true" className="h-4 w-4" />
        {unread > 0 && <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1.5 text-xs text-white">{unread > 99 ? '99+' : unread}</span>}
      </Button>
      {open && (
        <section
          ref={panel}
          id="notification-panel"
          aria-label="Notifications"
          tabIndex={-1}
          onKeyDown={event => { if (event.key === 'Escape') close(); }}
          className="fixed inset-x-3 top-20 z-50 max-h-[calc(100dvh-10.5rem)] overflow-y-auto rounded-xl border bg-white p-4 shadow-lg outline-none sm:left-auto sm:right-5 sm:w-[440px] lg:max-h-[calc(100dvh-7rem)]"
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Notifications {unread > 0 && <span className="text-sm font-normal text-muted-foreground">· {unread} unread</span>}</h2>
            <Button variant="ghost" size="icon" aria-label="Close notifications" onClick={close}><X aria-hidden="true" className="h-4 w-4" /></Button>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" disabled={pending || loading || !unread} onClick={() => void act(markAllNotificationsRead)}>Mark all read</Button>
            <Button size="sm" variant="ghost" disabled={pending || loading} onClick={() => void refresh()}>Refresh</Button>
          </div>
          {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
          {!loaded && loading && <SkeletonRows rows={3} />}
          {loaded && !items.length && <p className="py-6 text-center text-sm text-muted-foreground">You’re all caught up.</p>}
          <div className="space-y-2">
            {items.map(item => (
              <article key={item._id} className={`rounded-lg border p-3 ${item.read ? '' : 'border-primary/30 bg-primary/5'}`}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="min-w-0 break-words font-semibold">{item.title}</h3>
                  {!item.read && <span className="text-xs font-medium text-primary">Unread</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.message}</p>
                <time dateTime={item.createdAt} className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</time>
                {item.kind === 'invitation' && item.invitationStatus === 'pending' && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" disabled={pending} onClick={() => void act(() => respondToGroupInvitation(item.sourceId, 'accepted'), true)}>Accept</Button>
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => void act(() => respondToGroupInvitation(item.sourceId, 'declined'), true)}>Decline</Button>
                  </div>
                )}
                {item.kind === 'invitation' && item.invitationStatus !== 'pending' && <p className="mt-2 text-sm font-medium">Invitation {item.invitationStatus || 'no longer available'}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => {
                    const nav = item.kind === 'invitation' ? 'My Groups' : item.kind === 'assessment' ? 'Assessments' : 'Tasks & Activities';
                    onNavigate(nav, item.sourceId);
                    close();
                  }}>Open</Button>
                  <Button size="sm" variant="ghost" disabled={pending} onClick={() => void act(() => setNotificationRead(item._id, !item.read))}>{item.read ? 'Mark unread' : 'Mark read'}</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" disabled={pending} onClick={() => void act(() => deleteNotification(item._id))}>Delete</Button>
                </div>
              </article>
            ))}
          </div>
          {nextCursor && <Button className="mt-3 w-full" variant="outline" disabled={pending || loading} onClick={() => void refresh(nextCursor)}>{loading ? 'Loading…' : 'Load older notifications'}</Button>}
        </section>
      )}
    </>
  );
}
