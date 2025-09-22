import React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";

import i18n from '@/shared/lib/i18n/server';
import { KanbanBoard } from "@/features/kanban";
import { DealViewSwitcher } from "@/entities/deal";
import { ssrFetch } from "@/shared/api";
import { DealExt } from "@/entities/deal";

// Generating static pages only for en and de
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'de' },
  ];
}

// ISR configuration - will be ignored in development
export const revalidate = 60;

export default async function KanbanDealsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const lng = (await params)?.locale ?? "de";
  // getFixedT returns a t function bound to the language + namespace
  const t = i18n.getFixedT(lng, "kanban");
  const title = t("boardTitle");

  // New translations from locale files
  // These translations will be available in components via i18n
  // with the namespace "kanban"
  const deals = await ssrFetch<DealExt[]>("deals");

  return (
    <Container
      maxWidth={false}
      component="main"
      disableGutters
      sx={{
        p: 2,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: 0, flexShrink: 0 }}>
        <DealViewSwitcher title={title} />
      </Box>
      <Box
        sx={{
          display: "flex",
          flexGrow: 1,
          mt: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <KanbanBoard initialDeals={deals || undefined} gap={3} padding={0} />
      </Box>
    </Container>
  );
}
