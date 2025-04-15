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
  IconEye,
  IconPhoto,
  IconPhotoOff,
  IconReceipt,
  IconFileInvoice
} from "@tabler/icons-react";
import { Id } from "@convex/_generated/dataModel";
import { format } from "date-fns";
import { Dispatch, SetStateAction, useState, useMemo, useCallback } from "react";
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

// Custom hook to get receipt URL
function useReceiptUrl(receiptId: Id<"_storage"> | undefined) {
  return useQuery(
    api.transactions.getReceiptUrl, 
    receiptId ? { receiptId } : "skip"
  );
}

// Transaction card component (separated to handle its own hooks)
interface TransactionCardProps {
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
  handleEdit: (transaction: any) => void;
  handleDelete: (id: Id<"transactions">, description: string) => void;
  onViewReceipt: (receiptId: Id<"_storage"> | undefined) => void;
}

const TransactionCard = ({ 
  transaction, 
  handleEdit, 
  handleDelete,
  onViewReceipt
}: TransactionCardProps) => {
  // Get receipt URL for this transaction
  const receiptUrl = useReceiptUrl(transaction.receiptId);
  
  function generateRefNumber(id: string) {
    return id.slice(-12).toUpperCase();
  }
  
  return (
    <Card 
      className={`overflow-hidden border shadow-md hover:shadow-lg transition-shadow ${transaction.type === "income" ? "bg-white border-gray-200" : "bg-white border-gray-200"}`}
    >
      <CardHeader className="py-4 px-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === "income" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              <span className="text-xl">
                {transaction.category.icon || (transaction.type === "income" ? "💰" : "💸")}
              </span>
            </div>
            <div>
              <div className="font-medium">{transaction.category.name}</div>
              <div className="text-sm text-muted-foreground">{format(new Date(transaction.date), "dd MMM yyyy")}</div>
            </div>
          </div>
          
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
      
      <CardContent className="p-0">
        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between">
          <div>
            <div className={`text-xl font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(transaction.amount)}
            </div>
            <div className="text-sm text-muted-foreground truncate max-w-[180px]">
              {transaction.description}
            </div>
          </div>
          
          {receiptUrl ? (
            <div 
              className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors"
              onClick={() => onViewReceipt(transaction.receiptId)}
            >
              <img 
                src={receiptUrl} 
                alt="Receipt" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-md bg-gray-100 flex items-center justify-center text-muted-foreground border border-gray-200">
              <IconPhotoOff className="h-6 w-6" />
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">Ref:</div>
              <div className="text-xs font-medium">{generateRefNumber(transaction._id)}</div>
            </div>
            
            <Badge variant="outline" className={`text-xs ${transaction.type === "income" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {transaction.type}
            </Badge>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-0 border-t border-gray-100">
        {transaction.receiptId ? (
          <Button 
            variant="ghost"
            className="w-full rounded-none h-10 text-sm hover:bg-gray-50"
            onClick={() => onViewReceipt(transaction.receiptId)}
          >
            <IconReceipt className="h-3.5 w-3.5 mr-2" />
            View Receipt
          </Button>
        ) : (
          <Button 
            variant="ghost"
            className="w-full rounded-none h-10 text-sm opacity-50 cursor-not-allowed"
            disabled
          >
            <IconFileInvoice className="h-3.5 w-3.5 mr-2" />
            No Receipt
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

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
  
  // Get selected receipt URL for dialog
  const selectedReceiptUrl = useReceiptUrl(selectedReceiptId || undefined);
  
  // Show receipt in dialog
  const showReceipt = useCallback((receiptId: Id<"_storage"> | undefined) => {
    if (receiptId) {
      setSelectedReceiptId(receiptId);
      setReceiptDialogOpen(true);
    }
  }, []);

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
          <TransactionCard 
            key={transaction._id}
            transaction={transaction}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            onViewReceipt={showReceipt}
          />
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
            {selectedReceiptUrl ? (
              <img
                src={selectedReceiptUrl}
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