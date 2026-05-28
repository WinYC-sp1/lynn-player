import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';
type ActiveView = 'music' | 'video' | 'online' | 'bilibili' | 'settings';

interface AppState {
  theme: Theme;
  activeView: ActiveView;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
  setActiveView: (view: ActiveView) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'system',
  activeView: 'music',
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
  setActiveView: (activeView) => set({ activeView }),
}));
