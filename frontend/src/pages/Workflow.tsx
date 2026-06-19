import { useNavigate } from "react-router-dom";
import { useWorkflowStore } from "@/stores/workflowStore";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, GitBranch, Upload, Eye } from "lucide-react";

const steps = [
  {
    id: "activities",
    title: "Activities",
    description: "Upload and review activity data",
    icon: GitBranch,
    route: "/workflow/activities",
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "billing",
    title: "Billing Plans",
    description: "Configure and review billing plan structures",
    icon: Upload,
    route: "/workflow/billing",
    color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    id: "students",
    title: "Students",
    description: "Upload and manage student records",
    icon: Upload,
    route: "/workflow/students",
    color: "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400",
  },
  {
    id: "preview",
    title: "Preview",
    description: "Preview all data before final submission",
    icon: Eye,
    route: "/workflow/preview",
    color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400",
  },
];

export default function WorkflowPage() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Workflow"
        description="Multi-step data onboarding workflow"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <Card
              key={step.id}
              className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => navigate(step.route)}
            >
              <CardHeader>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${step.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="mt-2 text-base">{step.title}</CardTitle>
                <CardDescription>{step.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full justify-between">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
