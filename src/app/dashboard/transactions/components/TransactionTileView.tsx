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
  IconChevronRight
} from "@tabler/icons-react";
import { Id } from "@convex/_generated/dataModel";
import { format } from "date-fns";
import { Dispatch, SetStateAction } from "react";

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

  if (!page || page.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {page.map((transaction) => (
          <Card 
            key={transaction._id}
            className={`overflow-hidden transition-all ${transaction.type === "income" ? "border-green-200" : "border-red-200"}`}
          >
            <CardHeader className={`${transaction.type === "income" ? "bg-green-50" : "bg-red-50"} py-4 px-4 gap-0 flex flex-col items-center justify-center`}>
              <div className="mb-2">
                <span className="text-3xl">
                  {transaction.category.icon || (transaction.type === "income" ? "💰" : "💸")}
                </span>
              </div>
              <CardTitle className="text-center text-lg">
                Payment {transaction.type === "income" ? "Received" : "Sent"}!
              </CardTitle>
              <span className={`text-2xl font-bold ${transaction.type === "income" ? "text-green-600" : "text-red-600"} mt-1`}>
                {formatAmount(transaction.amount)}
              </span>
            </CardHeader>
            
            <CardContent className="py-4 px-4 flex flex-col gap-3">
              <div className="grid grid-cols-[1fr_1fr] gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Ref Number</div>
                  <div className="text-sm font-medium">{generateRefNumber(transaction._id)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Payment Time</div>
                  <div className="text-sm font-medium">{formatDate(transaction.date)}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-[1fr_1fr] gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Payment Method</div>
                  <div className="text-sm font-medium">{transaction.category.name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Sender Name</div>
                  <div className="text-sm font-medium truncate">
                    {transaction.description.length > 20 
                      ? transaction.description.substring(0, 20) + "..." 
                      : transaction.description}
                  </div>
                </div>
              </div>
              
              <div className="mt-1">
                <div className="text-xs text-muted-foreground">Description</div>
                <div className="text-sm font-medium">{transaction.description}</div>
              </div>
            </CardContent>
            
            <CardFooter className="px-4 py-3 border-t flex justify-between items-center bg-muted/50">
              <Badge 
                variant="outline" 
                className={`text-xs ${transaction.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {transaction.type}
              </Badge>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  title="Download Receipt"
                >
                  <IconDownload className="h-4 w-4" />
                </Button>
                
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
            </CardFooter>
          </Card>
        ))}
      </div>
      
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