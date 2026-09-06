export type Peer = { _id: string; name: string; registrationNumber?: string };
export type CommunitySection = { _id: string; name: string; code: string; department: string; batch: string; academicYear: string; description: string; assignedTeachers: Peer[] };
export type StudentGroup = { _id: string; name: string; description: string; createdBy: Peer | null; participants: { student: Peer | null; status: 'pending' | 'accepted' | 'declined' }[] };
export type GroupInvitation = Pick<StudentGroup, '_id' | 'name' | 'description' | 'createdBy'>;
export type AppNotification = { _id: string; title: string; message: string; kind: 'invitation' | 'assessment' | 'work'; sourceId: string; read: boolean; createdAt: string; invitationStatus?: 'pending' | 'accepted' | 'declined' };
export type AssignedWork = { _id: string; title: string; instructions: string; kind: 'assessment' | 'task' | 'homework' | 'activity' | 'announcement'; status: string; durationMinutes?: number; totalMarks?: number; assignedSections?: { _id: string; name: string; code: string }[] };
