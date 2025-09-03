import { Theme } from "@mui/material/styles";

/**
 * Creates sticky styles for table elements
 */
export const createStickySx = () => ({
  position: "sticky",
  zIndex: (theme: Theme) => theme.zIndex.appBar + 2,
  background: (theme: Theme) => theme.palette.background.paper,
  boxSizing: "border-box",
});

/**
 * Creates table styles for consistent appearance
 */
export const createTableSx = () => ({
  width: "100%",
  minWidth: "800px",
  tableLayout: "fixed",
  // border: "none",
  borderCollapse: "collapse",
  "& th": {
    border: "1px solid rgba(224, 224, 224, 1)",
    padding: "6px",
    height: "24px",
    lineHeight: "1.2",
    fontWeight: 700,
    boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
    backgroundColor: "rgba(232, 238, 243, 1)",
  },
  "& td": {
    border: "1px solid rgba(224, 224, 224, 1)",
    padding: "6px",
    height: "24px",
    lineHeight: "1.2",
    minWidth: "800px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
});
