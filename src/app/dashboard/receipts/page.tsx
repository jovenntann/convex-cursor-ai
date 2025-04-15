"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { IconFilter } from "@tabler/icons-react";

// Components
import { ReceiptGallery, ReceiptFilters, ReceiptDetails } from "./components";

export default function ReceiptsPage() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [pageSize] = useState(12); // Default page size for gallery
  const [selectedReceipt, setSelectedReceipt] = useState<Id<"transactions"> | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: null as [number, number] | null,
    categoryId: null as Id<"categories"> | null,
    searchQuery: "",
  });

  // Fetch receipts with pagination
  const { page, isDone, continueCursor } = useQuery(api.transactions.getReceiptsPaginated, {
    paginationOpts: {
      numItems: pageSize,
      cursor: cursor,
    },
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.searchQuery ? { searchQuery: filters.searchQuery } : {}),
    ...(filters.dateRange ? { startDate: filters.dateRange[0], endDate: filters.dateRange[1] } : {})
  }) || { page: [], isDone: true, continueCursor: null };

  // Load more function
  const loadMore = useCallback(() => {
    if (!isDone && continueCursor) {
      setCursor(continueCursor);
    }
  }, [isDone, continueCursor]);

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Container with max width and centered */}
        <div className="mx-auto w-full max-w-[1400px] px-4 lg:px-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Receipts</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-1"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <IconFilter className="h-4 w-4" />
                Filters
              </Button>
            </div>
          </div>
          
          {isFilterOpen && (
            <div className="mt-4">
              <ReceiptFilters 
                filters={filters}
                setFilters={setFilters}
              />
            </div>
          )}

          <div className="mt-6">
            <ReceiptGallery 
              receipts={page} 
              onSelectReceipt={setSelectedReceipt}
              selectedReceipt={selectedReceipt}
              onLoadMore={loadMore}
              hasMore={!isDone}
            />
          </div>
        </div>
      </div>

      {selectedReceipt && (
        <ReceiptDetails
          receiptId={selectedReceipt}
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
} 