import { create } from "zustand";
import type { Notification } from "@/types";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [
    {
      id: "n1",
      type: "success",
      title: "Upload Complete",
      message: "Activities file processed successfully",
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: "n2",
      type: "warning",
      title: "Validation Warning",
      message: "3 validation items need review",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: false,
    },
    {
      id: "n3",
      type: "error",
      title: "Upload Failed",
      message: "Student roster file format invalid",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      read: true,
    },
  ],
  unreadCount: 2,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
      unreadCount: state.notifications.filter((n) => !n.read).length - 1 >= 0
        ? state.notifications.filter((n) => !n.read).length - 1
        : 0,
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
