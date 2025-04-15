"use client";

import { useState, useEffect } from "react";
import { api } from "@convex/_generated/api";
import { useMutation, useAction, useQuery } from "convex/react";
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Upload, X, Image, FileIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Form schema for adding/editing a transaction
const transactionFormSchema = z.object({
  description: z.string().min(2, "Description must be at least 2 characters").max(100),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().min(1, "Please select a category"),
  date: z.string().min(1, "Please select a date"),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

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
    receiptId?: Id<"_storage">;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [receiptId, setReceiptId] = useState<Id<"_storage"> | undefined>(undefined);
  
  const isEditing = !!editTransaction;
  
  // Get mutations and actions
  const createTransaction = useMutation(api.transactions.create);
  const updateTransaction = useMutation(api.transactions.update);
  const generateUploadUrl = useAction(api.actions.uploadReceipt.generateUploadUrl);
  
  // Get receipt URL with useQuery
  const storedReceiptUrl = useQuery(
    api.transactions.getReceiptUrl, 
    receiptId ? { receiptId } : "skip"
  );
  
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      description: "",
      amount: 0,
      type: "expense",
      categoryId: "",
      date: new Date().toISOString().split('T')[0],
    },
  });
  
  // Update form when editing or opening
  useEffect(() => {
    if (open) {
      if (editTransaction) {
        // Set form values for editing
        form.reset({
          description: editTransaction.description,
          amount: editTransaction.amount,
          type: editTransaction.type,
          categoryId: editTransaction.categoryId,
          date: new Date(editTransaction.date).toISOString().split('T')[0],
        });
        
        // If the transaction has a receipt, set the receipt ID
        if (editTransaction.receiptId) {
          setReceiptId(editTransaction.receiptId);
        } else {
          setReceiptUrl(null);
          setReceiptId(undefined);
        }
      } else {
        // Reset form for new transaction
        form.reset({
          description: "",
          amount: 0,
          type: "expense",
          categoryId: "",
          date: new Date().toISOString().split('T')[0],
        });
        setReceiptFile(null);
        setReceiptUrl(null);
        setReceiptId(undefined);
      }
    }
  }, [open, form, editTransaction]);
  
  // Update receiptUrl when storedReceiptUrl changes
  useEffect(() => {
    if (storedReceiptUrl) {
      setReceiptUrl(storedReceiptUrl);
    }
  }, [storedReceiptUrl]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setReceiptFile(files[0]);
      
      // Clear any existing receipt ID since we're uploading a new file
      if (receiptId) {
        setReceiptId(undefined);
      }
    }
  };
  
  // Handle file upload
  const handleFileUpload = async () => {
    if (!receiptFile) return undefined;
    
    try {
      setIsUploading(true);
      
      // Get upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: receiptFile,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload file");
      }
      
      const { storageId } = await response.json();
      setReceiptId(storageId);
      
      return storageId;
    } catch (error) {
      console.error("Error uploading receipt:", error);
      toast.error("Receipt Upload Failed", { 
        description: "Failed to upload receipt. Please try again."
      });
      return undefined;
    } finally {
      setIsUploading(false);
    }
  };
  
  // Remove file
  const removeFile = () => {
    setReceiptFile(null);
    
    // If we're removing a file that hasn't been uploaded yet, clear the receipt ID
    if (receiptFile && !receiptId) {
      setReceiptId(undefined);
      setReceiptUrl(null);
    }
  };
  
  // Filter categories based on selected type
  const type = form.watch("type");
  const filteredCategories = categories.filter(cat => cat.type === type && cat.isActive);
  
  async function onSubmit(values: TransactionFormValues) {
    try {
      setIsSubmitting(true);
      let finalReceiptId = receiptId;
      
      // If there's a new file to upload, upload it
      if (receiptFile && !receiptId) {
        finalReceiptId = await handleFileUpload();
      }
      
      if (isEditing && editTransaction) {
        // Update existing transaction
        await updateTransaction({
          id: editTransaction._id,
          description: values.description,
          amount: values.amount,
          type: values.type,
          categoryId: values.categoryId as Id<"categories">,
          date: new Date(values.date).getTime(),
          receiptId: finalReceiptId,
        });
        
        toast.success("Transaction Updated", {
          description: `"${values.description}" was successfully updated`,
          action: {
            label: "View Transactions",
            onClick: () => onOpenChange(false),
          },
          duration: 5000,
        });
      } else {
        // Create new transaction with receipt (if present)
        await createTransaction({
          description: values.description,
          amount: values.amount,
          type: values.type,
          categoryId: values.categoryId as Id<"categories">,
          date: new Date(values.date).getTime(),
          receiptId: finalReceiptId,
        });
        
        toast.success("Transaction Created", {
          description: `"${values.description}" was successfully created`,
          action: {
            label: "View Transactions",
            onClick: () => onOpenChange(false),
          },
          duration: 5000,
        });
      }
      
      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} transaction:`, error);
      toast.error(`Failed to ${isEditing ? 'Update' : 'Create'} Transaction`, {
        description: `There was a problem ${isEditing ? 'updating' : 'creating'} your transaction. Please try again.`,
        action: {
          label: "Retry",
          onClick: () => form.handleSubmit(onSubmit)(),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Determine if the receipt is an image
  const isImageReceipt = receiptUrl && 
    (receiptUrl.endsWith('.jpg') || 
     receiptUrl.endsWith('.jpeg') || 
     receiptUrl.endsWith('.png') || 
     receiptUrl.endsWith('.gif') || 
     receiptUrl.endsWith('.webp'));
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "New"} Transaction</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update transaction details." 
              : "Add a new transaction to track your income or expenses."}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Transaction description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("categoryId", "");
                        }}
                        value={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="income" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            <span className="inline-flex items-center gap-1">
                              <Badge className="bg-green-100 text-green-800">Income</Badge>
                              <span className="text-xs text-muted-foreground">(Money coming in)</span>
                            </span>
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="expense" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            <span className="inline-flex items-center gap-1">
                              <Badge className="bg-red-100 text-red-800">Expense</Badge>
                              <span className="text-xs text-muted-foreground">(Money going out)</span>
                            </span>
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5">$</span>
                        <Input 
                          type="number" 
                          min="0.01" 
                          step="0.01" 
                          placeholder="0.00"
                          className="pl-7" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Transaction amount
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map(category => (
                          <SelectItem key={category._id} value={category._id}>
                            <span className="inline-flex items-center gap-2">
                              {category.icon} {category.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Transaction date
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
            {/* Receipt Upload */}
            <div className="space-y-2">
              <FormLabel>Receipt</FormLabel>
              
              {receiptUrl ? (
                <div className="relative rounded-md border border-gray-200 p-4 flex flex-col items-center">
                  {isImageReceipt ? (
                    <div className="w-full max-h-48 flex justify-center overflow-hidden">
                      <img 
                        src={receiptUrl} 
                        alt="Receipt" 
                        className="object-contain max-h-48"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center p-4 w-full">
                      <FileIcon className="h-10 w-10 text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">Receipt document</span>
                    </div>
                  )}
                  
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(receiptUrl, '_blank')}
                    >
                      View
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="destructive" 
                      size="sm"
                      onClick={() => {
                        setReceiptUrl(null);
                        setReceiptId(undefined);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : receiptFile ? (
                <div className="relative rounded-md border border-gray-200 p-4">
                  <div className="flex items-center">
                    <FileIcon className="h-10 w-10 text-gray-400" />
                    <div className="ml-2 flex-1">
                      <p className="text-sm font-medium">{receiptFile.name}</p>
                      <p className="text-xs text-gray-500">
                        {(receiptFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                      disabled={isUploading}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {isUploading && (
                    <div className="mt-2 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-xs">Uploading...</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="receipt-upload"
                    className={cn(
                      "flex flex-col items-center justify-center w-full h-32",
                      "border-2 border-dashed rounded-lg cursor-pointer",
                      "bg-gray-50 hover:bg-gray-100",
                      "dark:hover:bg-gray-800 dark:bg-gray-700",
                      "border-gray-300 dark:border-gray-600"
                    )}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-6 w-6 text-gray-500 mb-2" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Images or PDFs (MAX. 10MB)
                      </p>
                    </div>
                    <input
                      id="receipt-upload"
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                  </label>
                </div>
              )}
              <FormDescription>
                Upload a receipt image or PDF for this transaction (optional)
              </FormDescription>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)} 
                disabled={isSubmitting || isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting 
                  ? isEditing ? "Updating..." : "Creating..." 
                  : isEditing ? "Update Transaction" : "Create Transaction"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}