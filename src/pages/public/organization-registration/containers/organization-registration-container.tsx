import { SkeletonRows, LoadError } from "@/components/common/loading-state";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FeatureChecklist } from "@/pages/public/organization-registration/components/feature-checklist";
import { RegistrationForm } from "@/pages/public/organization-registration/components/registration-form";
import { INITIAL_ORGANIZATION_REGISTRATION_FORM } from "@/pages/public/organization-registration/organization-registration.constants";
import type { OrganizationRegistrationFormValues } from "@/pages/public/organization-registration/organization-registration.types";
import { listFeatures } from "@/services/features.api.service";
import { createOrganizationRegistration } from "@/services/organization-registrations.api.service";
import type { Feature } from "@/types/api";

export function OrganizationRegistrationContainer() {
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [featuresError, setFeaturesError] = useState("");
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    [],
  );
  const [form, setForm] = useState<OrganizationRegistrationFormValues>(INITIAL_ORGANIZATION_REGISTRATION_FORM);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeFeatures = useMemo(() => features.filter((feature) => feature.isActive), [features]);

  const loadFeatures = useCallback(async () => {
    setFeaturesLoading(true); setFeaturesError("");
    try {
      const items = await listFeatures();
      setFeatures(items);
      setSelectedFeatures(items.filter((feature) => feature.enabledByDefault).map((feature) => feature._id));
    } catch (error) {
      setFeaturesError(error instanceof Error ? error.message : "Unable to load features.");
    } finally { setFeaturesLoading(false); }
  }, []);
  useEffect(() => { void loadFeatures(); }, [loadFeatures]);

  function updateField(field: keyof OrganizationRegistrationFormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const response = await createOrganizationRegistration({
        orgName: form.orgName,
        orgEmail: form.orgEmail,
        phoneNumber: form.phoneNumber,
        address: form.address,
        location: {
          country: form.country,
          state: form.state,
          city: form.city,
          postalCode: form.postalCode,
        },
        requestedFeatures: selectedFeatures,
      });
      setSuccess(response.message || "Organization registration submitted for superadmin review.");
      setForm(INITIAL_ORGANIZATION_REGISTRATION_FORM);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <RegistrationForm
        error={error}
        form={form}
        isSubmitting={isSubmitting || featuresLoading || Boolean(featuresError)}
        success={success}
        onSubmit={submitRegistration}
        onUpdateField={updateField}
      />
      {featuresLoading ? <SkeletonRows rows={6} /> : featuresError ? <LoadError message={featuresError} onRetry={() => void loadFeatures()} /> : <FeatureChecklist features={activeFeatures} selectedFeatureIds={selectedFeatures} onChange={setSelectedFeatures} />}
    </section>
  );
}
