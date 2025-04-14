"use client";

import { useState } from "react";
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
}

// Sort indicator component
function SortIndicator({ active = false, direction = "asc" }: { active?: boolean, direction?: "asc" | "desc" }) {
  if (!active) return <IconArrowsSort className="h-4 w-4 text-muted-foreground" />;
  return direction === "asc" 
    ? <IconArrowUp className="h-5 w-5 text-blue-600 ml-1 font-bold" /> 
    : <IconArrowDown className="h-5 w-5 text-blue-600 ml-1 font-bold" />;
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
            disabled={!page || page.length === 0}
          >
            <IconChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNextPage}
            disabled={isDone || !continueCursor || !page || page.length === 0}
          >
            Next
            <IconChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
} 