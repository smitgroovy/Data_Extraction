import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import DashboardPage from "@/pages/Dashboard";
import WorkflowPage from "@/pages/Workflow";
import WorkflowActivitiesPage from "@/pages/WorkflowActivities";
import WorkflowBillingPage from "@/pages/WorkflowBilling";
import WorkflowStudentsPage from "@/pages/WorkflowStudents";
import WorkflowPreviewPage from "@/pages/WorkflowPreview";


function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/workflow" element={<WorkflowPage />} />
      <Route path="/workflow/activities" element={<WorkflowActivitiesPage />} />
      <Route path="/workflow/billing" element={<WorkflowBillingPage />} />
      <Route path="/workflow/students" element={<WorkflowStudentsPage />} />
      <Route path="/workflow/preview" element={<WorkflowPreviewPage />} />

    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <AppRoutes />
      </AppShell>
    </BrowserRouter>
  );
}
