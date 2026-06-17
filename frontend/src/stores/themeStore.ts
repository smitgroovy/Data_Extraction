import { create } from "zustand";
import type { ThemeMode } from "@/types";

interface ThemeState {
  mode: ThemeMode;
  sidebarCollapsed: boolean;
  toggleMode: () => void;
  setMode: (mode: ThemeMode) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "light",
  sidebarCollapsed: false,
  toggleMode: () =>
    set((state) => {
      const next = state.mode === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      return { mode: next };
    }),
  setMode: (mode) => {
    document.documentElement.classList.toggle("dark", mode === "dark");
    set({ mode });
  },
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
