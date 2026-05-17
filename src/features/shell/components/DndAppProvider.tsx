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
import { useMatchupStore } from '@/shared/store/useMatchupStore';
import './DndAppProvider.less';

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
        {dragAgentId ? (
          <div className="dnd-hero-drag-overlay">{getAgentLabel(dragAgentId)}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
