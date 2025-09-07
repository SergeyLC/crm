"use client";

import React, { useCallback, useEffect } from "react";

import {
  CardsByRestStages,
  KanbanBoard as EntitiesKanbanBoard,
  KanbanStackData,
} from "@/entities/kanban/";
import Container from "@mui/material/Container";
import {
  DealExt,
  sanitizeDealData,
  UpdateDealDTO,
  useGetDealsQuery,
  useLazyGetDealByIdQuery,
  useUpdateDealMutation,
} from "@/entities/deal";
import { DealStage, DealStatus } from "@/shared/generated/prisma-client";
import { prepareStacks, moveCardToStage, processKanbanChanges } from "../lib";
import { useTranslation } from "react-i18next";

export type KanbanBoardProps = {
  stacks?: KanbanStackData[];
  className?: string;
  gap?: number;
  padding?: number;
};

/**
 * Feature-level wrapper around entities/kanban KanbanBoard.
 * Accepts stacks data and forwards to the entities component.
 */
/**
 * KanbanBoard component displays a kanban board for managing deals.
 *
 * It accepts either precomputed stacks or fetches deal data as needed, and provides
 * interactive functionality for moving cards between stages, updating deals, and handling
 * changes in the board state. The component is memoized for performance and integrates
 * with translation and mutation hooks.
 *
 * @param {KanbanBoardProps} props - The props for the KanbanBoard component.
 * @param {KanbanStackData[]} [props.stacks] - Optional precomputed stacks to display.
 * @param {string} [props.className] - Optional CSS class for styling.
 * @param {number} [props.gap=2] - Gap between stacks.
 * @param {number} [props.padding=1] - Padding inside stacks.
 *
 * @returns {JSX.Element} The rendered Kanban board UI.
 */
export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stacks: incomingStacks,
  className,
  gap = 2,
  padding = 1,
}) => {
  const { t } = useTranslation(["kanban", "KanbanBoard"]);
  const needToFetchData = !incomingStacks || incomingStacks.length === 0;

  // load data only if needed
  const { data: deals = [], refetch } = useGetDealsQuery(undefined, needToFetchData);

  useEffect(() => {
    if (needToFetchData) {
      refetch();
    }
  }, [needToFetchData, refetch]);

  // Memoize the calculation of stacks to avoid unnecessary recomputations
  const dealStacks = React.useMemo(() => {
    // If ready-made stacks are provided, use them
    if (incomingStacks?.length) {
      return incomingStacks;
    }
    // Otherwise, create from deals
    return prepareStacks(deals || [], t);
  }, [incomingStacks, deals, t]);

  // Local state for working with data
  const [stacksInfo, setStacksInfo] = React.useState<KanbanStackData[]>(
    () => []
  );
  const triggerGetDealById = useLazyGetDealByIdQuery();
  const updateDeal = useUpdateDealMutation();

  // Update state when data source changes
  useEffect(() => {
    if (dealStacks.length) {
      setStacksInfo(dealStacks);
    }
  }, [dealStacks]);

  const footerItems: { id: DealStage | DealStatus; label: string }[] = [
    { id: "LOST", label: t("footer.lost") },
    { id: "WON", label: t("footer.won") },
    { id: "ARCHIVED", label: t("footer.archived") },
  ];

  const update = useCallback(
    async (id: string, updateData: (deal: DealExt) => UpdateDealDTO) => {
      const deal = await triggerGetDealById(id);
      if (!deal) {
        console.error("Deal not found for id", id);
        return;
      }

      const updatedData = updateData(deal);
      const preparedUpdate = sanitizeDealData(updatedData);
      console.log("Updating deal", id, preparedUpdate);

      const body: UpdateDealDTO = {
        ...preparedUpdate,
      };
      await updateDeal.mutateAsync({ id, body });
    },
    [triggerGetDealById, updateDeal]
  );

  const moveCardToRestStage = useCallback(
    (stage: string, id: string) => {
      moveCardToStage(stage, id, update);
    },
    [update]
  );

  const handleChange = useCallback(
    (newStacks: KanbanStackData[], restStages?: CardsByRestStages) => {
      // Process all changes using the utility function
      processKanbanChanges(
        stacksInfo,
        newStacks,
        restStages,
        moveCardToRestStage,
        update
      );

      // Save new state
      setStacksInfo(newStacks);
    },
    [stacksInfo, moveCardToRestStage, update]
  );

  return (
    <Container
      maxWidth={false}
      component="main"
      sx={{
        p: 0,
        display: "flex",
        alignItems: "stretch",
        paddingLeft: "0 !important",
        paddingRight: "0 !important",
        height: "100%", // Occupies the full height of the parent
        overflow: "hidden", // Important!
        flex: 1,
        position: "relative",
      }}
    >
      <EntitiesKanbanBoard
        stacks={stacksInfo}
        className={className}
        gap={gap}
        padding={padding}
        onChange={handleChange}
        footerItems={footerItems}
      />
    </Container>
  );
};

export default KanbanBoard;
