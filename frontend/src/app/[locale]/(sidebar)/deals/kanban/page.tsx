import React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";

import i18n from "@/shared/lib/i18n/server";
import { KanbanBoard } from "@/features/kanban";
import { DealViewSwitcher } from "@/entities/deal/DealViewSwitcher";

export const revalidate = 60;

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "de" }];
}

export default async function KanbanDealsPage({
  params,
}: {
  params: Promise<{ locale?: string }>;
}) {
  const lng = (await params)?.locale ?? "de";
  const t = i18n.getFixedT(lng, "kanban");
  const title = t("boardTitle");

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
