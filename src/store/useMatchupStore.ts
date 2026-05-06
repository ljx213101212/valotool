import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MatchupSide = 'attack' | 'defense';

interface MatchupState {
  attackAgentIds: string[];
  defenseAgentIds: string[];
  addAgent: (side: MatchupSide, agentId: string) => void;
  removeAgent: (side: MatchupSide, agentId: string) => void;
}

export const useMatchupStore = create<MatchupState>()(
  persist(
    (set) => ({
      attackAgentIds: [],
      defenseAgentIds: [],

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
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<Pick<MatchupState, 'attackAgentIds' | 'defenseAgentIds'>> | undefined;
        return {
          ...current,
          attackAgentIds: Array.isArray(p?.attackAgentIds) ? p.attackAgentIds : current.attackAgentIds,
          defenseAgentIds: Array.isArray(p?.defenseAgentIds) ? p.defenseAgentIds : current.defenseAgentIds,
        };
      },
    }
  )
);
