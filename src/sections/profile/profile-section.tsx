import { Award, BookOpen, BriefcaseBusiness, Code2, FileUp, Link, Mail, Phone, Users } from "lucide-react";
import { ChangePasswordCard } from "@/components/common/change-password-card";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileSection({ mustChangePassword = false }: { mustChangePassword?: boolean }) {
  const profileRows = [
    { label: "Email", value: "riya.sharma@example.edu", icon: Mail },
    { label: "Phone", value: "+91 98765 43210", icon: Phone },
    { label: "Department", value: "Computer Science Engineering", icon: BookOpen },
    { label: "Batch", value: "2027 · Section C", icon: Users },
    { label: "Primary group", value: "Advanced Coding Group", icon: Code2 },
    { label: "Placement interest", value: "Software Development", icon: BriefcaseBusiness },
  ];

  return (
    <>
      <SectionIntro
        eyebrow="Profile"
        title="Student academic, placement, and skill profile."
        description="Keep identity, contact details, department, groups, skills, resume links, and placement preferences ready."
        action={
          <Button>
            <FileUp className="h-4 w-4" />
            Upload Resume
          </Button>
        }
      />
      <section className="grid min-w-0 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-primary text-3xl font-bold text-primary-foreground">
                RS
              </div>
              <h2 className="mt-4 text-xl font-bold">Riya Sharma</h2>
              <p className="text-sm text-muted-foreground">CSE · Section C · Roll 21CSE084</p>
              <Badge className="mt-3" variant="secondary">
                Placement Ready: 78%
              </Badge>
            </div>
            <div className="mt-6 space-y-3">
              <Button className="w-full" variant="outline">
                <Link className="h-4 w-4" />
                Portfolio Link
              </Button>
              <Button className="w-full" variant="outline">
                <Award className="h-4 w-4" />
                Certificates
              </Button>
            </div>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Details</CardTitle>
              <CardDescription>profile data.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {profileRows.map((row) => (
                <div key={row.label} className="flex gap-3 rounded-lg border p-3">
                  <row.icon className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{row.label}</p>
                    <p className="text-sm font-medium">{row.value}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Profile tags visible to coordinators.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {["React", "TypeScript", "Java", "SQL", "Data Structures", "Public Speaking"].map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </CardContent>
          </Card>
          <ChangePasswordCard mustChangePassword={mustChangePassword} />
        </div>
      </section>
    </>
  );
}
