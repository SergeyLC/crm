import {
  DealStage,
} from "@/shared/generated/prisma";

export type EnumDealStage = Omit<DealStage, "LEAD" | "WON" | "LOST">;

export type EnumDealStageType = EnumDealStage[keyof EnumDealStage];
