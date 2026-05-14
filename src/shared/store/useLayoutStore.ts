import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface LayoutState {
  leftOpen: boolean;
  rightOpen: boolean;
  timelineOpen: boolean;
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleTimeline: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  devtools(
    persist(
      (set) => ({
        leftOpen: true,
        rightOpen: true,
        timelineOpen: true,

        toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
        toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
        toggleTimeline: () => set((s) => ({ timelineOpen: !s.timelineOpen })),
      }),
      { name: 'valorant-layout-storage' } // 刷新记住状态
    ),
    { name: 'LayoutStore', enabled: import.meta.env.DEV }
  )
);