import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/features/DataTable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Database, Building2, Users, Layers, Receipt } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface Provider {
  id: string;
  name: string;
  student_count: number;
  activity_count: number;
  billing_plan_count: number;
  created_at: string;
}

interface PreviewRow {
  id: string;
  student: string;
  activityName: string;
  description: string;
  category: string;
  billingPlan: string;
  billingAmount: string;
  providerName: string;
  providerId: string;
}

export default function SessionsPage() {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [records, setRecords] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/providers`);
        const data = await res.json();
        setProviders(data.providers || []);
        if (data.providers?.length > 0) {
          setSelectedProviderId(data.providers[0].id);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!selectedProviderId) return;
    async function load() {
      setLoadingData(true);
      try {
        const res = await fetch(`${API}/api/providers/${selectedProviderId}/preview`);
        const data = await res.json();
        setRecords(data.records || []);
      } finally {
        setLoadingData(false);
      }
    }
    load();
  }, [selectedProviderId]);

  const selectedProvider = providers.find((p) => p.id === selectedProviderId);

  const columns: ColumnDef<PreviewRow, any>[] = [
    { accessorKey: "student", header: "Student" },
    { accessorKey: "activityName", header: "Activity" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "billingPlan", header: "Billing Plan" },
    { accessorKey: "billingAmount", header: "Amount" },
  ];

  return (
    <div>
      <PageHeader
        title="Sessions"
        description="Select a provider to view their saved onboarding data"
      />

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : providers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No saved data yet</CardTitle>
            <CardDescription>
              Go to the Preview page and save your data to the database first.
            </CardDescription>
            <Button className="mt-4" onClick={() => navigate("/workflow/preview")}>
              Go to Preview
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="flex h-10 w-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProvider && (
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Users className="h-8 w-8 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{selectedProvider.student_count}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Layers className="h-8 w-8 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{selectedProvider.activity_count}</p>
                    <p className="text-xs text-muted-foreground">Activities</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <Receipt className="h-8 w-8 text-violet-600 shrink-0" />
                  <div>
                    <p className="text-2xl font-bold">{selectedProvider.billing_plan_count}</p>
                    <p className="text-xs text-muted-foreground">Billing Plans</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable<PreviewRow>
              data={records}
              columns={columns}
              enableSelection={false}
              searchPlaceholder="Search student data..."
            />
          )}
        </>
      )}
    </div>
  );
}
