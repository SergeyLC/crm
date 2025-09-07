import React from "react";
import {
  useSensor,
  useSensors,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  DragEndEvent,
  DragOverEvent,
  useDraggable
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { KanbanCardData, KanbanStackData } from "@/entities/kanban";

export type CardsByRestStages = {
  [key: string]: KanbanCardData[];
};

/**
 * Creates the DnD sensors configuration
 */
export const useDndSensors = () => {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );
};

/**
 * Creates a scheduling function for onChange events
 */
export const createChangeScheduler = (
  onChange: ((stacks: KanbanStackData[], restStages?: CardsByRestStages) => void) | undefined,
  pendingOnChangeRef: React.MutableRefObject<number | null>
) => {
  return (next: KanbanStackData[], restStages?: CardsByRestStages) => {
    if (!onChange) return;

    // refuse previous scheduled call if exists
    if (pendingOnChangeRef.current !== null) {
      cancelAnimationFrame(pendingOnChangeRef.current);
      pendingOnChangeRef.current = null;
    }

    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
      pendingOnChangeRef.current = window.requestAnimationFrame(() => {
        pendingOnChangeRef.current = null;
        onChange(next, restStages);
      });
    } else {
      // fallback to microtask
      Promise.resolve().then(() => onChange(next, restStages));
    }
  };
};

/**
 * Process drag over events
 */
export const processDragOver = (event: DragOverEvent, setCurrentOverId: (id: string | null) => void) => {
  const { over } = event;
  setCurrentOverId(over?.id ? String(over.id) : null);
};

/**
 * Process drag end events - handle only cross-stack movements
 */
export const processDragEnd = (
  event: DragEndEvent,
  localStacks: KanbanStackData[],
  restStagesNames: string[],
  scheduleOnChange: (stacks: KanbanStackData[], restStages?: CardsByRestStages) => void
) => {
  const { active, over } = event;
  if (!over) return localStacks;
  
  const activeId = String(active.id);
  const overId = String(over.id);

  const next = localStacks.map((s) => ({ ...s, cards: [...s.cards] }));

  const sourceStackIndex = next.findIndex((s) =>
    s.cards.some((c) => String(c.id) === activeId)
  );
  
  // Находим только индекс целевого стека, не карточки внутри стека
  const overIsStackIndex = next.findIndex((s) => String(s.id) === overId);
  
  if (sourceStackIndex === -1) return localStacks;

  // DROP TO FOOTER
  if (restStagesNames.includes(overId)) {
    const src = next[sourceStackIndex];
    const srcIndex = src.cards.findIndex((c) => String(c.id) === activeId);
    if (srcIndex === -1) return localStacks;
    // remove card from source stack
    const removedCard = src.cards.splice(srcIndex, 1);
    scheduleOnChange(next, { [overId]: [removedCard[0]] });
    return next;
  }

  // MOVING BETWEEN STACKS
  // Проверяем, что перетаскивание происходит между разными стеками
  if (overIsStackIndex !== -1 && overIsStackIndex !== sourceStackIndex) {
    const src = next[sourceStackIndex];
    const dst = next[overIsStackIndex];
    const srcIndex = src.cards.findIndex((c) => String(c.id) === activeId);
    if (srcIndex === -1) return localStacks;
    const [moved] = src.cards.splice(srcIndex, 1);

    // Добавляем карточку в конец целевого стека
    dst.cards.push(moved);

    scheduleOnChange(next);
    return next;
  }

  return localStacks;
};

/**
 * Find a card by ID across all stacks
 */
export const findCardById = (stacks: KanbanStackData[], id: string): KanbanCardData | undefined => {
  return stacks.flatMap(s => s.cards).find(c => c.id === id);
};

/**
 * Create draggable card props with proper sizing
 */
export const useDraggableCardProps = (id: string) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    marginBottom: 8,
    touchAction: "none",
    WebkitUserSelect: "none",
    userSelect: "none",
    cursor: isDragging ? "grabbing" : "grab",
    // Make original transparent while dragging
    opacity: isDragging ? 0 : 1, // Completely hide original
    // Ensure the dragged element has the correct size
    width: isDragging ? "auto" : undefined,
    height: isDragging ? "auto" : undefined,
  };

  return { attributes, listeners, setNodeRef, style, isDragging };
};