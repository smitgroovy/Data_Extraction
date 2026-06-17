import type { WorkflowStep } from "@/types";

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "activities",
    label: "Activities",
    description: "Upload and review activity data",
    route: "/workflow/activities",
    status: "pending",
  },
  {
    id: "billing",
    label: "Billing & Charges",
    description: "Upload and review billing plans and charges",
    route: "/workflow/billing",
    status: "pending",
  },
  {
    id: "students",
    label: "Students",
    description: "Upload and review student data",
    route: "/workflow/students",
    status: "pending",
  },
  {
    id: "preview",
    label: "Preview",
    description: "Preview all data before final submission",
    route: "/workflow/preview",
    status: "pending",
  },
];

export const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Workflow", href: "/workflow", icon: "GitBranch" },
  { label: "Activities", href: "/workflow/activities", icon: "Activity" },
  { label: "Billing & Charges", href: "/workflow/billing", icon: "Receipt" },
  { label: "Students", href: "/workflow/students", icon: "Users" },
  { label: "Preview", href: "/workflow/preview", icon: "Eye" },

];

export const FILE_ACCEPT_TYPES = {
  "application/pdf": [".pdf"],
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "application/vnd.ms-excel": [".xls"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};

export const UPLOAD_CATEGORIES = [
  { value: "activity", label: "Activity Data" },
  { value: "billing", label: "Billing Plans" },
  { value: "student", label: "Student Data" },
] as const;

export const MOCK_ACTIVITIES: import("@/types").Activity[] = [
  { id: "a1", providerId: "p1", name: "Mathematics Tutoring", code: "MT-101", description: "One-on-one math tutoring sessions", category: "Academic", status: "active", rate: 45, unit: "hour", createdAt: "2026-03-01" },
  { id: "a2", providerId: "p1", name: "Reading Intervention", code: "RI-102", description: "Structured reading program", category: "Literacy", status: "active", rate: 50, unit: "hour", createdAt: "2026-03-01" },
  { id: "a3", providerId: "p2", name: "STEM Workshop", code: "SW-201", description: "Hands-on science activities", category: "STEM", status: "active", rate: 35, unit: "session", createdAt: "2026-03-15" },
  { id: "a4", providerId: "p2", name: "Counseling Session", code: "CS-202", description: "Individual counseling", category: "Wellness", status: "review", rate: 75, unit: "hour", createdAt: "2026-04-01" },
  { id: "a5", providerId: "p3", name: "ESL Classes", code: "EC-301", description: "English as Second Language", category: "Language", status: "active", rate: 25, unit: "hour", createdAt: "2026-04-10" },
];

export const MOCK_BILLING_PLANS: import("@/types").BillingPlan[] = [
  { id: "bp1", providerId: "p1", name: "Standard Tutoring Plan", code: "STP-001", description: "Monthly tutoring package", type: "Monthly", frequency: "monthly", amount: 450, currency: "USD", status: "active", createdAt: "2026-03-01" },
  { id: "bp2", providerId: "p1", name: "Intensive Program", code: "IP-002", description: "Weekly intensive sessions", type: "Weekly", frequency: "weekly", amount: 200, currency: "USD", status: "active", createdAt: "2026-03-01" },
  { id: "bp3", providerId: "p2", name: "Workshop Bundle", code: "WB-001", description: "Bundle of 10 workshops", type: "Package", frequency: "one-time", amount: 300, currency: "USD", status: "active", createdAt: "2026-03-15" },
  { id: "bp4", providerId: "p2", name: "Counseling Package", code: "CP-002", description: "8 counseling sessions", type: "Package", frequency: "monthly", amount: 500, currency: "USD", status: "review", createdAt: "2026-04-01" },
  { id: "bp5", providerId: "p3", name: "ESL Monthly Plan", code: "EMP-001", description: "Monthly ESL classes", type: "Monthly", frequency: "monthly", amount: 200, currency: "USD", status: "active", createdAt: "2026-04-10" },
];

export const MOCK_STUDENTS: import("@/types").Student[] = [
  { id: "s1", providerId: "p1", firstName: "Emma", lastName: "Johnson", email: "emma.j@student.edu", phone: "(555) 111-2222", dateOfBirth: "2010-05-12", grade: "8", status: "active", createdAt: "2026-03-01" },
  { id: "s2", providerId: "p1", firstName: "Liam", lastName: "Brown", email: "liam.b@student.edu", phone: "(555) 222-3333", dateOfBirth: "2009-08-24", grade: "9", status: "active", createdAt: "2026-03-01" },
  { id: "s3", providerId: "p1", firstName: "Sophia", lastName: "Martinez", email: "sophia.m@student.edu", phone: "(555) 333-4444", dateOfBirth: "2011-02-18", grade: "7", status: "active", createdAt: "2026-03-05" },
  { id: "s4", providerId: "p2", firstName: "Noah", lastName: "Garcia", email: "noah.g@student.edu", phone: "(555) 444-5555", dateOfBirth: "2008-11-30", grade: "10", status: "active", createdAt: "2026-03-15" },
  { id: "s5", providerId: "p2", firstName: "Olivia", lastName: "Wilson", email: "olivia.w@student.edu", phone: "(555) 555-6666", dateOfBirth: "2007-07-04", grade: "11", status: "pending", createdAt: "2026-04-01" },
  { id: "s6", providerId: "p3", firstName: "Ethan", lastName: "Davis", email: "ethan.d@student.edu", phone: "(555) 666-7777", dateOfBirth: "2012-01-15", grade: "6", status: "active", createdAt: "2026-04-10" },
];

export const MOCK_VALIDATION_ISSUES: import("@/types").ValidationIssue[] = [
  { id: "v1", providerId: "p1", type: "duplicate", severity: "error", entityType: "Student", entityId: "s3", field: "email", message: "Duplicate email address found for Sophia Martinez", status: "open", createdAt: "2026-03-12" },
  { id: "v2", providerId: "p1", type: "missing-reference", severity: "error", entityType: "Activity", entityId: "a5", field: "providerId", message: "Activity references non-existent provider", status: "open", createdAt: "2026-04-10" },

  { id: "v4", providerId: "p2", type: "data-quality", severity: "warning", entityType: "Charge", entityId: "c4", field: "amount", message: "Charge amount significantly above average", status: "open", createdAt: "2026-04-01" },
  { id: "v5", providerId: "p3", type: "missing-field", severity: "info", entityType: "Student", entityId: "s6", field: "phone", message: "Phone number missing for student record", status: "open", createdAt: "2026-04-10" },
  { id: "v6", providerId: "p1", type: "format-error", severity: "error", entityType: "BillingPlan", entityId: "bp4", field: "amount", message: "Invalid currency format in billing plan amount", status: "resolved", createdAt: "2026-04-01" },
];

export const MOCK_UPLOADS: import("@/types").Upload[] = [
  { id: "u1", providerId: "p1", fileName: "activities_march.xlsx", fileType: "xlsx", fileSize: 245760, category: "activity", status: "completed", progress: 100, createdAt: "2026-03-01T10:00:00Z", completedAt: "2026-03-01T10:02:30Z" },
  { id: "u2", providerId: "p1", fileName: "billing_plans.csv", fileType: "csv", fileSize: 15360, category: "billing", status: "completed", progress: 100, createdAt: "2026-03-01T10:05:00Z", completedAt: "2026-03-01T10:06:15Z" },
  { id: "u3", providerId: "p1", fileName: "student_roster.xlsx", fileType: "xlsx", fileSize: 512000, category: "student", status: "completed", progress: 100, createdAt: "2026-03-01T11:00:00Z", completedAt: "2026-03-01T11:05:00Z" },
  { id: "u4", providerId: "p2", fileName: "stem_workshops.pdf", fileType: "pdf", fileSize: 1024000, category: "activity", status: "processing", progress: 65, createdAt: "2026-03-15T09:00:00Z" },
  { id: "u5", providerId: "p2", fileName: "student_data.xlsx", fileType: "xlsx", fileSize: 786432, category: "student", status: "uploading", progress: 45, createdAt: "2026-04-01T14:00:00Z" },
  { id: "u6", providerId: "p3", fileName: "esl_charges.csv", fileType: "csv", fileSize: 8192, category: "billing", status: "failed", progress: 30, error: "Invalid file format", createdAt: "2026-04-10T08:00:00Z" },
];
