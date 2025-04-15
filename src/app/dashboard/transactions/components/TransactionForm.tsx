import { useState } from "react";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editTransaction?: {
    _id: Id<"transactions">;
    description: string;
    amount: number;
    type: "income" | "expense";
    categoryId: Id<"categories">;
    date: number;
  } | null;
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

export function TransactionForm({
  open,
  onOpenChange,
  onSuccess,
  editTransaction,
  categories,
}: TransactionFormProps) {
  // Form state
  const [description, setDescription] = useState(editTransaction?.description || "");
  const [amount, setAmount] = useState(editTransaction?.amount.toString() || "");
  const [type, setType] = useState<"income" | "expense">(editTransaction?.type || "expense");
  const [categoryId, setCategoryId] = useState<Id<"categories"> | null>(editTransaction?.categoryId || null);
  const [date, setDate] = useState(editTransaction?.date ? new Date(editTransaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  
  // Get mutations
  const createTransaction = useMutation(api.transactions.create);
  const updateTransaction = useMutation(api.transactions.update);
  
  // Filter categories based on selected type
  const filteredCategories = categories.filter(cat => cat.type === type && cat.isActive);
  
  // Reset form
  function resetForm() {
    setDescription("");
    setAmount("");
    setType("expense");
    setCategoryId(null);
    setDate(new Date().toISOString().split('T')[0]);
  }
  
  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      const transactionData = {
        description,
        amount: parseFloat(amount),
        type,
        categoryId: categoryId as Id<"categories">,
        date: new Date(date).getTime(),
      };
      
      if (editTransaction) {
        // Update existing transaction
        await updateTransaction({
          id: editTransaction._id,
          ...transactionData,
        });
        
        toast.success("Transaction Updated", {
          description: "The transaction has been updated successfully.",
        });
      } else {
        // Create new transaction
        await createTransaction(transactionData);
        
        toast.success("Transaction Created", {
          description: "The transaction has been created successfully.",
        });
      }
      
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast.error("Failed to Save Transaction", {
        description: "There was a problem saving the transaction. Please try again.",
      });
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editTransaction ? "Edit" : "New"} Transaction</DialogTitle>
          <DialogDescription>
            {editTransaction 
              ? "Edit the transaction details below." 
              : "Add a new transaction by filling out the form below."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter transaction description"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Amount
            </label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="type" className="text-sm font-medium">
              Type
            </label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as "income" | "expense");
                setCategoryId(null); // Reset category when type changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select
              value={categoryId?.toString() || ""}
              onValueChange={(value) => setCategoryId(value as Id<"categories">)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map(category => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="date" className="text-sm font-medium">
              Date
            </label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editTransaction ? "Update" : "Create"} Transaction
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 