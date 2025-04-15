import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconDownload, IconReceipt } from "@tabler/icons-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface ReceiptDetailsProps {
  receiptId: Id<"transactions">;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptDetails({ receiptId, isOpen, onClose }: ReceiptDetailsProps) {
  const transaction = useQuery(api.transactions.getById, { id: receiptId });
  
  // Always call useQuery hook, but pass null if no receipt ID exists
  const receiptStorageId = transaction?.receiptId || null;
  const receiptUrlQueryResult = useQuery(
    api.transactions.getReceiptUrl, 
    receiptStorageId ? { receiptId: receiptStorageId } : { receiptId: undefined as unknown as Id<"_storage"> }
  );
  
  // Only use the result if we actually have a receipt ID
  const receiptUrl = receiptStorageId ? receiptUrlQueryResult : null;
  
  if (!transaction) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt Details</DialogTitle>
          <DialogDescription>
            Transaction from {formatDate(transaction.date)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 flex flex-col gap-6">
          <div className="flex-1 overflow-hidden rounded-lg bg-muted">
            {receiptUrl ? (
              <div className="flex flex-col items-center justify-center p-4">
                <img 
                  src={receiptUrl} 
                  alt="Receipt" 
                  className="max-h-[70vh] object-contain"
                  onError={(e) => {
                    // If image fails, show a PDF or document icon
                    (e.target as HTMLImageElement).style.display = 'none';
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const icon = document.createElement('div');
                      icon.innerHTML = '<div class="flex items-center justify-center"><IconReceipt class="h-20 w-20" /></div>';
                      icon.className = 'text-muted-foreground';
                      parent.appendChild(icon);
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8">
                <IconReceipt className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No receipt available for this transaction
                </p>
              </div>
            )}
          </div>
          
          <div className="grid gap-2">
            <h3 className="font-semibold text-lg">{transaction.description}</h3>
            <p className={`font-medium ${transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
              {formatCurrency(transaction.amount)}
            </p>
            <p className="text-sm text-muted-foreground">
              Category: {transaction.category.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Date: {formatDate(transaction.date)}
            </p>
          </div>
          
          {receiptUrl && (
            <div className="flex gap-2">
              <Button 
                className="w-full" 
                onClick={() => window.open(receiptUrl, '_blank')}
              >
                <IconDownload className="mr-2 h-4 w-4" />
                Download Receipt
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 