import React, { useState, useCallback, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  IconDotsVertical, 
  IconPencil, 
  IconTrash, 
  IconChevronLeft,
  IconChevronRight,
  IconPhotoOff,
  IconReceipt,
  IconFileInvoice
} from "@tabler/icons-react";
import { Id } from "@convex/_generated/dataModel";
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ReceiptGalleryProps {
  page: any[];
  isDone: boolean;
  continueCursor: string | null;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
  handleDelete: (id: Id<"transactions">, description: string) => void;
  handleEdit: (transaction: any) => void;
  pageSize: number;
  onPageSizeChange: (value: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  isFirstPage: boolean;
}

// Custom hook to get receipt URL
function useReceiptUrl(receiptId: Id<"_storage"> | undefined) {
  return useQuery(
    api.transactions.getReceiptUrl, 
    receiptId ? { receiptId } : "skip"
  );
}

// Receipt Card component
interface ReceiptCardProps {
  transaction: {
    _id: Id<"transactions">;
    amount: number;
    description: string;
    date: number;
    type: "income" | "expense";
    receiptId?: Id<"_storage">;
    category: {
      _id: Id<"categories">;
      name: string;
      icon?: string;
      color?: string;
    };
  };
  isSelected: boolean;
  onSelect: (id: string, isSelected: boolean) => void;
  handleEdit: (transaction: any) => void;
  handleDelete: (id: Id<"transactions">, description: string) => void;
  onViewReceipt: (transaction: any) => void;
}

const ReceiptCard = ({ 
  transaction, 
  isSelected,
  onSelect,
  handleEdit, 
  handleDelete,
  onViewReceipt
}: ReceiptCardProps) => {
  // Get receipt URL for this transaction
  const receiptUrl = useReceiptUrl(transaction.receiptId);
  
  function generateRefNumber(id: string) {
    return id.slice(-8).toUpperCase();
  }
  
  // Format date
  const formattedDate = format(new Date(transaction.date), "MMM dd, yyyy");
  
  return (
    <div className="group relative">
      <div className={cn(
        "absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity",
        isSelected && "opacity-100"
      )}>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(transaction._id, !!checked)}
          className="h-5 w-5 bg-background/80 backdrop-blur"
        />
      </div>

      <div 
        className={cn(
          "relative aspect-[3/4] border rounded-md overflow-hidden transition-all duration-200 group-hover:shadow-lg group-hover:scale-[1.02] cursor-pointer",
          isSelected 
            ? "ring-2 ring-primary border-primary shadow-md" 
            : "border-border hover:border-muted-foreground/25"
        )}
        onClick={() => onViewReceipt(transaction)}
      >
        {/* Receipt background */}
        <div className="absolute inset-0 bg-card overflow-hidden">
          {receiptUrl ? (
            <div className="h-full">
              <img
                src={receiptUrl}
                alt="Receipt"
                className="h-full w-full object-cover"
              />
              {/* Gradient overlay to make content readable */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-background/20" />
            </div>
          ) : (
            <div className="h-full bg-muted/20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <IconPhotoOff className="h-8 w-8" />
                <span className="text-xs">No receipt image</span>
              </div>
            </div>
          )}
        </div>

        {/* Receipt header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
          <Badge 
            variant={transaction.type === "income" ? "default" : "destructive"} 
            className={cn(
              "text-xs font-normal", 
              transaction.type === "income" && "bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-800/20 dark:text-green-400 dark:hover:bg-green-800/30"
            )}
          >
            {transaction.type}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm">
                <IconDotsVertical className="h-3.5 w-3.5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                <IconPencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(transaction._id, transaction.description);
                }}
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Receipt content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col gap-3 bg-gradient-to-t from-background via-background/90 to-transparent z-10">
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">{formattedDate}</div>
            <div className="font-semibold line-clamp-1 text-sm">{transaction.description}</div>
            <div className="flex items-center">
              <span className="text-xs font-medium mr-2 opacity-70">Category:</span>
              <div className="flex items-center gap-1">
                <span className="text-sm">{transaction.category.icon}</span>
                <span className="text-xs font-medium">{transaction.category.name}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs flex items-center opacity-80">
              <span>#{generateRefNumber(transaction._id)}</span>
            </div>
            <div className={cn(
              "text-base font-bold",
              transaction.type === "income" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
            )}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(transaction.amount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export function ReceiptGallery({
  page,
  isDone,
  continueCursor,
  selectedRows,
  setSelectedRows,
  handleDelete,
  handleEdit,
  pageSize,
  onPageSizeChange,
  onNextPage,
  onPreviousPage,
  isFirstPage,
}: ReceiptGalleryProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  
  // Get selected receipt URL for modal
  const selectedReceiptUrl = useReceiptUrl(selectedTransaction?.receiptId);
  
  // Toggle row selection
  const toggleRowSelection = useCallback((id: string, isSelected: boolean) => {
    setSelectedRows(prev => 
      isSelected 
        ? [...prev, id]
        : prev.filter(rowId => rowId !== id)
    );
  }, [setSelectedRows]);
  
  // Show receipt details in modal
  const showReceiptDetails = useCallback((transaction: any) => {
    setSelectedTransaction(transaction);
    setReceiptModalOpen(true);
  }, []);
  
  // Close modal when navigating pages
  useEffect(() => {
    setReceiptModalOpen(false);
  }, [page]);

  if (!page || page.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="p-8 border border-dashed rounded-lg text-center max-w-md mx-auto">
          <IconReceipt className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No receipts found</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or create a new receipt to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gallery grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-6">
        {page.map((transaction) => (
          <ReceiptCard 
            key={transaction._id}
            transaction={transaction}
            isSelected={selectedRows.includes(transaction._id)}
            onSelect={toggleRowSelection}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            onViewReceipt={showReceiptDetails}
          />
        ))}
      </div>
      
      {/* Receipt Modal */}
      <Dialog open={receiptModalOpen} onOpenChange={setReceiptModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Receipt Image */}
            <div className="bg-muted/20 border rounded-md flex items-center justify-center p-2 min-h-[300px]">
              {selectedReceiptUrl ? (
                <img
                  src={selectedReceiptUrl}
                  alt="Receipt"
                  className="max-w-full max-h-[500px] object-contain rounded-md"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <IconPhotoOff className="h-12 w-12" />
                  <span>No receipt image available</span>
                </div>
              )}
            </div>
            
            {/* Receipt Details */}
            <div className="flex flex-col overflow-auto">
              {selectedTransaction && (
                <div className="space-y-4 p-1">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium leading-none">
                      Transaction Information
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      Details about this transaction.
                    </div>
                  </div>
                  
                  <div className="grid gap-3">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-muted-foreground">Description</div>
                      <div className="font-medium">{selectedTransaction.description}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground">Amount</div>
                        <div className={cn(
                          "font-bold",
                          selectedTransaction.type === "income" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
                        )}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(selectedTransaction.amount)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground">Type</div>
                        <Badge 
                          variant={selectedTransaction.type === "income" ? "default" : "destructive"}
                          className={cn(
                            selectedTransaction.type === "income" && "bg-green-100 hover:bg-green-200 text-green-800 dark:bg-green-800/20 dark:text-green-400 dark:hover:bg-green-800/30"
                          )}
                        >
                          {selectedTransaction.type}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground">Date</div>
                        <div className="font-medium">
                          {format(new Date(selectedTransaction.date), "MMMM dd, yyyy")}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground">Category</div>
                        <div className="flex items-center gap-1.5">
                          <span>{selectedTransaction.category.icon}</span>
                          <span>{selectedTransaction.category.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-muted-foreground">Reference Number</div>
                      <code className="bg-muted px-2 py-1 rounded text-xs">
                        {selectedTransaction._id}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleEdit(selectedTransaction)}
              >
                <IconPencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  handleDelete(selectedTransaction._id, selectedTransaction.description);
                  setReceiptModalOpen(false);
                }}
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <Button variant="default" onClick={() => setReceiptModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={isFirstPage}
            className="h-8 w-8 p-0"
          >
            <IconChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous</span>
          </Button>
          
          <span className="text-sm text-muted-foreground px-2">
            {page.length} {page.length === 1 ? 'receipt' : 'receipts'} {!isDone ? "(more available)" : ""}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={isDone}
            className="h-8 w-8 p-0"
          >
            <IconChevronRight className="h-4 w-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            className="h-8 rounded-md border border-input bg-background text-foreground px-2 text-xs"
            value={pageSize.toString()}
            onChange={(e) => onPageSizeChange(e.target.value)}
          >
            <option value="12">12 per page</option>
            <option value="24">24 per page</option>
            <option value="36">36 per page</option>
            <option value="48">48 per page</option>
          </select>
        </div>
      </div>
    </div>
  );
} 