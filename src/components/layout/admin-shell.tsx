import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { useState, type ReactNode } from "react";
import { Bell, LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { ActionToast } from "@/components/common/action-toast";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { adminNavItems } from "@/data/admin";
import { cn } from "@/lib/utils";
import type { AdminNavLabel } from "@/types/admin";

import { useNavigationDrawer } from "./use-navigation-drawer";

const navigationGroups = [
  { heading: "Overview", items: ["Dashboard", "Readiness"] },
  { heading: "Student management", items: ["Students", "Cohorts", "Groups"] },
  { heading: "Learning", items: ["Tasks", "Assessments"] },
  { heading: "Administration", items: ["Coordinators", "Settings"] },
];

export function AdminShell({
  role = "admin",
  activeNav,
  mobileMenuOpen,
  toastMessage,
  children,
  onChangeNav,
  onCloseMenu,
  onOpenMenu,
  onLogout,
  onDismissToast,
}: {
  role?: string;
  activeNav: AdminNavLabel;
  mobileMenuOpen: boolean;
  toastMessage: string;
  children: ReactNode;
  onChangeNav: (nav: AdminNavLabel) => void;
  onCloseMenu: () => void;
  onOpenMenu: () => void;
  onLogout: () => void;
  onDismissToast: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const drawer = useNavigationDrawer(mobileMenuOpen);
  return (
    <main className="workspace-shell min-h-screen overflow-x-hidden">
      {mobileMenuOpen ? (
        <button className="fixed inset-0 z-30 bg-foreground/35 backdrop-blur-[1px] lg:hidden" aria-label="Close navigation" onClick={onCloseMenu} />
      ) : null}

      <aside
        id="workspace-sidebar"
        onKeyDown={event => { if (event.key === "Escape" && mobileMenuOpen) onCloseMenu(); }}
        className={cn(
          "workspace-sidebar fixed inset-y-0 left-0 z-40 w-64 max-w-[86vw] border-r bg-white transition-[width,transform] lg:translate-x-0",
          collapsed && "lg:w-20",
          mobileMenuOpen ? "visible translate-x-0" : "invisible -translate-x-full lg:visible",
        )}
      >
        <div className={cn("flex h-16 items-center justify-between border-b px-5", collapsed && "lg:justify-center lg:px-2")}>
          <BrandLogo compact={collapsed && !mobileMenuOpen} subtitle={role === "teacher" ? "Coordinator" : "Admin"} />
          <Button ref={drawer.closeButton} className="lg:hidden" variant="ghost" size="icon" onClick={onCloseMenu} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav aria-label="Workspace navigation" className="h-[calc(100dvh-4rem)] space-y-4 overflow-y-auto p-3">
          {navigationGroups.filter(group => role !== "teacher" || group.heading !== "Administration").map(group => (
            <div key={group.heading} role="group" aria-label={group.heading} className="space-y-1">
              <p className={cn("px-3 text-xs font-semibold text-slate-300", collapsed && "lg:sr-only")}>{group.heading}</p>
              {group.items.map(label => adminNavItems.find(item => item.label === label)).map(item => item && (
                <button
                  key={item.label}
                  aria-label={item.label}
                  title={collapsed ? item.label : undefined}
                  aria-current={activeNav === item.label ? "page" : undefined}
                  className={cn("flex w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                    collapsed && "lg:justify-center lg:px-0")}
                  onClick={() => { onChangeNav(item.label); onCloseMenu(); }}
                >
                  <item.icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className={cn("transition-[padding-left]", collapsed ? "lg:pl-20" : "lg:pl-64")}>
        <header className={cn("fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 transition-[left] md:px-6", collapsed ? "lg:left-20" : "lg:left-64")}>
          <div className="flex min-w-0 items-center gap-3">
            <Button ref={drawer.trigger} className="lg:hidden" variant="outline" size="icon" onClick={onOpenMenu} aria-label="Open navigation" aria-controls="workspace-sidebar" aria-expanded={mobileMenuOpen}>
              <Menu className="h-5 w-5" />
            </Button>
            <Button className="hidden lg:inline-flex" size="icon" variant="ghost" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} aria-controls="workspace-sidebar" aria-expanded={!collapsed}>
              {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
            </Button>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{activeNav}</h2>
              <p className="hidden text-sm text-muted-foreground sm:block">{role === "teacher" ? "Faculty workspace" : "Organization admin console"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Announcements" onClick={() => onChangeNav("Tasks")}>
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className={cn("workspace-content", ["Readiness", "Students", "Assessments"].includes(activeNav) && "workspace-content-wide")}>
          {!["Assessments", "Cohorts", "My Cohorts", "Groups", "My Groups"].includes(activeNav) && <Breadcrumbs items={[{ label: "Dashboard", onClick: activeNav !== "Dashboard" ? () => onChangeNav("Dashboard") : undefined }, ...(activeNav !== "Dashboard" ? [{ label: activeNav }] : [])]} />}{children}
        </div>
      </div>

      <ActionToast message={toastMessage} onClose={onDismissToast} />
    </main>
  );
}
