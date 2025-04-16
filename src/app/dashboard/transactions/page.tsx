"use client";

import { useState, useEffect } from "react";
import { api } from "@convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { IconPlus, IconTable, IconLayoutGrid } from "@tabler/icons-react";
import { toast } from "sonner";

// Import components
import { TransactionTable, DeleteConfirmDialog, FilterBar, TransactionForm, TransactionTileView } from "./components";

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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [transactionToDelete, setTransactionToDelete] = useState<{ id: Id<"transactions">; description: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"table" | "tile">("table");
  
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
    ...(debouncedSearchQuery ? { searchQuery: debouncedSearchQuery } : {}),
    ...(startDate ? { startDate: startDate.getTime() } : {}),
    ...(endDate ? { endDate: endDate.getTime() } : {})
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
  
  function handleDateRangeChange(start: Date | null, end: Date | null) {
    setStartDate(start);
    setEndDate(end);
    setCursor(null); // Reset to first page when changing date range
  }
  
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

  // Handle edit for a transaction
  function handleEdit(transaction: any) {
    setTransactionToEdit(transaction);
    setShowTransactionForm(true);
  }
  
  // Close transaction form and reset edit state
  function handleCloseForm() {
    setShowTransactionForm(false);
    setTransactionToEdit(null);
  }
  
  // Function to toggle view mode
  function toggleViewMode() {
    setViewMode(viewMode === "table" ? "tile" : "table");
  }
  
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <h1 className="text-2xl font-bold">Transactions</h1>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={toggleViewMode}
              className="h-9 w-9"
              title={viewMode === "table" ? "Switch to Tile View" : "Switch to Table View"}
            >
              {viewMode === "table" ? (
                <IconLayoutGrid className="h-4 w-4" />
              ) : (
                <IconTable className="h-4 w-4" />
              )}
            </Button>
            <Button className="flex items-center gap-1" onClick={() => setShowTransactionForm(true)}>
              <IconPlus className="h-4 w-4" />
              New Transaction
            </Button>
          </div>
        </div>
        
        <div className="px-4 lg:px-6">
          <FilterBar 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            typeFilter={typeFilter}
            categoryFilter={categoryFilter}
            startDate={startDate}
            endDate={endDate}
            onTypeFilterChange={handleTypeFilterChange}
            onCategoryFilterChange={handleCategoryFilterChange}
            onDateRangeChange={handleDateRangeChange}
            sortByDate={sortByDate}
            sortByAmount={sortByAmount}
            sortByDescription={sortByDescription}
            sortDirection={sortDirection}
            toggleSortByDate={toggleSortByDate}
            toggleSortByAmount={toggleSortByAmount}
            toggleSortByDescription={toggleSortByDescription}
            categories={categories}
          />
          
          {viewMode === "table" ? (
            <TransactionTable 
              page={page}
              isDone={isDone}
              continueCursor={continueCursor}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              handleDelete={handleDelete}
              handleEdit={handleEdit}
              sortByDate={sortByDate}
              sortByAmount={sortByAmount}
              sortByDescription={sortByDescription}
              sortDirection={sortDirection}
              toggleSortByDate={toggleSortByDate}
              toggleSortByAmount={toggleSortByAmount}
              toggleSortByDescription={toggleSortByDescription}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              onNextPage={handleNextPage}
              onPreviousPage={handlePreviousPage}
              handleBulkDelete={handleBulkDelete}
            />
          ) : (
            <div className="py-3">
              <TransactionTileView
                page={page}
                isDone={isDone}
                continueCursor={continueCursor}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                handleDelete={handleDelete}
                handleEdit={handleEdit}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                onNextPage={handleNextPage}
                onPreviousPage={handlePreviousPage}
                isFirstPage={cursor === null}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Transaction Form Dialog */}
      {showTransactionForm && (
        <TransactionForm
          open={showTransactionForm}
          onOpenChange={handleCloseForm}
          onSuccess={refreshData}
          editTransaction={transactionToEdit}
          categories={categories}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          transactionToDelete={transactionToDelete}
          bulkDelete={bulkDelete}
          selectedRowsCount={selectedRows.length}
        />
      )}
    </div>
  );
} 