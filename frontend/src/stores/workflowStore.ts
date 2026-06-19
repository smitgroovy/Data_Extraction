import { create } from "zustand";
import type { WorkflowStep } from "@/types";
import { WORKFLOW_STEPS } from "@/constants";

interface WorkflowState {
  steps: WorkflowStep[];
  currentStepIndex: number;
  selectedProviderId: string | null;
  setSteps: (steps: WorkflowStep[]) => void;
  updateStepStatus: (stepId: string, status: WorkflowStep["status"]) => void;
  setCurrentStep: (index: number) => void;
  goNext: () => void;
  goBack: () => void;
  setSelectedProviderId: (id: string | null) => void;
  reset: () => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  steps: WORKFLOW_STEPS,
  currentStepIndex: 0,
  selectedProviderId: null,
  setSteps: (steps) => set({ steps }),
  updateStepStatus: (stepId, status) =>
    set((state) => ({
      steps: state.steps.map((s) =>
        s.id === stepId ? { ...s, status } : s
      ),
    })),
  setCurrentStep: (index) => set({ currentStepIndex: index }),
  goNext: () => {
    const { currentStepIndex, steps } = get();
    if (currentStepIndex < steps.length - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    }
  },
  goBack: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },
  setSelectedProviderId: (id) => set({ selectedProviderId: id }),
  reset: () => set({ steps: WORKFLOW_STEPS, currentStepIndex: 0, selectedProviderId: null }),
}));
