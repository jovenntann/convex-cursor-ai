"use client";

import { useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useIsMobile } from "@/hooks/use-mobile";
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
  IconCircleCheckFilled,
  IconLoader,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  _id: Id<"categories">;
  name: string;
  description: string;
  icon?: string;
  type: "income" | "expense";
  nature: "fixed" | "dynamic";
  budget?: number;
  paymentDueDay?: number;
  isActive: boolean;
}

interface CategoryTableProps {
  page: Category[] | undefined;
  isDone: boolean | undefined;
  continueCursor: string | null | undefined;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
  handleDelete: (id: Id<"categories">, name: string) => void;
  handleEdit: (category: Category) => void;
  sortByName: boolean;
  sortByBudget: boolean;
  sortDirection: "asc" | "desc";
  toggleSortByName: () => void;
  pageSize: number;
  onPageSizeChange: (value: string) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
}

// Status component
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      {isActive ? (
        <>
          <IconCircleCheckFilled className="text-green-500 dark:text-green-400 h-4 w-4" />
          <span>Active</span>
        </>
      ) : (
        <>
          <IconLoader className="text-amber-500 dark:text-amber-400 h-4 w-4" />
          <span>Inactive</span>
        </>
      )}
    </div>
  );
}

// Sort indicator component
function SortIndicator({ active = false, direction = "asc" }: { active?: boolean, direction?: "asc" | "desc" }) {
  if (!active) return <IconArrowsSort className="h-4 w-4 text-muted-foreground" />;
  return direction === "asc" 
    ? <IconArrowUp className="h-5 w-5 text-blue-600 dark:text-blue-400 ml-1 font-bold" /> 
    : <IconArrowDown className="h-5 w-5 text-blue-600 dark:text-blue-400 ml-1 font-bold" />;
}

// Mobile Card component to display category in a card layout on small screens
function CategoryCard({ 
  category, 
  isSelected, 
  onToggleSelect, 
  onEdit, 
  onDelete 
}: { 
  category: Category; 
  isSelected: boolean; 
  onToggleSelect: () => void; 
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  return (
    <div className={`border ${isSelected ? 'border-primary' : 'border-border'} rounded-lg p-4 mb-3`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelect}
            aria-label={`Select ${category.name}`}
          />
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              {category.icon || '📁'}
            </span>
            <span className="font-medium">{category.name}</span>
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
            <DropdownMenuItem onClick={onEdit}>
              <IconPencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="text-destructive" 
              onClick={onDelete}
            >
              <IconTrash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted-foreground mb-1">Type</p>
          <Badge 
            variant="outline" 
            className={`text-xs ${category.type === "income" 
              ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" 
              : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"}`}
          >
            {category.type}
          </Badge>
        </div>
        
        <div>
          <p className="text-muted-foreground mb-1">Nature</p>
          <Badge 
            variant="outline" 
            className={`text-xs ${category.nature === "fixed" 
              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" 
              : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}
          >
            {category.nature}
          </Badge>
        </div>
        
        <div>
          <p className="text-muted-foreground mb-1">Budget</p>
          <p>{category.budget ? `$${category.budget.toFixed(2)}` : '--'}</p>
        </div>
        
        <div>
          <p className="text-muted-foreground mb-1">Status</p>
          <StatusBadge isActive={category.isActive} />
        </div>
        
        <div className="col-span-2">
          <p className="text-muted-foreground mb-1">Description</p>
          <p className="truncate">{category.description}</p>
        </div>
      </div>
    </div>
  );
}

export function CategoryTable({
  page,
  isDone,
  continueCursor,
  selectedRows,
  setSelectedRows,
  handleDelete,
  handleEdit,
  sortByName,
  sortByBudget,
  sortDirection,
  toggleSortByName,
  pageSize,
  onPageSizeChange,
  onNextPage,
  onPreviousPage,
}: CategoryTableProps) {
  const isMobile = useIsMobile();

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
      setSelectedRows(page.map(cat => cat._id));
    }
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
        </div>
      )}
      
      {isMobile ? (
        <div className="p-4">
          {page && page.length > 0 ? (
            page.map((category) => (
              <CategoryCard 
                key={category._id}
                category={category}
                isSelected={selectedRows.includes(category._id)}
                onToggleSelect={() => toggleRowSelection(category._id)}
                onEdit={() => handleEdit(category)}
                onDelete={() => handleDelete(category._id, category.name)}
              />
            ))
          ) : (
            <div className="text-center py-6 text-muted-foreground h-[400px] flex items-center justify-center">
              {page === undefined ? 'Loading...' : 'No categories found'}
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 50 }}></TableHead>
                <TableHead style={{ width: 50 }}>
                  <Checkbox
                    checked={page && page.length > 0 && selectedRows.length === page.length}
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
              {page && page.length > 0 ? (
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
                        className={`text-xs ${category.type === "income" 
                          ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" 
                          : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"}`}
                      >
                        {category.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${category.nature === "fixed" 
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" 
                          : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"}`}
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
                          <DropdownMenuItem onClick={() => handleEdit(category)}>
                            <IconPencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive" 
                            onClick={() => handleDelete(category._id, category.name)}
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
                  <TableCell colSpan={10} className="text-center py-6 text-muted-foreground h-[400px] align-middle">
                    {page === undefined ? 'Loading...' : 'No categories found'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
      
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