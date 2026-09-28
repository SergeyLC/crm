"use client";

import React from "react";
import { DealStageComponent } from "@/entities/deal/DealStage/DealStage";
import type { EnumDealStage } from "@/entities/deal/DealStage/types";

/** Deal-specific column formatter — kept out of base-table to avoid entity barrel pull. */
export const stageToComponentFormatter = (
  value: string | undefined,
): React.ReactNode => {
  return (
    value &&
    React.createElement(DealStageComponent, {
      stage: value as EnumDealStage,
      readOnly: true,
      compact: true,
    })
  );
};
