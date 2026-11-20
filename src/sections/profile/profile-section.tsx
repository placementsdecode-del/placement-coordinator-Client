import { useState } from 'react';
import { getCurrentUser, updateProfile } from '@/services/auth.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { ChangePasswordCard } from '@/components/common/change-password-card';
import { PageSkeleton, LoadError } from '@/components/common/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ApiUser } from '@/types/api';

export function ProfileSection({ mustChangePassword = false }: { mustChangePassword?: boolean }) {
  const { data, loading, error, refresh } = useCommunityData(getCurrentUser);
  if (!data && loading) return <PageSkeleton label="Loading your profile" />;
  if (!data) return <LoadError message={error} onRetry={refresh} />;
  return <section className="space-y-5">
    <div><h1 className="text-2xl font-semibold">Your profile</h1><p className="mt-2 text-sm text-muted-foreground">Keep your contact details, skills, and resume link ready for your coordinators.</p></div>
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card><CardHeader><CardTitle>{data.name}</CardTitle></CardHeader><CardContent className="space-y-3">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[['Email', data.email], ['Registration number', data.registrationNumber], ['Department', data.department], ['Batch', data.batch]].map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 break-words font-medium">{value || 'Unassigned'}</dd></div>)}
        </dl>
        <ProfileForm user={data} />
      </CardContent></Card>
      <ChangePasswordCard mustChangePassword={data.mustChangePassword ?? mustChangePassword} />
    </div>
  </section>;
}

function ProfileForm({ user }: { user: ApiUser }) {
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [skills, setSkills] = useState(user.skills?.join(', ') || '');
  const [resumeUrl, setResumeUrl] = useState(user.resumeUrl || '');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  return <form className="space-y-4 border-t pt-4" onSubmit={async event => {
    event.preventDefault(); setPending(true); setError(''); setMessage('');
    try {
      const result = await updateProfile({ phoneNumber, skills: skills.split(',').map(skill => skill.trim()).filter(Boolean), resumeUrl });
      setMessage(result.message);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save profile'); }
    finally { setPending(false); }
  }}>
    <fieldset disabled={pending} className="space-y-4">
      <label className="block text-sm font-medium">Phone number<Input type="tel" autoComplete="tel" maxLength={30} value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} /></label>
      <label className="block text-sm font-medium">Skills, separated by commas<Input maxLength={1800} value={skills} onChange={event => setSkills(event.target.value)} /></label>
      <label className="block text-sm font-medium">Resume link<Input type="url" placeholder="https://" maxLength={2000} value={resumeUrl} onChange={event => setResumeUrl(event.target.value)} /></label>
      <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save profile'}</Button>
    </fieldset>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="text-sm text-primary">{message}</p>}
  </form>;
}
