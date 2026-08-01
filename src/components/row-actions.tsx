import { Button } from "@/components/ui/button";

export function RowActions({
  onEdit,
  onDelete,
  deleteLabel = "Delete",
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {onEdit ? (
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>
          Edit
        </Button>
      ) : null}
      {onDelete ? (
        <Button type="button" size="sm" variant="destructive" onClick={onDelete}>
          {deleteLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function confirmDelete(entityLabel: string): boolean {
  return window.confirm(
    `Delete this ${entityLabel}? This cannot be undone.`,
  );
}
