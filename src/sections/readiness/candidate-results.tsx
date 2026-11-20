import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { scoreText } from '@/lib/utils';
import type { CohortRow, ReadinessPolicy } from '@/types/readiness';

function StudentIdentity({ student }: { student: CohortRow['student'] }) {
  return <div className="min-w-0 break-words">
    <p className="font-semibold">{student.name}</p>
    <p className="text-xs text-muted-foreground">{[student.registrationNumber, student.section?.name].filter(Boolean).join(' · ')}</p>
  </div>;
}

function ReadinessScore({ row }: { row: CohortRow }) {
  return <div className="space-y-1">
    <p className="font-semibold tabular-nums">{row.overall === null ? 'Not evaluated' : `${scoreText(row.overall)} / 10`}</p>
    <Badge variant="outline" className="font-medium">{row.status}</Badge>
  </div>;
}

function Evaluation({ row, skill, policy }: { row: CohortRow; skill: string; policy: ReadinessPolicy }) {
  const result = row.skills.find(item => item.key === skill);
  if (!result) return <span className="text-muted-foreground">Outside policy</span>;
  return <div>
    <p className="tabular-nums">{result.score === null ? 'Not evaluated' : `${scoreText(result.score)} / 10`}</p>
    <p className="text-xs text-muted-foreground">{result.recentSamples}/{policy.minSamples} recent</p>
  </div>;
}

function Eligibility({ row }: { row: CohortRow }) {
  return <div className="space-y-1">
    <Badge variant="outline" className="font-medium">{row.eligibility.status}</Badge>
    <p className="hidden break-words text-xs text-muted-foreground xl:block">{row.eligibility.reasons.slice(0, 2).join(' · ') || 'Meets policy requirements'}</p>
    {row.decision && <p className="break-words text-xs font-medium">{row.decision.decision} · {row.decision.reason}</p>}
  </div>;
}

export function CandidateResults({ rows, policy, onSelect }: {
  rows: CohortRow[];
  policy: ReadinessPolicy;
  onSelect: (studentId: string) => void;
}) {
  if (!rows.length) return <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No students match these filters.</p>;
  const action = (row: CohortRow) => <Button size="sm" variant="outline" className="gap-1 px-2" onClick={() => onSelect(row.student.id)} aria-label={`View details for ${row.student.name}`}>
    View details <ArrowRight aria-hidden="true" className="size-3.5" />
  </Button>;
  return <>
    <div className="hidden overflow-hidden rounded-xl border bg-card xl:block">
      <table className="w-full table-fixed text-left text-sm">
        <thead className="bg-muted text-xs text-muted-foreground"><tr>
          <th scope="col" className="w-[17%] px-3 py-3">Student</th>
          <th scope="col" className="w-[13%] px-3 py-3">Department / batch</th>
          <th scope="col" className="w-[17%] px-3 py-3">Readiness</th>
          <th scope="col" className="w-[12%] px-3 py-3">Coding</th>
          <th scope="col" className="w-[12%] px-3 py-3">DSA</th>
          <th scope="col" className="px-3 py-3">Eligibility</th>
          <th scope="col" className="w-40 px-3 py-3"><span className="sr-only">Actions</span></th>
        </tr></thead>
        <tbody>{rows.map(row => <tr key={row.student.id} className="border-t align-top hover:bg-muted/60 [&>td]:px-3 [&>td]:py-3">
          <td><StudentIdentity student={row.student} /></td>
          <td className="break-words">{row.student.department || '—'}<p className="text-xs text-muted-foreground">{row.student.batch || '—'}</p></td>
          <td><ReadinessScore row={row} /></td>
          <td><Evaluation row={row} policy={policy} skill="coding" /></td>
          <td><Evaluation row={row} policy={policy} skill="dsa" /></td>
          <td><Eligibility row={row} /></td>
          <td>{action(row)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <ul className="grid gap-3 md:grid-cols-2 xl:hidden">
      {rows.map(row => <li key={row.student.id} className="min-w-0 space-y-3 rounded-xl border bg-card p-4">
        <StudentIdentity student={row.student} />
        <p className="break-words text-xs text-muted-foreground">{[row.student.department, row.student.batch].filter(Boolean).join(' · ') || 'Department and batch unavailable'}</p>
        <dl className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
          <div><dt className="mb-1 text-xs text-muted-foreground">Readiness</dt><dd><ReadinessScore row={row} /></dd></div>
          <div><dt className="mb-1 text-xs text-muted-foreground">Eligibility</dt><dd><Eligibility row={row} /></dd></div>
          <div><dt className="text-xs text-muted-foreground">Coding</dt><dd><Evaluation row={row} policy={policy} skill="coding" /></dd></div>
          <div><dt className="text-xs text-muted-foreground">DSA</dt><dd><Evaluation row={row} policy={policy} skill="dsa" /></dd></div>
        </dl>
        {action(row)}
      </li>)}
    </ul>
  </>;
}
