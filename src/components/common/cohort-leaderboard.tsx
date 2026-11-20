import { useCallback, useState } from 'react';
import { Trophy } from 'lucide-react';
import { getLeaderboard } from '@/services/readiness.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { InfoTip } from './info-tip';
import { SkeletonRows } from './loading-state';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const rankColors = ['bg-amber-100 text-amber-900', 'bg-slate-200 text-slate-800', 'bg-orange-100 text-orange-900'];

export function CohortLeaderboard() {
  const [cohort, setCohort] = useState('');
  const load = useCallback(async (signal: AbortSignal) => ({ ...await getLeaderboard(cohort, signal), cohort }), [cohort]);
  const { data, error, loading, refresh } = useCommunityData(load);
  const current = data?.cohort === cohort ? data : undefined;

  return <Card>
    <CardHeader className="gap-3 sm:flex-row sm:items-end sm:justify-between sm:space-y-0">
      <div className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy aria-hidden="true" className="size-5 text-primary" />Top 50 learners
          <InfoTip text="Rank uses the average percentage from each learner’s best graded attempt per assessment. Ties use completed assessment count, then name. Students may take different assessments. Practice rooms are excluded." />
        </CardTitle>
        <p className="text-sm text-muted-foreground">Ranked by average score across graded assessments.</p>
      </div>
      <label className="block max-w-56 space-y-1 text-sm font-medium">
        <span>Leaderboard scope</span>
        <select className="compact-select" value={cohort} onChange={event => setCohort(event.target.value)}>
          <option value="">Organization</option>
          {data?.sections.map(section => <option key={section._id} value={section._id}>{section.name}</option>)}
        </select>
      </label>
    </CardHeader>
    <CardContent className="space-y-3" aria-busy={loading}>
      {error && <div className="flex flex-wrap items-center gap-2">
        <p role="alert" className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" onClick={refresh}>Retry rankings</Button>
      </div>}
      {!current ? !error && <SkeletonRows rows={3} /> : current.rows.length ? (
        <table className="w-full table-fixed text-left text-sm">
          <thead className="text-xs text-muted-foreground"><tr>
            <th scope="col" className="w-12 pb-2 sm:w-16">Rank</th>
            <th scope="col" className="pb-2">Student</th>
            <th scope="col" className="hidden w-32 pb-2 pr-4 text-right sm:table-cell">Assessments</th>
            <th scope="col" className="w-16 pb-2 text-right sm:w-28">Avg. score</th>
          </tr></thead>
          <tbody>{current.rows.map((row, index) => <tr key={row.id} className="border-t hover:bg-muted/60">
            <td className="py-2.5"><span className={cn('inline-flex size-8 items-center justify-center rounded-lg text-xs font-semibold tabular-nums', rankColors[index] ?? 'bg-muted text-muted-foreground')}>{index + 1}</span></td>
            <td className="break-words py-2.5 pr-2">
              <p className="font-medium">{row.name}</p>
              <p className="text-xs text-muted-foreground">{[row.department, row.batch].filter(Boolean).join(' · ')}</p>
              <p className="text-xs text-muted-foreground sm:hidden">{row.assessments} {row.assessments === 1 ? 'assessment' : 'assessments'}</p>
            </td>
            <td className="hidden py-2.5 pr-4 text-right tabular-nums sm:table-cell">{row.assessments}</td>
            <td className="py-2.5 text-right font-semibold tabular-nums">{row.score}%</td>
          </tr>)}</tbody>
        </table>
      ) : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Rankings appear after students complete graded assessments in this scope.</p>}
    </CardContent>
  </Card>;
}
