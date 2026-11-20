import { useId, useState } from 'react';
import { CheckCircle2, CircleAlert, ClipboardList, SlidersHorizontal, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CandidateFilters, ReadinessDirectoryPage } from '@/types/readiness';
import { selectClass } from './readiness-view';

const statuses = [
  { label: 'Placement Ready', Icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-800' },
  { label: 'Almost Ready', Icon: TrendingUp, tone: 'bg-blue-50 text-blue-800' },
  { label: 'Needs Improvement', Icon: Target, tone: 'bg-amber-50 text-amber-900' },
  { label: 'Not Ready', Icon: CircleAlert, tone: 'bg-red-50 text-red-800' },
  { label: 'Insufficient Evidence', Icon: ClipboardList, tone: 'bg-slate-100 text-slate-700' },
];

export function ReadinessOverview({ counts, readiness, onSelect }: {
  counts?: ReadinessDirectoryPage['counts'];
  readiness: string;
  onSelect: (status: string) => void;
}) {
  return <section aria-labelledby="readiness-overview" className="space-y-3">
    <div>
      <h2 id="readiness-overview" className="text-lg font-semibold">Readiness overview</h2>
      <p className="text-sm text-muted-foreground">Counts cover all pages within your student scope and reflect the other candidate filters.</p>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,14rem))]">
      {statuses.map(({ label, Icon, tone }) => <button key={label} type="button"
        aria-pressed={label === readiness}
        onClick={() => onSelect(label === readiness ? '' : label)}
        className={cn('flex min-h-20 min-w-0 flex-col items-start justify-center gap-2 rounded-xl border bg-card p-3 text-left transition-colors hover:border-primary sm:p-4',
          label === readiness && 'border-primary bg-blue-50/60 ring-1 ring-primary')}>
        <span className="flex items-center gap-2">
          <span className={cn('inline-flex items-center justify-center rounded-lg p-1.5', tone)}><Icon aria-hidden="true" className="size-4" /></span>
          <span className="text-2xl font-semibold leading-none tabular-nums">{counts ? counts[label] ?? 0 : '—'}</span>
        </span>
        <span className="text-xs font-medium leading-tight sm:text-sm">{label}</span>
      </button>)}
    </div>
  </section>;
}

const eligibilityOptions = ['Eligible', 'Nearly Eligible', 'Not Eligible'];
const optionsFor = (values: string[]) => values.map(value => ({ value, label: value }));

function FilterSelect({ label, placeholder, value, options, onChange }: {
  label: string;
  placeholder: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  const id = useId();
  return <div className="min-w-0 space-y-1 text-sm font-medium">
    <label htmlFor={id}>{label}</label>
    <select id={id} className={selectClass} value={value} onChange={event => onChange(event.target.value)}>
      <option value="">{placeholder}</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </div>;
}

export function CandidateFilterPanel({ filters, data, onChange, onReset, recording }: {
  filters: CandidateFilters;
  data?: ReadinessDirectoryPage;
  onChange: (key: keyof CandidateFilters, value: string) => void;
  onReset: () => void;
  recording: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const invalidMinimum = !!filters.minimum && (Number(filters.minimum) < 0 || Number(filters.minimum) > 10);
  const active = Object.entries(filters).filter(([key, value]) => value.trim() && (key !== 'minimum' || !invalidMinimum)).length;
  return <section aria-labelledby="candidate-filters" className="space-y-3 rounded-xl border bg-slate-50/80 p-3 sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <SlidersHorizontal aria-hidden="true" className="size-4 text-primary" />
        <h2 id="candidate-filters" className="text-sm font-semibold">{recording ? 'Find students to evaluate' : 'Candidate filters'}</h2>
        {active > 0 && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900">{active} active</span>}
      </div>
      <div className="flex flex-wrap gap-1">
        <Button type="button" size="sm" variant="ghost" disabled={!active} onClick={onReset}>Reset filters</Button>
        <Button type="button" size="sm" variant="outline" className="sm:hidden" aria-expanded={expanded} aria-controls="more-candidate-filters" onClick={() => setExpanded(value => !value)}>
          {expanded ? 'Hide filters' : 'Show filters'}
        </Button>
      </div>
    </div>
    <div className="grid gap-3 sm:grid-cols-[minmax(0,18rem)_minmax(0,12rem)] xl:grid-cols-[minmax(0,18rem)_minmax(0,12rem)_minmax(0,10rem)_minmax(0,10rem)]">
      <label className="block min-w-0 space-y-1 text-sm font-medium">
        <span>Search students</span>
        <Input value={filters.search} maxLength={80} placeholder="Name or registration number" onChange={event => onChange('search', event.target.value)} />
      </label>
      <div id="more-candidate-filters" className={cn('max-sm:space-y-3 sm:contents', !expanded && 'hidden')}>
        <FilterSelect label="Readiness" placeholder="All levels" value={filters.readiness} options={optionsFor(statuses.map(({ label }) => label))} onChange={value => onChange('readiness', value)} />
        <FilterSelect label="Department" placeholder="All departments" value={filters.department} options={optionsFor(data?.departments ?? [])} onChange={value => onChange('department', value)} />
        <FilterSelect label="Batch" placeholder="All batches" value={filters.batch} options={optionsFor(data?.batches ?? [])} onChange={value => onChange('batch', value)} />
        <details className="sm:col-span-full">
          <summary className="cursor-pointer py-2 text-sm font-medium text-primary">Advanced filters{(filters.eligibility || filters.skill || filters.minimum) && ' (active)'}</summary>
          <div className="mt-2 grid gap-3 sm:grid-cols-[repeat(2,minmax(0,12rem))] xl:grid-cols-[repeat(3,minmax(0,12rem))]">
            <FilterSelect label="Eligibility" placeholder="All outcomes" value={filters.eligibility} options={optionsFor(eligibilityOptions)} onChange={value => onChange('eligibility', value)} />
            <FilterSelect label="Skill" placeholder="Any skill" value={filters.skill} options={data?.policy.skills.map(({ key, label }) => ({ value: key, label })) ?? []} onChange={value => onChange('skill', value)} />
            <label className="block min-w-0 space-y-1 text-sm font-medium">
              <span>Minimum score / 10</span>
              <Input type="number" min="0" max="10" step="any" aria-invalid={invalidMinimum || undefined} aria-describedby={invalidMinimum ? "candidate-minimum-error" : undefined} disabled={!filters.skill} value={filters.minimum} onChange={event => onChange('minimum', event.target.value)} />
              {invalidMinimum && <span id="candidate-minimum-error" className="block text-xs text-destructive">Enter a number from 0 to 10 to apply this filter.</span>}
            </label>
          </div>
        </details>
      </div>
    </div>
  </section>;
}
