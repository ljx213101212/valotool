import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MapAgentPlacement, MatchupSide } from '@/types/matchup';
import { reconcileMapPlacements } from '@/utils/reconcileMapPlacements';

export type { MatchupSide, MapAgentPlacement } from '@/types/matchup';

interface MatchupState {
  attackAgentIds: string[];
  defenseAgentIds: string[];
  mapPlacements: MapAgentPlacement[];
  /** 从右侧拖入地图时加入的阵营（与左侧「场景」进攻/防守视角无关） */
  dragDropTargetSide: MatchupSide;
  setDragDropTargetSide: (side: MatchupSide) => void;
  addAgent: (side: MatchupSide, agentId: string) => void;
  removeAgent: (side: MatchupSide, agentId: string) => void;
  patchMapPlacement: (
    id: string,
    patch: Partial<Pick<MapAgentPlacement, 'x' | 'y' | 'facing'>>
  ) => void;
}

export const useMatchupStore = create<MatchupState>()(
  persist(
    (set) => ({
      attackAgentIds: [],
      defenseAgentIds: [],
      mapPlacements: [],
      dragDropTargetSide: 'attack',
      setDragDropTargetSide: (side) => set({ dragDropTargetSide: side }),

      addAgent: (side, agentId) =>
        set((s) => {
          if (side === 'attack' && s.attackAgentIds.includes(agentId)) return s;
          if (side === 'defense' && s.defenseAgentIds.includes(agentId)) return s;
          const attackAgentIds =
            side === 'attack' ? [...s.attackAgentIds, agentId] : s.attackAgentIds;
          const defenseAgentIds =
            side === 'defense' ? [...s.defenseAgentIds, agentId] : s.defenseAgentIds;
          return {
            attackAgentIds,
            defenseAgentIds,
            mapPlacements: reconcileMapPlacements(
              attackAgentIds,
              defenseAgentIds,
              s.mapPlacements
            ),
          };
        }),

      removeAgent: (side, agentId) =>
        set((s) => {
          const attackAgentIds =
            side === 'attack' ? s.attackAgentIds.filter((id) => id !== agentId) : s.attackAgentIds;
          const defenseAgentIds =
            side === 'defense'
              ? s.defenseAgentIds.filter((id) => id !== agentId)
              : s.defenseAgentIds;
          return {
            attackAgentIds,
            defenseAgentIds,
            mapPlacements: reconcileMapPlacements(
              attackAgentIds,
              defenseAgentIds,
              s.mapPlacements
            ),
          };
        }),

      patchMapPlacement: (id, patch) =>
        set((s) => ({
          mapPlacements: s.mapPlacements.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),
    }),
    {
      name: 'valorant-matchup',
      partialize: (s) => ({
        attackAgentIds: s.attackAgentIds,
        defenseAgentIds: s.defenseAgentIds,
        dragDropTargetSide: s.dragDropTargetSide,
        mapPlacements: s.mapPlacements,
      }),
      merge: (persisted, current) => {
        const p = persisted as
          | Partial<
              Pick<
                MatchupState,
                'attackAgentIds' | 'defenseAgentIds' | 'dragDropTargetSide' | 'mapPlacements'
              >
            >
          | undefined;
        const sideOk =
          p?.dragDropTargetSide === 'attack' || p?.dragDropTargetSide === 'defense'
            ? p.dragDropTargetSide
            : current.dragDropTargetSide;
        const attackAgentIds = Array.isArray(p?.attackAgentIds)
          ? p.attackAgentIds
          : current.attackAgentIds;
        const defenseAgentIds = Array.isArray(p?.defenseAgentIds)
          ? p.defenseAgentIds
          : current.defenseAgentIds;
        const rawPlacements = Array.isArray(p?.mapPlacements) ? p.mapPlacements : [];
        return {
          ...current,
          attackAgentIds,
          defenseAgentIds,
          dragDropTargetSide: sideOk,
          mapPlacements: reconcileMapPlacements(
            attackAgentIds,
            defenseAgentIds,
            rawPlacements
          ),
        };
      },
    }
  )
);
