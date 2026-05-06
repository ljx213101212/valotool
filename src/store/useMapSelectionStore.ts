import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MAPS_CATALOG } from '@/data/mapsCatalog';

interface MapSelectionState {
  selectedMapId: string;
  setSelectedMapId: (id: string) => void;
}

const defaultMapId = MAPS_CATALOG[0]?.id ?? 'bind';

export const useMapSelectionStore = create<MapSelectionState>()(
  persist(
    (set) => ({
      selectedMapId: defaultMapId,
      setSelectedMapId: (id) => set({ selectedMapId: id }),
    }),
    { name: 'valorant-map-selection' }
  )
);
