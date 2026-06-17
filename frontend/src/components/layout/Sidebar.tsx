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
} from "lucide-react";
import { useThemeStore } from "@/stores/themeStore";
import { Button } from "@/components/ui/button";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  GitBranch,
  Activity,
  Receipt,
  Users,
  Eye,
};

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Workflow", href: "/workflow", icon: "GitBranch" },
  { label: "Activities", href: "/workflow/activities", icon: "Activity" },
  { label: "Billing & Charges", href: "/workflow/billing", icon: "Receipt" },
  { label: "Students", href: "/workflow/students", icon: "Users" },
  { label: "Preview", href: "/workflow/preview", icon: "Eye" },

];

export function Sidebar() {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore();

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
        {menuItems.map((item) => {
          const Icon = iconMap[item.icon];
          const isActive = location.pathname === item.href ||
            (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
