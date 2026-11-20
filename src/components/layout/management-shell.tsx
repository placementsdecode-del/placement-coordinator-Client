import { useState, type ReactNode } from "react";
import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, X, type LucideIcon } from "lucide-react";
import { ActionToast } from "@/components/common/action-toast";
import { BrandLogo } from "@/components/common/brand-logo";
import { Breadcrumbs } from "@/components/common/breadcrumbs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigationDrawer } from "./use-navigation-drawer";

type NavigationItem<Label extends string> = { label: Label; icon: LucideIcon };

export type ManagementShellProps<Label extends string> = {
  activeNav: Label;
  mobileMenuOpen: boolean;
  toastMessage: string;
  children: ReactNode;
  onChangeNav: (label: Label) => void;
  onCloseMenu: () => void;
  onOpenMenu: () => void;
  onLogout: () => void;
  onDismissToast: () => void;
};

export function ManagementShell<Label extends string>({
  activeNav, mobileMenuOpen, toastMessage, children, onChangeNav, onCloseMenu, onOpenMenu, onLogout, onDismissToast,
  subtitle, groups, home, shortcut, wide,
}: ManagementShellProps<Label> & {
  subtitle: string;
  groups: { heading: string; items: NavigationItem<Label>[] }[];
  home: Label;
  shortcut: { title: string; target: Label; icon: LucideIcon };
  wide?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const drawer = useNavigationDrawer(mobileMenuOpen);
  return <div className="workspace-shell management-workspace min-h-screen overflow-x-hidden" onKeyDown={event => {
    if (event.key === "Escape" && mobileMenuOpen) onCloseMenu();
  }}>
    {mobileMenuOpen && <button className="fixed inset-0 z-30 bg-foreground/35 backdrop-blur-[1px] lg:hidden"
      tabIndex={-1} aria-label="Dismiss navigation overlay" onClick={onCloseMenu} />}
    <aside id="workspace-sidebar" className={cn("workspace-sidebar fixed inset-y-0 left-0 z-40 w-64 max-w-[86vw] border-r transition-[width,transform] lg:translate-x-0",
      collapsed && "lg:w-20", mobileMenuOpen ? "visible translate-x-0" : "invisible -translate-x-full lg:visible")}>
      <div className={cn("flex h-16 items-center justify-between border-b px-5", collapsed && "lg:justify-center lg:px-2")}>
        <BrandLogo compact={collapsed && !mobileMenuOpen} subtitle={subtitle} />
        <Button ref={drawer.closeButton} className="shrink-0 lg:hidden" variant="ghost" size="icon" onClick={onCloseMenu} aria-label="Close navigation">
          <X aria-hidden="true" className="size-5" />
        </Button>
      </div>
      <nav aria-label="Workspace navigation" className="h-[calc(100dvh-4rem)] space-y-4 overflow-y-auto p-3">
        {groups.map(group => <div key={group.heading} role="group" aria-label={group.heading} className="space-y-1">
          <p className={cn("px-3 text-xs font-semibold text-slate-300", collapsed && "lg:sr-only")}>{group.heading}</p>
          {group.items.map(item => <button key={item.label} type="button" aria-label={item.label}
            title={collapsed ? item.label : undefined} aria-current={activeNav === item.label ? "page" : undefined}
            className={cn("flex w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
              collapsed && "lg:justify-center lg:px-0")}
            onClick={() => { onChangeNav(item.label); onCloseMenu(); }}>
            <item.icon aria-hidden="true" className="size-4 shrink-0" />
            <span className={cn("truncate", collapsed && "lg:hidden")}>{item.label}</span>
          </button>)}
        </div>)}
      </nav>
    </aside>
    <div className={cn("transition-[padding-left]", collapsed ? "lg:pl-20" : "lg:pl-64")}>
      <header className={cn("fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between gap-2 border-b bg-card px-4 transition-[left] md:px-6",
        collapsed ? "lg:left-20" : "lg:left-64")}>
        <div className="flex min-w-0 items-center gap-3">
          <Button ref={drawer.trigger} className="shrink-0 lg:hidden" variant="outline" size="icon" onClick={onOpenMenu}
            aria-label="Open navigation" aria-controls="workspace-sidebar" aria-expanded={mobileMenuOpen}>
            <Menu aria-hidden="true" className="size-5" />
          </Button>
          <Button className="hidden shrink-0 lg:inline-flex" variant="ghost" size="icon" onClick={() => setCollapsed(value => !value)}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"} aria-controls="workspace-sidebar" aria-expanded={!collapsed}>
            {collapsed ? <PanelLeftOpen aria-hidden="true" className="size-5" /> : <PanelLeftClose aria-hidden="true" className="size-5" />}
          </Button>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{activeNav}</p>
            <p className="hidden text-sm text-muted-foreground sm:block">{subtitle} workspace</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="icon" aria-label={shortcut.title} onClick={() => onChangeNav(shortcut.target)}>
            <shortcut.icon aria-hidden="true" className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout} aria-label="Logout">
            <LogOut aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </header>
      <main className={cn("workspace-content", wide && "workspace-content-wide")}>
        <Breadcrumbs items={[
          { label: home, onClick: activeNav !== home ? () => onChangeNav(home) : undefined },
          ...(activeNav !== home ? [{ label: activeNav }] : []),
        ]} />
        {children}
      </main>
    </div>
    <ActionToast message={toastMessage} onClose={onDismissToast} />
  </div>;
}
