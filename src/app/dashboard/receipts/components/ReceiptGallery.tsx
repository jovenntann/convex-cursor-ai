import { useCallback, useRef, useEffect, useState } from "react";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { IconReceipt, IconLoader2 } from "@tabler/icons-react";

interface ReceiptGalleryProps {
  receipts: Array<{
    _id: Id<"transactions">;
    description: string;
    amount: number;
    date: number;
    type: "income" | "expense";
    receiptId: Id<"_storage"> | undefined;
    receiptUrl: string | null;
    category: {
      name: string;
      color?: string;
    };
  }>;
  onSelectReceipt: (id: Id<"transactions">) => void;
  selectedReceipt: Id<"transactions"> | null;
  onLoadMore: () => void;
  hasMore: boolean;
}

type Orientation = "portrait" | "landscape" | "unknown";

export function ReceiptGallery({ 
  receipts, 
  onSelectReceipt, 
  selectedReceipt,
  onLoadMore,
  hasMore
}: ReceiptGalleryProps) {
  // Track image orientations by receipt ID
  const [imageOrientations, setImageOrientations] = useState<Record<string, Orientation>>({});
  
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        onLoadMore();
      }
    });
    
    observer.current.observe(node);
  }, [hasMore, onLoadMore]);

  // Handle image load and determine orientation
  const handleImageLoad = useCallback((receiptId: Id<"transactions">, event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const orientation = image.naturalHeight > image.naturalWidth ? "portrait" : "landscape";
    
    setImageOrientations(prev => ({
      ...prev,
      [receiptId.toString()]: orientation
    }));
  }, []);

  // Function to determine grid span for each item
  const getGridSpan = (receiptId: string, index: number) => {
    const orientation = imageOrientations[receiptId] || "unknown";
    
    // Create some variety in the grid based on orientation and position
    if (orientation === "landscape") {
      // Make some landscape images span 2 columns
      return (index % 5 === 0) ? "col-span-2" : "col-span-1";
    } else if (orientation === "portrait") {
      // Make some portrait images span 2 rows
      return (index % 7 === 0) ? "row-span-2" : "row-span-1";
    } else {
      // For unknown orientation, create variety based on index
      if (index % 10 === 0) return "col-span-2 row-span-2";
      if (index % 8 === 0) return "col-span-2";
      if (index % 6 === 0) return "row-span-2";
      return "";
    }
  };

  if (!receipts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <IconReceipt className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium mb-2">No receipts found</h3>
        <p className="text-sm text-muted-foreground">
          Try uploading a receipt in the transactions page or adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)]">
        {receipts.map((receipt, index) => {
          const gridSpanClass = getGridSpan(receipt._id.toString(), index);
          
          return (
            <div 
              key={receipt._id} 
              className={`cursor-pointer rounded-lg overflow-hidden
              border border-border bg-card shadow-sm transition-all duration-200 
              hover:shadow-md hover:border-primary/40 hover:-translate-y-1
              ${gridSpanClass}
              ${
                selectedReceipt === receipt._id 
                  ? 'ring-2 ring-primary shadow-md border-primary/70' 
                  : ''
              }`}
              onClick={() => onSelectReceipt(receipt._id)}
            >
              <div className="relative h-full">
                {receipt.receiptUrl ? (
                  <img 
                    src={receipt.receiptUrl} 
                    alt={receipt.description} 
                    className="w-full h-full object-cover"
                    onLoad={(e) => handleImageLoad(receipt._id, e)}
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLImageElement).src = '/placeholder-receipt.svg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <IconReceipt className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                
                {/* Subtle overlay gradient at the bottom for better visibility */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
            </div>
          );
        })}
      </div>
      
      {hasMore && (
        <div 
          ref={loadMoreRef} 
          className="flex justify-center py-4"
        >
          <Button variant="outline" onClick={onLoadMore} className="flex items-center gap-2">
            <IconLoader2 className="h-4 w-4 animate-spin" />
            Loading more...
          </Button>
        </div>
      )}
    </div>
  );
} 