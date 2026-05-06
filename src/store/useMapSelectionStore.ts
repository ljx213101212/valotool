import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { MAPS_CATALOG } from '@/data/mapsCatalog';

export type TacticalSide = 'attack' | 'defense';

interface MapSelectionState {
  selectedMapId: string;
  setSelectedMapId: (id: string) => void;
  side: TacticalSide;
  setSide: (side: TacticalSide) => void;
}

const defaultMapId = MAPS_CATALOG[0]?.id ?? 'bind';

export const useMapSelectionStore = create<MapSelectionState>()(
  devtools(
    persist(
      (set) => ({
        selectedMapId: defaultMapId,
        setSelectedMapId: (id) => set({ selectedMapId: id }),
        side: 'attack',
        setSide: (side) => set({ side }),
      }),
      {
        name: 'valorant-map-selection',
        merge: (persisted, current) => {
          const p = persisted as Partial<MapSelectionState> | undefined;
          return {
            ...current,
            ...p,
            side: p?.side === 'defense' || p?.side === 'attack' ? p.side : current.side,
          };
        },
      }
    ),
    { name: 'MapSelectionStore', enabled: import.meta.env.DEV }
  )
);
