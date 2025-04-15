import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconTrash } from "@tabler/icons-react";
import { Id } from "@convex/_generated/dataModel";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  transactionToDelete: { id: Id<"transactions">; description: string } | null;
  bulkDelete: boolean;
  selectedRowsCount: number;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  transactionToDelete,
  bulkDelete,
  selectedRowsCount,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete {bulkDelete ? 'Transactions' : 'Transaction'}</DialogTitle>
          <DialogDescription>
            {bulkDelete 
              ? `Are you sure you want to delete ${selectedRowsCount} transactions? This action cannot be undone.`
              : `Are you sure you want to delete "${transactionToDelete?.description}"? This action cannot be undone.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 py-3">
          <IconTrash className="h-5 w-5 text-destructive" />
          <span className="text-sm text-muted-foreground">
            All data associated with {bulkDelete ? 'these transactions' : 'this transaction'} will be permanently deleted.
          </span>
        </div>
        
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete {bulkDelete ? 'Transactions' : 'Transaction'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 