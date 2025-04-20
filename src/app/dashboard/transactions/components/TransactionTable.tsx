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
  isMobile?: boolean;
}

export default function TransactionTable({
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
  isMobile
}: TransactionTableProps) {

  function toggleRowSelection(id: string) {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id) 
        : [...prev, id]
    );
  }

  function toggleAllRows() {
    if (page && page.length > 0 && selectedRows.length === page.length) {
      setSelectedRows([]);
    } else if (page && page.length > 0) {
      setSelectedRows(page.map(transaction => transaction._id));
    }
  }

  // List of columns to hide on mobile
  const mobileHiddenCols = ["category", "date"];
  
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
          <Button 
            variant="destructive" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={handleBulkDelete}
          >
            <IconTrash className="h-4 w-4" />
            <span>Delete</span>
          </Button>
        </div>
      )}
      
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 40 }}>
                <Checkbox
                  checked={page && page.length > 0 && selectedRows.length === page.length}
                  onCheckedChange={toggleAllRows}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className={isMobile ? "hidden" : ""}>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-1 p-0 h-auto font-medium hover:bg-transparent"
                  onClick={toggleSortByDate}
                >
                  <span>Date</span>
                  <SortIndicator active={sortByDate} direction={sortDirection} />
                </Button>
              </TableHead>
              <TableHead className={isMobile ? "hidden" : ""}>Category</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-1 p-0 h-auto font-medium hover:bg-transparent"
                  onClick={toggleSortByDescription}
                >
                  <span>Description</span>
                  <SortIndicator active={sortByDescription} direction={sortDirection} />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  className="flex items-center gap-1 p-0 h-auto font-medium hover:bg-transparent ml-auto"
                  onClick={toggleSortByAmount}
                >
                  <span>Amount</span>
                  <SortIndicator active={sortByAmount} direction={sortDirection} />
                </Button>
              </TableHead>
              <TableHead style={{ width: 40 }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page && page.length > 0 ? (
              page.map((transaction) => (
                <TableRow key={transaction._id} className="hover:bg-muted/50">
                  <TableCell className="p-0 pl-4">
                    <Checkbox
                      checked={selectedRows.includes(transaction._id)}
                      onCheckedChange={() => toggleRowSelection(transaction._id)}
                      aria-label={`Select ${transaction.description}`}
                    />
                  </TableCell>
                  <TableCell className={isMobile ? "hidden" : ""}>
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className={isMobile ? "hidden" : ""}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg" aria-hidden="true">
                        {transaction.category.icon || '📁'}
                      </span>
                      <span>{transaction.category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.description}</div>
                      {isMobile && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <span>{transaction.category.icon || '📁'}</span>
                          <span>{transaction.category.name}</span>
                          <span>•</span>
                          <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                          <Badge 
                            variant="outline" 
                            className={`ml-1 text-xs ${
                              transaction.type === "income" 
                                ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" 
                                : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                            }`}
                          >
                            {transaction.type}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={transaction.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
                      {transaction.type === "income" ? "+" : "-"}${Math.abs(transaction.amount).toFixed(2)}
                    </span>
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
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground h-[400px] align-middle">
                  {page === undefined ? 'Loading...' : 'No transactions found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between py-4 px-4 border-t gap-3 md:gap-2">
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
        <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3">
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            onClick={onPreviousPage}
            disabled={!page || page.length === 0}
            className="min-w-[100px] md:min-w-0 h-10 md:h-8 flex-1 md:flex-initial"
          >
            <IconChevronLeft className="h-4 w-4 mr-2" />
            {isMobile ? "Prev" : "Previous"}
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            onClick={onNextPage}
            disabled={isDone || !continueCursor || !page || page.length === 0}
            className="min-w-[100px] md:min-w-0 h-10 md:h-8 flex-1 md:flex-initial"
          >
            {isMobile ? "Next" : "Next"}
            <IconChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
} 