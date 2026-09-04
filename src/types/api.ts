export type ApiRoleName = "superadmin" | "admin" | "teacher" | "student";

export type ApiUser = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phoneNumber?: string;
  registrationNumber?: string;
  department?: string;
  batch?: string;
  section?: string | ApiSection | null;
  groups?: string[];
  preparationScore?: number;
  role: ApiRoleName;
  permissions?: string[];
  organization?: string | { _id: string; orgName?: string; orgEmail?: string } | null;
  mustChangePassword: boolean;
  status: "active" | "inactive";
};

export type Feature = {
  _id: string;
  key: string;
  name: string;
  description: string;
  enabledByDefault: boolean;
  isActive: boolean;
};

export type RegisterOrg = {
  _id: string;
  externalId?: string;
  orgName: string;
  orgEmail: string;
  address: string;
  phoneNumber: string;
  requestedFeatures: string[] | Feature[];
  status: "pending" | "accepted" | "rejected";
  discussionNotes?: string;
};

export type AcceptedOrganization = {
  _id: string;
  registrationRequest: string;
  orgName: string;
  orgEmail: string;
  address: string;
  phoneNumber: string;
  features: string[] | Feature[];
  adminUser?: string | ApiUser | null;
  status: "active" | "suspended";
};

export type ApiRole = {
  _id: string;
  name: ApiRoleName;
  displayName: string;
  description: string;
  organization?: string | AcceptedOrganization | null;
  permissions: string[];
  isSystem: boolean;
  isEditable: boolean;
};

export type ApiSection = {
  _id: string;
  organization: string | AcceptedOrganization;
  name: string;
  code: string;
  department: string;
  batch: string;
  academicYear: string;
  assignedTeachers: ApiUser[];
  status: "active" | "inactive";
  description: string;
};

export type ApiAssessmentQuestion = {
  id?: string;
  _id?: string;
  type: "single-choice" | "multiple-choice" | "true-false" | "short-answer" | "long-answer" | "coding" | "file-upload" | "numerical";
  text: string;
  options: string[];
  correctAnswer?: string | string[] | boolean | number | null;
  explanation?: string;
  marks: number;
  negativeMarks?: number;
};

export type ApiAssessment = {
  _id: string;
  organization: string | AcceptedOrganization;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  instructions: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  attemptsAllowed: number;
  negativeMarking: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  allowAnswerReview: boolean;
  assignedSections: ApiSection[];
  assignedTeachers: ApiUser[];
  questions: ApiAssessmentQuestion[];
  status: "draft" | "scheduled" | "active" | "completed" | "archived";
};

export type LoginResponse = {
  token: string;
  user: ApiUser;
};

export type CreateUserResponse = {
  message: string;
  user: ApiUser;
  temporaryPassword?: string;
};
