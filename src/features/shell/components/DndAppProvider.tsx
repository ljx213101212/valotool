import { useState, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { MAP_DROP_ZONE_ID } from '@/shared/constants/dnd';
import { getAgentLabel } from '@/shared/data/agentsCatalog';
import { getAgentPortraitUrl } from '@/shared/data/agentPortraitUrl';
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import './DndAppProvider.less';

function HeroDragOverlay({ agentId }: { agentId: string }) {
  const portraitUrl = getAgentPortraitUrl(agentId);
  const label = getAgentLabel(agentId);

  return (
    <div className="dnd-hero-drag-overlay" title={label} aria-label={label}>
      {portraitUrl ? (
        <img className="dnd-hero-drag-overlay__portrait" src={portraitUrl} alt="" draggable={false} />
      ) : (
        <span className="dnd-hero-drag-overlay__fallback">{label}</span>
      )}
    </div>
  );
}

export function DndAppProvider({ children }: { children: ReactNode }) {
  const [dragAgentId, setDragAgentId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const onDragStart = (e: DragStartEvent) => {
    const id = e.active.data.current?.agentId;
    setDragAgentId(typeof id === 'string' ? id : null);
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragAgentId(null);
    const { active, over } = e;
    if (!over || over.id !== MAP_DROP_ZONE_ID) return;
    const agentId = active.data.current?.agentId;
    if (typeof agentId !== 'string') return;
    const { dragDropTargetSide, addAgent } = useMatchupStore.getState();
    addAgent(dragDropTargetSide, agentId);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragAgentId(null)}
    >
      {children}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }}>
        {dragAgentId ? <HeroDragOverlay agentId={dragAgentId} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
