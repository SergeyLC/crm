import React from "react";
import { BaseTableRowData } from "../model/types";
import { currencyFormatter as defaultCurrencyFormatter, formatDate } from "@/shared/lib/";
import { EnumDealStage, DealStageComponent } from "@/entities/deal";

export function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

export function getComparator<TO, T>(
  order: TO,
  orderBy: keyof T
): (a: T, b: T) => number {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export type TConvertSrcDataToDataRows<T, TTableData extends BaseTableRowData> = (
  src: T[]
) => TTableData[];

export function defaultConvertSrcDataToDataRows<
  T,
  TTableData extends BaseTableRowData,
>(src: T[]): TTableData[] {
  return src.map(
    () =>
      ({
        id: "defaultConvertSrcDataToDataRows should be implemented",
      }) as TTableData
  );
}

export const currencyFormatter = <T extends BaseTableRowData>(
  value: number | string | null | undefined,
  row: T,
  currency: string = "EUR",
  locale: string = "de-DE"
): React.ReactNode =>
  value
    ? defaultCurrencyFormatter(value, currency, locale)
    : null;

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

export const dateFormatter = <T extends BaseTableRowData>(
  value: Date | string,
  row: T,
  locale: string = "de-DE"
): React.ReactNode => (value ? formatDate(value, locale) as string : null);
