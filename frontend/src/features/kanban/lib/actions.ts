import { DealExt, UpdateDealDTO } from "@/entities/deal";
import { CardsByRestStages, KanbanStackData } from "@/entities/kanban";
import { DealStage, DealStatus } from "@/shared/generated/prisma";

/**
 * Find cards that have moved between stacks
 */
export const findStackChanges = (
  oldStacks: KanbanStackData[],
  newStacks: KanbanStackData[]
) => {
  // Map of all cards "before": stackId -> Set(cardIds)
  const oldStackMap = new Map<string, Set<string>>();
  oldStacks.forEach((stack) => {
    if (stack.id) {
      oldStackMap.set(
        stack.id,
        new Set(stack.cards.map((card) => card.id))
      );
    }
  });

  // Result: list of moved cards { cardId, fromStack, toStack }
  const movedCards: { cardId: string; fromStack: string; toStack: string }[] = [];

  // Check each card in the new stacks
  newStacks.forEach((newStack) => {
    const newStackId = newStack.id;

    newStack.cards.forEach((card) => {
      // Find the old stack for this card
      let oldStackId: string | null = null;

      oldStackMap.forEach((cardIds, stackId) => {
        if (oldStackId === null && cardIds.has(card.id)) {
          oldStackId = stackId;
        }
      });

      // If the card was in a different stack - it was moved
      if (newStackId && oldStackId && oldStackId !== newStackId) {
        movedCards.push({
          cardId: card.id,
          fromStack: oldStackId,
          toStack: newStackId,
        });
      }
    });
  });

  return {
    movedCards,
  };
};

/**
 * Utility to update a deal's stage or status
 */
export const moveCardToStage = (
  stage: string,
  id: string,
  update: (id: string, updater: (deal: DealExt) => UpdateDealDTO) => void
) => {
  let updateInfo = {}; //sanitizeDealData({...deal, ...(stage in DealStage ? { stage } : (stage in DealStatus ? { status: stage } : {}))});
  if (stage in DealStage) {
    // If the stage is a valid DealStage
    updateInfo = { stage };
  }
  if (stage in DealStatus) {
    // If the stage is a valid DealStatus
    updateInfo = { status: stage };
  }
  
  // console.log(`Moving card ${id} to stage ${stage} with updateInfo=${JSON.stringify(updateInfo)}`);
  update(id, (deal) => ({
    ...deal,
    ...updateInfo,
  }));
};

/**
 * Process changes in Kanban board
 */
export const processKanbanChanges = (
  oldStacks: KanbanStackData[],
  newStacks: KanbanStackData[],
  restStages: CardsByRestStages | undefined,
  moveCardToRestStage: (stage: string, id: string) => void,
  updateDeal: (id: string, updateFn: (deal: DealExt) => UpdateDealDTO) => void
) => {
  // Handle cards moved to special areas (footer)
  if (restStages) {
    Object.entries(restStages).forEach(([stage, cards]) => {
      cards?.forEach(({ id }) => {
        moveCardToRestStage(stage, id);
      });
    });
  }

  // Find moved cards between main columns
  const { movedCards } = findStackChanges(oldStacks, newStacks);

  if (movedCards.length > 0) {
    // Apply changes
    movedCards.forEach(({ cardId, toStack }) => {
      // If toStack is a DealStage, update the stage
      if (toStack in DealStage) {
        updateDeal(cardId, (deal) => ({
          ...deal,
          stage: toStack as DealStage,
        }));
      }
    });
  }
};