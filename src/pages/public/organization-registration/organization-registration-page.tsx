import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { OrganizationRegistrationContainer } from "@/pages/public/organization-registration/containers/organization-registration-container";

export function OrganizationRegistrationPage({ onBack }: { onBack: () => void }) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <BrandLogo subtitle="Organization Signup" />
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Login
          </Button>
        </div>
        <OrganizationRegistrationContainer />
      </div>
    </main>
  );
}
