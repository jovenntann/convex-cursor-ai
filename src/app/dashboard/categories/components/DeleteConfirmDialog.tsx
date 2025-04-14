"use client";

import { Id } from "@convex/_generated/dataModel";
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

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  categoryToDelete: { id: Id<"categories">; name: string } | null;
  bulkDelete: boolean;
  selectedRowsCount: number;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  categoryToDelete,
  bulkDelete,
  selectedRowsCount,
}: DeleteConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete {bulkDelete ? 'Categories' : 'Category'}</DialogTitle>
          <DialogDescription>
            {bulkDelete 
              ? `Are you sure you want to delete ${selectedRowsCount} categories? This action cannot be undone.`
              : `Are you sure you want to delete "${categoryToDelete?.name}"? This action cannot be undone.`
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 py-3">
          <IconTrash className="h-5 w-5 text-destructive" />
          <span className="text-sm text-muted-foreground">
            All data associated with {bulkDelete ? 'these categories' : 'this category'} will be permanently deleted.
          </span>
        </div>
        
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Delete {bulkDelete ? 'Categories' : 'Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 