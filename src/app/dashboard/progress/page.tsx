"use client";

import { api } from "@convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { BudgetProgress } from "@/components/budget-progress";
import { useState } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { 
  RefreshCw,
  ArrowUpIcon,
  PiggyBankIcon,
  BadgePercentIcon,
  ReceiptIcon,
  CreditCardIcon
} from "lucide-react";
import { BudgetProgressBar } from "@/components/BudgetProgressBar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "@convex/_generated/dataModel";

// Color scheme constants
const COLOR_SCHEME = {
  income: {
    gradientFrom: "#f5f5f5", // light gray
    gradientTo: "#737373",   // gray-500
    textColor: "text-gray-700 dark:text-gray-300",
    accentColor: "text-gray-600 dark:text-gray-400",
    bgLight: "from-gray-50/90 to-white dark:from-gray-800/20 dark:to-background/90",
    bgAccent: "bg-gray-200 dark:bg-gray-700/40"
  },
  fixed: {
    gradientFrom: "#f5f5f5", // light gray
    gradientTo: "#525252",   // gray-600
    textColor: "text-gray-700 dark:text-gray-300",
    accentColor: "text-gray-600 dark:text-gray-400",
    bgLight: "from-gray-100/90 to-white dark:from-gray-800/20 dark:to-background/90",
    bgAccent: "bg-gray-200 dark:bg-gray-700/40"
  },
  dynamic: {
    gradientFrom: "#f5f5f5", // light gray
    gradientTo: "#333333",   // gray-700
    textColor: "text-gray-700 dark:text-gray-300",
    accentColor: "text-gray-600 dark:text-gray-400",
    bgLight: "from-gray-100/90 to-white dark:from-gray-800/20 dark:to-background/90",
    bgAccent: "bg-gray-200 dark:bg-gray-700/40"
  }
};

