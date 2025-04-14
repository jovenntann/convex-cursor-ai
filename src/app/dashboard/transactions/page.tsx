"use client";

import { useState, useEffect } from "react";
import { api } from "@convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@convex/_generated/dataModel";
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
  IconFilter,
  IconSearch,
  IconX,
  IconPlus,
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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";

export default function TransactionsPage() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortByAmount, setSortByAmount] = useState(false);
  const [sortByDate, setSortByDate] = useState(false);
  const [sortByDescription, setSortByDescription] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [typeFilter, setTypeFilter] = useState<"income" | "expense" | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<Id<"categories"> | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: Id<"transactions">; description: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkDelete, setBulkDelete] = useState(false);
  
  // Get mutations
  const deleteTransaction = useMutation(api.transactions.remove);
  
  // Get categories for filter dropdown
  const categories = useQuery(api.categories.getAll) || [];
  
  // Refresh data function
  const refreshData = () => setDataRefreshKey(prev => prev + 1);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset cursor when search changes
      setCursor(null);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { page, isDone, continueCursor } = useQuery(api.transactions.getAllPaginated, {
    paginationOpts: {
      numItems: pageSize,
      cursor: cursor,
    },
    sortByAmount,
    sortByDate,
    sortByDescription,
    sortDirection,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(categoryFilter ? { categoryId: categoryFilter } : {}),
    ...(debouncedSearchQuery ? { searchQuery: debouncedSearchQuery } : {})
  }) || { page: [], isDone: true, continueCursor: null };

  function handleNextPage() {
    if (!isDone && continueCursor) {
      setCursor(continueCursor);
    }
  }

  function handlePreviousPage() {
    // Reset to first page
    setCursor(null);
  }

  function toggleRowSelection(id: string) {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id) 
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

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setCursor(null); // Reset to first page when changing page size
  }
  
  function toggleSortByDate() {
    if (sortByDate) {
      // If already sorting by date, toggle direction
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Start sorting by date
      setSortByDate(true);
      setSortByAmount(false);
      setSortByDescription(false);
    }
    setCursor(null); // Reset to first page
  }

  function toggleSortByAmount() {
    if (sortByAmount) {
      // If already sorting by amount, toggle direction
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Start sorting by amount
      setSortByAmount(true);
      setSortByDate(false);
      setSortByDescription(false);
    }
    setCursor(null); // Reset to first page
  }
  
  function toggleSortByDescription() {
    if (sortByDescription) {
      // If already sorting by description, toggle direction
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Start sorting by description
      setSortByDescription(true);
      setSortByDate(false);
      setSortByAmount(false);
    }
    setCursor(null); // Reset to first page
  }

  function handleTypeFilterChange(value: string) {
    if (value === "all") {
      setTypeFilter(null);
    } else {
      setTypeFilter(value as "income" | "expense");
    }
    setCursor(null); // Reset to first page when changing filter
  }
  
  function handleCategoryFilterChange(value: string) {
    if (value === "all") {
      setCategoryFilter(null);
    } else {
      setCategoryFilter(value as Id<"categories">);
    }
    setCursor(null); // Reset to first page when changing filter
  }
  
  function clearSearch() {
    setSearchQuery("");
    setCursor(null);
  }

  // Sort indicator component
  const SortIndicator = ({ active = false, direction = "asc" }: { active?: boolean, direction?: "asc" | "desc" }) => {
    if (!active) return <IconArrowsSort className="h-4 w-4 text-muted-foreground" />;
    return direction === "asc" 
      ? <IconArrowUp className="h-5 w-5 text-blue-600 ml-1 font-bold" /> 
      : <IconArrowDown className="h-5 w-5 text-blue-600 ml-1 font-bold" />;
  };
  
  // Handle delete confirmation for a transaction
  function handleDelete(id: Id<"transactions">, description: string) {
    setTransactionToDelete({ id, description });
    setShowDeleteConfirm(true);
    setBulkDelete(false);
  }
  
  // Handle bulk delete confirmation
  function handleBulkDelete() {
    if (selectedRows.length === 0) return;
    
    setBulkDelete(true);
    setShowDeleteConfirm(true);
  }
  
  // Perform the delete after confirmation
  async function confirmDelete() {
    try {
      if (bulkDelete) {
        // Handle bulk delete
        for (const id of selectedRows) {
          await deleteTransaction({ id: id as Id<"transactions"> });
        }
        
        toast.success(`Transactions Deleted`, {
          description: `${selectedRows.length} transactions were successfully deleted`,
          duration: 5000,
        });
        
        // Clear the selection
        setSelectedRows([]);
      } else if (transactionToDelete) {
        // Handle single delete
        await deleteTransaction({ id: transactionToDelete.id });
        
        toast.success(`Transaction Deleted`, {
          description: `"${transactionToDelete.description}" was successfully deleted`,
          duration: 5000,
        });
        
        // Clear the selection if this transaction was selected
        setSelectedRows(prev => prev.filter(id => id !== transactionToDelete.id));
      }
      
      // Close the dialog and reset deletion state
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
      setBulkDelete(false);
      
      // Refresh the data
      refreshData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to Delete Transactions", {
        description: "There was a problem deleting the transactions. Please try again.",
      });
    }
  }
  
  // Close the delete confirmation dialog
  function cancelDelete() {
    setShowDeleteConfirm(false);
    setTransactionToDelete(null);
    setBulkDelete(false);
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
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <Button className="flex items-center gap-1">
            <IconPlus className="h-4 w-4" />
            New Transaction
          </Button>
        </div>
        
        <div className="px-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort:</span>
              <Button 
                variant={sortByDate ? "default" : "outline"} 
                size="sm"
                onClick={toggleSortByDate}
                className={`flex items-center gap-1 ${sortByDate ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-400" : ""}`}
              >
                <span className="font-medium">By Date</span>
                {sortByDate && <SortIndicator active={true} direction={sortDirection} />}
              </Button>
              <Button 
                variant={sortByAmount ? "default" : "outline"} 
                size="sm"
                onClick={toggleSortByAmount}
                className={`flex items-center gap-1 ${sortByAmount ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-400" : ""}`}
              >
                <span className="font-medium">By Amount</span>
                {sortByAmount && <SortIndicator active={true} direction={sortDirection} />}
              </Button>
              <Button 
                variant={sortByDescription ? "default" : "outline"} 
                size="sm"
                onClick={toggleSortByDescription}
                className={`flex items-center gap-1 ${sortByDescription ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-400" : ""}`}
              >
                <span className="font-medium">By Description</span>
                {sortByDescription && <SortIndicator active={true} direction={sortDirection} />}
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-auto min-w-[220px]">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-8 h-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-1 top-1 h-7 w-7 px-0" 
                    onClick={clearSearch}
                  >
                    <IconX className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                  </Button>
                )}
              </div>
              
              <span className="text-sm font-medium">Filter:</span>
              <Select
                value={typeFilter || "all"}
                onValueChange={handleTypeFilterChange}
              >
                <SelectTrigger className="w-[150px]">
                  <div className="flex items-center gap-2">
                    <IconFilter className="h-4 w-4" />
                    <SelectValue placeholder="All types" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="income">Income Only</SelectItem>
                  <SelectItem value="expense">Expenses Only</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={categoryFilter?.toString() || "all"}
                onValueChange={handleCategoryFilterChange}
              >
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <IconFilter className="h-4 w-4" />
                    <SelectValue placeholder="All categories" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
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
                            <DropdownMenuItem>
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
                      {debouncedSearchQuery 
                        ? `No transactions found matching "${debouncedSearchQuery}"` 
                        : typeFilter 
                          ? `No ${typeFilter} transactions found` 
                          : 'No transactions found'}
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
                  onValueChange={handlePageSizeChange}
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
                  onClick={handlePreviousPage}
                  disabled={cursor === null}
                >
                  <IconChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={isDone || !continueCursor || page.length === 0}
                >
                  Next
                  <IconChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete {bulkDelete ? 'Transactions' : 'Transaction'}</DialogTitle>
            <DialogDescription>
              {bulkDelete 
                ? `Are you sure you want to delete ${selectedRows.length} transactions? This action cannot be undone.`
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
            <Button type="button" variant="outline" onClick={cancelDelete}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete {bulkDelete ? 'Transactions' : 'Transaction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 