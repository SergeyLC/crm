"use client";

import React, { useMemo, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/lib/i18n/client";

/**
 * Always wrap with I18nextProvider (same tree on server + client).
 * Locale comes from the URL segment via the server layout — not localStorage —
 * so the first client render matches SSR (avoids React #418).
 */
export function I18nProvider({
  children,
  locale = "de",
}: {
  children: React.ReactNode;
  locale?: string;
}) {
  const lng = locale === "en" ? "en" : "de";

  const i18nInstance = useMemo(
    () => i18n.cloneInstance({ lng }),
    [lng],
  );

  useEffect(() => {
    // Keep the singleton in sync for modules that import it directly.
    if (i18n.language !== lng) {
      void i18n.changeLanguage(lng);
    }
  }, [lng]);

  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
}

export default I18nProvider;
