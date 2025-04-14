"use client";

import { useState, useEffect } from "react";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";

// Selected popular emojis for financial categories (limited to 30)
const POPULAR_EMOJIS = [
  "💰", "💵", "💳", "🏦", "💹", 
  "📊", "📈", "📉", "💼", "🏠", 
  "🚗", "✈️", "🍔", "🛒", "🛍️", 
  "🏥", "💊", "📱", "💻", "🔌", 
  "🎮", "🎬", "📚", "👕", "🎓", 
  "🏋️", "💇", "🚿", "🧾", "📁"
];

// Form schema for adding/editing a category
const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
  icon: z.string().max(10).optional(),
  type: z.enum(["income", "expense"]),
  nature: z.enum(["fixed", "dynamic"]),
  budget: z.coerce.number().min(0).optional(),
  paymentDueDay: z.coerce.number().min(1).max(31).optional(),
  isActive: z.boolean().default(true),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// EmojiPicker component 
function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-10 px-3 font-normal justify-start text-xl"
          role="combobox"
        >
          {value || "📁"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="grid grid-cols-6 gap-2">
          {POPULAR_EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              variant="outline"
              className="h-10 w-10 p-0 text-xl"
              onClick={() => {
                onChange(emoji);
              }}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editCategory?: {
    id: Id<"categories">;
    name: string;
    description: string;
    icon?: string;
    type: "income" | "expense";
    nature: "fixed" | "dynamic";
    budget?: number;
    paymentDueDay?: number;
    isActive: boolean;
  };
}

export function CategoryForm({ open, onOpenChange, onSuccess, editCategory }: CategoryFormProps) {
  const createCategory = useMutation(api.categories.create);
  const updateCategory = useMutation(api.categories.update);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!editCategory;
  
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      icon: "📁",
      type: "expense",
      nature: "fixed",
      isActive: true,
    },
  });

  const natureOptions = [
    { label: "Fixed", value: "fixed", badge: "bg-blue-100 text-blue-800", description: "Same amount" },
    { label: "Variable", value: "dynamic", badge: "bg-amber-100 text-amber-800", description: "Changes" },
  ];

  // Update form when editing or opening
  useEffect(() => {
    if (open) {
      if (editCategory) {
        // Set form values for editing
        form.reset({
          name: editCategory.name,
          description: editCategory.description || "",
          icon: editCategory.icon || "📁",
          type: editCategory.type,
          nature: editCategory.nature,
          budget: editCategory.budget,
          paymentDueDay: editCategory.paymentDueDay,
          isActive: editCategory.isActive,
        });
      } else {
        // Reset form for new category
        form.reset({
          name: "",
          description: "",
          icon: "📁",
          type: "expense",
          nature: "fixed",
          isActive: true,
        });
      }
    }
  }, [open, form, editCategory]);

  async function onSubmit(values: CategoryFormValues) {
    try {
      setIsSubmitting(true);
      // Convert form data to match API schema
      const categoryData = {
        name: values.name,
        description: values.description || "",
        type: values.type,
        nature: values.nature,
        budget: values.budget,
        paymentDueDay: values.paymentDueDay,
        icon: values.icon,
        // color field is optional in the API
        color: values.type === "income" ? "#4CAF50" : "#F44336", // Green for income, Red for expense
      };
      
      let categoryId;
      
      if (isEditing && editCategory) {
        // Update existing category
        categoryId = await updateCategory({
          id: editCategory.id,
          ...categoryData,
          isActive: values.isActive
        });
        
        // Show success toast
        toast.success(`Category Updated`, {
          description: `"${values.name}" was successfully updated`,
          action: {
            label: "View Categories",
            onClick: () => onOpenChange(false),
          },
          duration: 5000,
          icon: values.icon || "📁",
        });
      } else {
        // Create new category
        categoryId = await createCategory(categoryData);
        
        // Enhanced toast notification with more styling and action buttons
        toast.success(`Category Created`, {
          description: `"${values.name}" was successfully created`,
          action: {
            label: "View Categories",
            onClick: () => onOpenChange(false),
          },
          duration: 5000,
          icon: values.icon || "📁",
        });
      }
      
      form.reset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} category:`, error);
      toast.error(`Failed to ${isEditing ? 'Update' : 'Create'} Category`, {
        description: `There was a problem ${isEditing ? 'updating' : 'creating'} your category. Please try again.`,
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
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Category</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update category details.' : 'Create a new category for organizing your income and expenses.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <EmojiPicker 
                        value={field.value || "📁"} 
                        onChange={(emoji) => field.onChange(emoji)} 
                      />
                    </FormControl>
                    <FormDescription>
                      Select emoji
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Category name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of this category" 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
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
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                name="nature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nature</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        {natureOptions.map(option => (
                          <FormItem key={option.value} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={option.value} />
                            </FormControl>
                            <FormLabel className="font-normal">
                              <span className="inline-flex items-center gap-1">
                                <Badge className={option.badge}>{option.label}</Badge>
                                <span className="text-xs text-muted-foreground">({option.description})</span>
                              </span>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (Optional)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5">$</span>
                        <Input 
                          type="number" 
                          min="0" 
                          step="0.01" 
                          placeholder="0.00"
                          className="pl-7" 
                          {...field}
                          value={field.value || ""}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Monthly budget limit
                    </FormDescription>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="paymentDueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Due Day (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="31" 
                        placeholder="Day of month" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Day of the month (1-31)
                    </FormDescription>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Active Status</FormLabel>
                    <FormDescription>
                      Inactive categories won't appear in transaction forms
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? isEditing ? "Updating..." : "Creating..." 
                  : isEditing ? "Update Category" : "Create Category"
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 