import React from "react";
import Container from "@mui/material/Container";
import { KanbanBoard } from "@/features/kanban/ui/KanbanBoard";
import Box from "@mui/material/Box";
import { DealViewSwitcher } from "@/entities/deal/DealViewSwitcher";
import i18n from '@/shared/lib/i18n/server';

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
        <KanbanBoard gap={3} padding={0} />
      </Box>
    </Container>
  );
}
