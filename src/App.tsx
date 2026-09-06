import { lazy, Suspense, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { LandingScreen } from "@/components/layout/landing-screen";
import { StudentShell } from "@/components/layout/student-shell";
import { SuperAdminShell } from "@/components/layout/super-admin-shell";
import { LoginScreen } from "@/components/layout/login-screen";
import { adminNavItems } from "@/data/admin";
import { superAdminNavItems } from "@/data/super-admin";
import { initialAnnouncements, initialAssessments, initialHomework, initialTasks, navItems } from "@/data/student";
import type { AdminNavLabel } from "@/types/admin";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/services/api-client";
import { getCurrentUser, login } from "@/services/auth.api.service";
import type { SessionUser, UserRole } from "@/types/auth";
import { toAppRole } from "@/types/auth";
import type { SuperAdminNavLabel } from "@/types/super-admin";
import type { AnnouncementItem, AssessmentItem, HomeworkItem, NavLabel, TaskItem } from "@/types/student";

import { PageSkeleton } from "@/components/common/loading-state";

const AdminSection = lazy(() => import("@/sections/admin/admin-section").then((module) => ({ default: module.AdminSection })));
const ActivitiesSection = lazy(() => import("@/sections/activities/activities-section").then((module) => ({ default: module.ActivitiesSection })));
const AnnouncementsSection = lazy(() => import("@/sections/announcements/announcements-section").then((module) => ({ default: module.AnnouncementsSection })));
const AssessmentsSection = lazy(() => import("@/sections/assessments/assessments-section").then((module) => ({ default: module.AssessmentsSection })));
const CareerRoadmapsSection = lazy(() => import("@/sections/career-roadmaps/career-roadmaps-section").then((module) => ({ default: module.CareerRoadmapsSection })));
const CodingPracticeSection = lazy(() => import("@/sections/coding-practice/coding-practice-section").then((module) => ({ default: module.CodingPracticeSection })));
const DailyTasksSection = lazy(() => import("@/sections/daily-tasks/daily-tasks-section").then((module) => ({ default: module.DailyTasksSection })));
const DashboardSection = lazy(() => import("@/sections/dashboard/dashboard-section").then((module) => ({ default: module.DashboardSection })));
const HomeworkSection = lazy(() => import("@/sections/homework/homework-section").then((module) => ({ default: module.HomeworkSection })));
const PreparationProgressSection = lazy(() => import("@/sections/preparation-progress/preparation-progress-section").then((module) => ({ default: module.PreparationProgressSection })));
const ProfileSection = lazy(() => import("@/sections/profile/profile-section").then((module) => ({ default: module.ProfileSection })));
const OrganizationRegistrationPage = lazy(() => import("@/pages/public/organization-registration").then((module) => ({ default: module.OrganizationRegistrationPage })));
const ResultsSection = lazy(() => import("@/sections/results/results-section").then((module) => ({ default: module.ResultsSection })));
const SelfAssessmentSection = lazy(() => import("@/sections/self-assessment/self-assessment-section").then((module) => ({ default: module.SelfAssessmentSection })));
const StudyMaterialsSection = lazy(() => import("@/sections/study-materials/study-materials-section").then((module) => ({ default: module.StudyMaterialsSection })));
const SuperAdminSection = lazy(() => import("@/sections/super-admin/super-admin-section").then((module) => ({ default: module.SuperAdminSection })));

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

function slugForNav(label: string) {
  return label.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function navFromPath<T extends string>(basePath: string, labels: T[], fallback: T): T {
  const segment = window.location.pathname.replace(basePath, "").split("/").filter(Boolean)[0];
  if (!segment) return fallback;
  return labels.find((label) => slugForNav(label) === segment) ?? fallback;
}

function pathForNav(role: UserRole, label: string) {
  const basePath = pathForRole(role);
  if (label === "Dashboard") return basePath;
  return `${basePath}/${slugForNav(label)}`;
}

function App() {
  const initialRouteRole = roleFromPath();
  const [sessionLoading, setSessionLoading] = useState(Boolean(getAccessToken()));
  const [isLoggedIn, setIsLoggedIn] = useState(Boolean(getAccessToken()));
  const [userRole, setUserRole] = useState<UserRole>(initialRouteRole ?? "student");
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [showRegistration, setShowRegistration] = useState(window.location.pathname === "/register-organization");
  const [showLogin, setShowLogin] = useState(Boolean(initialRouteRole));
  const [activeNav, setActiveNav] = useState<NavLabel>(() => navFromPath("/student", navItems.map((item) => item.label), "Dashboard"));
  const [activeAdminNav, setActiveAdminNav] = useState<AdminNavLabel>(() => {
    const basePath = initialRouteRole === "teacher" ? "/teacher" : "/admin";
    return navFromPath(basePath, adminNavItems.map((item) => item.label), "Dashboard");
  });
  const [activeSuperAdminNav, setActiveSuperAdminNav] = useState<SuperAdminNavLabel>(() => navFromPath("/super-admin", superAdminNavItems.map((item) => item.label), "Dashboard"));
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

  useEffect(() => {
    if (!getAccessToken()) return;

    getCurrentUser()
      .then((user) => {
        const appRole = toAppRole(user.role);
        setCurrentUser({ ...user, appRole });
        setUserRole(appRole);
        setIsLoggedIn(true);
        setShowLogin(false);
        if (roleFromPath() !== appRole) {
          window.history.replaceState({}, "", pathForRole(appRole));
        }
      })
      .catch(() => {
        clearAccessToken();
        setIsLoggedIn(false);
        setCurrentUser(null);
      })
      .finally(() => setSessionLoading(false));
  }, []);

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

  async function handleLogin(email: string, password: string) {
    const response = await login(email, password);
    const appRole = toAppRole(response.user.role);
    setAccessToken(response.token);
    setCurrentUser({ ...response.user, appRole });
    setUserRole(appRole);
    setIsLoggedIn(true);
    setShowRegistration(false);
    setShowLogin(false);
    setActiveNav("Dashboard");
    setActiveAdminNav("Dashboard");
    setActiveSuperAdminNav("Dashboard");
    window.history.pushState({}, "", pathForRole(appRole));
  }

  function changeStudentNav(nav: NavLabel) {
    setActiveNav(nav);
    window.history.pushState({}, "", pathForNav("student", nav));
  }

  function changeAdminNav(nav: AdminNavLabel) {
    setActiveAdminNav(nav);
    window.history.pushState({}, "", pathForNav(userRole === "teacher" ? "teacher" : "admin", nav));
  }

  function changeSuperAdminNav(nav: SuperAdminNavLabel) {
    setActiveSuperAdminNav(nav);
    window.history.pushState({}, "", pathForNav("super-admin", nav));
  }

  function logout() {
    clearAccessToken();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setShowRegistration(false);
    setShowLogin(true);
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
        return <ProfileSection mustChangePassword={currentUser?.mustChangePassword} />;
      default:
        return <DashboardSection taskItems={taskItems} onTaskAction={handleTaskAction} />;
    }
  }

  if (sessionLoading) return <div className="mx-auto max-w-7xl p-6"><PageSkeleton label="Restoring your session" /></div>;

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

    if (showLogin) {
      return (
        <LoginScreen
          onLogin={handleLogin}
          onBack={() => setShowLogin(false)}
          onOpenRegistration={() => {
            setShowRegistration(true);
            window.history.pushState({}, "", "/register-organization");
          }}
        />
      );
    }

    return <LandingScreen onEnterDemo={() => setShowLogin(true)} />;
  }

  if (userRole === "super-admin") {
    return (
      <SuperAdminShell
        activeNav={activeSuperAdminNav}
        mobileMenuOpen={mobileMenuOpen}
        toastMessage={toastMessage}
        onChangeNav={changeSuperAdminNav}
        onCloseMenu={() => setMobileMenuOpen(false)}
        onOpenMenu={() => setMobileMenuOpen(true)}
        onLogout={logout}
        onDismissToast={() => setToastMessage("")}
      >
        <Suspense fallback={<PageSkeleton />}><SuperAdminSection activeNav={activeSuperAdminNav} onAction={showToast} /></Suspense>
      </SuperAdminShell>
    );
  }

  if (userRole === "admin" || userRole === "teacher") {
    return (
      <AdminShell
        activeNav={activeAdminNav}
        mobileMenuOpen={mobileMenuOpen}
        toastMessage={toastMessage}
        onChangeNav={changeAdminNav}
        onCloseMenu={() => setMobileMenuOpen(false)}
        onOpenMenu={() => setMobileMenuOpen(true)}
        onLogout={logout}
        onDismissToast={() => setToastMessage("")}
      >
        <Suspense fallback={<PageSkeleton />}><AdminSection activeNav={activeAdminNav} currentUser={currentUser} onAction={showToast} /></Suspense>
      </AdminShell>
    );
  }

  return (
    <StudentShell
      activeNav={activeNav}
      mobileMenuOpen={mobileMenuOpen}
      sidebarCollapsed={sidebarCollapsed}
      toastMessage={toastMessage}
      onChangeNav={changeStudentNav}
      onCloseMenu={() => setMobileMenuOpen(false)}
      onOpenMenu={() => setMobileMenuOpen(true)}
      onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
      onLogout={logout}
      onDismissToast={() => setToastMessage("")}
    >
      <Suspense key={activeNav} fallback={<PageSkeleton label={`Loading ${activeNav}`} />}>{renderSection()}</Suspense>
    </StudentShell>
  );
}

export default function Application() {
  return <Suspense fallback={<div className="mx-auto max-w-7xl p-6"><PageSkeleton /></div>}><App /></Suspense>;
}