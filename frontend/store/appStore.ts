import { create } from 'zustand';

type AppState = {
  isQuickAddOpen: boolean;
  openQuickAdd: () => void;
  closeQuickAdd: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  isQuickAddOpen: false,
  openQuickAdd: () => set({ isQuickAddOpen: true }),
  closeQuickAdd: () => set({ isQuickAddOpen: false }),
}));
