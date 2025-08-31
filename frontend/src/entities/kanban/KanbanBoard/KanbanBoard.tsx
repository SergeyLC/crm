"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Theme } from "@mui/material/styles";
import {
  DndContext,
  pointerWithin,
  rectIntersection,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  DragOverlay,
  CollisionDetection,
} from "@dnd-kit/core";
import { KanbanStack, KanbanCard } from "@/entities/kanban";
import { useTranslation } from 'react-i18next';
import type { KanbanCardData, KanbanStackData } from "@/entities/kanban";
import Paper from "@mui/material/Paper";
import {
  CardsByRestStages,
  useDndSensors,
  createChangeScheduler,
  processDragOver,
  processDragEnd,
  findCardById,
  useDraggableCardProps,
} from "./boardDndHelpers";

type Props = {
  stacks: KanbanStackData[];
  className?: string;
  gap?: number;
  padding?: number;
  onChange?: (
    stacks: KanbanStackData[],
    restStages?: CardsByRestStages
  ) => void;
  footerItems?: { id: string; label: string }[];
};

export const KanbanBoard: React.FC<Props> = React.memo(function KanbanBoard({
  stacks,
  className,
  gap = 2,
  padding = 1,
  onChange,
  footerItems,
}) {
  const [localStacks, setLocalStacks] = React.useState<KanbanStackData[]>(
    () => stacks
  );
  const restStagesNames = React.useMemo(() => footerItems?.map((item) => item.id) || [], [footerItems]);

  React.useEffect(() => {
    setLocalStacks(stacks);
  }, [stacks]);

  const sensors = useDndSensors();

  // Custom collision detection algorithm for better handling of footer elements
  const customCollisionDetection: CollisionDetection = React.useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    const rectCollisions = rectIntersection(args);

    // If there are pointer collisions, use them (for regular elements)
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }

    // If there are no pointer collisions, use rect collisions (for footer elements)
    return rectCollisions;
  }, []);

  const [activeId, setActiveId] = React.useState<string | null>(null);

  const pendingOnChangeRef = React.useRef<number | null>(null);

  const scheduleOnChange = React.useMemo(
    () => createChangeScheduler(onChange, pendingOnChangeRef),
    [onChange, pendingOnChangeRef]
  );

  const [currentOverId, setCurrentOverId] = React.useState<string | null>(null);

  // Function to get the muted background color of the card
  const getCardOverlayBackground = React.useCallback((overId: string | null) => {
    // console.log("getCardOverlayBackground called with overId:", overId);
    
    if (overId) {
      const lowId = overId.toLowerCase();
      if (lowId.includes("won")) return "rgba(76, 175, 80, 0.15)"; // muted green
      if (lowId.includes("lost")) return "rgba(244, 67, 54, 0.15)"; // muted red
      if (lowId.includes("archived")) return "rgba(33, 150, 243, 0.15)"; // muted blue
      return "rgba(25, 118, 210, 0.1)"; // for regular stacks
    }

    // Default darker background when not over any dropItem
    return "rgba(0, 0, 0, 0.08)"; // slightly darker than background
  }, []);

  const onDragOver = React.useCallback(
    (event: DragOverEvent) => {
      processDragOver(event, setCurrentOverId);
    },
    [setCurrentOverId]
  );

  const onDragEndInternal = React.useCallback(
    (event: DragEndEvent) => {
      const updatedStacks = processDragEnd(
        event,
        localStacks,
        restStagesNames,
        scheduleOnChange
      );
      setLocalStacks(updatedStacks);
    },
    [localStacks, restStagesNames, scheduleOnChange]
  );

  const { t } = useTranslation('kanban');

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragOver={onDragOver}
      onDragEnd={(e) => {
        setActiveId(null);
        onDragEndInternal(e);
      }}
      onDragStart={(e) => {
        setActiveId(String(e.active.id));
      }}
    >
      <Box
        className={className}
        role="region"
        aria-label={t('kanban:board.aria')}
        sx={{
          width: "100%",
          height: "100%",
          overflowX: "auto",
          overflowY: "auto",
          display: "flex",
          flex: 1,
          cursor: activeId ? "grabbing" : "default",
        }}
      >
        <Stack
          direction="row"
          sx={{
            display: "flex",
            flex: "0 0 auto",
            // minHeight: "100%",
            alignItems: "flex-start",
            py: padding,
            px: padding,
            gap: (theme: Theme) => theme.spacing(gap),
          }}
        >
          {localStacks.map((s) => (
            <ColumnDroppable key={s.id} stack={s}>
              {(isOver) => (
                <KanbanStack
                  title={s.title}
                  cards={s.cards}
                  isDropTarget={isOver}
                  renderCard={(card) => (
                    <DraggableCard key={card.id} id={card.id} card={card} />
                  )}
                />
              )}
            </ColumnDroppable>
          ))}
        </Stack>

        {/* footer rendered inside entities so droppables are in same DndContext */}
        {footerItems && footerItems.length > 0 && (
          <Box
            sx={{
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 10,
              display: activeId ? "flex" : "none",
              justifyContent: "space-evenly",
              gap: 3,
              px: 2,
              pointerEvents: activeId ? "auto" : "none",
              zIndex: 1300,
            }}
          >
            {footerItems.map((it) => (
              <BottomDropItem
                key={it.id}
                id={it.id}
                label={
                  t(`kanban:footer.${it.id}`, {
                    defaultValue: it.label,
                  })
                }
              />
            ))}
          </Box>
        )}

        <DragOverlay
          style={{ zIndex: 1400 }}
          modifiers={[
            // Отключаем автоматическое масштабирование
            ({ transform }) => ({
              ...transform,
              scaleX: 1,
              scaleY: 1,
            }),
          ]}
        >
          {activeId ? (
            <KanbanCard
              backgroundColor={getCardOverlayBackground(currentOverId)}
              data={
                findCardById(localStacks, activeId) ?? {
                  id: activeId!,
                  title: "",
                  clientName: "",
                  potentialValue: 0,
                }
              }
            />
          ) : null}
        </DragOverlay>
      </Box>
    </DndContext>
  );
});

