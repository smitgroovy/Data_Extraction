import { useLocation, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  workflow: "Workflow",
  activities: "Activities",
  billing: "Billing Plans",
  students: "Students",
  preview: "Preview",

};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      {segments.map((segment, index) => {
        const path = "/" + segments.slice(0, index + 1).join("/");
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        const isLast = index === segments.length - 1;

        return (
          <span key={path} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            {isLast ? (
              <span className="text-foreground font-medium">{label}</span>
            ) : (
              <Link to={path} className="hover:text-foreground transition-colors">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
