import { useEffect, useState } from "react";
import { LoaderCircle, Plus, UserPlus } from "lucide-react";
import { FieldError, isValidEmail } from "@/components/common/form-validation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SectionRow } from "@/types/admin";

export function CreateStudentForm({
  sections,
  initialSectionId,
  embedded = false,
  onCreateStudent,
}: {
  sections: SectionRow[];
  initialSectionId?: string;
  embedded?: boolean;
  onCreateStudent: (user: {
    name: string;
    email: string;
    phoneNumber: string;
    registrationNumber: string;
    department: string;
    batch: string;
    section?: string;
    password?: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    registrationNumber: "",
    department: sections[0]?.department ?? "",
    batch: sections[0]?.batch ?? "",
    section: initialSectionId ?? sections[0]?.id ?? "",
    password: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialSection = sections.find((section) => section.id === initialSectionId);
    setForm((current) => ({
      ...current,
      department: initialSection?.department || current.department || sections[0]?.department || "",
      batch: initialSection?.batch || current.batch || sections[0]?.batch || "",
      section: initialSectionId || current.section || sections[0]?.id || "",
    }));
  }, [initialSectionId, sections]);

  const formContent = (
    <form
          className="grid max-w-5xl gap-3 md:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const nextErrors: Record<string, string> = {};
            if (!form.name.trim()) nextErrors.name = "Student name is required.";
            if (!form.email.trim()) nextErrors.email = "Student email is required.";
            else if (!isValidEmail(form.email)) nextErrors.email = "Enter a valid email address.";
            if (!form.registrationNumber.trim()) nextErrors.registrationNumber = "Registration number is required.";
            if (!form.department.trim()) nextErrors.department = "Department is required.";
            if (!form.batch.trim()) nextErrors.batch = "Batch is required.";
            if (form.password && form.password.length < 8) nextErrors.password = "Password must be at least 8 characters.";
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length) return;
            setSubmitting(true);
            try {
              await onCreateStudent({
                ...form,
                section: form.section || undefined,
                password: form.password.trim() || undefined,
              });
              setForm((current) => ({ ...current, name: "", email: "", phoneNumber: "", registrationNumber: "", password: "" }));
            } catch (error) {
              setErrors({ submit: error instanceof Error ? error.message : "Unable to save. Try again." });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="space-y-1">
            <label className="block space-y-1 text-sm font-medium">Student name
            <Input required placeholder="Student name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </label>
            <FieldError message={errors.name} />
          </div>
          <div className="space-y-1">
            <label className="block space-y-1 text-sm font-medium">Student email
            <Input required type="email" placeholder="Student email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <FieldError message={errors.email} />
          </div>
          <label className="block space-y-1 text-sm font-medium">Phone number
          <Input placeholder="Phone number" value={form.phoneNumber} onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))} />
          </label>
          <div className="space-y-1">
            <label className="block space-y-1 text-sm font-medium">Registration number
            <Input required placeholder="Registration number" value={form.registrationNumber} onChange={(event) => setForm((current) => ({ ...current, registrationNumber: event.target.value }))} />
            </label>
            <FieldError message={errors.registrationNumber} />
          </div>
          <div className="space-y-1">
            <label className="block space-y-1 text-sm font-medium">Department
            <Input required placeholder="Department" value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} />
            </label>
            <FieldError message={errors.department} />
          </div>
          <div className="space-y-1">
            <label className="block space-y-1 text-sm font-medium">Batch
            <Input required placeholder="Batch" value={form.batch} onChange={(event) => setForm((current) => ({ ...current, batch: event.target.value }))} />
            </label>
            <FieldError message={errors.batch} />
          </div>
          <select aria-label="Student section" className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}>
            <option value="">No section</option>
            {sections.map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
          </select>
          <div className="space-y-1">
            <label className="block space-y-1 text-sm font-medium">Password optional
            <Input type="password" placeholder="Password optional" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </label>
            <FieldError message={errors.password} />
          </div>
          <div className="md:col-span-4"><FieldError message={errors.submit} /></div>
          <div className="flex justify-end md:col-span-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {submitting ? "Creating..." : "Create Student"}
            </Button>
          </div>
        </form>
  );

  if (embedded) {
    return (
      <div className="rounded-lg border bg-background p-4">
        <div className="mb-3">
          <p className="font-semibold">Add Student To Section</p>
          <p className="text-sm text-muted-foreground">Create a student account directly in the selected section.</p>
        </div>
        {formContent}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Student</CardTitle>
        <CardDescription>Create a student account and assign an initial section.</CardDescription>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  );
}

