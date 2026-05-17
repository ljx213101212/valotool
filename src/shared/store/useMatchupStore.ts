import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AbilitySlot } from '@/features/abilities/config';
import type { AbilityPlacement, AbilityPopoverAnchor } from '@/shared/types/ability';
import type { MapAgentPlacement, MatchupSide } from '@/shared/types/matchup';
import { nextAbilitySpawnPoint } from '@/shared/utils/abilitySpawnPosition';
import { reconcileMapPlacements } from '@/shared/utils/reconcileMapPlacements';

export type { MatchupSide, MapAgentPlacement } from '@/shared/types/matchup';

export type SpawnAbilityInput = {
  ownerPlacementId: string;
  agentId: string;
  abilitySlot: AbilitySlot;
  x: number;
  y: number;
};

interface MatchupState {
  attackAgentIds: string[];
  defenseAgentIds: string[];
  mapPlacements: MapAgentPlacement[];
  abilityPlacements: AbilityPlacement[];
  /** ⌘/Ctrl+点击特工后的技能 Popover（仅内存） */
  abilityPopoverPlacementId: string | null;
  abilityPopoverAnchor: AbilityPopoverAnchor | null;
  /** 地图上当前选中的特工 placement（仅内存，不参与 persist） */
  selectedPlacementId: string | null;
  setSelectedPlacementId: (id: string | null) => void;
  openAbilityPopover: (placementId: string, anchor: AbilityPopoverAnchor) => void;
  closeAbilityPopover: () => void;
  spawnAbilityPlacement: (input: SpawnAbilityInput) => void;
  spawnAbilityAtMapCenter: (
    input: Omit<SpawnAbilityInput, 'x' | 'y'>
  ) => void;
  /** 从右侧拖入地图时加入的阵营（与左侧「场景」进攻/防守视角无关） */
  dragDropTargetSide: MatchupSide;
  setDragDropTargetSide: (side: MatchupSide) => void;
  addAgent: (side: MatchupSide, agentId: string) => void;
  removeAgent: (side: MatchupSide, agentId: string) => void;
  patchMapPlacement: (
    id: string,
    patch: Partial<
      Pick<MapAgentPlacement, 'x' | 'y' | 'facing' | 'eliminated' | 'eliminatedByPlacementId'>
    >
  ) => void;
  patchAbilityPlacement: (id: string, patch: Pick<AbilityPlacement, 'x' | 'y'>) => void;
}

function pickSelectionAfterPlacements(
  prevSelected: string | null,
  mapPlacements: MapAgentPlacement[]
): string | null {
  return prevSelected && mapPlacements.some((p) => p.id === prevSelected)
    ? prevSelected
    : null;
}

export const useMatchupStore = create<MatchupState>()(
  devtools(
    persist(
      (set) => ({
      attackAgentIds: [],
      defenseAgentIds: [],
      mapPlacements: [],
      abilityPlacements: [],
      abilityPopoverPlacementId: null,
      abilityPopoverAnchor: null,
      selectedPlacementId: null,
      setSelectedPlacementId: (id) =>
        set({
          selectedPlacementId: id,
          abilityPopoverPlacementId: null,
          abilityPopoverAnchor: null,
        }),
      openAbilityPopover: (placementId, anchor) =>
        set({
          abilityPopoverPlacementId: placementId,
          abilityPopoverAnchor: anchor,
        }),
      closeAbilityPopover: () =>
        set({
          abilityPopoverPlacementId: null,
          abilityPopoverAnchor: null,
        }),
      spawnAbilityPlacement: (input) =>
        set((s) => ({
          abilityPlacements: [
            ...s.abilityPlacements,
            {
              id: crypto.randomUUID(),
              ownerPlacementId: input.ownerPlacementId,
              agentId: input.agentId,
              abilitySlot: input.abilitySlot,
              x: input.x,
              y: input.y,
            },
          ],
        })),
      spawnAbilityAtMapCenter: (input) =>
        set((s) => {
          const { x, y } = nextAbilitySpawnPoint(s.abilityPlacements);
          return {
            abilityPlacements: [
              ...s.abilityPlacements,
              {
                id: crypto.randomUUID(),
                ownerPlacementId: input.ownerPlacementId,
                agentId: input.agentId,
                abilitySlot: input.abilitySlot,
                x,
                y,
              },
            ],
          };
        }),
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
          const mapPlacements = reconcileMapPlacements(
            attackAgentIds,
            defenseAgentIds,
            s.mapPlacements
          );
          return {
            attackAgentIds,
            defenseAgentIds,
            mapPlacements,
            selectedPlacementId: pickSelectionAfterPlacements(s.selectedPlacementId, mapPlacements),
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
          const mapPlacements = reconcileMapPlacements(
            attackAgentIds,
            defenseAgentIds,
            s.mapPlacements
          );
          return {
            attackAgentIds,
            defenseAgentIds,
            mapPlacements,
            selectedPlacementId: pickSelectionAfterPlacements(s.selectedPlacementId, mapPlacements),
          };
        }),

      patchMapPlacement: (id, patch) =>
        set((s) => ({
          mapPlacements: s.mapPlacements.map((p) =>
            p.id === id ? { ...p, ...patch } : p
          ),
        })),
      patchAbilityPlacement: (id, patch) =>
        set((s) => ({
          abilityPlacements: s.abilityPlacements.map((p) =>
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
        abilityPlacements: s.abilityPlacements,
      }),
      merge: (persisted, current) => {
        const p = persisted as
          | Partial<
              Pick<
                MatchupState,
                | 'attackAgentIds'
                | 'defenseAgentIds'
                | 'dragDropTargetSide'
                | 'mapPlacements'
                | 'abilityPlacements'
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
        const abilityPlacements = Array.isArray(p?.abilityPlacements) ? p.abilityPlacements : [];
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
          abilityPlacements,
        };
      },
    }
    ),
    { name: 'MatchupStore', enabled: import.meta.env.DEV }
  )
);
