export const currencyFormatter = (
  value?: number | string | null,
  currency: string = "EUR",
  locale: string = "de-DE"
) =>
  value
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        currencyDisplay: "symbol",
      }).format(Number(value))
    : null;
