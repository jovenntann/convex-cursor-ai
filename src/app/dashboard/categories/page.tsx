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
  IconLoader,
  IconCircleCheckFilled,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconFilter,
  IconSearch,
  IconX,
  IconPlus,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Import components
import { CategoryForm, CategoryTable, DeleteConfirmDialog } from "./components";

export default function CategoriesPage() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortByName, setSortByName] = useState(false);
  const [sortByBudget, setSortByBudget] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [typeFilter, setTypeFilter] = useState<"income" | "expense" | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: Id<"categories">; name: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkDelete, setBulkDelete] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  
  // Get mutations
  const deleteCategory = useMutation(api.categories.remove);
  
  // Refresh data function - call this after creating or updating categories
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
  
  const { page, isDone, continueCursor } = useQuery(api.categories.getAllPaginated, {
    paginationOpts: {
      numItems: pageSize,
      cursor: cursor,
    },
    sortByName,
    sortByBudget,
    sortDirection,
    ...(typeFilter ? { type: typeFilter } : {}),
    ...(debouncedSearchQuery ? { searchQuery: debouncedSearchQuery } : {})
  }) || { page: [], isDone: true, continueCursor: null };

  function handleNextPage() {
    if (!isDone && continueCursor) {
      setCursor(continueCursor);
    }
  }

  function handlePreviousPage() {
    // This is a simplified approach - in a real app you would maintain a stack of cursors
    setCursor(null); // Go back to first page
  }

  function handlePageSizeChange(value: string) {
    setPageSize(Number(value));
    setCursor(null); // Reset to first page when changing page size
  }
  
  function toggleSortByName() {
    if (sortByName) {
      // If already sorting by name, toggle direction
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Start sorting by name
      setSortByName(true);
      setSortByBudget(false);
    }
    setCursor(null); // Reset to first page
  }
  
  function toggleSortByDate() {
    if (!sortByName && !sortByBudget) {
      // If already sorting by date, toggle direction
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Start sorting by date
      setSortByName(false);
      setSortByBudget(false);
    }
    setCursor(null); // Reset to first page
  }

  function toggleSortByBudget() {
    if (sortByBudget) {
      // If already sorting by budget, toggle direction
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Start sorting by budget
      setSortByBudget(true);
      setSortByName(false);
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
  
  // Handle delete confirmation for a category
  function handleDelete(id: Id<"categories">, name: string) {
    setCategoryToDelete({ id, name });
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
          await deleteCategory({ id: id as Id<"categories"> });
        }
        
        toast.success(`Categories Deleted`, {
          description: `${selectedRows.length} categories were successfully deleted`,
          duration: 5000,
        });
        
        // Clear the selection
        setSelectedRows([]);
      } else if (categoryToDelete) {
        // Handle single delete
        await deleteCategory({ id: categoryToDelete.id });
        
        toast.success(`Category Deleted`, {
          description: `"${categoryToDelete.name}" was successfully deleted`,
          duration: 5000,
        });
        
        // Clear the selection if this category was selected
        setSelectedRows(prev => prev.filter(id => id !== categoryToDelete.id));
      }
      
      // Close the dialog and reset deletion state
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
      setBulkDelete(false);
      
      // Refresh the data
      refreshData();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("Failed to Delete Categories", {
        description: "There was a problem deleting the categories. Please try again.",
      });
    }
  }
  
  // Close the delete confirmation dialog
  function cancelDelete() {
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
    setBulkDelete(false);
  }

  // Handle edit for a category
  function handleEdit(category: any) {
    setCategoryToEdit({
      id: category._id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      type: category.type,
      nature: category.nature,
      budget: category.budget,
      paymentDueDay: category.paymentDueDay,
      isActive: category.isActive
    });
    setShowCategoryForm(true);
  }
  
  // Close category form and reset edit state
  function handleCloseForm() {
    setShowCategoryForm(false);
    setCategoryToEdit(null);
  }
  
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between px-4 lg:px-6">
          <h1 className="text-2xl font-bold">Categories</h1>
          <Button className="flex items-center gap-1" onClick={() => setShowCategoryForm(true)}>
            <IconPlus className="h-4 w-4" />
            New Category
          </Button>
        </div>
        
        <div className="px-4 lg:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort:</span>
              <Button 
                variant={sortByName ? "default" : "outline"} 
                size="sm"
                onClick={toggleSortByName}
                className={`flex items-center gap-1 ${sortByName ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-400" : ""}`}
              >
                <span className="font-medium">By Name</span>
                {sortByName && <SortIndicator active={true} direction={sortDirection} />}
              </Button>
              <Button 
                variant={!sortByName && !sortByBudget ? "default" : "outline"} 
                size="sm"
                onClick={toggleSortByDate}
                className={`flex items-center gap-1 ${!sortByName && !sortByBudget ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-400" : ""}`}
              >
                <span className="font-medium">By Date</span>
                {!sortByName && !sortByBudget && <SortIndicator active={true} direction={sortDirection} />}
              </Button>
              <Button 
                variant={sortByBudget ? "default" : "outline"} 
                size="sm"
                onClick={toggleSortByBudget}
                className={`flex items-center gap-1 ${sortByBudget ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-400" : ""}`}
              >
                <span className="font-medium">By Budget</span>
                {sortByBudget && <SortIndicator active={true} direction={sortDirection} />}
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full md:w-auto min-w-[220px]">
                <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search categories..."
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
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <IconFilter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="income">Income Only</SelectItem>
                  <SelectItem value="expense">Expenses Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Category Table */}
          <div className="flex items-center justify-between mb-2">
            {selectedRows.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleBulkDelete}
              >
                Delete Selected ({selectedRows.length})
              </Button>
            )}
          </div>
          
          <CategoryTable 
            page={page}
            isDone={isDone}
            continueCursor={continueCursor}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            handleDelete={handleDelete}
            handleEdit={handleEdit}
            sortByName={sortByName}
            sortByBudget={sortByBudget}
            sortDirection={sortDirection}
            toggleSortByName={toggleSortByName}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            onNextPage={handleNextPage}
            onPreviousPage={handlePreviousPage}
          />
        </div>
      </div>
      
      {/* Category Modal (for both Add and Edit) */}
      <CategoryForm 
        open={showCategoryForm} 
        onOpenChange={handleCloseForm} 
        onSuccess={refreshData}
        editCategory={categoryToEdit}
      />
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        categoryToDelete={categoryToDelete}
        bulkDelete={bulkDelete}
        selectedRowsCount={selectedRows.length}
      />
    </div>
  );
} 