import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IconFilter,
  IconSearch,
  IconX,
  IconArrowUp,
  IconArrowDown,
  IconArrowsSort,
  IconCalendar,
} from "@tabler/icons-react";
import { Id } from "@convex/_generated/dataModel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Sort indicator component
const SortIndicator = ({ active = false, direction = "asc" }: { active?: boolean, direction?: "asc" | "desc" }) => {
  if (!active) return <IconArrowsSort className="h-4 w-4 text-muted-foreground" />;
  return direction === "asc" 
    ? <IconArrowUp className="h-5 w-5 text-blue-600 ml-1 font-bold" /> 
    : <IconArrowDown className="h-5 w-5 text-blue-600 ml-1 font-bold" />;
};

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: "income" | "expense" | null;
  categoryFilter: Id<"categories"> | null;
  startDate: Date | null;
  endDate: Date | null;
  onTypeFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
  sortByDate: boolean;
  sortByAmount: boolean;
  sortByDescription: boolean;
  sortDirection: "asc" | "desc";
  toggleSortByDate: () => void;
  toggleSortByAmount: () => void;
  toggleSortByDescription: () => void;
  categories: Array<{
    _id: Id<"categories">;
    name: string;
    icon?: string;
    type: "income" | "expense";
    description: string;
    nature: "fixed" | "dynamic";
    isActive: boolean;
    budget?: number;
    paymentDueDay?: number;
    color?: string;
  }>;
}

export function FilterBar({
  searchQuery,
  setSearchQuery,
  typeFilter,
  categoryFilter,
  startDate,
  endDate,
  onTypeFilterChange,
  onCategoryFilterChange,
  onDateRangeChange,
  sortByDate,
  sortByAmount,
  sortByDescription,
  sortDirection,
  toggleSortByDate,
  toggleSortByAmount,
  toggleSortByDescription,
  categories,
}: FilterBarProps) {
  function clearSearch() {
    setSearchQuery("");
  }

  function handleStartDateChange(date: Date | undefined) {
    onDateRangeChange(date || null, endDate);
  }

  function handleEndDateChange(date: Date | undefined) {
    onDateRangeChange(startDate, date || null);
  }

  function clearDateRange() {
    onDateRangeChange(null, null);
  }

  const formatDate = (date: Date | null) => {
    return date ? format(date, "MMM d, yyyy") : "";
  };

  return (
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
          onValueChange={onTypeFilterChange}
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
          onValueChange={onCategoryFilterChange}
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
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2 h-9">
              <IconCalendar className="h-4 w-4" />
              {startDate && endDate ? (
                <span className="text-sm">
                  {formatDate(startDate)} - {formatDate(endDate)}
                </span>
              ) : (
                <span className="text-sm">Date Range</span>
              )}
              {(startDate || endDate) && (
                <div
                  className="flex items-center justify-center h-5 w-5 p-0 ml-1 rounded-full hover:bg-gray-200 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDateRange();
                  }}
                >
                  <IconX className="h-3 w-3" />
                  <span className="sr-only">Clear date range</span>
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="flex flex-col sm:flex-row gap-2 p-2">
              <div>
                <p className="text-sm font-medium mb-2">Start Date</p>
                <Calendar
                  mode="single"
                  selected={startDate || undefined}
                  onSelect={handleStartDateChange}
                  initialFocus
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-2">End Date</p>
                <Calendar
                  mode="single"
                  selected={endDate || undefined}
                  onSelect={handleEndDateChange}
                  initialFocus
                  disabled={(date: Date) => startDate ? date < startDate : false}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
} 