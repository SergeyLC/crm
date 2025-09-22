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
  useGetActiveDealsQuery,
  useLazyGetDealByIdQuery,
  useUpdateDealMutation,
  DealActiveQueryKey,
  DealWonQueryKey,
  DealLostQueryKey,
  DealArchivedQueryKey,
} from "@/entities/deal";

import { QueryKeyType, useInvalidateQueries } from "@/shared";

import { DealStage, DealStatus } from "@/shared/generated/prisma";
import { prepareStacks, moveCardToStage, processKanbanChanges } from "../lib";
import { useTranslation } from "react-i18next";

export type KanbanBoardProps = {
  // stacks?: KanbanStackData[];
  initialDeals?: DealExt[];
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
 * @param {string} [props.className] - Optional CSS class for styling.
 * @param {number} [props.gap=2] - Gap between stacks.
 * @param {number} [props.padding=1] - Padding inside stacks.
 *
 * @returns {JSX.Element} The rendered Kanban board UI.
 */
export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  // stacks: incomingStacks,
  className,
  initialDeals,
  gap = 2,
  padding = 1,
}) => {
  const { t } = useTranslation(["kanban", "KanbanBoard"]);
  // const needToFetchData = !incomingStacks || incomingStacks.length === 0;

  // load data only if needed
  const {
    useQuery: { data: deals = [] },
  } = useGetActiveDealsQuery(undefined, {
    placeholderData: initialDeals,
  });

  // Memoize the calculation of stacks to avoid unnecessary recomputations
  const dealStacks = React.useMemo(() => {
    // Otherwise, create from deals
    return prepareStacks(deals || [], t);
  }, [deals, t]);

  // Local state for working with data
  const [stacksInfo, setStacksInfo] = React.useState<KanbanStackData[]>(
    () => dealStacks
  );

  const invalidateDeals = useInvalidateQueries();

  const onSuccess = React.useCallback((data: unknown) => {
    const { status, stage } = data as DealExt;

    // Determine which queries to invalidate based on the updated deal's status and stage

    const invalidateKeys = [DealActiveQueryKey as unknown as  QueryKeyType];
    if (status === "ARCHIVED") {
      invalidateKeys.push(DealArchivedQueryKey as unknown as QueryKeyType);
    } else if (stage === "WON") {
      invalidateKeys.push(DealWonQueryKey as unknown as QueryKeyType);
    } else if (stage === "LOST") {
      invalidateKeys.push(DealLostQueryKey as unknown as QueryKeyType);
    }
    // invalidate only relevant queries
    invalidateDeals(invalidateKeys);
  }, [invalidateDeals]);

  const getDealById = useLazyGetDealByIdQuery();
  const updateDeal = useUpdateDealMutation({ onSuccess });

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
      const deal = await getDealById(id);
      if (!deal) {
        console.error("Deal not found for id", id);
        return;
      }

      const updatedData = updateData(deal);
      const preparedUpdate = sanitizeDealData(updatedData);
      const body: UpdateDealDTO = {
        ...preparedUpdate,
      };
      await updateDeal.mutateAsync({ id, body });
    },
    [getDealById, updateDeal]
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
