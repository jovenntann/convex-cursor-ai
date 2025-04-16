"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { useState, useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export default function HomePage() {
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
      default:
        break;
    }
  };
  
  // Get recent transactions with their categories
  const transactions = useQuery(api.transactions.getWithCategory, { 
    limit: 10,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });
  
  // Get recent income transactions
  const recentIncomeTransactions = useQuery(api.transactions.getWithCategory, { 
    limit: 10, 
    type: "income",
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });
  
  // Get counts for summary statistics
  const totalTransactions = useQuery(api.transactions.count, {});
  const incomeCount = useQuery(api.transactions.count, { type: "income" });
  const expenseCount = useQuery(api.transactions.count, { type: "expense" });
  
  // Get financial summary data
  const summary = useQuery(api.transactions.getSummary, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });
  
  // Get all categories
  const categories = useQuery(api.categories.getAll);
  
  // Get sum of fixed expenses
  const fixedExpensesTotal = useQuery(api.categories.sumFixedExpenses);
  
  // Get sum of income categories
  const incomeCategoriesTotal = useQuery(api.categories.sumIncomeCategories);
  
  // Get sum of dynamic expenses
  const dynamicExpensesTotal = useQuery(api.categories.sumDynamicExpenses);
  
  // Get sum of all expense categories (fixed + dynamic)
  const totalExpensesCategories = useQuery(api.categories.sumTotalExpenseCategories);
  
  // Track active tab
  const [activeTab, setActiveTab] = useState("outline");
  
  // Handle date range changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const date = new Date(e.target.value).getTime();
    setDateRange(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: date
    }));
  };
  
  // Check loading state
  const isLoading = 
    transactions === undefined || 
    recentIncomeTransactions === undefined ||
    totalTransactions === undefined || 
    incomeCount === undefined || 
    expenseCount === undefined || 
    summary === undefined || 
    categories === undefined || 
    fixedExpensesTotal === undefined || 
    incomeCategoriesTotal === undefined || 
    dynamicExpensesTotal === undefined || 
    totalExpensesCategories === undefined;
  
  // Format recent transactions for data table
  const recentTransactionsData = transactions ? transactions.map((transaction, index) => ({
    id: index + 1,
    category: {
      icon: transaction.category.icon || "📁",
      name: transaction.category.name
    },
    date: new Date(transaction.date).toLocaleDateString(),
    description: transaction.description,
    amount: `${transaction.type === "income" ? "+" : "-"}$${Math.abs(transaction.amount).toFixed(2)}`,
    type: transaction.type
  })) : [];
  
  // Format income transactions for data table
  const incomeTransactionsData = recentIncomeTransactions ? recentIncomeTransactions.map((transaction, index) => ({
    id: index + 1,
    category: {
      icon: transaction.category.icon || "📁",
      name: transaction.category.name
    },
    date: new Date(transaction.date).toLocaleDateString(),
    description: transaction.description,
    amount: `+$${Math.abs(transaction.amount).toFixed(2)}`,
    type: transaction.type
  })) : [];

  // Set defaults for financial summary data
  const financialSummary = summary || {
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0
  };

  // Prepare column headers based on transaction data
  const [tableHeaders, setTableHeaders] = useState({
    category: "Category",
    description: "Description",
    date: "Date",
    type: "Type",
    amount: "Amount"
  });

  // Update headers if transactions data is available
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      setTableHeaders({
        category: "Category",
        description: "Description",
        date: "Date",
        type: "Type",
        amount: "Amount"
      });
    }
  }, [transactions]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="@container/main flex flex-1 flex-col items-center justify-center gap-2">
        <div className="animate-pulse text-lg">Loading financial data...</div>
      </div>
    );
  }

  // Show empty state if no transactions
  if (transactions && transactions.length === 0) {
    return (
      <div className="@container/main flex flex-1 flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">No transactions found</h2>
        <p>Add your first transaction to start tracking your finances</p>
      </div>
    );
  }

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Date Range Selector */}
        <div className="px-4 lg:px-6 flex flex-col sm:flex-row gap-3 items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Financial Dashboard</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <Select onValueChange={handlePresetChange} defaultValue="current-month">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
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
        
        <SectionCards 
          transactionCount={totalTransactions || 0}
          incomeCount={incomeCount || 0}
          expenseCount={expenseCount || 0}
          categoryCount={categories?.length || 0}
          totalIncome={financialSummary.totalIncome}
          totalExpense={financialSummary.totalExpense}
          netAmount={financialSummary.netAmount}
          fixedExpensesTotal={fixedExpensesTotal || 0}
          incomeCategoriesTotal={incomeCategoriesTotal || 0}
          dynamicExpensesTotal={dynamicExpensesTotal || 0}
          totalExpensesCategories={totalExpensesCategories || 0}
        />
        <div className="px-4 lg:px-6">
          <ChartAreaInteractive transactions={transactions || []} />
        </div>
        <DataTable 
          data={activeTab === "past-performance" ? incomeTransactionsData : recentTransactionsData} 
          columnHeaders={tableHeaders}
          onTabChange={setActiveTab}
          counts={{
            income: recentIncomeTransactions?.length || 0,
            paidExpenses: 0, // We would need data for these
            unpaidExpenses: 0, // We would need data for these
          }}
        />
      </div>
    </div>
  )
} 