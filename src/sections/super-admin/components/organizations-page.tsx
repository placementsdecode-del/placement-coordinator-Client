import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Check, ChevronRight, LoaderCircle, Save, Search, ShieldBan, SlidersHorizontal, X } from 'lucide-react';
import { Notice, type NoticeTone } from '@/components/common/notice';
import { InfoTile } from '@/components/common/admin-primitives';
import { EmptyState } from '@/components/common/empty-state';
import { FieldError } from '@/components/common/form-validation';
import { SectionIntro } from '@/components/common/section-intro';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { isValidEmail } from '@/lib/utils';
import type { AcceptedOrganization, Feature } from '@/types/api';
import type { OrganizationRow } from '@/types/super-admin';

type OrganizationActions = {
  onUpdateDetails: (id: string, payload: Partial<AcceptedOrganization>) => Promise<void>;
  onUpdateStatus: (id: string, status: string) => Promise<void>;
  onRecoverCredentials: (registrationId: string) => Promise<void>;
};

function featureIds(organization?: AcceptedOrganization) {
  return organization?.features.map(feature => typeof feature === 'string' ? feature : feature._id) ?? [];
}

function contactForm(organization: AcceptedOrganization) {
  return {
    orgName: organization.orgName, orgEmail: organization.orgEmail, phoneNumber: organization.phoneNumber,
    country: organization.location?.country ?? '', state: organization.location?.state ?? '',
    city: organization.location?.city ?? '', postalCode: organization.location?.postalCode ?? '', address: organization.address,
  };
}

