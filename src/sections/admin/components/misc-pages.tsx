import { useState } from "react";
import { BarChart3, Layers, Plus, Send, Users } from "lucide-react";
import { ChangePasswordCard } from "@/components/common/change-password-card";
import { EmptyState } from "@/components/common/empty-state";
import { InfoTile } from "@/components/common/admin-primitives";
import { DonutProgress } from "@/components/common/donut-progress";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminStudentRow, SectionRow } from "@/types/admin";

export function AnnouncementsAdmin({ onAction, sections }: { onAction: (message: string) => void; sections: SectionRow[] }) {
  return (
    <>
      <SectionIntro
        eyebrow="Announcements"
        title="Publish placement updates to sections and groups."
        description="Send drive updates, schedule changes, preparation instructions, and deadline reminders."
        action={
          <Button onClick={() => onAction("Announcement published.")}>
            <Send className="h-4 w-4" />
            Publish
          </Button>
        }
      />
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <Input placeholder="Announcement title" />
          <textarea className="min-h-36 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" placeholder="Write announcement content" />
          <div className="grid gap-3 sm:grid-cols-3">
            <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm">
              {sections.map((section) => <option key={section.id}>{section.name}</option>)}
              <option>All Students</option>
              <option>Coding Group</option>
            </select>
            <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm">
              <option>Normal</option>
              <option>Important</option>
              <option>Urgent</option>
            </select>
            <Button onClick={() => onAction("Announcement preview opened.")}>Preview</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

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

export function GroupsAdmin({ onAction }: { onAction: (message: string) => void }) {
  return (
    <>
      <SectionIntro
        eyebrow="Groups"
        title="Create cross-section preparation groups."
        description="Groups can include students from multiple sections for aptitude, coding, interview, or company-specific support."
        action={<Button onClick={() => onAction("Group created.")}><Plus className="h-4 w-4" />New Group</Button>}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-3">
          <CardContent className="p-4 sm:p-5">
            <EmptyState icon={Users} title="No groups yet" description="Create groups after students and sections are ready." />
          </CardContent>
        </Card>
      </section>
    </>
  );
}

export function SettingsAdmin({ onAction }: { onAction: (message: string) => void }) {
  const [orgName, setOrgName] = useState("");
  const [shortName, setShortName] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [defaultDepartment, setDefaultDepartment] = useState("");
  const [studentPortalTitle, setStudentPortalTitle] = useState("");
  const [supportContact, setSupportContact] = useState("");
  const [brandColor, setBrandColor] = useState("#153E9F");

  return (
    <>
      <SectionIntro
        eyebrow="Settings"
        title="Organization profile and student portal defaults."
        description="The uploaded organization profile becomes the default branding, contact, academic year, and support information shown to students."
      />
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
            <CardDescription>These values become defaults for student accounts under this organization.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid max-w-3xl gap-3 md:grid-cols-2">
              <Input placeholder="Organization name" value={orgName} onChange={(event) => setOrgName(event.target.value)} />
              <Input placeholder="Short name" value={shortName} onChange={(event) => setShortName(event.target.value)} />
              <Input placeholder="Academic year" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
              <Input placeholder="Admin contact email" value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} />
              <Input placeholder="Default department" value={defaultDepartment} onChange={(event) => setDefaultDepartment(event.target.value)} />
              <Input placeholder="Student support contact" value={supportContact} onChange={(event) => setSupportContact(event.target.value)} />
              <Input className="md:col-span-2" placeholder="Student portal title" value={studentPortalTitle} onChange={(event) => setStudentPortalTitle(event.target.value)} />
            </div>
            <div className="grid gap-3 md:grid-cols-[140px_minmax(0,1fr)]">
              <div className="rounded-lg border bg-background p-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg text-xl font-black text-white" style={{ backgroundColor: brandColor }}>
                  {shortName.slice(0, 2).toUpperCase()}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Logo preview</p>
              </div>
              <div className="space-y-3">
                <Input placeholder="Logo file name or URL" />
                <Input placeholder="Brand color" value={brandColor} onChange={(event) => setBrandColor(event.target.value)} />
                <Button variant="outline" onClick={() => onAction("Organization logo upload selected.")}>
                  Upload Organization Logo
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => onAction("Organization profile saved and applied as student defaults.")}>
                Save Organization Defaults
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Student Default Preview</CardTitle>
            <CardDescription>What new students will inherit after login.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg text-sm font-black text-white" style={{ backgroundColor: brandColor }}>
                  {shortName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold">{studentPortalTitle}</p>
                  <p className="text-sm text-muted-foreground">{shortName} · {academicYear}</p>
                </div>
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              <InfoTile label="Default organization" value={orgName} />
              <InfoTile label="Default department owner" value={defaultDepartment} />
              <InfoTile label="Student support" value={supportContact} />
              <InfoTile label="Admin contact" value={contactEmail} />
            </div>
          </CardContent>
        </Card>
        <ChangePasswordCard />
        </div>
      </section>
    </>
  );
}
