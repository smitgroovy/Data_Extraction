import { Link, useLocation } from "react-router-dom";
import { useWorkflowStore } from "@/stores/workflowStore";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function WizardStepper() {
  const { steps, setCurrentStep } = useWorkflowStore();
  const location = useLocation();

  const currentIndex = steps.findIndex(
    (s) => location.pathname === s.route
  );

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = index <= currentIndex;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => isClickable && setCurrentStep(index)}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors",
                  isCurrent && "text-primary font-medium",
                  isCompleted && "text-emerald-600",
                  !isClickable && "text-muted-foreground cursor-not-allowed",
                  isClickable && !isCurrent && !isCompleted && "hover:text-primary"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                    !isClickable && "border-muted-foreground/30 text-muted-foreground/50"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 flex-1 h-px",
                    isCompleted ? "bg-emerald-500" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
