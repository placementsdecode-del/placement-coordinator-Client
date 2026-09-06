import { CohortLeaderboard } from "@/components/common/cohort-leaderboard";
import { StudentOverview } from "@/sections/dashboard/student-overview";
import { notifyCommunityChanged } from "@/sections/community/community-events";
import { lazy, Suspense, useEffect, useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { LandingScreen } from "@/components/layout/landing-screen";
import { StudentShell } from "@/components/layout/student-shell";
import { SuperAdminShell } from "@/components/layout/super-admin-shell";
import { LoginScreen } from "@/components/layout/login-screen";
import { adminNavItems } from "@/data/admin";
import { superAdminNavItems } from "@/data/super-admin";
import { navItems } from "@/data/student";
import type { AdminNavLabel } from "@/types/admin";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/services/api-client";
import { getCurrentUser, login } from "@/services/auth.api.service";
import type { SessionUser, UserRole } from "@/types/auth";
import { toAppRole } from "@/types/auth";
import type { SuperAdminNavLabel } from "@/types/super-admin";
import type { NavLabel } from "@/types/student";

import { PageSkeleton } from "@/components/common/loading-state";

const StudentReadiness = lazy(() => import("@/sections/readiness/student-readiness").then(module => ({ default: module.StudentReadiness })));
const CoordinatorReadiness = lazy(() => import("@/sections/readiness/coordinator-readiness").then(module => ({ default: module.CoordinatorReadiness })));
const AssessmentAttempts = lazy(() => import("@/sections/readiness/assessment-attempts").then(module => ({ default: module.AssessmentAttempts })));
const MySection = lazy(() => import("@/sections/community/student-community").then(module => ({ default: module.MySection })));
const MyGroups = lazy(() => import("@/sections/community/student-community").then(module => ({ default: module.MyGroups })));
const MyAssignedWork = lazy(() => import("@/sections/community/student-community").then(module => ({ default: module.MyAssignedWork })));
const AdminSection = lazy(() => import("@/sections/admin/admin-section").then((module) => ({ default: module.AdminSection })));
const CareerRoadmapsSection = lazy(() => import("@/sections/career-roadmaps/career-roadmaps-section").then((module) => ({ default: module.CareerRoadmapsSection })));
const CodingPracticeSection = lazy(() => import("@/sections/coding-practice/coding-practice-section").then((module) => ({ default: module.CodingPracticeSection })));
const ProfileSection = lazy(() => import("@/sections/profile/profile-section").then((module) => ({ default: module.ProfileSection })));
const OrganizationRegistrationPage = lazy(() => import("@/pages/public/organization-registration").then((module) => ({ default: module.OrganizationRegistrationPage })));
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
  const aliases: Record<string, string> = { 'my-section': 'my-cohorts', sections: 'cohorts', results: 'progress', 'preparation-progress': 'progress', 'assigned-work': 'assessments', activities: 'tasks-and-activities', 'daily-tasks': 'tasks-and-activities', 'placement-homework': 'tasks-and-activities', announcements: basePath === '/student' ? 'tasks-and-activities' : 'tasks', reports: 'readiness' };
  const canonical = aliases[segment] || segment;
  return labels.find((label) => slugForNav(label) === canonical) ?? fallback;
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

  useEffect(() => {
    const sync = () => {
      setActiveNav(navFromPath('/student', navItems.map(item => item.label), 'Dashboard'));
      setActiveAdminNav(navFromPath(userRole === 'teacher' ? '/teacher' : '/admin', adminNavItems.map(item => item.label), 'Dashboard'));
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [userRole]);

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
      case "My Cohorts": return <MySection />;
      case "My Groups": return <MyGroups onChanged={notifyCommunityChanged} />;
      case "Assigned Work": return <AssessmentAttempts />;
      case "Activities":
        return <MyAssignedWork kind="activity" />;
      case "Tasks & Activities":
        return <MyAssignedWork />;
      case "Placement Homework":
        return <MyAssignedWork kind="homework" />;
      case "Study Materials":
        return <StudyMaterialsSection onAction={showToast} />;
      case "Career Roadmaps":
        return <CareerRoadmapsSection onAction={showToast} />;
      case "Coding Practice":
        return <CodingPracticeSection onAction={showToast} />;
      case "Self-Assessment":
        return <SelfAssessmentSection onLaunch={(title) => showToast(`${title} launched.`)} />;
      case "Assessments": return <AssessmentAttempts />;
      case "Progress":
        return <><StudentReadiness /><CohortLeaderboard /></>;
      case "Announcements":
        return <MyAssignedWork kind="announcement" />;
      case "Preparation Progress":
        return <><StudentReadiness /><CohortLeaderboard /></>;
      case "Profile":
        return <ProfileSection mustChangePassword={currentUser?.mustChangePassword} />;
      default:
        return <StudentOverview onNavigate={changeStudentNav} />;
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
        role={currentUser?.role}
        activeNav={activeAdminNav}
        mobileMenuOpen={mobileMenuOpen}
        toastMessage={toastMessage}
        onChangeNav={changeAdminNav}
        onCloseMenu={() => setMobileMenuOpen(false)}
        onOpenMenu={() => setMobileMenuOpen(true)}
        onLogout={logout}
        onDismissToast={() => setToastMessage("")}
      >
        <Suspense fallback={<PageSkeleton />}>{activeAdminNav === "Readiness" ? <><CoordinatorReadiness /><CohortLeaderboard /></> : <AdminSection activeNav={activeAdminNav} currentUser={currentUser} onAction={showToast} />}</Suspense>
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
