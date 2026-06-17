import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  GitBranch,
  Activity,
  Receipt,
  Users,
  Eye,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
} from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  GitBranch,
  Activity,
  Receipt,
  Users,
  Eye,
};

const workflowChildren = [
  { label: "Activities", href: "/workflow/activities", icon: "Activity" },
  { label: "Billing & Charges", href: "/workflow/billing", icon: "Receipt" },
  { label: "Students", href: "/workflow/students", icon: "Users" },
  { label: "Preview", href: "/workflow/preview", icon: "Eye" },
];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();

  const workflowActive = location.pathname === "/workflow" ||
    workflowChildren.some((c) => location.pathname.startsWith(c.href));

  const [workflowOpen, setWorkflowOpen] = useState(workflowActive);

  if (!workflowOpen && workflowActive) {
    setWorkflowOpen(true);
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") return location.pathname === href;
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-background transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        {!sidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight">Onboard</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(sidebarCollapsed ? "mx-auto" : "ml-auto")}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <Link
          to="/dashboard"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            isActive("/dashboard")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          {!sidebarCollapsed && <span>Dashboard</span>}
        </Link>

        <div className="mt-1">
          <button
            onClick={() => setWorkflowOpen(!workflowOpen)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              workflowActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <GitBranch className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left">Workflow</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    workflowOpen && "rotate-180"
                  )}
                />
              </>
            )}
          </button>

          {(!sidebarCollapsed && workflowOpen) && (
            <div className="ml-2 mt-1 space-y-1 border-l pl-2">
              {workflowChildren.map((item) => {
                const Icon = iconMap[item.icon];
                const childActive = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      childActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
