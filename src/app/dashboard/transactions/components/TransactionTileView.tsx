import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  IconDotsVertical, 
  IconPencil, 
  IconTrash, 
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconEye
} from "@tabler/icons-react";
import { Id } from "@convex/_generated/dataModel";
import { format } from "date-fns";
import { Dispatch, SetStateAction, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface TransactionTileViewProps {
  page: any[];
  isDone: boolean;
  continueCursor: string | null;
  selectedRows: string[];
  setSelectedRows: Dispatch<SetStateAction<string[]>>;
  handleDelete: (id: Id<"transactions">, description: string) => void;
  handleEdit: (transaction: any) => void;
  pageSize: number;
  onPageSizeChange: (value: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  isFirstPage: boolean;
}

export function TransactionTileView({
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
}: TransactionTileViewProps) {
  const [selectedReceiptId, setSelectedReceiptId] = useState<Id<"_storage"> | null>(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  
  // Get receipt URL with useQuery
  const receiptUrl = useQuery(
    api.transactions.getReceiptUrl, 
    selectedReceiptId ? { receiptId: selectedReceiptId } : "skip"
  );

  // Format date for display
  function formatDate(timestamp: number) {
    return format(new Date(timestamp), "dd MMM yyyy, HH:mm");
  }

  // Format amount with currency symbol
  function formatAmount(amount: number) {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount);
  }

  // Generate a reference number (simplified for demo)
  function generateRefNumber(id: string) {
    // Take the last 12 characters of the ID to create a reference number
    return id.slice(-12).toUpperCase();
  }

  // Show receipt in dialog
  function showReceipt(receiptId: Id<"_storage"> | undefined) {
    if (receiptId) {
      setSelectedReceiptId(receiptId);
      setReceiptDialogOpen(true);
    }
  }

  if (!page || page.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {page.map((transaction) => (
          <Card 
            key={transaction._id}
            className={`overflow-hidden border ${transaction.type === "income" ? "bg-white border-gray-100" : "bg-white border-gray-100"}`}
          >
            <CardHeader className={`py-6 px-4 gap-2 flex flex-col items-center justify-center relative`}>
              <div className="mb-2">
                <span className="text-4xl">
                  {transaction.category.icon || (transaction.type === "income" ? "💰" : "💸")}
                </span>
              </div>
              <CardTitle className="text-center text-xl">
                {transaction.type === "income" ? "Income" : "Expense"}
              </CardTitle>
              
              <div className="absolute right-3 top-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <IconDotsVertical className="h-4 w-4" />
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
                      onClick={() => handleDelete(transaction._id, transaction.description)}
                    >
                      <IconTrash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <div className="w-full border-t border-gray-100"></div>
            
            <CardContent className="p-0">
              <div className="pt-4 text-center">
                <div className="text-sm text-muted-foreground">
                  Total Amount
                </div>
                <div className={`text-2xl font-bold mt-1 ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {formatAmount(transaction.amount)}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4 px-3">
                <div className="rounded-lg border border-gray-100 p-3">
                  <div className="text-xs text-muted-foreground">Ref Number</div>
                  <div className="text-sm font-medium">{generateRefNumber(transaction._id)}</div>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <div className="text-xs text-muted-foreground">Transaction Date</div>
                  <div className="text-sm font-medium">{format(new Date(transaction.date), "dd MMM yyyy")}</div>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div className="text-sm font-medium">{transaction.category.name}</div>
                </div>
                <div className="rounded-lg border border-gray-100 p-3">
                  <div className="text-xs text-muted-foreground">Description</div>
                  <div className="text-sm font-medium truncate">
                    {transaction.description}
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-4 mt-3 flex justify-center">
              {transaction.receiptId ? (
                <Button 
                  variant="outline"
                  className={`w-full flex items-center justify-center gap-2 ${transaction.type === "income" ? "border-green-200 hover:bg-green-50" : "border-red-200 hover:bg-red-50"}`}
                  onClick={() => showReceipt(transaction.receiptId)}
                >
                  <IconEye className="h-4 w-4" />
                  Show Receipt
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  className={`w-full flex items-center justify-center gap-2 opacity-50 cursor-not-allowed ${transaction.type === "income" ? "border-green-200" : "border-red-200"}`}
                  disabled
                >
                  <IconEye className="h-4 w-4" />
                  No Receipt Available
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
            <DialogDescription>
              View the receipt for this transaction.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-4">
            {receiptUrl ? (
              <img
                src={receiptUrl}
                alt="Transaction Receipt"
                className="max-w-full max-h-[500px] object-contain rounded-md border"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <IconDownload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Loading receipt...</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Pagination */}
      <div className="flex items-center justify-between border-t pt-4">
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
            {page.length} {page.length === 1 ? 'item' : 'items'} {!isDone ? "(more available)" : ""}
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
            className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            value={pageSize.toString()}
            onChange={(e) => onPageSizeChange(e.target.value)}
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </div>
    </div>
  );
} 