export function OrganizationsPage({ organizations, apiOrganizations, features, selectedOrg, loadError, onSelectOrg, ...actions }: OrganizationActions & {
  organizations: OrganizationRow[]; apiOrganizations: AcceptedOrganization[]; features: Feature[];
  selectedOrg: OrganizationRow | null; loadError: string; loading: boolean; onSelectOrg: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [visible, setVisible] = useState(50);
  const matching = organizations.filter(org => (status === 'all' || org.status === status) && `${org.name} ${org.region}`.toLowerCase().includes(search.trim().toLowerCase()));
  const organization = apiOrganizations.find(org => org._id === selectedOrg?.id);
  return <div className="space-y-5">
    <SectionIntro eyebrow="Organizations" title="Organizations" description="Manage institution details, feature access, and account status." />
    {loadError && <Notice tone="error">{loadError}</Notice>}
    <section className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(260px,0.7fr)_minmax(0,1.6fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="flex min-h-0 flex-col lg:max-h-[calc(100dvh-15rem)]">
        <CardHeader className="shrink-0 gap-3">
          <div><CardTitle>Organization directory</CardTitle><CardDescription>{matching.length} of {organizations.length} institutions</CardDescription></div>
          <div className="relative"><Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" aria-label="Search organizations" placeholder="Search institutions" value={search} onChange={event => { setSearch(event.target.value); setVisible(50); }} /></div>
          <select aria-label="Filter organizations by status" className="h-10 w-full rounded-md border bg-white px-3 text-sm" value={status} onChange={event => { setStatus(event.target.value); setVisible(50); }}><option value="all">All statuses</option><option value="Active">Active</option><option value="Suspended">Suspended</option></select>
        </CardHeader>
        <CardContent aria-label="Organization directory" tabIndex={0} className="panel-scroll max-h-80 space-y-2 pt-0 lg:max-h-none">
          {matching.slice(0, visible).map(org => {
            const count = featureIds(apiOrganizations.find(item => item._id === org.id)).length;
            return <button key={org.id} aria-pressed={selectedOrg?.id === org.id} aria-controls="organization-details" className={`w-full min-w-0 rounded-lg border p-3 text-left transition-colors ${selectedOrg?.id === org.id ? 'border-primary/60 bg-blue-50 ring-1 ring-primary/10' : 'bg-white hover:border-blue-300 hover:bg-slate-50'}`} onClick={() => onSelectOrg(org.id)}>
              <div className="flex items-start justify-between gap-2"><p className="min-w-0 truncate font-semibold">{org.name}</p><ChevronRight aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /></div>
              <p className="mt-1 text-xs text-muted-foreground">{org.students} students · {org.coordinators} coordinators</p>
              <div className="mt-2 flex flex-wrap items-center gap-2"><Badge variant={org.status === 'Active' ? 'secondary' : 'danger'}>{org.status}</Badge><span className="text-xs text-muted-foreground">{count} {count === 1 ? 'feature' : 'features'}</span></div>
            </button>;
          })}
          {matching.length > visible && <Button className="w-full" variant="outline" onClick={() => setVisible(count => count + 50)}>Show more organizations</Button>}
          {!matching.length && <EmptyState icon={Building2} title={organizations.length ? 'No matching institutions' : 'No organizations yet'} description={organizations.length ? 'Try another name or status.' : 'Approved registrations will appear here.'} />}
        </CardContent>
      </Card>
      {organization && selectedOrg ? <OrganizationDetails key={organization._id} organization={organization} summary={selectedOrg} features={features} {...actions} /> : <Card><CardContent className="p-6"><EmptyState icon={Building2} title="Select an organization" description="Choose an institution to manage its details and enabled features." /></CardContent></Card>}
    </section>
  </div>;
}

function OrganizationDetails({ organization, summary, features, onUpdateDetails, onUpdateStatus, onRecoverCredentials }: OrganizationActions & { organization: AcceptedOrganization; summary: OrganizationRow; features: Feature[] }) {
  const [tab, setTab] = useState<'overview' | 'contact' | 'features'>('overview');
  const [form, setForm] = useState(() => contactForm(organization));
  const [draft, setDraft] = useState(() => featureIds(organization));
  const [busy, setBusy] = useState('');
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: NoticeTone; text: string } | null>(null);
  useEffect(() => { setForm(contactForm(organization)); setDraft(featureIds(organization)); setErrors({}); }, [organization]);
  const assigned = featureIds(organization);
  const catalog = [...features, ...organization.features.filter((feature): feature is Feature => typeof feature !== 'string' && !features.some(item => item._id === feature._id))];
  const changed = [...draft].sort().join(',') !== [...assigned].sort().join(',');
  const contactChanged = JSON.stringify(form) !== JSON.stringify(contactForm(organization));
  const inactiveSelected = catalog.some(feature => !feature.isActive && draft.includes(feature._id));

  async function perform(action: string, callback: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(action); setFeedback(null);
    try { await callback(); setFeedback({ tone: 'success', text: success }); setConfirmSuspend(false); }
    catch (reason) { setFeedback({ tone: 'error', text: reason instanceof Error ? reason.message : 'Unable to save. Please try again.' }); }
    finally { setBusy(''); }
  }

  async function saveContact(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    for (const field of ['orgName', 'orgEmail', 'phoneNumber', 'address'] as const) if (!form[field].trim()) next[field] = 'This field is required.';
    if (form.orgEmail && !isValidEmail(form.orgEmail)) next.orgEmail = 'Enter a valid email address.';
    setErrors(next);
    if (Object.keys(next).length) return;
    await perform('contact', () => onUpdateDetails(organization._id, {
      orgName: form.orgName.trim(), orgEmail: form.orgEmail.trim(), phoneNumber: form.phoneNumber.trim(), address: form.address.trim(),
      location: { country: form.country.trim(), state: form.state.trim(), city: form.city.trim(), postalCode: form.postalCode.trim() },
    }), 'Organization details saved.');
  }

  return <Card id="organization-details" aria-label="Selected organization details" className="flex min-h-0 scroll-mt-20 flex-col lg:max-h-[calc(100dvh-15rem)]">
    <CardHeader className="shrink-0 border-b pb-0">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="text-xl [overflow-wrap:anywhere]">{summary.name}</CardTitle><CardDescription className="mt-1 [overflow-wrap:anywhere]">{organization.orgEmail}</CardDescription></div><Badge variant={summary.status === 'Active' ? 'secondary' : 'danger'}>{summary.status}</Badge></div>
      <nav aria-label="Organization sections" className="!mt-4 flex gap-1 overflow-x-auto">
        {(['overview', 'contact', 'features'] as const).map(item => <button key={item} disabled={!!busy} aria-pressed={tab === item} className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold capitalize ${tab === item ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`} onClick={() => { setTab(item); setFeedback(null); }}>{item === 'features' ? `Features (${assigned.length})` : item === 'contact' ? 'Contact details' : 'Overview'}</button>)}
      </nav>
    </CardHeader>
    <CardContent className="panel-scroll space-y-5 p-5" tabIndex={0} aria-label="Organization information">
      {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
      {tab === 'overview' && <>
        <div className="grid gap-3 sm:grid-cols-3"><InfoTile label="Students" value={String(summary.students)} /><InfoTile label="Coordinators" value={String(summary.coordinators)} /><InfoTile label="Active accounts" value={`${summary.usage}%`} /></div>
        <section className="rounded-xl border bg-slate-50 p-4"><h3 className="text-sm font-semibold">Enabled features</h3><div className="mt-3 flex flex-wrap gap-2">{assigned.map(id => <Badge key={id} variant="feature">{catalog.find(feature => feature._id === id)?.name ?? 'Unavailable feature'}</Badge>)}{!assigned.length && <p className="text-sm text-muted-foreground">No features assigned.</p>}</div><Button variant="outline" size="sm" className="mt-4" onClick={() => setTab('features')}><SlidersHorizontal className="h-4 w-4" />Edit enabled features</Button></section>
        <section className="space-y-3 rounded-xl border p-4"><h3 className="text-sm font-semibold">Institution contact</h3><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Phone</dt><dd className="mt-1 font-medium [overflow-wrap:anywhere]">{organization.phoneNumber || 'Not provided'}</dd></div><div><dt className="text-muted-foreground">Location</dt><dd className="mt-1 font-medium [overflow-wrap:anywhere]">{[organization.location?.city, organization.location?.state, organization.location?.country].filter(Boolean).join(', ') || 'Not provided'}</dd></div><div className="sm:col-span-2"><dt className="text-muted-foreground">Address</dt><dd className="mt-1 whitespace-pre-wrap [overflow-wrap:anywhere]">{organization.address}</dd></div></dl></section>
        {!organization.credentialsSentAt && <div className="space-y-3"><Notice tone="warning">Admin credentials have not been delivered by email. You can recover a temporary password if onboarding is still pending.</Notice><Button className="h-auto min-h-11 whitespace-normal text-left" variant="warning" disabled={!!busy} onClick={() => void perform('credentials', () => onRecoverCredentials(organization.registrationRequest), 'Credential recovery completed. Review the credentials message above.')}><ShieldBan className="h-4 w-4 shrink-0" />{busy === 'credentials' ? 'Recovering…' : 'Recover admin credentials'}</Button></div>}
        <section className="rounded-xl border p-4"><h3 className="text-sm font-semibold">Organization access</h3><p className="mb-3 mt-1 text-sm text-muted-foreground">Suspending an institution prevents its members from signing in and accessing their sessions.</p>{summary.status === 'Active' ? confirmSuspend ? <div className="space-y-3"><Notice tone="warning">Suspend {summary.name}? Students and staff will lose access until you activate the organization again.</Notice><div className="flex flex-wrap gap-2"><Button variant="destructive" disabled={!!busy} onClick={() => void perform('status', () => onUpdateStatus(organization._id, 'Suspended'), 'Organization suspended.')}><ShieldBan className="h-4 w-4" />{busy === 'status' ? 'Suspending…' : 'Confirm suspension'}</Button><Button variant="cancel" disabled={!!busy} onClick={() => setConfirmSuspend(false)}>Cancel</Button></div></div> : <Button variant="destructive" disabled={!!busy} onClick={() => setConfirmSuspend(true)}><ShieldBan className="h-4 w-4" />Suspend organization</Button> : <Button disabled={!!busy} onClick={() => void perform('status', () => onUpdateStatus(organization._id, 'Active'), 'Organization activated.')}><Check className="h-4 w-4" />{busy === 'status' ? 'Activating…' : 'Activate organization'}</Button>}</section>
      </>}
      {tab === 'contact' && <form onSubmit={saveContact} className="space-y-4">
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{([
          ['orgName', 'Organization name', 'text'], ['orgEmail', 'Organization email', 'email'], ['phoneNumber', 'Phone number', 'tel'], ['country', 'Country', 'text'], ['state', 'State', 'text'], ['city', 'City', 'text'], ['postalCode', 'Postal code', 'text'],
        ] as const).map(([field, label, type]) => <div key={field} className="min-w-0 space-y-1.5"><label htmlFor={`organization-${field}`} className="text-sm font-medium">{label}</label><Input id={`organization-${field}`} type={type} required={['orgName', 'orgEmail', 'phoneNumber'].includes(field)} aria-invalid={!!errors[field]} disabled={!!busy} value={form[field]} onChange={event => setForm(current => ({ ...current, [field]: event.target.value }))} /><FieldError message={errors[field]} /></div>)}</div>
        <div className="space-y-1.5"><label htmlFor="organization-address" className="text-sm font-medium">Address</label><textarea id="organization-address" required rows={3} className="max-h-48 min-h-24 w-full resize-y rounded-md border bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm" aria-invalid={!!errors.address} disabled={!!busy} value={form.address} onChange={event => setForm(current => ({ ...current, address: event.target.value }))} /><FieldError message={errors.address} /></div>
        <div className="flex flex-wrap items-center gap-2 border-t pt-4"><Button type="submit" disabled={!!busy || !contactChanged}>{busy === 'contact' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{busy === 'contact' ? 'Saving…' : 'Save details'}</Button><Button variant="cancel" type="button" disabled={!!busy || !contactChanged} onClick={() => { setForm(contactForm(organization)); setErrors({}); setFeedback(null); }}><X className="h-4 w-4" />Cancel changes</Button></div>
      </form>}
      {tab === 'features' && <div className="space-y-4">
        <div><h3 className="font-semibold">Enabled features</h3><p className="mt-1 text-sm text-muted-foreground">Select the features assigned to this institution, then save your changes.</p></div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Organization feature assignments">{catalog.map(feature => {
          const checked = draft.includes(feature._id);
          return <label key={feature._id} className={`flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${checked ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-700'} ${busy || (!feature.isActive && !checked) ? 'opacity-60' : 'hover:border-blue-400'}`}>
            <input type="checkbox" className="h-4 w-4 shrink-0 accent-blue-600" checked={checked} disabled={!!busy || (!feature.isActive && !checked)} onChange={event => setDraft(current => event.target.checked ? [...current, feature._id] : current.filter(id => id !== feature._id))} /><span className="min-w-0 break-words">{feature.name}{!feature.isActive && ' (inactive)'}</span>
          </label>;
        })}</div>
        {!catalog.length && <Notice tone="info">Create features in the platform Features page before assigning them.</Notice>}
        {inactiveSelected && <Notice tone="warning">Remove inactive features from this selection before saving. They cannot be newly assigned.</Notice>}
        {!draft.length && <Notice tone="warning">No features are selected. Saving will remove all assigned features from this organization.</Notice>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><p className="text-sm text-muted-foreground">{draft.length} selected{changed ? ' · Unsaved changes' : ''}</p><div className="flex flex-wrap gap-2"><Button variant="cancel" disabled={!!busy || !changed} onClick={() => { setDraft(assigned); setFeedback(null); }}><X className="h-4 w-4" />Cancel changes</Button><Button disabled={!!busy || !changed || inactiveSelected} onClick={() => void perform('features', () => onUpdateDetails(organization._id, { features: draft }), 'Enabled features saved.')}><Save className="h-4 w-4" />{busy === 'features' ? 'Saving…' : 'Save features'}</Button></div></div>
      </div>}
    </CardContent>
  </Card>;
}
