import { useState, type ReactNode } from 'react';
import type { ReadinessPolicy, ReadinessQuery, ReadinessReport } from '@/types/readiness';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { scoreText } from '@/lib/utils';
export const selectClass = 'h-11 w-full rounded-md border bg-white px-3 text-sm';
export function FilterBar({ policies, query, onChange, children }: { policies: ReadinessPolicy[]; query: ReadinessQuery; onChange: (query: ReadinessQuery) => void; children?: ReactNode }) {
  return <div className="grid gap-3 rounded-lg border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"><label className="text-sm font-medium">Target role / company<select aria-label="Target role or company" className={selectClass} value={query.policy || ''} onChange={event => onChange({ ...query, policy: event.target.value })}><option value="">Default role</option>{policies.map(policy => <option key={policy._id} value={policy._id}>{policy.label} · v{policy.version}</option>)}</select></label>
    <label className="text-sm font-medium">Evidence window<select aria-label="Evidence window" className={selectClass} value={query.months || 'custom'} onChange={event => onChange({ policy: query.policy, ...(event.target.value === 'custom' ? { from: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) } : { months: event.target.value }) })}><option value="3">3 months</option><option value="4">4 months</option><option value="6">6 months</option><option value="custom">Custom dates</option></select></label>
    {!query.months && <><label className="text-sm font-medium">From (UTC)<input aria-label="From date" type="date" className={selectClass} value={query.from || ''} onChange={event => onChange({ ...query, from: event.target.value })} /></label><label className="text-sm font-medium">To (UTC)<input aria-label="To date" type="date" className={selectClass} value={query.to || ''} onChange={event => onChange({ ...query, to: event.target.value })} /></label></>}{children}</div>;
}
export function ReadinessView({ report }: { report: ReadinessReport }) {
  const [evidenceLimit, setEvidenceLimit] = useState(10);
  const { activity } = report;
  const daily = report.daily.slice(-14);
  const maximumMinutes = Math.max(1, ...daily.map(day => day.minutes));
  const metrics = [
    { label: 'Readiness', value: report.overall === null ? 'Awaiting results' : `${scoreText(report.overall)} / 10`, detail: report.overall === null ? 'Complete graded assessments to build your score.' : report.status },
    { label: 'Active learning', value: `${activity.activeMinutes} min`, detail: `${activity.activeDays} active days` },
    { label: 'Problems solved', value: `${activity.problemsSolved} / ${activity.problemsAttempted}`, detail: `${activity.submissions} submissions` },
    { label: 'Assessments', value: String(activity.assessmentsCompleted), detail: `${activity.pendingReview} awaiting review` },
  ];
  return <div className="readiness-report space-y-5">
    <div className="readiness-metrics">
      {metrics.map((metric, index) => <Card key={metric.label} className={index === 0 ? 'border-slate-900 bg-slate-900 text-white' : ''}><CardContent className="p-5">
        <p className={`text-sm ${index === 0 ? 'text-slate-300' : 'text-muted-foreground'}`}>{metric.label}</p>
        <p className="mt-3 break-words text-2xl font-semibold tracking-tight tabular-nums">{metric.value}</p>
        <p className={`mt-2 text-sm leading-6 ${index === 0 ? 'text-slate-300' : 'text-muted-foreground'}`}>{metric.detail}</p>
      </CardContent></Card>)}
    </div>

    <Card><CardContent className="space-y-4 p-5">
      <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{report.eligibility.status}</Badge><span className="text-sm text-muted-foreground">{report.policy.label} · {report.evidenceCount} scored records</span></div>
      {report.provisional && <p className="text-sm leading-6 text-muted-foreground">Your score will become more representative as you complete assessments across the required skills.</p>}
      {report.eligibility.reasons.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm leading-6">{report.eligibility.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
      <details className="rounded-lg bg-slate-50 p-3 text-sm">
        <summary className="cursor-pointer font-medium">How this score is calculated</summary>
        <div className="mt-3 space-y-2 leading-6 text-muted-foreground"><p>{report.formula}</p><p>{report.coverage}% skill coverage · policy version {report.policy.version}.</p><p>Learning time records activity. Readiness uses graded evidence and the selected role’s requirements.</p></div>
      </details>
    </CardContent></Card>

    <section aria-label="Skill readiness" className="space-y-3">
      <h2 className="text-lg font-semibold">Skills to focus on</h2>
      <div className="readiness-skills">{report.skills.map(skill => <Card key={skill.key}><CardContent className="space-y-3 p-5">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{skill.label}</h3><span className="whitespace-nowrap text-lg font-semibold tabular-nums">{skill.score === null ? 'Not scored' : `${scoreText(skill.score)} / 10`}</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${(skill.score || 0) * 10}%` }} /></div>
        <p className="text-sm leading-6 text-muted-foreground">{skill.recommendation}</p>
        <details className="border-t pt-3 text-sm"><summary className="cursor-pointer font-medium text-primary">Evidence and requirements</summary><div className="mt-3 space-y-3 text-muted-foreground">
          <p>{skill.mandatory ? 'Required' : 'Optional'} · minimum {skill.minimum}/10 · {skill.recentSamples}/{report.policy.minSamples} recent independent evaluations.</p>
          <p>First attempt average {scoreText(skill.firstAverage)} · latest {scoreText(skill.latestAverage)}. Last evaluated {skill.lastAt?.slice(0, 10) || 'Never'}.</p>
          <div className="flex flex-wrap gap-2"><Badge variant="outline">{skill.trend}</Badge><Badge variant="outline">{skill.consistency}</Badge></div>
          <div className="readiness-difficulties">{skill.difficulties.map(item => <div key={item.difficulty} className="min-w-0 rounded-lg bg-slate-50 p-3"><p className="capitalize">{item.difficulty}</p><p className="mt-1 font-semibold text-foreground">{item.score === null ? 'Not scored' : `${scoreText(item.score)} / 10`}</p><p className="mt-1 text-xs">{item.samples} evaluations</p></div>)}</div>
        </div></details>
      </CardContent></Card>)}</div>
    </section>

    <details className="rounded-xl border bg-white p-5">
      <summary className="cursor-pointer text-base font-semibold">Learning activity and score history</summary>
      <div className="readiness-charts mt-5">
        <section className="min-w-0 rounded-lg border p-4"><h3 className="text-sm font-semibold">Readiness history</h3>
          {report.history.some(point => point.overall !== null) ? <div className="mt-4 space-y-3">{report.history.map(point => <div key={point.at} className="flex min-w-0 items-center gap-3 text-sm"><time className="shrink-0 text-muted-foreground">{point.at.slice(0, 10)}</time><div className="h-2 min-w-0 flex-1 rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{ width: `${(point.overall || 0) * 10}%` }} /></div><span className="w-10 text-right tabular-nums">{scoreText(point.overall)}</span></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Graded assessments will build your history.</p>}
        </section>
        <section className="min-w-0 rounded-lg border p-4"><h3 className="text-sm font-semibold">Last 14 recorded learning days</h3>
          {daily.length ? <div role="img" aria-label="Recorded learning minutes by day" className="mt-4 flex h-36 items-end gap-2">{daily.map(day => <div key={day.day} title={`${day.day} · ${day.minutes} min`} className="flex h-full min-w-0 flex-1 items-end"><div className="w-full rounded-t bg-indigo-400" style={{ height: `${Math.max(2, day.minutes / maximumMinutes * 100)}%` }} /></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">Your activity will appear as you study.</p>}
          <p className="mt-3 text-xs text-muted-foreground">{activity.streak} day streak · times recorded in UTC.</p>
        </section>
      </div>
    </details>

    <details className="rounded-xl border bg-white p-5">
      <summary className="cursor-pointer text-base font-semibold">Evidence records ({report.evidence.length})</summary>
      <div className="mt-4 space-y-3">
        {report.evidence.slice(0, evidenceLimit).map(item => <div key={item.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm"><div className="min-w-0"><p className="break-words font-medium">{item.title}</p><p className="mt-1 break-words text-xs text-muted-foreground">{item.skill} · {item.difficulty} · {item.at.slice(0, 10)}</p></div><span className="shrink-0 font-medium">{item.percentage === null ? 'Practice log' : `${item.score}/${item.maxScore} · ${item.percentage}%`}</span></div>)}
        {!report.evidence.length && <p className="text-sm text-muted-foreground">No evidence recorded in this window.</p>}
        {report.evidence.length > evidenceLimit && <button type="button" className="min-h-11 text-sm font-medium text-primary underline" onClick={() => setEvidenceLimit(limit => limit + 10)}>Show 10 more records</button>}
      </div>
    </details>
  </div>;
}
