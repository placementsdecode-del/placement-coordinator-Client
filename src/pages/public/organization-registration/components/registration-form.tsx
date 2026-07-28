import { Building2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { OrganizationRegistrationFormValues } from "@/pages/public/organization-registration/organization-registration.types";

export function RegistrationForm({
  error,
  form,
  isSubmitting,
  success,
  onSubmit,
  onUpdateField,
}: {
  error: string;
  form: OrganizationRegistrationFormValues;
  isSubmitting: boolean;
  success: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onUpdateField: (field: keyof OrganizationRegistrationFormValues, value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Building2 className="h-6 w-6 text-primary" />
          Register Organization
        </CardTitle>
        <CardDescription>Submit institution details for superadmin review.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input required placeholder="Organization ID" value={form.id} onChange={(event) => onUpdateField("id", event.target.value)} />
            <Input required placeholder="Organization name" value={form.orgName} onChange={(event) => onUpdateField("orgName", event.target.value)} />
            <Input required type="email" placeholder="Admin email" value={form.orgEmail} onChange={(event) => onUpdateField("orgEmail", event.target.value)} />
            <Input required placeholder="Phone number" value={form.phoneNumber} onChange={(event) => onUpdateField("phoneNumber", event.target.value)} />
          </div>
          <textarea
            required
            className="min-h-28 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm"
            placeholder="Address"
            value={form.address}
            onChange={(event) => onUpdateField("address", event.target.value)}
          />
          {error ? <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
          {success ? (
            <p className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 p-3 text-sm font-medium text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {success}
            </p>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Registration"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
