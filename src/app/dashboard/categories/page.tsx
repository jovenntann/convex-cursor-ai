"use client";

import { useState } from "react";
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
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CategoriesPage() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  
  const { page, isDone, continueCursor } = useQuery(api.categories.getAllPaginated, {
    paginationOpts: {
      numItems: pageSize,
      cursor: cursor,
    }
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
                  <TableHead>Name</TableHead>
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
                      No categories found
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