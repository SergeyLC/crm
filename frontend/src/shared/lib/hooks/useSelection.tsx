import * as React from "react";

export function useSelection(initial: readonly string[] = []) {
  const [selected, setSelected] = React.useState<readonly string[]>(initial);

  const isSelected = React.useCallback(
    (id: string) => selected.indexOf(id) !== -1,
    [selected]
  );

  const toggleById = React.useCallback((id: string) => {
    setSelected((prev) => {
      const selectedIndex = prev.indexOf(id);
      if (selectedIndex === -1) return [...prev, id];
      if (selectedIndex === 0) return prev.slice(1);
      if (selectedIndex === prev.length - 1) return prev.slice(0, -1);
      return [...prev.slice(0, selectedIndex), ...prev.slice(selectedIndex + 1)];
    });
  }, []);

  const handleClick = React.useCallback(
    (_: React.MouseEvent<unknown>, id: string) => {
      toggleById(id);
    },
    [toggleById]
  );

  const handleSelectAll = React.useCallback(
    (checked: boolean, rows: { id: string }[]) => {
      if (checked) {
        setSelected(rows.map((r) => r.id));
      } else {
        setSelected([]);
      }
    },
    []
  );

  const clearSelection = React.useCallback(() => setSelected([]), []);

  return {
    selected,
    setSelected,
    isSelected,
    handleClick,
    handleSelectAll,
    clearSelection,
  } as const;
}