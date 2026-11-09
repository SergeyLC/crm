import React, { ReactNode } from "react";
import I18nProvider from "@/components/I18nProvider";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
