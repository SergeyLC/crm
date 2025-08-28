"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import { Theme } from "@mui/material/styles";
import { KanbanCard, KanbanCardData } from "@/entities/kanban";
import { currencyFormatter } from "@/shared/lib";

export type KanbanStackProps = {
  title: string;
  cards: KanbanCardData[];
  className?: string;
  compact?: boolean;
  isDropTarget?: boolean;
  // optional renderer - allows wrapping cards in Draggable when used by KanbanBoard
  renderCard?: (card: KanbanCardData, index: number) => React.ReactNode;
};

export const KanbanStack: React.FC<KanbanStackProps> = React.memo(
  function KanbanStack({
    title,
    cards,
    className,
    compact = true,
    isDropTarget = false,
    renderCard,
  }) {
    const total = React.useMemo(
      () =>
        cards.reduce(
          (acc, c) =>
            acc + (typeof c.potentialValue === "number" ? c.potentialValue : 0),
          0
        ),
      [cards]
    );

    const formattedTotal = React.useMemo(
      () => currencyFormatter(total),
      [total]
    );

    return (
      <Paper
        className={className}
        variant="outlined"
        sx={{
          // width: compact ? 200 : 300,
          display: "flex",
          flexDirection: "column",
          p: 1,
          height: "100%",
          boxSizing: "border-box",
          bgcolor: isDropTarget 
            ? "rgba(25, 118, 210, 0.05)"
            : (theme: Theme) =>
                theme.palette.mode === "dark"
                  ? theme.palette.background.paper
                  : theme.palette.grey[100],
          transition: "background-color 0.2s ease",
        }}
      >
        <Box sx={{ mb: 1, pl: 1.2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, lineHeight: 1.1 }}
          >
            {title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="caption" color="text.primary">
              {formattedTotal}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {cards.length} {cards.length === 1 ? "card" : "cards"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <Stack
          sx={{
            gap: 1,
            flex: 1,
            minHeight: 0,
            overflowX: "visible",
            overflowY: "clip",
            alignSelf: "stretch",
            pr: 0.5,
          }}
        >
          {cards.map((c, i) =>
            renderCard ? renderCard(c, i) : <KanbanCard key={c.id} data={c} />
          )}
        </Stack>
      </Paper>
    );
  }
);

export default KanbanStack;
