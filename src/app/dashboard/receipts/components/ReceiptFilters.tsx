import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

interface ReceiptFiltersProps {
  filters: {
    dateRange: [number, number] | null;
    categoryId: Id<"categories"> | null;
    searchQuery: string;
  };
  setFilters: (filters: any) => void;
}

export function ReceiptFilters({ filters, setFilters }: ReceiptFiltersProps) {
  const categories = useQuery(api.categories.getAll) || [];
  const [searchQuery, setSearchQuery] = useState(filters.searchQuery);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.searchQuery) {
        setFilters({ ...filters, searchQuery });
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery, filters, setFilters]);
  
  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search receipts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              value={filters.categoryId ?? "all"}
              onValueChange={(value) => setFilters({ 
                ...filters, 
                categoryId: value === "all" ? null : value as Id<"categories">
              })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2 flex items-end">
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setFilters({
                dateRange: null,
                categoryId: null,
                searchQuery: "",
              })}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 