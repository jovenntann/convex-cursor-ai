"use client";

import { api } from "@convex/_generated/api";
import { useQuery } from "convex/react";

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { useState } from "react";

export default function HomePage() {
  // Get recent transactions with their categories
  const transactions = useQuery(api.transactions.getWithCategory, { limit: 10 });
  
  // Get counts for summary statistics
  const totalTransactions = useQuery(api.transactions.count, {});
  const incomeCount = useQuery(api.transactions.count, { type: "income" });
  const expenseCount = useQuery(api.transactions.count, { type: "expense" });
  
  // Get financial summary data
  const summary = useQuery(api.transactions.getSummary, {});
  
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
  
  // Format transactions for data table
  const tableData = transactions ? transactions.map((transaction, index) => ({
    id: index + 1,
    header: transaction.description,
    type: transaction.type,
    status: transaction.amount > 0 ? "Done" : "In Process",
    target: transaction.category.name,
    limit: `$${Math.abs(transaction.amount).toFixed(2)}`,
    reviewer: new Date(transaction.date).toLocaleDateString()
  })) : [];

  // Set defaults for financial summary data
  const financialSummary = summary || {
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
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
        <DataTable data={tableData} />
      </div>
    </div>
  )
} 