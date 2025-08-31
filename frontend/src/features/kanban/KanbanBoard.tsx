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
import { prepareStacks, moveCardToStage, processKanbanChanges } from "./lib";
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
export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  stacks: incomingStacks,
  className,
  gap = 2,
  padding = 1,
}) => {
  const { t } = useTranslation("kanban");
  const needToFetchData = !incomingStacks || incomingStacks.length === 0;


  // load data only if needed
  const { data: deals = [] } = useGetDealsQuery(undefined, {
    // Remove refetchOnMountOrArgChange to prevent double requests
    // RTK Query will automatically refetch when tags are invalidated
    refetchOnFocus: true,
    skip: !needToFetchData,
  }) as { data: DealExt[] };

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
  const [stacksInfo, setStacksInfo] = React.useState<KanbanStackData[]>([]);
  const [triggerGetDealById] = useLazyGetDealByIdQuery();
  const [updateDeal] = useUpdateDealMutation();

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
      const getResult = await triggerGetDealById(id);
      const deal = ("data" in getResult ? getResult.data : undefined) as
        | DealExt
        | undefined;
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
      await updateDeal({ id, body }).unwrap();
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
        height: "100%", // Занимает всю высоту родителя
        overflow: "hidden", // Важно для вложенного скролла
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
