import { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { LandingScreen } from "@/components/layout/landing-screen";
import { StudentShell } from "@/components/layout/student-shell";
import { SuperAdminShell } from "@/components/layout/super-admin-shell";
import { initialAnnouncements, initialAssessments, initialHomework, initialTasks } from "@/data/student";
import { AdminSection } from "@/sections/admin/admin-section";
import { ActivitiesSection } from "@/sections/activities/activities-section";
import { AnnouncementsSection } from "@/sections/announcements/announcements-section";
import { AssessmentsSection } from "@/sections/assessments/assessments-section";
import { CareerRoadmapsSection } from "@/sections/career-roadmaps/career-roadmaps-section";
import { CodingPracticeSection } from "@/sections/coding-practice/coding-practice-section";
import { DailyTasksSection } from "@/sections/daily-tasks/daily-tasks-section";
import { DashboardSection } from "@/sections/dashboard/dashboard-section";
import { HomeworkSection } from "@/sections/homework/homework-section";
import { PreparationProgressSection } from "@/sections/preparation-progress/preparation-progress-section";
import { ProfileSection } from "@/sections/profile/profile-section";
import { OrganizationRegistrationPage } from "@/pages/public/organization-registration";
import { ResultsSection } from "@/sections/results/results-section";
import { SelfAssessmentSection } from "@/sections/self-assessment/self-assessment-section";
import { StudyMaterialsSection } from "@/sections/study-materials/study-materials-section";
import { SuperAdminSection } from "@/sections/super-admin/super-admin-section";
import type { AdminNavLabel } from "@/types/admin";
import { clearAccessToken } from "@/services/api-client";
import type { SessionUser, UserRole } from "@/types/auth";
import type { SuperAdminNavLabel } from "@/types/super-admin";
import type { AnnouncementItem, AssessmentItem, HomeworkItem, NavLabel, TaskItem } from "@/types/student";

function roleFromPath(): UserRole | null {
  const path = window.location.pathname;
  if (path.startsWith("/super-admin")) return "super-admin";
  if (path.startsWith("/teacher")) return "teacher";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/student")) return "student";
  return null;
}

function pathForRole(role: UserRole) {
  if (role === "super-admin") return "/super-admin";
  if (role === "teacher") return "/teacher";
  if (role === "admin") return "/admin";
  return "/student";
}

function App() {
  const initialRouteRole = roleFromPath();
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(initialRouteRole));
  const [userRole, setUserRole] = useState<UserRole>(initialRouteRole ?? "student");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [showRegistration, setShowRegistration] = useState(window.location.pathname === "/register-organization");
  const [activeNav, setActiveNav] = useState<NavLabel>("Dashboard");
  const [activeAdminNav, setActiveAdminNav] = useState<AdminNavLabel>("Dashboard");
  const [activeSuperAdminNav, setActiveSuperAdminNav] = useState<SuperAdminNavLabel>("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [taskItems, setTaskItems] = useState<TaskItem[]>(initialTasks);
  const [homeworkItems, setHomeworkItems] = useState<HomeworkItem[]>(initialHomework);
  const [assessmentItems, setAssessmentItems] = useState<AssessmentItem[]>(initialAssessments);
  const [announcementItems, setAnnouncementItems] = useState<AnnouncementItem[]>(initialAnnouncements);
  const [toastMessage, setToastMessage] = useState("");

  function showToast(message: string) {
    setToastMessage(message);
  }

  function handleTaskAction(title: string) {
    setTaskItems((items) =>
      items.map((item) => {
        if (item.title !== title) return item;
        if (item.status === "Not started") return { ...item, status: "In progress" };
        return { ...item, status: "Completed" };
      }),
    );
    showToast("Task status updated.");
  }

  function handleSubmitHomework(title: string) {
    setHomeworkItems((items) => items.map((item) => (item.title === title ? { ...item, status: "Submitted" } : item)));
    showToast("Homework submitted successfully.");
  }

  function handleCreateAssessment(assessment: AssessmentItem) {
    setAssessmentItems((items) => [assessment, ...items]);
    showToast("Practice assessment created.");
  }

  function handleJoinAssessment(title: string) {
    setAssessmentItems((items) => items.map((item) => (item.title === title ? { ...item, status: "Joined" } : item)));
    showToast("Assessment joined.");
  }

  function handleMarkRead() {
    setAnnouncementItems((items) => items.map((item) => ({ ...item, read: true })));
    showToast("All announcements marked read.");
  }

  function enterWorkspace(role: UserRole = "student") {
    clearAccessToken();
    setCurrentUser(null);
    setUserRole(role);
    setIsLoggedIn(true);
    setShowRegistration(false);
    setMobileMenuOpen(false);
    setActiveNav("Dashboard");
    setActiveAdminNav("Dashboard");
    setActiveSuperAdminNav("Dashboard");
    window.history.pushState({}, "", pathForRole(role));
  }

  function logout() {
    clearAccessToken();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setShowRegistration(false);
    setMobileMenuOpen(false);
    window.history.pushState({}, "", "/");
  }

  function renderSection() {
    switch (activeNav) {
      case "Activities":
        return <ActivitiesSection />;
      case "Daily Tasks":
        return <DailyTasksSection query={query} setQuery={setQuery} taskItems={taskItems} onTaskAction={handleTaskAction} />;
      case "Placement Homework":
        return <HomeworkSection homeworkItems={homeworkItems} onSubmitHomework={handleSubmitHomework} />;
      case "Study Materials":
        return <StudyMaterialsSection onAction={showToast} />;
      case "Career Roadmaps":
        return <CareerRoadmapsSection onAction={showToast} />;
      case "Coding Practice":
        return <CodingPracticeSection onAction={showToast} />;
      case "Self-Assessment":
        return <SelfAssessmentSection onLaunch={(title) => showToast(`${title} launched.`)} />;
      case "Assessments":
        return (
          <AssessmentsSection
            assessmentItems={assessmentItems}
            onCreateAssessment={handleCreateAssessment}
            onJoinAssessment={handleJoinAssessment}
          />
        );
      case "Results":
        return <ResultsSection />;
      case "Announcements":
        return <AnnouncementsSection announcementItems={announcementItems} onMarkRead={handleMarkRead} />;
      case "Preparation Progress":
        return <PreparationProgressSection />;
      case "Profile":
        return <ProfileSection />;
      default:
        return <DashboardSection taskItems={taskItems} onTaskAction={handleTaskAction} />;
    }
  }

  if (!isLoggedIn) {
    if (showRegistration) {
      return (
        <OrganizationRegistrationPage
          onBack={() => {
            setShowRegistration(false);
            window.history.pushState({}, "", "/");
          }}
        />
      );
    }

    return <LandingScreen onEnterDemo={() => enterWorkspace(roleFromPath() ?? "student")} />;
  }

  if (userRole === "super-admin") {
    return (
      <SuperAdminShell
        activeNav={activeSuperAdminNav}
        mobileMenuOpen={mobileMenuOpen}
        toastMessage={toastMessage}
        onChangeNav={setActiveSuperAdminNav}
        onCloseMenu={() => setMobileMenuOpen(false)}
        onOpenMenu={() => setMobileMenuOpen(true)}
        onLogout={logout}
        onDismissToast={() => setToastMessage("")}
      >
        <SuperAdminSection activeNav={activeSuperAdminNav} onAction={showToast} />
      </SuperAdminShell>
    );
  }

  if (userRole === "admin" || userRole === "teacher") {
    return (
      <AdminShell
        activeNav={activeAdminNav}
        mobileMenuOpen={mobileMenuOpen}
        toastMessage={toastMessage}
        onChangeNav={setActiveAdminNav}
        onCloseMenu={() => setMobileMenuOpen(false)}
        onOpenMenu={() => setMobileMenuOpen(true)}
        onLogout={logout}
        onDismissToast={() => setToastMessage("")}
      >
        <AdminSection activeNav={activeAdminNav} currentUser={currentUser} onAction={showToast} />
      </AdminShell>
    );
  }

  return (
    <StudentShell
      activeNav={activeNav}
      mobileMenuOpen={mobileMenuOpen}
      sidebarCollapsed={sidebarCollapsed}
      toastMessage={toastMessage}
      onChangeNav={setActiveNav}
      onCloseMenu={() => setMobileMenuOpen(false)}
      onOpenMenu={() => setMobileMenuOpen(true)}
      onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
      onLogout={logout}
      onDismissToast={() => setToastMessage("")}
    >
      {renderSection()}
    </StudentShell>
  );
}

export default App;
