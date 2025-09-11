import { Group } from "@/entities/pipeline/model/types";
import { SelectItemsDialog } from "@/shared/ui/SelectItemsDialog";

interface SelectGroupsDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (groupIds: string[]) => void;
  availableGroups: Group[];
  title?: string;
  submitLabel?: string;
}

export const SelectGroupsDialog: React.FC<SelectGroupsDialogProps> = ({
  open,
  onClose,
  onSubmit,
  availableGroups,
}) => {
  return (
    <SelectItemsDialog<Group>
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      items={availableGroups}
    //   title={title}
    //   submitLabel={submitLabel}
      translationNamespace="SelectGroupsDialog"
      searchPlaceholder="searchGroups"
      noItemsFoundText="noGroupsFound"
      noAvailableItemsText="noAvailableGroups"
      renderPrimary={(group) => group.name}
      renderSecondary={(group) => group.description}
    />
  );
};