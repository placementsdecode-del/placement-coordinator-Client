import { useState } from "react";
import { ClipboardList, FileText, LoaderCircle, Plus } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { FieldError } from "@/components/common/form-validation";
import { SkeletonRows } from "@/components/common/loading-state";
import { SectionIntro } from "@/components/common/section-intro";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AdminAssessment, AdminTask, SectionRow } from "@/types/admin";

export function TasksAdmin({ tasks, sections, onAddTask }: { tasks: AdminTask[]; sections: SectionRow[]; onAddTask: (task: AdminTask) => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Daily Task");
  const [assignedTo, setAssignedTo] = useState(sections[0]?.name ?? "");
  const previewTitle = title || "Untitled placement task";

  return (
    <>
      <SectionIntro
        eyebrow="Tasks"
        title="Create tasks and preview how students will receive them."
        description="Assign daily tasks, homework, reflections, or coding work to sections, groups, or selected students."
      />
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Create Task</CardTitle>
            <CardDescription>Task setup and assignment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-w-3xl space-y-3">
            <Input placeholder="Task title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={type} onChange={(event) => setType(event.target.value)}>
                <option>Daily Task</option>
                <option>Placement Homework</option>
                <option>Coding Practice</option>
                <option>Resume Review</option>
              </select>
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
                {sections.map((section) => <option key={section.id}>{section.name}</option>)}
              </select>
            </div>
            <textarea className="min-h-28 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" placeholder="Instructions, attachments, expected outcome, evaluation notes" />
            <div className="flex justify-end">
              <Button onClick={() => onAddTask({ id: crypto.randomUUID(), title: previewTitle, type, assignedTo, due: "Tomorrow, 5:00 PM", status: "Draft", submissions: 0 })}>
                Create Task
              </Button>
            </div>
            </div>
          </CardContent>
        </Card>
        <StudentTaskPreview title={previewTitle} type={type} assignedTo={assignedTo} />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Task Board</CardTitle>
          <CardDescription>Created tasks and submission progress.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.length ? tasks.map((task) => (
            <div key={task.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_140px_120px] md:items-center">
              <div>
                <p className="font-semibold">{task.title}</p>
                <p className="text-sm text-muted-foreground">{task.type} · {task.assignedTo} · {task.due}</p>
              </div>
              <Badge variant="outline">{task.status}</Badge>
              <p className="text-sm text-muted-foreground">{task.submissions} submissions</p>
            </div>
          )) : (
            <EmptyState icon={ClipboardList} title="No tasks yet" description="Create a task to assign preparation work to students." />
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function StudentTaskPreview({ title, type, assignedTo }: { title: string; type: string; assignedTo: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Preview</CardTitle>
        <CardDescription>How this task appears to assigned students.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-primary/5 p-4">
          <Badge>{type}</Badge>
          <h3 className="mt-3 text-lg font-bold">{title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{assignedTo ? `Assigned to ${assignedTo}.` : "Audience not selected."} Due date will be set during publish.</p>
        </div>
        <div className="rounded-lg border p-3 text-sm text-muted-foreground">
          Students will see instructions, attachments, comments, upload controls, and coordinator feedback after review.
        </div>
        <div className="flex justify-end">
          <Button variant="outline">Open Student View Preview</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AssessmentsAdmin({
  assessments,
  sections,
  onAddAssessment,
  onCreateValidatedAssessment,
  loading,
}: {
  assessments: AdminAssessment[];
  sections: SectionRow[];
  onAddAssessment: (assessment: AdminAssessment) => void;
  onCreateValidatedAssessment: (assessment: AdminAssessment & { questions: Array<{ id: string; type: string; text: string; options: string[]; marks: string; correctAnswer?: string }> }) => Promise<void>;
  loading: boolean;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Written Test");
  const [assignedTo, setAssignedTo] = useState(sections[0]?.name ?? "");
  const [instructions, setInstructions] = useState("");
  const [rubric, setRubric] = useState("");
  const [questionType, setQuestionType] = useState("MCQ");
  const [questionText, setQuestionText] = useState("");
  const [questionOptions, setQuestionOptions] = useState("");
  const [questionMarks, setQuestionMarks] = useState("");
  const [questions, setQuestions] = useState<Array<{ id: string; type: string; text: string; options: string[]; marks: string }>>([]);
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
      },
    ]);
    setQuestionText("");
    setQuestionMarks("");
    setQuestionOptions("");
    setErrors((current) => ({ ...current, questionText: "", questionMarks: "", questionOptions: "" }));
  }

  function validateAssessmentForm() {
    const nextErrors: Record<string, string> = {};
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
        title="Create assessments and preview the student experience before publishing."
        description="Build written tests, mock interviews, group discussions, coding rounds, and company-specific assessments."
      />
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
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
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={type} onChange={(event) => setType(event.target.value)}>
                <option>Written Test</option>
                <option>Mock Interview</option>
                <option>Group Discussion</option>
                <option>Coding Round</option>
              </select>
              <div className="space-y-1">
              <select className="h-11 w-full rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
                {sections.map((section) => <option key={section.id}>{section.name}</option>)}
                <option>Aptitude Group</option>
                <option>Interview Group</option>
              </select>
              <FieldError message={errors.assignedTo} />
              </div>
              <select className="h-11 rounded-md border bg-white px-3 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm">
                <option>60 min</option>
                <option>30 min</option>
                <option>45 min</option>
                <option>Panel slot</option>
              </select>
            </div>
            <textarea className="min-h-28 w-full rounded-md border bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring sm:text-sm" placeholder="Instructions students should read before starting" value={instructions} onChange={(event) => setInstructions(event.target.value)} />
            <FieldError message={errors.instructions} />
            <Input placeholder="Rubric or passing criteria" value={rubric} onChange={(event) => setRubric(event.target.value)} />
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
            <Button
              disabled={submitting}
              onClick={async () => {
                if (!validateAssessmentForm()) return;
                const assessment = { id: crypto.randomUUID(), title: previewTitle, type, assignedTo, duration: "60 min", instructions, rubric, status: `Draft · ${questions.length} ${questions.length === 1 ? "question" : "questions"}`, questions };
                setSubmitting(true);
                try {
                  onAddAssessment(assessment);
                  await onCreateValidatedAssessment(assessment);
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
        <AssessmentPreview title={previewTitle} type={type} assignedTo={assignedTo} instructions={instructions} rubric={rubric} questions={questions} />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Assessment Board</CardTitle>
          <CardDescription>Created assessments and publish state.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <SkeletonRows rows={3} /> : assessments.length ? assessments.map((assessment) => (
            <div key={assessment.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{assessment.title}</p>
                <Badge variant="outline">{assessment.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{assessment.type} · {assessment.assignedTo} · {assessment.duration}</p>
            </div>
          )) : (
            <EmptyState icon={FileText} title="No assessments yet" description="Create and validate an assessment before publishing it to students." />
          )}
        </CardContent>
      </Card>
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
          <p className="mt-2 text-sm text-muted-foreground">{assignedTo} · 60 min · Starts after publish</p>
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
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="outline">Preview Student Start Screen</Button>
          <Button>Publish Assessment</Button>
        </div>
      </CardContent>
    </Card>
  );
}
