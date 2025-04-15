import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  IconPencil,
  IconTrash,
  IconChevronLeft,
  IconChevronRight,
  IconGripVertical,
  IconDotsVertical,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconCalendar,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Id } from "@convex/_generated/dataModel";
import { Dispatch, SetStateAction } from "react";

// Sort indicator component
const SortIndicator = ({ active = false, direction = "asc" }: { active?: boolean, direction?: "asc" | "desc" }) => {
  if (!active) return <IconArrowsSort className="h-4 w-4 text-muted-foreground" />;
  return direction === "asc" 
    ? <IconArrowUp className="h-5 w-5 text-blue-600 ml-1 font-bold" /> 
    : <IconArrowDown className="h-5 w-5 text-blue-600 ml-1 font-bold" />;
};

interface TransactionTableProps {
  page: any[];
  isDone: boolean;
  continueCursor: string | null;
  selectedRows: string[];
  setSelectedRows: Dispatch<SetStateAction<string[]>>;
  handleDelete: (id: Id<"transactions">, description: string) => void;
  handleEdit: (transaction: any) => void;
  sortByDate: boolean;
  sortByAmount: boolean;
  sortByDescription: boolean;
  sortDirection: "asc" | "desc";
  toggleSortByDate: () => void;
  toggleSortByAmount: () => void;
  toggleSortByDescription: () => void;
  pageSize: number;
  onPageSizeChange: (value: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  handleBulkDelete: () => void;
}

export function TransactionTable({
  page,
  isDone,
  continueCursor,
  selectedRows,
  setSelectedRows,
  handleDelete,
  handleEdit,
  sortByDate,
  sortByAmount,
  sortByDescription,
  sortDirection,
  toggleSortByDate,
  toggleSortByAmount,
  toggleSortByDescription,
  pageSize,
  onPageSizeChange,
  onNextPage,
  onPreviousPage,
  handleBulkDelete,
}: TransactionTableProps) {
  function toggleRowSelection(id: string) {
    setSelectedRows((prev: string[]) => 
      prev.includes(id) 
        ? prev.filter((rowId: string) => rowId !== id) 
        : [...prev, id]
    );
  }

  function toggleAllRows() {
    if (page?.length && selectedRows.length === page.length) {
      setSelectedRows([]);
    } else if (page?.length) {
      setSelectedRows(page.map(tx => tx._id));
    }
  }

  // Format date for display
  function formatDate(timestamp: number) {
    return format(new Date(timestamp), "MMM d, yyyy");
  }

  // Format amount with currency symbol
  function formatAmount(amount: number, type: "income" | "expense") {
    return type === "income" 
      ? `+$${amount.toFixed(2)}` 
      : `-$${amount.toFixed(2)}`;
  }

  return (
    <div className="rounded-lg border shadow-sm">
      {/* Bulk Actions Bar */}
      {selectedRows.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {selectedRows.length} {selectedRows.length === 1 ? 'item' : 'items'} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="destructive" 
              size="sm" 
              className="flex items-center gap-1"
              onClick={handleBulkDelete}
            >
              <IconTrash className="h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: 50 }}></TableHead>
            <TableHead style={{ width: 50 }}>
              <Checkbox
                checked={page?.length > 0 && selectedRows.length === page.length}
                onCheckedChange={toggleAllRows}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                className="flex items-center gap-1 p-0 h-auto font-medium hover:bg-transparent"
                onClick={toggleSortByDate}
              >
                <span>Date</span>
                {sortByDate && <SortIndicator active={true} direction={sortDirection} />}
              </Button>
            </TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                className="flex items-center gap-1 p-0 h-auto font-medium hover:bg-transparent"
                onClick={toggleSortByDescription}
              >
                <span>Description</span>
                {sortByDescription && <SortIndicator active={true} direction={sortDirection} />}
              </Button>
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                className="flex items-center gap-1 p-0 h-auto font-medium hover:bg-transparent"
                onClick={toggleSortByAmount}
              >
                <span>Amount</span>
                {sortByAmount && <SortIndicator active={true} direction={sortDirection} />}
              </Button>
            </TableHead>
            <TableHead style={{ width: 50 }}></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="min-h-[400px]">
          {page?.length > 0 ? (
            page.map((transaction) => (
              <TableRow key={transaction._id} className="hover:bg-muted/50">
                <TableCell className="p-0 pl-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <IconGripVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
                <TableCell className="p-0">
                  <Checkbox
                    checked={selectedRows.includes(transaction._id)}
                    onCheckedChange={() => toggleRowSelection(transaction._id)}
                    aria-label={`Select ${transaction.description}`}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(transaction.date)}</span>
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px] truncate font-medium">
                  {transaction.description}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-xl" aria-hidden="true">
                      {transaction.category.icon || '📁'}
                    </span>
                    <span>{transaction.category.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${transaction.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}>
                  {formatAmount(transaction.amount, transaction.type)}
                </TableCell>
                <TableCell className="p-0">
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
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground h-[400px] align-middle">
                No transactions found
              </TableCell>
            </TableRow>
          )}
          {page === undefined && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-6 text-muted-foreground h-[400px] align-middle">
                Loading...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      
      <div className="flex items-center justify-between py-4 px-4 border-t">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page</span>
          <Select
            value={pageSize.toString()}
            onValueChange={onPageSizeChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreviousPage}
            disabled={continueCursor === null}
          >
            <IconChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={isDone || !continueCursor || page?.length === 0}
          >
            Next
            <IconChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
} 