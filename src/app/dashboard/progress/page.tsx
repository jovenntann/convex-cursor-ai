"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";
import { BudgetProgress } from "@/components/budget-progress";
import { useState } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function ProgressPage() {
  // Date range state
  const [dateRange, setDateRange] = useState(() => {
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
  
  // Handle preset date range selection
  const handlePresetChange = (value: string) => {
    const today = new Date();
    
    switch (value) {
      case "current-month": {
        // First day of current month
        const firstDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1));
        // Last day of current month
        const lastDay = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999));
        
        setDateRange({
          startDate: firstDay.getTime(),
          endDate: lastDay.getTime()
        });
        break;
      }
      case "last-month": {
        // First day of last month
        const firstDay = new Date(Date.UTC(today.getFullYear(), today.getMonth() - 1, 1));
        // Last day of last month
        const lastDay = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999));
        
        setDateRange({
          startDate: firstDay.getTime(),
          endDate: lastDay.getTime()
        });
        break;
      }
      case "last-3-months": {
        // First day of 3 months ago
        const firstDay = new Date(Date.UTC(today.getFullYear(), today.getMonth() - 3, 1));
        // Last day of current month
        const lastDay = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999));
        
        setDateRange({
          startDate: firstDay.getTime(),
          endDate: lastDay.getTime()
        });
        break;
      }
      case "year-to-date": {
        // First day of current year
        const firstDay = new Date(Date.UTC(today.getFullYear(), 0, 1));
        // Last day of current month
        const lastDay = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999));
        
        setDateRange({
          startDate: firstDay.getTime(),
          endDate: lastDay.getTime()
        });
        break;
      }
      default:
        break;
    }
  };
  
  // Handle date range changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const date = new Date(e.target.value).getTime();
    setDateRange(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: date
    }));
  };
  
  // Show loading state
  if (budgetUsageData === undefined) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2">
        <div className="animate-pulse text-lg">Loading budget data...</div>
      </div>
    );
  }
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Budget Progress</h1>
        <p className="text-muted-foreground">
          Track your spending against your budget targets for the selected period.
        </p>
      </div>
      
      {/* Date Range Selector */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6 border-b pb-4">
        <div className="text-muted-foreground">
          Showing data for: <span className="font-medium text-foreground">{formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}</span>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Select onValueChange={handlePresetChange} defaultValue="current-month">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-month">Previous Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="year-to-date">Year to Date</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <label htmlFor="start-date" className="text-sm font-medium">
              From:
            </label>
            <input
              id="start-date"
              type="date"
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={new Date(dateRange.startDate).toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(e, 'start')}
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="end-date" className="text-sm font-medium">
              To:
            </label>
            <input
              id="end-date"
              type="date"
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={new Date(dateRange.endDate).toISOString().split('T')[0]}
              onChange={(e) => handleDateChange(e, 'end')}
            />
          </div>
        </div>
      </div>
      
      {/* 3-Column Budget Progress Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Income */}
        <div className="border rounded-lg p-5 bg-white/80 shadow-sm h-full">
          <h2 className="text-xl font-medium text-gray-800 mb-4 border-b pb-2">Income Budget</h2>
          {budgetUsageData.categories && budgetUsageData.categories.filter(c => c.type === "income").length > 0 ? (
            <BudgetProgress 
              categories={budgetUsageData.categories.filter(c => c.type === "income")} 
              hideTitle={true}
              singleType="income"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-gray-500">No income data available for this period.</p>
            </div>
          )}
        </div>
        
        {/* Center Column - Fixed Expenses */}
        <div className="border rounded-lg p-5 bg-white/80 shadow-sm h-full">
          <h2 className="text-xl font-medium text-gray-800 mb-4 border-b pb-2">Fixed Expenses</h2>
          {budgetUsageData.categories && budgetUsageData.categories.filter(c => c.nature === "fixed" && c.type === "expense").length > 0 ? (
            <BudgetProgress 
              categories={budgetUsageData.categories.filter(c => c.nature === "fixed" && c.type === "expense")} 
              hideTitle={true}
              singleType="fixed"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-gray-500">No fixed expense data available.</p>
              <p className="text-sm text-gray-400 mt-2">Try changing your date range.</p>
            </div>
          )}
        </div>
        
        {/* Right Column - Dynamic Expenses */}
        <div className="border rounded-lg p-5 bg-white/80 shadow-sm h-full">
          <h2 className="text-xl font-medium text-gray-800 mb-4 border-b pb-2">Dynamic Expenses</h2>
          {budgetUsageData.categories && budgetUsageData.categories.filter(c => c.nature === "dynamic" && c.type === "expense").length > 0 ? (
            <BudgetProgress 
              categories={budgetUsageData.categories.filter(c => c.nature === "dynamic" && c.type === "expense")} 
              hideTitle={true}
              singleType="dynamic"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-gray-500">No dynamic expense data available.</p>
              <p className="text-sm text-gray-400 mt-2">Try changing your date range.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 