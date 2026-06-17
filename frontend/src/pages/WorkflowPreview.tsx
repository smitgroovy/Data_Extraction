import { useMemo, useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/features/DataTable";
import { Loader2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface PreviewRow {
  id: string;
  student: string;
  activityName: string;
  description: string;
  category: string;
  billingPlan: string;
  billingAmount: string;
}

export default function WorkflowPreviewPage() {
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [actRes, billRes, stuRes] = await Promise.all([
          fetch(`${API}/api/extracted/activities`),
          fetch(`${API}/api/extracted/billing`),
          fetch(`${API}/api/extracted/students`),
        ]);
        const [actData, billData, stuData] = await Promise.all([
          actRes.json(), billRes.json(), stuRes.json(),
        ]);

        const activities = (actData.records || []) as any[];
        const billing = (billData.records || []) as any[];
        const students = (stuData.records || []) as any[];

        const actMap = new Map<string, any>();
        for (const a of activities) actMap.set(a.name, a);

        const billKey = (name: string, plan: string) => `${name}||${plan}`;
        const billMap = new Map<string, any>();
        for (const b of billing) {
          if (b.recordType === "billing" && b.name && b.billingPlan) {
            billMap.set(billKey(b.name, b.billingPlan), b);
          }
        }

        const joined: PreviewRow[] = [];
        let idx = 0;

        for (const stu of students) {
          const activity = actMap.get(stu.activityName) || {};
          const billing = billMap.get(billKey(stu.activityName, stu.billingPlan)) || {};

          joined.push({
            id: `row-${idx++}`,
            student: stu.name || "-",
            activityName: stu.activityName || "-",
            description: activity.description || "-",
            category: activity.category || "-",
            billingPlan: billing.billingPlan || stu.billingPlan || "-",
            billingAmount: billing.billingAmount != null ? `₹${billing.billingAmount}` : "-",
          });
        }

        setRows(joined);
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns = useMemo<ColumnDef<PreviewRow, any>[]>(
    () => [
      { accessorKey: "student", header: "Student" },
      { accessorKey: "activityName", header: "Activity Name" },
      { accessorKey: "description", header: "Description" },
      { accessorKey: "category", header: "Category" },
      { accessorKey: "billingPlan", header: "Billing Plan" },
      { accessorKey: "billingAmount", header: "Billing Amount" },
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Preview"
        description="Consolidated view of all onboarding data"
      />
      <DataTable<PreviewRow>
        data={rows}
        columns={columns}
        enableSelection={false}
        searchPlaceholder="Search preview data..."
      />
    </div>
  );
}
