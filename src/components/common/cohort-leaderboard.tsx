import { useState } from 'react';
import { getLeaderboard } from '@/services/readiness.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { InfoTip } from './info-tip';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function CohortLeaderboard() {
  const { data, error, loading, refresh } = useCommunityData(getLeaderboard); const [cohort, setCohort] = useState('');
  const rows = data?.rows.filter(r => !cohort || r.cohortIds.includes(cohort)) || [];
  return <Card><CardHeader><CardTitle>Leaderboard <InfoTip text="Ranked by average percentage using each student's best graded attempt per assessment. Ties use completed assessment count, then name. Students may have taken different assessments. Practice rooms are excluded." /></CardTitle><select aria-label="Leaderboard scope" className="h-11 rounded-md border px-3" value={cohort} onChange={e => setCohort(e.target.value)}><option value="">Organization</option>{data?.sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></CardHeader><CardContent>{error ? <p role="alert">{error} <button onClick={refresh}>Retry</button></p> : loading && !data ? <p>Loading rankings…</p> : rows.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Rank', 'Student', 'Assessments', 'Average score'].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{rows.slice(0, 50).map((r, i) => <tr key={r.id} className="border-t"><td className="p-3">{i + 1}</td><td className="p-3">{r.name}</td><td className="p-3">{r.assessments}</td><td className="p-3 font-semibold">{r.score}%</td></tr>)}</tbody></table></div> : <p className="text-sm text-muted-foreground">Rankings appear after students complete graded assessments.</p>}</CardContent></Card>;
}
