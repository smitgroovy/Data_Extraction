export interface Activity {
  id: string;
  providerId: string;
  name: string;
  code: string;
  description: string;
  category: string;
  status: "active" | "inactive" | "review";
  rate: number;
  unit: string;
  createdAt: string;
}

export interface BillingPlan {
  id: string;
  providerId: string;
  name: string;
  code: string;
  description: string;
  type: string;
  frequency: string;
  amount: number;
  currency: string;
  status: "active" | "inactive" | "review";
  createdAt: string;
}

export interface Student {
  id: string;
  providerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  grade: string;
  status: "active" | "inactive" | "pending";
  createdAt: string;
}

export interface ValidationIssue {
  id: string;
  providerId: string;
  type: ValidationType;
  severity: "error" | "warning" | "info";
  entityType: string;
  entityId: string;
  field: string;
  message: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: string;
}

export type ValidationType =
  | "duplicate"
  | "missing-reference"
  | "data-quality"
  | "format-error"
  | "missing-field";

export interface Upload {
  id: string;
  providerId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: UploadCategory;
  status: UploadStatus;
  progress: number;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export type UploadCategory =
  | "activity"
  | "billing"
  | "student";

export type UploadStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface WorkflowStep {
  id: string;
  label: string;
  description: string;
  route: string;
  status: "pending" | "in-progress" | "completed" | "error";
}

export interface DashboardMetrics {
  totalActivities: number;
  totalBillingPlans: number;
  totalStudents: number;
  validationErrors: number;
  pendingReviews: number;
  workflowCompletion: number;
  totalUploads: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  secondary?: number;
}

export type ThemeMode = "light" | "dark";

export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}
