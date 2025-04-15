"use client";

import { useState, useEffect } from "react";
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
  const isEditing = !!editTransaction;
  
  // Get mutations
  const createTransaction = useMutation(api.transactions.create);
  const updateTransaction = useMutation(api.transactions.update);
  
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
      } else {
        // Reset form for new transaction
        form.reset({
          description: "",
          amount: 0,
          type: "expense",
          categoryId: "",
          date: new Date().toISOString().split('T')[0],
        });
      }
    }
  }, [open, form, editTransaction]);
  
  // Filter categories based on selected type
  const type = form.watch("type");
  const filteredCategories = categories.filter(cat => cat.type === type && cat.isActive);
  
  async function onSubmit(values: TransactionFormValues) {
    try {
      setIsSubmitting(true);
      
      const transactionData = {
        description: values.description,
        amount: values.amount,
        type: values.type,
        categoryId: values.categoryId as Id<"categories">,
        date: new Date(values.date).getTime(),
      };
      
      if (isEditing && editTransaction) {
        // Update existing transaction
        await updateTransaction({
          id: editTransaction._id,
          ...transactionData,
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
        // Create new transaction
        await createTransaction(transactionData);
        
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
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
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