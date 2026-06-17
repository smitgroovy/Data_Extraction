import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { DataTable } from "@/components/features/DataTable";
import { WizardStepper } from "@/components/features/WizardStepper";
import { UploadDropzone } from "@/components/features/UploadDropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useWorkflowStore } from "@/stores/workflowStore";
import { ArrowRight, ArrowLeft, Upload, Table2, FileSpreadsheet, Loader2, AlertCircle, Terminal } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const HIDDEN_KEYS = new Set(["id", "source", "extractedAt", "recordType"]);

function fmtHeader(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

function buildColumns<T extends Record<string, any>>(data: T[]): ColumnDef<T, any>[] {
  if (data.length === 0) return [];
  return Object.keys(data[0])
    .filter((k) => !HIDDEN_KEYS.has(k))
    .map((key) => ({
      accessorKey: key,
      header: fmtHeader(key),
    }));
}

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function WorkflowActivitiesPage() {
  const navigate = useNavigate();
  const { goBack } = useWorkflowStore();
  const [showTable, setShowTable] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractResult, setExtractResult] = useState<{ success: boolean; count: number; message: string } | null>(null);
  const [extractedRecords, setExtractedRecords] = useState<any[]>([]);
  const [isPolling, setIsPolling] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch(`${API}/api/extracted/activities`);
      const data = await res.json();
      if (data.records) setExtractedRecords(data.records);
    } catch {}
  }

  useEffect(() => {
    if (showTable) fetchData();
  }, [showTable]);

  useEffect(() => {
    if (!isPolling) return;
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/api/extracted/activities`);
        const data = await res.json();
        if (data.records && data.records.length > 0) {
          if (!cancelled) {
            setExtractedRecords(data.records);
            clearInterval(interval);
            setIsPolling(false);
            setShowTable(true);
          }
        } else if (data.files && data.files.length > 0) {
          if (!cancelled) {
            setExtractResult({ success: true, count: 0, message: "Extraction complete — no records could be extracted from the file" });
            clearInterval(interval);
            setIsPolling(false);
          }
        }
      } catch {
        // keep polling
      }
    }, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isPolling]);

  const columns = useMemo(() => buildColumns(extractedRecords), [extractedRecords]);

  const handleExtract = async () => {
    if (uploadedFiles.length === 0) return;
    setExtracting(true);
    setExtractResult(null);

    try {
      const formData = new FormData();
      formData.append("file", uploadedFiles[0]);

      const res = await fetch(`${API}/api/extract/activities`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setExtractResult({ success: true, count: 0, message: data.message });
        setIsPolling(true);
      } else {
        setExtractResult({ success: false, count: 0, message: data.error || "Extraction failed" });
      }
    } catch {
      setExtractResult({ success: false, count: 0, message: "Could not connect to extraction server" });
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div>
      <WizardStepper />
      <PageHeader
        title="Activities"
        description="Upload and extract activity data"
        actions={
          <Button variant="outline" size="sm" onClick={() => setShowTable(!showTable)}>
            {showTable ? <Upload className="mr-2 h-4 w-4" /> : <Table2 className="mr-2 h-4 w-4" />}
            {showTable ? "Upload Files" : "View Table"}
          </Button>
        }
      />

      {showTable ? (
        extractedRecords.length > 0 ? (
          <DataTable<any>
            data={extractedRecords}
            columns={columns}
            searchPlaceholder="Search activities..."
          />
        ) : (
          <p className="py-12 text-center text-sm text-muted-foreground">Nothing to show. Upload a file and extract data first.</p>
        )
      ) : (
        <Card>
          <CardContent className="p-6">
            <UploadDropzone
              onFilesAdded={(files) => setUploadedFiles((prev) => [...prev, ...files])}
            />

            {extractResult && (
              <div className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm ${
                extractResult.success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
              }`}>
                {extractResult.success ? <Terminal className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                <div>
                  <span>{extractResult.message}</span>
                  {isPolling && (
                    <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      waiting for results...
                    </span>
                  )}
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && !extractResult && (
              <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                  <span>{uploadedFiles.length} file(s) ready for extraction</span>
                </div>
                <Button onClick={handleExtract} disabled={extracting}>
                  {extracting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extracting...</>
                  ) : (
                    <><Terminal className="mr-2 h-4 w-4" />Extract</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={goBack} disabled>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <Button onClick={() => navigate("/workflow/billing")}>
          Next: Billing & Charges
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
