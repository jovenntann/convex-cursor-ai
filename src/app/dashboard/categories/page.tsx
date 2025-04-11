"use client";

import { useState, useEffect } from "react";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
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

export default function CategoriesPage() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortByName, setSortByName] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [typeFilter, setTypeFilter] = useState<"income" | "expense" | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  
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
          <Button className="flex items-center gap-1">
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
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground h-[400px] align-middle">
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
                    <TableCell colSpan={9} className="text-center py-6 text-muted-foreground h-[400px] align-middle">
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
    </div>
  );
} 