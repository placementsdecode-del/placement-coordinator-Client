import type { ReactNode } from "react";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { ActionToast } from "@/components/common/action-toast";
import { BrandLogo } from "@/components/common/brand-logo";
import { Button } from "@/components/ui/button";
import { superAdminNavItems } from "@/data/super-admin";
import { cn } from "@/lib/utils";
import type { SuperAdminNavLabel } from "@/types/super-admin";

import { useNavigationDrawer } from "./use-navigation-drawer";

export function SuperAdminShell({
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
  activeNav: SuperAdminNavLabel;
  mobileMenuOpen: boolean;
  toastMessage: string;
  children: ReactNode;
  onChangeNav: (nav: SuperAdminNavLabel) => void;
  onCloseMenu: () => void;
  onOpenMenu: () => void;
  onLogout: () => void;
  onDismissToast: () => void;
}) {
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
          "workspace-sidebar fixed inset-y-0 left-0 z-40 w-72 max-w-[86vw] border-r bg-white transition-transform lg:translate-x-0",
          mobileMenuOpen ? "visible translate-x-0" : "invisible -translate-x-full lg:visible",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <BrandLogo subtitle="Platform" />
          <Button ref={drawer.closeButton} className="lg:hidden" variant="ghost" size="icon" onClick={onCloseMenu} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="border-b px-5 py-3">
          <p className="text-sm font-bold">Platform Console</p>
          <p className="text-xs text-muted-foreground">Super Admin</p>
        </div>
        <nav className="h-[calc(100vh-7.25rem)] space-y-1 overflow-y-auto p-3">
          {superAdminNavItems.map((item) => (
            <button
              key={item.label}
              aria-current={activeNav === item.label ? "page" : undefined}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                activeNav === item.label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
              )}
              onClick={() => {
                onChangeNav(item.label);
                onCloseMenu();
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 md:px-6 lg:left-72">
          <div className="flex min-w-0 items-center gap-3">
            <Button ref={drawer.trigger} className="lg:hidden" variant="outline" size="icon" onClick={onOpenMenu} aria-label="Open navigation" aria-controls="workspace-sidebar" aria-expanded={mobileMenuOpen}>
              <Menu className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{activeNav}</h2>
              <p className="hidden text-sm text-muted-foreground sm:block">Super admin platform control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Support" onClick={() => onChangeNav("Support")}>
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>
        <div className="workspace-content">
          {children}
        </div>
      </div>

      <ActionToast message={toastMessage} onClose={onDismissToast} />
    </main>
  );
}
