"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Budget Progress</h1>
        <p className="text-muted-foreground max-w-2xl">
          Tracking your budget performance for <span className="font-medium text-foreground">{currentMonth}</span>
        </p>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Income Summary Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-teal-50/90 to-white dark:from-teal-950/20 dark:to-background/90">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium text-teal-700 dark:text-teal-300">Income Budget</CardTitle>
              <CardDescription>Total income vs. target</CardDescription>
            </div>
            <div className="bg-teal-100 dark:bg-teal-900/40 p-2 rounded-full">
              <ArrowUpIcon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-teal-700 dark:text-teal-300">{formatCurrency(incomeSummary.totalSpent)}</span>
                <span className="text-xs text-muted-foreground">of {formatCurrency(incomeSummary.totalBudget)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                  {incomeSummary.percentUsed.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">Target Achievement</span>
              </div>
            </div>
            <div className="mt-4">
              <BudgetProgressBar 
                value={Math.min(incomeSummary.percentUsed, 100)} 
                gradientFrom="#f0fdfa" 
                gradientTo="#2dd4bf"
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
                <span className="font-medium text-teal-600 dark:text-teal-400">
                  {formatCurrency(Math.max(incomeSummary.totalBudget - incomeSummary.totalSpent, 0))}
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>
        
        {/* Fixed Expenses Summary Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50/90 to-white dark:from-blue-950/20 dark:to-background/90">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium text-blue-700 dark:text-blue-300">Fixed Expenses</CardTitle>
              <CardDescription>Recurring monthly costs</CardDescription>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-full">
              <ReceiptIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">{formatCurrency(fixedExpensesSummary.totalSpent)}</span>
                <span className="text-xs text-muted-foreground">of {formatCurrency(fixedExpensesSummary.totalBudget)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {fixedExpensesSummary.percentUsed.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">Budget Used</span>
              </div>
            </div>
            <div className="mt-4">
              <BudgetProgressBar 
                value={Math.min(fixedExpensesSummary.percentUsed, 100)} 
                gradientFrom="#f0f9ff" 
                gradientTo="#3b82f6"
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
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {formatCurrency(Math.max(fixedExpensesSummary.remaining, 0))}
                </span>
              </div>
            </div>
          </CardFooter>
        </Card>
        
        {/* Dynamic Expenses Summary Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50/90 to-white dark:from-purple-950/20 dark:to-background/90">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-base font-medium text-purple-700 dark:text-purple-300">Dynamic Expenses</CardTitle>
              <CardDescription>Variable spending categories</CardDescription>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/40 p-2 rounded-full">
              <CreditCardIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatCurrency(dynamicExpensesSummary.totalSpent)}</span>
                <span className="text-xs text-muted-foreground">of {formatCurrency(dynamicExpensesSummary.totalBudget)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {dynamicExpensesSummary.percentUsed.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">Budget Used</span>
              </div>
            </div>
            <div className="mt-4">
              <BudgetProgressBar 
                value={Math.min(dynamicExpensesSummary.percentUsed, 100)} 
                gradientFrom="#faf5ff" 
                gradientTo="#9333ea"
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
                <span className="font-medium text-purple-600 dark:text-purple-400">
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
        <Card className="border-0 shadow-md bg-gradient-to-br from-teal-50/90 to-white dark:from-teal-950/20 dark:to-background/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-medium text-teal-700 dark:text-teal-300">Income Budget</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetUsageData.categories && budgetUsageData.categories.filter(c => c.type === "income").length > 0 ? (
              <BudgetProgress 
                categories={budgetUsageData.categories.filter(c => c.type === "income")} 
                hideTitle={true}
                singleType="income"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <p>No income data available for this period.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Fixed Expenses */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50/90 to-white dark:from-blue-950/20 dark:to-background/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-medium text-blue-700 dark:text-blue-300">Fixed Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetUsageData.categories && budgetUsageData.categories.filter(c => c.nature === "fixed" && c.type === "expense").length > 0 ? (
              <BudgetProgress 
                categories={budgetUsageData.categories.filter(c => c.nature === "fixed" && c.type === "expense")} 
                hideTitle={true}
                singleType="fixed"
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
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50/90 to-white dark:from-purple-950/20 dark:to-background/90">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-medium text-purple-700 dark:text-purple-300">Dynamic Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {budgetUsageData.categories && budgetUsageData.categories.filter(c => c.nature === "dynamic" && c.type === "expense").length > 0 ? (
              <BudgetProgress 
                categories={budgetUsageData.categories.filter(c => c.nature === "dynamic" && c.type === "expense")} 
                hideTitle={true}
                singleType="dynamic"
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