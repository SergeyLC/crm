import React, { ReactNode } from "react";
import I18nProvider from "@/components/I18nProvider";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await params; // Still await to avoid unused variable warning

  return <I18nProvider>{children}</I18nProvider>;
}
