import { listGroups } from '@/services/groups.api.service';
import { useCommunityData } from '@/sections/community/use-community-data';
import { AssessmentReviewQueue } from '@/sections/readiness/assessment-attempts';
import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { useState } from "react";
import { FileText, LoaderCircle, Plus } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { FieldError } from "@/components/common/form-validation";
import { SkeletonRows } from "@/components/common/loading-state";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminAssessment, SectionRow } from "@/types/admin";

export function AssessmentsAdmin({
  assessments,
  sections,
  onCreateValidatedAssessment,
  loading,
  onPublish,
}: {
  assessments: AdminAssessment[];
  sections: SectionRow[];
  onCreateValidatedAssessment: (assessment: AdminAssessment & { difficulty?: string; attemptsAllowed?: number; passingPercentage?: number; questions: Array<{ id: string; type: string; text: string; options: string[]; marks: string; correctAnswer?: string }> }) => Promise<void>;
  loading: boolean;
  onPublish: (id: string) => Promise<void>;
}) {
  const { data: groupData } = useCommunityData(listGroups);
  const [opened, setOpened] = useState("");
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState("");
  const [publishError, setPublishError] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("coding");
  const [assignedTo, setAssignedTo] = useState(sections[0]?.id ?? "");
  const [instructions, setInstructions] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [duration, setDuration] = useState("60");
  const [attemptsAllowed, setAttemptsAllowed] = useState("1");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [passingPercentage, setPassingPercentage] = useState("40");
  const [rubric, setRubric] = useState("");
  const [questionType, setQuestionType] = useState("MCQ");
  const [questionText, setQuestionText] = useState("");
  const [questionOptions, setQuestionOptions] = useState("");
  const [questionMarks, setQuestionMarks] = useState("");
  const [questions, setQuestions] = useState<Array<{ id: string; type: string; text: string; options: string[]; marks: string; correctAnswer?: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const previewTitle = title || "Untitled assessment";

  function addQuestion() {
    const text = questionText.trim();
    const nextErrors: Record<string, string> = {};
    if (!text) nextErrors.questionText = "Question text is required.";
    if (!questionMarks.trim()) nextErrors.questionMarks = "Marks are required.";
    else if (Number.isNaN(Number(questionMarks)) || Number(questionMarks) <= 0) nextErrors.questionMarks = "Marks must be a positive number.";
    if (questionType === "MCQ" && questionOptions.split(",").map((option) => option.trim()).filter(Boolean).length < 2) {
      nextErrors.questionOptions = "Add at least two comma-separated options.";
    }
    if (questionType === "MCQ" && !questionOptions.split(",").map(option => option.trim()).includes(correctAnswer.trim())) nextErrors.correctAnswer = "Choose the correct answer from the options.";
    setErrors((current) => ({ ...current, ...nextErrors }));
    if (Object.keys(nextErrors).length) return;
    setQuestions((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        type: questionType,
        text,
        options: questionOptions.split(",").map((option) => option.trim()).filter(Boolean),
        marks: questionMarks,
        correctAnswer: correctAnswer.trim(),
      },
    ]);
    setQuestionText("");
    setQuestionMarks("");
    setQuestionOptions("");
    setErrors((current) => ({ ...current, questionText: "", questionMarks: "", questionOptions: "" }));
  }

  function validateAssessmentForm() {
    const nextErrors: Record<string, string> = {};
    if (!Number.isFinite(Number(passingPercentage)) || Number(passingPercentage) < 0 || Number(passingPercentage) > 100 || !passingPercentage.trim()) nextErrors.questions = "Pass percentage must be between 0 and 100.";
    if (!type.trim()) nextErrors.title = "Assessment skill is required.";
    if (!Number.isInteger(Number(duration)) || Number(duration) < 1 || Number(duration) > 600) nextErrors.questions = "Duration must be 1–600 minutes.";
    if (!Number.isInteger(Number(attemptsAllowed)) || Number(attemptsAllowed) < 1 || Number(attemptsAllowed) > 20) nextErrors.questions = "Attempts must be 1–20.";
    if (!title.trim()) nextErrors.title = "Assessment title is required.";
    if (!assignedTo) nextErrors.assignedTo = "Select an audience.";
    if (!instructions.trim()) nextErrors.instructions = "Instructions are required.";
    if (!questions.length) nextErrors.questions = "Add at least one question before creating the assessment.";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return (
    <>
      <SectionIntro
        eyebrow="Assessments"
        title="Assessments"
        action={<Button onClick={() => { setCreating(v => !v); setOpened(""); }}>{creating ? "Close builder" : "Create assessment"}</Button>}
        description="Build written tests, mock interviews, group discussions, coding rounds, and company-specific assessments."
      />
      {!opened && <Breadcrumbs items={[{ label: "Assessments", onClick: opened ? () => setOpened("") : undefined }, ...(opened ? [{ label: assessments.find(a => a.id === opened)?.title || "Assessment" }] : [])]} />}
      {opened && <AssessmentReviewQueue key={opened} assessmentId={opened} title={assessments.find(a => a.id === opened)?.title} onBack={() => setOpened("")} />}
      {creating && <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Create Assessment</CardTitle>
            <CardDescription>Type, target audience, rules, duration, and rubric.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-w-4xl space-y-3">
            <div className="space-y-1">
              <Input placeholder="Assessment title" value={title} onChange={(event) => setTitle(event.target.value)} />
              <FieldError message={errors.title} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-medium">Assessment skill<Input aria-label="Assessment skill" placeholder="DSA, MCAT, medical entrance, competitive exams…" value={type} onChange={event => setType(event.target.value)} /></label>

              <div className="space-y-1">
              <select className="h-11 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
                <option value="">Select a cohort or group</option>
                {groupData?.groups.map(g => <option key={g._id} value={`group:${g._id}`}>Group · {g.name}</option>)}
                {sections.map((section) => <option key={section.id} value={section.id}>{section.name} · {section.code}</option>)}

              </select>
              <FieldError message={errors.assignedTo} />
              </div>

            </div>
            <textarea className="min-h-28 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" placeholder="Instructions students should read before starting" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
            <FieldError message={errors.instructions} />
            <label className="block text-sm font-medium">Pass percentage<Input type="number" min="0" max="100" value={passingPercentage} onChange={e => setPassingPercentage(e.target.value)} /></label>
            <Input placeholder="Grading rubric" maxLength={5000} value={rubric} onChange={(event) => setRubric(event.target.value)} />
            <div className="rounded-lg border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">Question Builder</p>
                <Badge variant="outline">{questions.length} {questions.length === 1 ? "question" : "questions"}</Badge>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[160px_120px_minmax(0,1fr)]">
                <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={questionType} onChange={(event) => setQuestionType(event.target.value)}>
                  <option>MCQ</option>
                  <option>Short Answer</option>
                  <option>Code Question</option>
                  <option>Interview Prompt</option>
                  <option>Group Discussion Topic</option>
                </select>
                <div className="space-y-1">
                  <Input placeholder="Marks" value={questionMarks} onChange={(event) => setQuestionMarks(event.target.value)} />
                  <FieldError message={errors.questionMarks} />
                </div>
                <div className="space-y-1">
                  <Input placeholder="Question text" value={questionText} onChange={(event) => setQuestionText(event.target.value)} />
                  <FieldError message={errors.questionText} />
                </div>
              </div>
              {questionType === "MCQ" ? (
                <div className="mt-3 space-y-1">
                  <Input placeholder="Comma-separated options" value={questionOptions} onChange={(event) => setQuestionOptions(event.target.value)} />
                  <FieldError message={errors.questionOptions} />
                </div>
              ) : null}
              {questionType === "MCQ" && <label className="block text-sm font-medium">Correct answer<Input value={correctAnswer} onChange={event => setCorrectAnswer(event.target.value)} /><FieldError message={errors.correctAnswer} /></label>}
                  <Button className="mt-3" variant="outline" onClick={addQuestion}>
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
              <div className="mt-3 space-y-2">
                {questions.map((question, index) => (
                  <div key={question.id} className="rounded-md border bg-white p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">Q{index + 1}</Badge>
                      <Badge variant="warning">{question.type}</Badge>
                      <span className="text-muted-foreground">{question.marks} marks</span>
                    </div>
                    <p className="mt-2 font-medium">{question.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-medium">Difficulty<select aria-label="Assessment difficulty" className="h-11 w-full rounded-md border bg-white px-3" value={difficulty} onChange={event => setDifficulty(event.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></label>
              <label className="text-sm font-medium">Duration (minutes)<Input type="number" min="1" max="600" value={duration} onChange={event => setDuration(event.target.value)} /></label>
              <label className="text-sm font-medium">Attempts allowed<Input type="number" min="1" max="20" value={attemptsAllowed} onChange={event => setAttemptsAllowed(event.target.value)} /></label>
            </div>
            <Button
              disabled={submitting}
              onClick={async () => {
                if (!validateAssessmentForm()) return;
                const assessment = { id: crypto.randomUUID(), title: previewTitle, type, assignedTo, duration: `${duration} min`, difficulty, attemptsAllowed: Number(attemptsAllowed), passingPercentage: Number(passingPercentage), instructions, rubric, status: `Draft · ${questions.length} ${questions.length === 1 ? "question" : "questions"}`, questions };
                setSubmitting(true);
                try {
                  await onCreateValidatedAssessment(assessment);
                  setCreating(false); setTitle(""); setQuestions([]);
                } catch (error) {
                  setErrors(current => ({ ...current, questions: error instanceof Error ? error.message : "Unable to create assessment." }));
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              {submitting ? "Validating..." : "Validate & Create Assessment"}
            </Button>
            <FieldError message={errors.questions} />
            </div>
          </CardContent>
        </Card>
        <AssessmentPreview title={previewTitle} type={type} assignedTo={sections.find(section => section.id === assignedTo)?.name || "Unassigned"} instructions={instructions} rubric={rubric} questions={questions} />
      </section>}
      {!opened && <Card>
        <CardHeader>
          <CardTitle>Assessment Board</CardTitle>
          <CardDescription>Created assessments and publish state.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {publishError && <p role="alert" className="text-destructive">{publishError}</p>}
          {loading ? <SkeletonRows rows={3} /> : assessments.length ? assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button className="text-left font-semibold hover:text-primary" onClick={() => setOpened(assessment.id)}>{assessment.title}</button>
                <Badge variant="outline">{assessment.status}</Badge>
                {assessment.status.startsWith("draft") && <Button disabled={!!publishing} onClick={async () => { setPublishing(assessment.id); setPublishError(""); try { await onPublish(assessment.id); } catch (error) { setPublishError(error instanceof Error ? error.message : "Unable to publish."); } finally { setPublishing(""); } }}>{publishing === assessment.id ? "Publishing…" : "Publish and notify"}</Button>}
              </div>
              <Button variant="outline" className="my-3 w-full" onClick={() => setOpened(assessment.id)}>Open submissions</Button>
              <p className="mt-1 text-sm text-muted-foreground">{assessment.type} · {assessment.assignedTo} · {assessment.duration}</p>
            </div>
          )) : (
            <EmptyState icon={FileText} title="No assessments yet" description="Create and validate an assessment before publishing it to students." />
          )}
        </CardContent>
      </Card>}
    </>
  );
}

export function AssessmentPreview({
  title,
  type,
  assignedTo,
  instructions,
  rubric,
  questions,
}: {
  title: string;
  type: string;
  assignedTo: string;
  instructions: string;
  rubric: string;
  questions: Array<{ id: string; type: string; text: string; options: string[]; marks: string }>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Experience Preview</CardTitle>
        <CardDescription>Review before students see it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-primary/5 p-4">
          <Badge>{type}</Badge>
          <h3 className="mt-3 text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{assignedTo} · Starts after publish</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm font-semibold">Instructions</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{instructions || "Instructions will appear here once added."}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-sm font-semibold">Rubric</p>
          <p className="mt-2 text-sm text-muted-foreground">{rubric || "Rubric details will appear here once added."}</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Question Preview</p>
            <Badge variant="outline">{questions.length} total</Badge>
          </div>
          <div className="mt-3 space-y-3">
            {questions.slice(0, 2).map((question, index) => (
              <div key={question.id} className="rounded-md bg-background p-3">
                <p className="text-sm font-medium">Q{index + 1}. {question.text}</p>
                {question.options.length ? (
                  <div className="mt-2 grid gap-2">
                    {question.options.slice(0, 4).map((option) => (
                      <div key={option} className="rounded border bg-white px-3 py-2 text-sm text-muted-foreground">{option}</div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 rounded border bg-white px-3 py-5 text-sm text-muted-foreground">Student response area</div>
                )}
              </div>
            ))}
            {!questions.length ? (
              <EmptyState icon={FileText} title="No questions yet" description="Add questions to validate and publish this assessment." />
            ) : null}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