export function CreateSectionForm({ onCreateSection, initialSection }: { onCreateSection: (section: SectionRow) => Promise<void>; initialSection?: SectionRow }) {
  const [name, setName] = useState(initialSection?.name ?? "");
  const [code, setCode] = useState(initialSection?.code ?? "");
  const [department, setDepartment] = useState(initialSection?.department ?? "");
  const [batch, setBatch] = useState(initialSection?.batch ?? "");
  const [academicYear, setAcademicYear] = useState(initialSection?.academicYear ?? "");
  const [description, setDescription] = useState(initialSection?.description ?? "");
  const [status, setStatus] = useState(initialSection?.status ?? "Active");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialSection ? "Edit section" : "Create section"}</CardTitle>
        <CardDescription>Define department, batch, academic year, code, and coordinator ownership.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid max-w-5xl gap-3 md:grid-cols-4"
          onSubmit={async (event) => {
            event.preventDefault();
            const sectionName = name.trim();
            const nextErrors: Record<string, string> = {};
            if (!sectionName) nextErrors.name = "Section name is required.";
            if (!code.trim()) nextErrors.code = "Section code is required.";
            if (!department.trim()) nextErrors.department = "Department is required.";
            if (!batch.trim()) nextErrors.batch = "Batch is required.";
            if (!academicYear.trim()) nextErrors.academicYear = "Academic year is required.";
            setErrors(nextErrors);
            if (Object.keys(nextErrors).length) return;
            setSubmitting(true);
            try {
              await onCreateSection({
                id: initialSection?.id ?? crypto.randomUUID(),
                name: sectionName,
                code: code.trim(),
                department,
                batch,
                academicYear: academicYear.trim(),
                students: 0,
                coordinator: "Unassigned",
                readiness: 0,
                status,
                description: description.trim(),
              });
              if (!initialSection) { setName(""); setCode(""); }
            } catch (error) {
              setErrors({ submit: error instanceof Error ? error.message : "Unable to save. Try again." });
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="space-y-1">
            <label className="block space-y-1 text-sm font-medium">Section name
            <Input placeholder="Section name" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <FieldError message={errors.name} />
          </div>
          <div className="space-y-1">
            <label className="block space-y-1 text-sm font-medium">Section code
            <Input placeholder="Section code" value={code} onChange={(event) => setCode(event.target.value)} />
            </label>
            <FieldError message={errors.code} />
          </div>
          <div className="space-y-1">
            <label className="block space-y-1 text-sm font-medium">Department
            <Input placeholder="Department" value={department} onChange={(event) => setDepartment(event.target.value)} />
            </label>
            <FieldError message={errors.department} />
          </div>
          <div className="space-y-1">
            <label className="block space-y-1 text-sm font-medium">Batch
            <Input placeholder="Batch" value={batch} onChange={(event) => setBatch(event.target.value)} />
            </label>
            <FieldError message={errors.batch} />
          </div>
          <label className="space-y-1 text-sm font-medium">Academic year *
            <Input required placeholder="2026–2027" value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
            <FieldError message={errors.academicYear} />
          </label>
          <label className="space-y-1 text-sm font-medium">Status
            <select className="h-11 w-full rounded-md border bg-white px-3" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Active</option><option>Inactive</option>
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium md:col-span-2">Description
            <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this section for?" />
          </label>
          <div className="md:col-span-4"><FieldError message={errors.submit} /></div>
          <div className="flex justify-end md:col-span-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {submitting ? "Saving..." : initialSection ? "Save changes" : "Create section"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