export default function ProgressPage() {
  // Date range state - fixed to current month
  const [dateRange] = useState(() => {
    // Get current date
    const today = new Date();
    
    // Create first day of current month with UTC adjustment
    const firstDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
    
    // Create last day of current month with UTC adjustment
    const lastDay = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999));
    
    return {
      startDate: firstDay.getTime(),
      endDate: lastDay.getTime()
    };
  });
  
  // Get budget usage data for categories
  const budgetUsageData = useQuery(api.categories.getCategoriesWithBudgetUsage, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });
  
  // Mutation to adjust budget
  const adjustBudget = useMutation(api.categories.adjustBudgetToSpending);
  
  // Handle adjust budget
  const handleAdjustBudget = async (categoryId: string, newBudget: number) => {
    try {
      await adjustBudget({
        categoryId: categoryId as Id<"categories">,
        newBudget
      });
      toast.success("Budget adjusted successfully!");
    } catch (error) {
      toast.error("Failed to adjust budget. Please try again.");
      console.error("Error adjusting budget:", error);
    }
  };
  
  // Show loading state
  if (budgetUsageData === undefined) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <RefreshCw className="size-8 animate-spin text-primary/80" />
        <div className="text-lg font-medium">Loading budget data...</div>
      </div>
    );
  }
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  // Calculate summary data for each category type
  const calculateCategorySummary = (categories: any[]) => {
    if (!categories || categories.length === 0) return { totalBudget: 0, totalSpent: 0, remaining: 0, percentUsed: 0 };
    
    const totalBudget = categories.reduce((sum, category) => sum + (category.budget || 0), 0);
    const totalSpent = categories.reduce((sum, category) => sum + category.amountSpent, 0);
    const remaining = totalBudget - totalSpent;
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    
    return { totalBudget, totalSpent, remaining, percentUsed };
  };
  
  // Get income summary
  const incomeSummary = calculateCategorySummary(
    budgetUsageData.categories?.filter(c => c.type === "income") || []
  );
  
  // Get fixed expenses summary
  const fixedExpensesSummary = calculateCategorySummary(
    budgetUsageData.categories?.filter(c => c.nature === "fixed" && c.type === "expense") || []
  );
  
  // Get dynamic expenses summary
  const dynamicExpensesSummary = calculateCategorySummary(
    budgetUsageData.categories?.filter(c => c.nature === "dynamic" && c.type === "expense") || []
  );
  
  // Get current month name
  const currentMonth = format(new Date(dateRange.startDate), "MMMM yyyy");

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-700 to-gray-500 bg-clip-text text-transparent">Budget Progress</h1>
        <p className="text-muted-foreground max-w-2xl">
          Tracking your budget performance for <span className="font-medium text-foreground">{currentMonth}</span>
        </p>
      </div> */}
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income Summary Card */}
        <Card className={`border-0 shadow-md bg-gradient-to-br ${COLOR_SCHEME.income.bgLight}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className={`text-base font-medium ${COLOR_SCHEME.income.textColor}`}>Income Budget</CardTitle>
              <CardDescription>Total income vs. target</CardDescription>
            </div>
            <div className={`p-2 rounded-full ${COLOR_SCHEME.income.bgAccent}`}>
              <ArrowUpIcon className={`h-5 w-5 ${COLOR_SCHEME.income.accentColor}`} />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className={`text-2xl font-bold ${COLOR_SCHEME.income.textColor}`}>{formatCurrency(incomeSummary.totalSpent)}</span>
                <span className="text-xs text-muted-foreground">of {formatCurrency(incomeSummary.totalBudget)}</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-2xl font-bold ${COLOR_SCHEME.income.textColor}`}>
                  {incomeSummary.percentUsed.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">Target Achievement</span>
              </div>
            </div>
            <div className="mt-4">
              <BudgetProgressBar 
                value={Math.min(incomeSummary.percentUsed, 100)} 
                gradientFrom={COLOR_SCHEME.income.gradientFrom}
                gradientTo={COLOR_SCHEME.income.gradientTo}
                height="h-3"
                rounded={true}
                animate={true}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex flex-col w-full">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <PiggyBankIcon className="h-3.5 w-3.5" />
                  Remaining to Goal
                </span>
                <span className={`font-medium ${COLOR_SCHEME.income.accentColor}`}>
                  {formatCurrency(Math.max(incomeSummary.totalBudget - incomeSummary.totalSpent, 0))}
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>
        
        {/* Fixed Expenses Summary Card */}
        <Card className={`border-0 shadow-md bg-gradient-to-br ${COLOR_SCHEME.fixed.bgLight}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className={`text-base font-medium ${COLOR_SCHEME.fixed.textColor}`}>Fixed Expenses</CardTitle>
              <CardDescription>Recurring monthly costs</CardDescription>
            </div>
            <div className={`p-2 rounded-full ${COLOR_SCHEME.fixed.bgAccent}`}>
              <ReceiptIcon className={`h-5 w-5 ${COLOR_SCHEME.fixed.accentColor}`} />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className={`text-2xl font-bold ${COLOR_SCHEME.fixed.textColor}`}>{formatCurrency(fixedExpensesSummary.totalSpent)}</span>
                <span className="text-xs text-muted-foreground">of {formatCurrency(fixedExpensesSummary.totalBudget)}</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-2xl font-bold ${COLOR_SCHEME.fixed.textColor}`}>
                  {fixedExpensesSummary.percentUsed.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">Budget Used</span>
              </div>
            </div>
            <div className="mt-4">
              <BudgetProgressBar 
                value={Math.min(fixedExpensesSummary.percentUsed, 100)} 
                gradientFrom={COLOR_SCHEME.fixed.gradientFrom}
                gradientTo={COLOR_SCHEME.fixed.gradientTo}
                height="h-3"
                rounded={true}
                animate={true}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex flex-col w-full">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <BadgePercentIcon className="h-3.5 w-3.5" />
                  Remaining Budget
                </span>
                <span className={`font-medium ${COLOR_SCHEME.fixed.accentColor}`}>
                  {formatCurrency(Math.max(fixedExpensesSummary.remaining, 0))}
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>
        
        {/* Dynamic Expenses Summary Card */}
        <Card className={`border-0 shadow-md bg-gradient-to-br ${COLOR_SCHEME.dynamic.bgLight}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className={`text-base font-medium ${COLOR_SCHEME.dynamic.textColor}`}>Dynamic Expenses</CardTitle>
              <CardDescription>Variable spending categories</CardDescription>
            </div>
            <div className={`p-2 rounded-full ${COLOR_SCHEME.dynamic.bgAccent}`}>
              <CreditCardIcon className={`h-5 w-5 ${COLOR_SCHEME.dynamic.accentColor}`} />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className={`text-2xl font-bold ${COLOR_SCHEME.dynamic.textColor}`}>{formatCurrency(dynamicExpensesSummary.totalSpent)}</span>
                <span className="text-xs text-muted-foreground">of {formatCurrency(dynamicExpensesSummary.totalBudget)}</span>
              </div>
              <div className="flex flex-col">
                <span className={`text-2xl font-bold ${COLOR_SCHEME.dynamic.textColor}`}>
                  {dynamicExpensesSummary.percentUsed.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">Budget Used</span>
              </div>
            </div>
            <div className="mt-4">
              <BudgetProgressBar 
                value={Math.min(dynamicExpensesSummary.percentUsed, 100)} 
                gradientFrom={COLOR_SCHEME.dynamic.gradientFrom}
                gradientTo={COLOR_SCHEME.dynamic.gradientTo}
                height="h-3"
                rounded={true}
                animate={true}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex flex-col w-full">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <BadgePercentIcon className="h-3.5 w-3.5" />
                  Remaining Budget
                </span>
                <span className={`font-medium ${COLOR_SCHEME.dynamic.accentColor}`}>
                  {formatCurrency(Math.max(dynamicExpensesSummary.remaining, 0))}
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Budget Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income */}
        <Card className={`border-0 shadow-md bg-gradient-to-br ${COLOR_SCHEME.income.bgLight}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-xl font-medium ${COLOR_SCHEME.income.textColor}`}>Income Budget</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetUsageData.categories && budgetUsageData.categories.filter(c => c.type === "income").length > 0 ? (
              <BudgetProgress 
                categories={budgetUsageData.categories.map(category => 
                  category.type === "income" ? 
                    {...category, color: category.color || COLOR_SCHEME.income.gradientTo} : 
                    category
                ).filter(c => c.type === "income")} 
                hideTitle={true}
                singleType="income"
                onAdjustBudget={handleAdjustBudget}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>No income data available for this period.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Fixed Expenses */}
        <Card className={`border-0 shadow-md bg-gradient-to-br ${COLOR_SCHEME.fixed.bgLight}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-xl font-medium ${COLOR_SCHEME.fixed.textColor}`}>Fixed Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetUsageData.categories && budgetUsageData.categories.filter(c => c.nature === "fixed" && c.type === "expense").length > 0 ? (
              <BudgetProgress 
                categories={budgetUsageData.categories.map(category => 
                  category.nature === "fixed" && category.type === "expense" ? 
                    {...category, color: category.color || COLOR_SCHEME.fixed.gradientTo} : 
                    category
                ).filter(c => c.nature === "fixed" && c.type === "expense")} 
                hideTitle={true}
                singleType="fixed"
                onAdjustBudget={handleAdjustBudget}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>No fixed expense data available.</p>
                <p className="text-sm mt-2">Try changing your date range.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Dynamic Expenses */}
        <Card className={`border-0 shadow-md bg-gradient-to-br ${COLOR_SCHEME.dynamic.bgLight}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-xl font-medium ${COLOR_SCHEME.dynamic.textColor}`}>Dynamic Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetUsageData.categories && budgetUsageData.categories.filter(c => c.nature === "dynamic" && c.type === "expense").length > 0 ? (
              <BudgetProgress 
                categories={budgetUsageData.categories.map(category => 
                  category.nature === "dynamic" && category.type === "expense" ? 
                    {...category, color: category.color || COLOR_SCHEME.dynamic.gradientTo} : 
                    category
                ).filter(c => c.nature === "dynamic" && c.type === "expense")} 
                hideTitle={true}
                singleType="dynamic"
                onAdjustBudget={handleAdjustBudget}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>No dynamic expense data available.</p>
                <p className="text-sm mt-2">Try changing your date range.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}