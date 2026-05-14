import { create } from 'zustand';

/** 任意战术 Drawer 打开时递增，用于屏蔽下层时间轴等交互 */
type UiOverlayState = {
  drawerLayerDepth: number;
  pushDrawerLayer: () => void;
  popDrawerLayer: () => void;
};

export const useUiOverlayStore = create<UiOverlayState>((set, get) => ({
  drawerLayerDepth: 0,
  pushDrawerLayer: () => set({ drawerLayerDepth: get().drawerLayerDepth + 1 }),
  popDrawerLayer: () =>
    set({ drawerLayerDepth: Math.max(0, get().drawerLayerDepth - 1) }),
}));

export function useTimelineInteractionBlocked(): boolean {
  return useUiOverlayStore((s) => s.drawerLayerDepth > 0);
}
