import { create } from "zustand";
import type { Upload } from "@/types";
import { MOCK_UPLOADS } from "@/constants";

interface UploadState {
  uploads: Upload[];
  uploadQueue: File[];
  isDragging: boolean;
  setUploads: (uploads: Upload[]) => void;
  addUpload: (upload: Upload) => void;
  updateUpload: (id: string, data: Partial<Upload>) => void;
  removeUpload: (id: string) => void;
  setUploadQueue: (queue: File[]) => void;
  addToQueue: (file: File) => void;
  clearQueue: () => void;
  setIsDragging: (dragging: boolean) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  uploads: MOCK_UPLOADS,
  uploadQueue: [],
  isDragging: false,
  setUploads: (uploads) => set({ uploads }),
  addUpload: (upload) =>
    set((state) => ({ uploads: [upload, ...state.uploads] })),
  updateUpload: (id, data) =>
    set((state) => ({
      uploads: state.uploads.map((u) =>
        u.id === id ? { ...u, ...data } : u
      ),
    })),
  removeUpload: (id) =>
    set((state) => ({
      uploads: state.uploads.filter((u) => u.id !== id),
    })),
  setUploadQueue: (queue) => set({ uploadQueue: queue }),
  addToQueue: (file) =>
    set((state) => ({ uploadQueue: [...state.uploadQueue, file] })),
  clearQueue: () => set({ uploadQueue: [] }),
  setIsDragging: (dragging) => set({ isDragging: dragging }),
}));
