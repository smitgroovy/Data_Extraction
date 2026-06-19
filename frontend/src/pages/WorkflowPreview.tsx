import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/features/DataTable";
import { Loader2, Database, CheckCircle2, ExternalLink, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
  const navigate = useNavigate();
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedProvider, setSavedProvider] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [providerName, setProviderName] = useState("");

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

  const handleSaveToDB = async () => {
    if (!providerName.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API}/api/preview/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: rows, providerName: providerName.trim() }),
      });
      const payload = await res.json().catch(() => ({} as any));
      if (res.ok) {
        setSavedProvider(providerName.trim());
        setDialogOpen(false);
        setProviderName("");
      } else {
        setSaveError(payload.error || "Failed to save data to database");
      }
    } catch {
      setSaveError("Could not connect to backend server");
    } finally {
      setSaving(false);
    }
  };

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
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save to Database</DialogTitle>
            <DialogDescription>
              Enter the provider name to save this data under. This will store the data in a normalized format.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="e.g. Sunrise Academy"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveToDB(); }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveToDB} disabled={saving || !providerName.trim()}>
              {saving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageHeader
        title="Preview"
        description="Consolidated view of all onboarding data"
        actions={
          savedProvider ? (
            <Button variant="outline" onClick={() => navigate("/sessions")}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View in Sessions
            </Button>
          ) : (
            <Button onClick={() => setDialogOpen(true)} disabled={rows.length === 0}>
              <Database className="mr-2 h-4 w-4" />
              Save to Database
            </Button>
          )
        }
      />

      {savedProvider && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Data saved successfully for provider "{savedProvider}"</span>
        </div>
      )}

      {saveError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {saveError}
        </div>
      )}

      <DataTable<PreviewRow>
        data={rows}
        columns={columns}
        enableSelection={false}
        searchPlaceholder="Search preview data..."
      />
    </div>
  );
}
