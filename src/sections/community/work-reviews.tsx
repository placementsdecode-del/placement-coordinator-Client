import { useCallback, useState } from 'react';
import { getWorkSubmissions, reviewWorkResponse } from '@/services/work.api.service';
import { useCommunityData } from './use-community-data';
import { Button } from '@/components/ui/button';
import { SkeletonRows } from '@/components/common/loading-state';

export function WorkReviews({ workId }: { workId: string }) {
  const load = useCallback(() => getWorkSubmissions(workId), [workId]);
  const { data, loading, error, refresh } = useCommunityData(load);
  const [pending, setPending] = useState('');
  const [actionError, setActionError] = useState('');
  return <section aria-label="Work submissions" className="mt-4 space-y-3 border-t pt-4">
    <div className="flex items-center justify-between"><h3 className="font-semibold">Responses</h3><Button size="sm" variant="outline" disabled={loading} onClick={refresh}>Refresh</Button></div>
    {loading && !data && <SkeletonRows rows={2} />}
    {(error || actionError) && <p role="alert" className="text-sm text-destructive">{error || actionError}</p>}
    {data?.submissions.length === 0 && <p className="text-sm text-muted-foreground">No responses yet.</p>}
    {data?.submissions.map(submission => <article key={submission._id} className="space-y-2 rounded-lg border p-3">
      <p className="font-medium">{submission.student?.name || 'Former student'} · {submission.status}</p>
      <p className="whitespace-pre-wrap break-words text-sm">{submission.response}</p>
      {submission.status === 'reviewed' ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{submission.feedback}</p> : <form className="space-y-2" onSubmit={async event => {
        event.preventDefault();
        const form = event.currentTarget;
        const feedback = String(new FormData(form).get('feedback') || '');
        setPending(submission._id); setActionError('');
        try { await reviewWorkResponse(workId, submission._id, feedback); refresh(); }
        catch (reason) { setActionError(reason instanceof Error ? reason.message : 'Unable to save feedback'); }
        finally { setPending(''); }
      }}>
        <label className="block text-sm">Feedback<textarea name="feedback" required maxLength={5000} className="workspace-textarea mt-1 min-h-20" /></label>
        <Button type="submit" size="sm" disabled={!!pending}>{pending === submission._id ? 'Saving…' : 'Review response'}</Button>
      </form>}
    </article>)}
  </section>;
}
