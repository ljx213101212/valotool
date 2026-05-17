import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AbilitySlot } from '@/features/abilities/config';
import type { AbilityPlacement, AbilityPopoverAnchor } from '@/shared/types/ability';
import type { MapAgentPlacement, MatchupSide } from '@/shared/types/matchup';
import { nextAbilitySpawnPoint } from '@/shared/utils/abilitySpawnPosition';
import { normalizeAbilityPlacements } from '@/shared/utils/normalizeAbilityPlacements';
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
  /** ⌘/Ctrl+点击特工后的部署技能 Popover（仅内存） */
  abilityPopoverPlacementId: string | null;
  abilityPopoverAnchor: AbilityPopoverAnchor | null;
  /** ⌘/Ctrl+点击地图上技能实例后的操作 Popover（仅内存） */
  abilityInstancePopoverId: string | null;
  abilityInstancePopoverAnchor: AbilityPopoverAnchor | null;
  /** 地图上当前选中的特工 placement（仅内存，不参与 persist） */
  selectedPlacementId: string | null;
  setSelectedPlacementId: (id: string | null) => void;
  /** 地图上当前选中的技能实例（仅内存，不参与 persist） */
  selectedAbilityPlacementId: string | null;
  setSelectedAbilityPlacementId: (id: string | null) => void;
  openAbilityPopover: (placementId: string, anchor: AbilityPopoverAnchor) => void;
  closeAbilityPopover: () => void;
  openAbilityInstancePopover: (abilityId: string, anchor: AbilityPopoverAnchor) => void;
  closeAbilityInstancePopover: () => void;
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
  patchAbilityPlacement: (
    id: string,
    patch: Partial<Pick<AbilityPlacement, 'x' | 'y' | 'state'>>
  ) => void;
  removeAbilityPlacement: (id: string) => void;
  /** 移除技能并归还技能点给施放者（归还逻辑待 buy-loadout 模块实现） */
  recallAbilityPlacement: (id: string) => void;
}

function pickSelectionAfterPlacements(
  prevSelected: string | null,
  mapPlacements: MapAgentPlacement[]
): string | null {
  return prevSelected && mapPlacements.some((p) => p.id === prevSelected)
    ? prevSelected
    : null;
}

function pickAbilitySelectionAfterPlacements(
  prevSelected: string | null,
  abilityPlacements: AbilityPlacement[]
): string | null {
  return prevSelected && abilityPlacements.some((p) => p.id === prevSelected)
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
      abilityInstancePopoverId: null,
      abilityInstancePopoverAnchor: null,
      selectedPlacementId: null,
      selectedAbilityPlacementId: null,
      setSelectedPlacementId: (id) =>
        set({
          selectedPlacementId: id,
          selectedAbilityPlacementId: null,
          abilityPopoverPlacementId: null,
          abilityPopoverAnchor: null,
          abilityInstancePopoverId: null,
          abilityInstancePopoverAnchor: null,
        }),
      setSelectedAbilityPlacementId: (id) =>
        set({
          selectedAbilityPlacementId: id,
          selectedPlacementId: null,
          abilityPopoverPlacementId: null,
          abilityPopoverAnchor: null,
          abilityInstancePopoverId: null,
          abilityInstancePopoverAnchor: null,
        }),
      openAbilityPopover: (placementId, anchor) =>
        set({
          abilityPopoverPlacementId: placementId,
          abilityPopoverAnchor: anchor,
          abilityInstancePopoverId: null,
          abilityInstancePopoverAnchor: null,
        }),
      closeAbilityPopover: () =>
        set({
          abilityPopoverPlacementId: null,
          abilityPopoverAnchor: null,
        }),
      openAbilityInstancePopover: (abilityId, anchor) =>
        set({
          abilityInstancePopoverId: abilityId,
          abilityInstancePopoverAnchor: anchor,
          abilityPopoverPlacementId: null,
          abilityPopoverAnchor: null,
        }),
      closeAbilityInstancePopover: () =>
        set({
          abilityInstancePopoverId: null,
          abilityInstancePopoverAnchor: null,
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
              state: 'initial',
              placedAt: Date.now(),
            },
          ],
        })),
      spawnAbilityAtMapCenter: (input) =>
        set((s) => {
          const { x, y } = nextAbilitySpawnPoint(s.abilityPlacements);
          const placedAt = Date.now();
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
                state: 'initial' as const,
                placedAt,
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
      removeAbilityPlacement: (id) =>
        set((s) => {
          const abilityPlacements = s.abilityPlacements.filter((p) => p.id !== id);
          return {
            abilityPlacements,
            abilityInstancePopoverId:
              s.abilityInstancePopoverId === id ? null : s.abilityInstancePopoverId,
            abilityInstancePopoverAnchor:
              s.abilityInstancePopoverId === id ? null : s.abilityInstancePopoverAnchor,
            selectedAbilityPlacementId: pickAbilitySelectionAfterPlacements(
              s.selectedAbilityPlacementId,
              abilityPlacements
            ),
          };
        }),
      recallAbilityPlacement: (id) =>
        set((s) => {
          const target = s.abilityPlacements.find((p) => p.id === id);
          if (!target) return s;
          // TODO(buy-loadout): 将 target.abilitySlot 技能点退还给 target.ownerPlacementId
          const abilityPlacements = s.abilityPlacements.filter((p) => p.id !== id);
          return {
            abilityPlacements,
            abilityInstancePopoverId: null,
            abilityInstancePopoverAnchor: null,
            selectedAbilityPlacementId: pickAbilitySelectionAfterPlacements(
              s.selectedAbilityPlacementId,
              abilityPlacements
            ),
          };
        }),
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
        const abilityPlacements = normalizeAbilityPlacements(p?.abilityPlacements);
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
