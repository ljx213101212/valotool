import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MatchupSide = 'attack' | 'defense';

interface MatchupState {
  attackAgentIds: string[];
  defenseAgentIds: string[];
  /** 从右侧拖入地图时加入的阵营（与左侧「场景」进攻/防守视角无关） */
  dragDropTargetSide: MatchupSide;
  setDragDropTargetSide: (side: MatchupSide) => void;
  addAgent: (side: MatchupSide, agentId: string) => void;
  removeAgent: (side: MatchupSide, agentId: string) => void;
}

export const useMatchupStore = create<MatchupState>()(
  persist(
    (set) => ({
      attackAgentIds: [],
      defenseAgentIds: [],
      dragDropTargetSide: 'attack',
      setDragDropTargetSide: (side) => set({ dragDropTargetSide: side }),

      addAgent: (side, agentId) =>
        set((s) => {
          if (side === 'attack') {
            if (s.attackAgentIds.includes(agentId)) return s;
            return { attackAgentIds: [...s.attackAgentIds, agentId] };
          }
          if (s.defenseAgentIds.includes(agentId)) return s;
          return { defenseAgentIds: [...s.defenseAgentIds, agentId] };
        }),

      removeAgent: (side, agentId) =>
        set((s) =>
          side === 'attack'
            ? { attackAgentIds: s.attackAgentIds.filter((id) => id !== agentId) }
            : { defenseAgentIds: s.defenseAgentIds.filter((id) => id !== agentId) }
        ),
    }),
    {
      name: 'valorant-matchup',
      partialize: (s) => ({
        attackAgentIds: s.attackAgentIds,
        defenseAgentIds: s.defenseAgentIds,
        dragDropTargetSide: s.dragDropTargetSide,
      }),
      merge: (persisted, current) => {
        const p = persisted as
          | Partial<Pick<MatchupState, 'attackAgentIds' | 'defenseAgentIds' | 'dragDropTargetSide'>>
          | undefined;
        const sideOk =
          p?.dragDropTargetSide === 'attack' || p?.dragDropTargetSide === 'defense'
            ? p.dragDropTargetSide
            : current.dragDropTargetSide;
        return {
          ...current,
          attackAgentIds: Array.isArray(p?.attackAgentIds) ? p.attackAgentIds : current.attackAgentIds,
          defenseAgentIds: Array.isArray(p?.defenseAgentIds) ? p.defenseAgentIds : current.defenseAgentIds,
          dragDropTargetSide: sideOk,
        };
      },
    }
  )
);
