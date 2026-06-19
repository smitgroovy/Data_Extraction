import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { BadgeProps } from "@/components/ui/badge";

const statusVariantMap: Record<string, BadgeProps["variant"]> = {
  active: "success",
  inactive: "secondary",
  pending: "warning",
  archived: "secondary",
  completed: "success",
  failed: "destructive",
  processing: "info",
  uploading: "info",
  cancelled: "secondary",
  resolved: "success",
  open: "warning",
  dismissed: "secondary",
  mapped: "success",
  unmapped: "secondary",
  conflict: "destructive",
  approved: "success",
  review: "warning",
  error: "destructive",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const safeStatus = status || "unknown";
  return (
    <Badge
      variant={statusVariantMap[safeStatus] || "default"}
      className={cn("capitalize", className)}
    >
      {safeStatus.replace("-", " ")}
    </Badge>
  );
}
