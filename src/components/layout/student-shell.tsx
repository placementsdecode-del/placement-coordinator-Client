import { Breadcrumbs } from '@/components/common/breadcrumbs';
import { useLearningTracker } from "@/sections/readiness/learning-tracker";
import { getMySection } from "@/services/community.api.service";
import { useCommunityData } from "@/sections/community/use-community-data";
import { NotificationCenter } from "@/sections/community/notification-center";
import type { ReactNode } from "react";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { ActionToast } from "@/components/common/action-toast";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { mobileNavItems, navItems } from "@/data/student";
import { cn } from "@/lib/utils";
import type { NavLabel } from "@/types/student";

export function StudentShell({
  activeNav,
  mobileMenuOpen,
  sidebarCollapsed,
  toastMessage,
  children,
  onChangeNav,
  onCloseMenu,
  onOpenMenu,
  onToggleSidebar,
  onLogout,
  onDismissToast,
}: {
  activeNav: NavLabel;
  mobileMenuOpen: boolean;
  sidebarCollapsed: boolean;
  toastMessage: string;
  children: ReactNode;
  onChangeNav: (nav: NavLabel) => void;
  onCloseMenu: () => void;
  onOpenMenu: () => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
  onDismissToast: () => void;
}) {
  const trackingError = useLearningTracker(activeNav);
  const { data: community } = useCommunityData(getMySection);
  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      {mobileMenuOpen ? (
        <button
          className="fixed inset-0 z-30 bg-foreground/35 backdrop-blur-[1px] lg:hidden"
          aria-label="Close navigation"
          onClick={onCloseMenu}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 max-w-[86vw] border-r bg-white transition-[width,transform] lg:translate-x-0",
          sidebarCollapsed ? "lg:w-20" : "w-72 lg:w-72",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn("flex h-16 items-center justify-between border-b px-5", sidebarCollapsed && "lg:px-2")}>
          <BrandLogo compact={sidebarCollapsed && !mobileMenuOpen} />
          <Button className="hidden lg:inline-flex" variant="ghost" size="icon" onClick={onToggleSidebar} aria-label="Minimize navigation">
            {sidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
          <Button className="lg:hidden" variant="ghost" size="icon" onClick={onCloseMenu} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <button
              key={item.label}
              aria-current={activeNav === item.label ? "page" : undefined}
              title={sidebarCollapsed ? item.label : undefined}
              className={cn(
                "group relative flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                sidebarCollapsed && "lg:justify-center lg:px-0",
                activeNav === item.label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
              onClick={() => {
                onChangeNav(item.label);
                onCloseMenu();
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className={cn("truncate", sidebarCollapsed && "lg:hidden")}>{item.label}</span>
              <span
                className={cn(
                  "pointer-events-none absolute left-[calc(100%+0.75rem)] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-md border bg-white px-3 py-2 text-sm font-medium text-foreground opacity-0 shadow-lg transition-opacity",
                  sidebarCollapsed && "lg:block lg:group-hover:opacity-100 lg:group-focus-visible:opacity-100",
                )}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      <div className={cn("transition-[padding-left]", sidebarCollapsed ? "lg:pl-20" : "lg:pl-72")}>
        <header
          className={cn(
            "fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 transition-[left] md:px-6",
            sidebarCollapsed ? "lg:left-20" : "lg:left-72",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Button className="lg:hidden" variant="outline" size="icon" onClick={onOpenMenu} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{activeNav}</h2>
              <button className="block max-w-[45vw] truncate text-left text-xs text-muted-foreground hover:text-primary sm:text-sm" onClick={() => onChangeNav("My Cohorts")}>{community ? community.section ? `${community.section.name} · ${community.section.code}` : "Section unassigned" : "View my section"}</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter onNavigate={onChangeNav} />
            <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="space-y-5 p-3 pb-28 pt-20 sm:space-y-6 sm:p-4 sm:pb-28 sm:pt-20 md:p-6 md:pt-20 lg:pb-6">{trackingError && <p role="status" className="text-sm text-amber-700">Learning-time sync failed. Check your connection.</p>}{!["Assessments", "Cohorts", "My Cohorts", "Groups", "My Groups"].includes(activeNav) && <Breadcrumbs items={[{ label: "Dashboard", onClick: activeNav !== "Dashboard" ? () => onChangeNav("Dashboard") : undefined }, ...(activeNav !== "Dashboard" ? [{ label: activeNav }] : [])]} />}{children}</div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-white px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-10px_30px_rgba(31,41,55,0.08)] lg:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileNavItems.map((item) => (
            <button
              key={item.label}
              aria-current={activeNav === item.label ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium leading-tight transition-colors",
                activeNav === item.label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
              onClick={() => onChangeNav(item.label)}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{item.label === "Placement Homework" ? "Homework" : item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <ActionToast message={toastMessage} onClose={onDismissToast} />
    </main>
  );
}
