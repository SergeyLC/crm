import { KanbanCardData } from "../KanbanCard";

export type KanbanStackData = {
  id?: string;
  title: string;
  cards: KanbanCardData[];
  compact?: boolean;
  width?: number; // optional override for stack width
};
