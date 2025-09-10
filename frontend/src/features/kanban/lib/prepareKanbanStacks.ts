import { DealExt } from "@/entities/deal";
import { KanbanStackData } from "@/entities/kanban";
import { DealStage } from "@/shared/generated/prisma";
import { TFunction } from "i18next";

const stacksBaseInfo: { id: DealStage; key: string }[] = [
  { id: "QUALIFIED", key: "qualified" },
  { id: "CONTACTED", key: "contacted" },
  { id: "DEMO_SCHEDULED", key: "demoScheduled" },
  { id: "PROPOSAL_SENT", key: "proposalSent" },
  { id: "NEGOTIATION", key: "negotiation" },
];

/**
 * Prepares kanban stacks from deals data
 */
export const prepareStacks = (
  deals: DealExt[],
  t: TFunction
): KanbanStackData[] =>
  stacksBaseInfo.map((info) => ({
    id: info.id,
    title: t(`stages.${info.key}`),
    cards: deals
      .filter((deal) => deal.stage === info.id)
      .map((deal) => ({
        id: deal.id,
        title: deal.title,
        clientName: deal.contact?.name ?? "",
        potentialValue: deal.potentialValue,
      })),
    compact: true,
  }));
