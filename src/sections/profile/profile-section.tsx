import { FileUp } from "lucide-react";
import { ChangePasswordCard } from "@/components/common/change-password-card";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileSection({ mustChangePassword = false }: { mustChangePassword?: boolean }) {
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
                --
              </div>
              <h2 className="mt-4 text-xl font-bold">Student Profile</h2>
              <p className="text-sm text-muted-foreground">Profile details will appear after API data is connected.</p>
              <Badge className="mt-3" variant="secondary">
                No readiness score yet
              </Badge>
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
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground md:col-span-2">
                No profile details available yet.
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>Profile tags visible to coordinators.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No skills available yet.
              </div>
            </CardContent>
          </Card>
          <ChangePasswordCard mustChangePassword={mustChangePassword} />
        </div>
      </section>
    </>
  );
}