// We keep these components here as they are tightly coupled with the DndContext
// and need access to the context provided by the DndContext parent

// Column droppable wrapper to make empty columns targetable
function ColumnDroppable({
  stack,
  children,
}: {
  stack: KanbanStackData;
  children: (isOver: boolean) => React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stack.id as string });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        flex: "0 0 auto",
        minWidth: stack.width ?? (stack.compact ? 200 : 300),
        maxHeight: "100%",
        height: "auto",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
        outline: isOver ? "1px dottted" : "none",
        outlineColor: isOver ? "primary.main" : "none",
        borderRadius: isOver ? 1 : 0,
        transition: "border-radius 0.2s ease",
      }}
    >
      {children(isOver)}
    </Box>
  );
}

function DraggableCard({ id, card }: { id: string; card: KanbanCardData }) {
  const { attributes, listeners, setNodeRef, style } =
    useDraggableCardProps(id);

  return (
    <div 
      ref={setNodeRef} 
      style={{
        ...style,
        cursor: "grab",
      }} 
      {...attributes} 
      {...listeners}
    >
      <KanbanCard data={card} />
    </div>
  );
}

// simple droppable item for footer
function BottomDropItem({ id, label }: { id: string; label: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Semantic colors for different actions
  const getBackgroundColor = () => {
    const lowId = id.toLowerCase();
    
    if (isOver) {
      // Bright colors on hover
      if (lowId.includes("won")) return "success.main"; // bright green
      if (lowId.includes("lost")) return "error.main"; // bright red
      if (lowId.includes("archived")) return "info.main"; // bright blue
      return "rgba(25, 118, 210, 0.05)"; //"dropZone.main"; // fallback
    } else {
      // Muted colors in normal state
      if (lowId.includes('won')) return "rgba(76, 175, 80, 0.15)";      // muted green
      if (lowId.includes('lost')) return "rgba(244, 67, 54, 0.15)";     // muted red
      if (lowId.includes('archived')) return "rgba(33, 150, 243, 0.15)"; // muted blue
      return "background.paper"; // fallback
    }
  };

  return (
    <Paper
      ref={setNodeRef}
      elevation={isOver ? 3 : 1}
      sx={{
        flex: 1,
        minWidth: 120,
        height: 53,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: getBackgroundColor(),
        border: "1px dashed rgba(0,0,0,0.08)",
        borderRadius: 1,
        transition: "background-color 0.2s ease, elevation 0.2s ease",
        // Increase drop area
        "&::before": {
          content: '""',
          position: "absolute",
          top: "-10px",
          left: "-10px",
          right: "-10px",
          bottom: "-10px",
          pointerEvents: "auto",
        },
        position: "relative",
      }}
    >
      {label}
    </Paper>
  );
}

export default KanbanBoard;
