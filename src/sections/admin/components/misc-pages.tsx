import { listOrganizations, updateOrganization } from '@/services/organizations.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { PageSkeleton, LoadError } from '@/components/common/loading-state';
import type { AcceptedOrganization } from '@/types/api';
import { useState } from "react";
import { BarChart3, Layers, Users } from "lucide-react";
import { ChangePasswordCard } from "@/components/common/change-password-card";
import { EmptyState } from "@/components/common/empty-state";
import { DonutProgress } from "@/components/common/donut-progress";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminStudentRow, SectionRow } from "@/types/admin";

export function ReportsAdmin({ sections, students }: { sections: SectionRow[]; students: AdminStudentRow[] }) {
  const placedStudents = students.filter((student) => student.placementStatus === "Placed");
  const inProcessStudents = students.filter((student) => student.placementStatus === "In process");
  const notPlacedStudents = students.filter((student) => student.placementStatus === "Not placed");
  const placementRate = Math.round((placedStudents.length / Math.max(students.length, 1)) * 100);
  const averagePackage =
    placedStudents.length > 0
      ? (placedStudents.reduce((total, student) => total + (student.packageLpa ?? 0), 0) / placedStudents.length).toFixed(1)
      : "0";
  const companyStats = placedStudents.reduce<Record<string, { company: string; count: number; bestPackage: number }>>((acc, student) => {
    const company = student.company ?? "Unknown";
    acc[company] = acc[company] ?? { company, count: 0, bestPackage: 0 };
    acc[company].count += 1;
    acc[company].bestPackage = Math.max(acc[company].bestPackage, student.packageLpa ?? 0);
    return acc;
  }, {});

  return (
    <>
      <SectionIntro
        eyebrow="Reports"
        title="Placement statistics and student outcome tracking."
        description="Track who is placed, who is still in process, who is not placed, and how outcomes vary by section and company."
        action={
          <Button variant="outline">
            <BarChart3 className="h-4 w-4" />
            Export Placement Report
          </Button>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Placed", value: placedStudents.length, detail: `${placementRate}% placement rate`, tone: "bg-secondary/10 text-secondary" },
          { label: "In process", value: inProcessStudents.length, detail: "Interview or offer pipeline", tone: "bg-primary/10 text-primary" },
          { label: "Not placed", value: notPlacedStudents.length, detail: "Needs focused support", tone: "bg-destructive/10 text-destructive" },
          { label: "Avg package", value: `${averagePackage} LPA`, detail: "Across placed students", tone: "bg-muted text-foreground" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="p-4">
              <div className={`inline-flex rounded-lg px-3 py-2 text-sm font-semibold ${item.tone}`}>{item.label}</div>
              <p className="mt-4 text-3xl font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Section Placement View</CardTitle>
            <CardDescription>Placed and pending students by section.</CardDescription>
          </CardHeader>
          <CardContent className="grid max-w-3xl gap-3 md:grid-cols-2">
            {sections.length ? sections.map((section) => {
              const sectionStudents = students.filter((student) => student.sectionId === section.id);
              const sectionPlaced = sectionStudents.filter((student) => student.placementStatus === "Placed").length;
              const sectionRate = Math.round((sectionPlaced / Math.max(sectionStudents.length, 1)) * 100);

              return (
                <div key={section.id} className="rounded-lg border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{section.name}</p>
                    <Badge variant={sectionRate >= 60 ? "secondary" : "warning"}>{sectionRate}% placed</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {sectionPlaced} placed · {sectionStudents.length - sectionPlaced} pending/not placed
                  </p>
                  <div className="mt-3">
                    <DonutProgress value={sectionRate} label="Placement rate" size="sm" />
                  </div>
                </div>
              );
            }) : (
              <div className="md:col-span-2">
                <EmptyState icon={Layers} title="No section reports yet" description="Create sections and add students to generate placement reports." />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Company Outcomes</CardTitle>
            <CardDescription>Offers received by company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.values(companyStats).length ? Object.values(companyStats).map((item) => (
              <div key={item.company} className="rounded-lg border p-3">
                <p className="font-semibold">{item.company}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.count} offer{item.count > 1 ? "s" : ""} · Best {item.bestPackage} LPA
                </p>
              </div>
            )) : (
              <EmptyState icon={BarChart3} title="No company outcomes yet" description="Placed student outcomes will appear here when available." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <PlacementStudentList title="Placed Students" description="Offer details and package." students={placedStudents} tone="placed" />
        <PlacementStudentList title="In Process" description="Current interview pipeline." students={inProcessStudents} tone="process" />
        <PlacementStudentList title="Not Placed" description="Students needing coordinator action." students={notPlacedStudents} tone="risk" />
      </section>
    </>
  );
}

export function PlacementStudentList({
  title,
  description,
  students,
  tone,
}: {
  title: string;
  description: string;
  students: AdminStudentRow[];
  tone: "placed" | "process" | "risk";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {students.length ? students.map((student) => (
          <div key={student.id} className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold">{student.name}</p>
                <p className="text-sm text-muted-foreground">
                  {student.rollNo} · {student.section}
                </p>
              </div>
              <Badge variant={tone === "placed" ? "secondary" : tone === "risk" ? "danger" : "outline"}>{student.placementStatus}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {student.placementStatus === "Placed"
                ? `${student.company} · ${student.packageLpa} LPA · ${student.offerDate}`
                : student.placementRound}
            </p>
          </div>
        )) : (
          <EmptyState icon={Users} title={`No ${title.toLowerCase()}`} description="Matching students will appear here after placement status updates." />
        )}
      </CardContent>
    </Card>
  );
}

export function SettingsAdmin() {
  const { data, loading, error, refresh } = useCommunityData(listOrganizations);
  if (!data && loading) return <PageSkeleton label="Loading organization settings" />;
  if (!data) return <LoadError message={error} onRetry={refresh} />;
  const organization = data[0];
  return <section className="space-y-5">
    <SectionIntro eyebrow="Settings" title="Organization settings" description="Update your organization’s contact details." />
    {organization && <OrganizationSettingsForm key={organization._id} organization={organization} />}
    <ChangePasswordCard />
  </section>;
}

function OrganizationSettingsForm({ organization }: { organization: AcceptedOrganization }) {
  const [orgName, setOrgName] = useState(organization.orgName);
  const [orgEmail, setOrgEmail] = useState(organization.orgEmail);
  const [phoneNumber, setPhoneNumber] = useState(organization.phoneNumber);
  const [address, setAddress] = useState(organization.address);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  return <Card className="workspace-form-panel"><CardHeader><CardTitle>Organization details</CardTitle></CardHeader><CardContent>
    <form className="space-y-4" onSubmit={async event => {
      event.preventDefault(); setPending(true); setError(''); setMessage('');
      try { const response = await updateOrganization(organization._id, { orgName, orgEmail, phoneNumber, address }); setMessage(response.message); }
      catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update organization'); }
      finally { setPending(false); }
    }}>
      <fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Organization name<Input required value={orgName} onChange={event => setOrgName(event.target.value)} /></label>
        <label className="text-sm font-medium">Contact email<Input required type="email" value={orgEmail} onChange={event => setOrgEmail(event.target.value)} /></label>
        <label className="text-sm font-medium">Phone number<Input required type="tel" value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} /></label>
        <label className="text-sm font-medium">Address<Input required value={address} onChange={event => setAddress(event.target.value)} /></label>
        <Button type="submit" className="justify-self-start sm:col-span-2" disabled={pending}>{pending ? 'Saving…' : 'Save organization details'}</Button>
      </fieldset>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="mt-3 text-sm text-primary">{message}</p>}
    </form>
  </CardContent></Card>;
}
