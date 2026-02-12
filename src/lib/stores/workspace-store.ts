import { create } from "zustand";

interface WorkspaceState {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  threadMessageId: string | null;
  openThread: (messageId: string) => void;
  closeThread: () => void;
  globalSearchOpen: boolean;
  openGlobalSearch: () => void;
  closeGlobalSearch: () => void;
  activeChannelId: string | null;
  setActiveChannelId: (id: string | null) => void;
  activeHuddleChannelId: string | null;
  isHuddleMinimized: boolean;
  startHuddle: (channelId: string) => void;
  leaveHuddle: () => void;
  toggleHuddleMinimized: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  threadMessageId: null,
  openThread: (messageId) => set({ threadMessageId: messageId }),
  closeThread: () => set({ threadMessageId: null }),
  globalSearchOpen: false,
  openGlobalSearch: () => set({ globalSearchOpen: true }),
  closeGlobalSearch: () => set({ globalSearchOpen: false }),
  activeChannelId: null,
  setActiveChannelId: (id) => set({ activeChannelId: id }),
  activeHuddleChannelId: null,
  isHuddleMinimized: false,
  startHuddle: (channelId) =>
    set({ activeHuddleChannelId: channelId, isHuddleMinimized: false }),
  leaveHuddle: () =>
    set({ activeHuddleChannelId: null, isHuddleMinimized: false }),
  toggleHuddleMinimized: () =>
    set((state) => ({ isHuddleMinimized: !state.isHuddleMinimized })),
}));
