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

// Form schema for adding/editing a category
const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
  icon: z.string().max(10).optional(),
  type: z.enum(["income", "expense"]),
  nature: z.enum(["fixed", "dynamic"]),
  budget: z.coerce.number().min(0).optional(),
  paymentDueDay: z.coerce.number().min(1).max(31).optional(),
  isActive: z.boolean().default(true),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// CategoryForm component
function CategoryForm({ open, onOpenChange, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const createCategory = useMutation(api.categories.create);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      icon: "📁",
      type: "expense",
      nature: "fixed",
      isActive: true,
    },
  });

  const natureOptions = [
    { label: "Fixed", value: "fixed", badge: "bg-blue-100 text-blue-800", description: "Same amount" },
    { label: "Variable", value: "dynamic", badge: "bg-amber-100 text-amber-800", description: "Changes" },
  ];

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        description: "",
        icon: "📁",
        type: "expense",
        nature: "fixed",
        isActive: true,
      });
    }
  }, [open, form]);

  async function onSubmit(values: CategoryFormValues) {
    try {
      setIsSubmitting(true);
      // Convert form data to match API schema
      const categoryData = {
        name: values.name,
        description: values.description || "",
        type: values.type,
        nature: values.nature,
        budget: values.budget,
        paymentDueDay: values.paymentDueDay,
        icon: values.icon,
        // color field is optional in the API
        color: values.type === "income" ? "#4CAF50" : "#F44336", // Green for income, Red for expense
      };
      
      const categoryId = await createCategory(categoryData);
      
      // Enhanced toast notification with more styling and action buttons
      toast.success(`Category Created`, {
        description: `"${values.name}" was successfully created`,
        action: {
          label: "View Categories",
          onClick: () => onOpenChange(false),
        },
        duration: 5000,
        icon: values.icon || "📁",
      });
      
      form.reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error("Failed to Create Category", {
        description: "There was a problem creating your category. Please try again.",
        action: {
          label: "Retry",
          onClick: () => form.handleSubmit(onSubmit)(),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a new category for organizing your income and expenses.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Emoji icon
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this category" 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="income" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            <span className="inline-flex items-center gap-1">
                              <Badge className="bg-green-100 text-green-800">Income</Badge>
                              <span className="text-xs text-muted-foreground">(Money coming in)</span>
                            </span>
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="expense" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            <span className="inline-flex items-center gap-1">
                              <Badge className="bg-red-100 text-red-800">Expense</Badge>
                              <span className="text-xs text-muted-foreground">(Money going out)</span>
                            </span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {natureOptions.map(option => (
                          <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={option.value} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              <span className="inline-flex items-center gap-1">
                                <Badge className={option.badge}>{option.label}</Badge>
                                <span className="text-xs text-muted-foreground">({option.description})</span>
                              </span>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5">$</span>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="0.00"
                          className="pl-7" 
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Monthly budget limit
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paymentDueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Due Day (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="31" 
                        placeholder="Day of month" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Day of the month (1-31)
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>
                      Inactive categories won't appear in transaction forms
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoriesPage() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortByName, setSortByName] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [typeFilter, setTypeFilter] = useState<"income" | "expense" | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);
  
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
      setSelectedRows(page.map(cat => cat._id));
    }
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
    }
    setCursor(null); // Reset to first page
  }
  
  function toggleSortDirection() {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    setCursor(null); // Reset to first page
  }
  
  function resetSort() {
    setSortByName(false);
    setSortDirection("asc");
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

  // Status component
  const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <div className="flex items-center gap-1.5">
      {isActive ? (
        <>
          <IconCircleCheckFilled className="text-green-500 h-4 w-4" />
          <span>Active</span>
        </>
      ) : (
        <>
          <IconLoader className="text-amber-500 h-4 w-4" />
          <span>Inactive</span>
        </>
      )}
    </div>
  );
  
  // Sort indicator component
  const SortIndicator = ({ active = false, direction = "asc" }: { active?: boolean, direction?: "asc" | "desc" }) => {
    if (!active) return <IconArrowsSort className="h-4 w-4 text-muted-foreground" />;
    return direction === "asc" 
      ? <IconArrowUp className="h-5 w-5 text-blue-600 ml-1 font-bold" /> 
      : <IconArrowDown className="h-5 w-5 text-blue-600 ml-1 font-bold" />;
  };
  
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
                variant={!sortByName ? "default" : "outline"} 
                size="sm"
                onClick={resetSort}
                className={`flex items-center gap-1 ${!sortByName ? "bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-400" : ""}`}
              >
                <span className="font-medium">By Date</span>
                {!sortByName && <SortIndicator active={true} direction={sortDirection} />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSortDirection}
                className="flex items-center gap-1 border-gray-300"
              >
                <span>{sortDirection === "asc" ? "Ascending" : "Descending"}</span>
                <SortIndicator active={true} direction={sortDirection} />
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
          
          <div className="rounded-lg border shadow-sm">
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
                      onClick={toggleSortByName}
                    >
                      <span>Name</span>
                      {sortByName && <SortIndicator active={true} direction={sortDirection} />}
                    </Button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Nature</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Payment Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ width: 50 }}></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="min-h-[400px]">
                {page?.length > 0 ? (
                  page.map((category) => (
                    <TableRow key={category._id} className="hover:bg-muted/50">
                      <TableCell className="p-0 pl-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                          <IconGripVertical className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="p-0">
                        <Checkbox
                          checked={selectedRows.includes(category._id)}
                          onCheckedChange={() => toggleRowSelection(category._id)}
                          aria-label={`Select ${category.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-xl" aria-hidden="true">
                            {category.icon || '📁'}
                          </span>
                          <span>{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {category.description}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${category.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                        >
                          {category.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${category.nature === "fixed" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {category.nature}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {category.budget ? `$${category.budget.toFixed(2)}` : '--'}
                      </TableCell>
                      <TableCell>
                        {category.paymentDueDay ? `Day ${category.paymentDueDay}` : '--'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge isActive={category.isActive} />
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
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6 text-muted-foreground h-[400px] align-middle">
                      {debouncedSearchQuery 
                        ? `No categories found matching "${debouncedSearchQuery}"` 
                        : typeFilter 
                          ? `No ${typeFilter} categories found` 
                          : 'No categories found'}
                    </TableCell>
                  </TableRow>
                )}
                {page === undefined && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-6 text-muted-foreground h-[400px] align-middle">
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
      
      {/* Add Category Modal */}
      <CategoryForm 
        open={showCategoryForm} 
        onOpenChange={setShowCategoryForm} 
        onSuccess={refreshData}
      />
    </div>
  );
} 