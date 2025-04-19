import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export interface SectionCardsProps {
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  categoryCount: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  fixedExpensesTotal?: number;
  incomeCategoriesTotal?: number;
  dynamicExpensesTotal?: number;
  totalExpensesCategories?: number;
}

export function SectionCards({ 
  transactionCount, 
  incomeCount, 
  expenseCount, 
  categoryCount,
  totalIncome,
  totalExpense,
  netAmount,
  fixedExpensesTotal = 0,
  incomeCategoriesTotal = 0,
  dynamicExpensesTotal = 0,
  totalExpensesCategories = 0
}: SectionCardsProps) {
  // Format currency values
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Calculate percentages
  const incomePercentage = incomeCategoriesTotal > 0 ? (totalIncome / incomeCategoriesTotal) * 100 : 0;
  const fixedExpensesPercentage = fixedExpensesTotal > 0 ? (totalExpense / fixedExpensesTotal) * 100 : 0;
  const dynamicExpensesPercentage = dynamicExpensesTotal > 0 ? (netAmount / dynamicExpensesTotal) * 100 : 0;
  
  // Calculate remaining values
  const remainingIncome = incomeCategoriesTotal - totalIncome;
  const remainingFixedBudget = fixedExpensesTotal - totalExpense;
  const remainingDynamicBudget = dynamicExpensesTotal - netAmount;
  
  // Calculate net balance
  const totalExpensesSum = totalExpense + netAmount;
  const netBalance = totalIncome - totalExpensesSum;
  const netBalancePercentage = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;
  const isPositiveBalance = netBalance >= 0;

  return (
    <div className="grid grid-cols-1 gap-3 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Income Budget Card */}
      <Card className="@container/card rounded-xl bg-gray-50/80 shadow-sm border-0">
        <CardHeader className="pt-4 pb-0 px-4">
          <CardTitle className="text-sm font-medium text-gray-700">Income Budget</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <div className="text-3xl font-bold text-gray-900 mb-1 tabular-nums">
            {formatCurrency(totalIncome)}
          </div>
          <div className="text-xs text-gray-500 mb-1">
            of {formatCurrency(incomeCategoriesTotal)}
          </div>
          <div className="mt-2 mb-1">
            <Progress 
              value={Math.min(incomePercentage, 100)} 
              className="h-2 rounded-full bg-gray-200" 
              color="#737373"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-0 px-4 pt-0 pb-4">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-700">
              <IconTrendingUp className="size-3" />
              Income transactions
            </div>
            <span className="text-xs font-medium text-gray-700">
              {formatCurrency(Math.max(remainingIncome, 0))}
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* Fixed Expenses Card */}
      <Card className="@container/card rounded-xl bg-gray-50/80 shadow-sm border-0">
        <CardHeader className="pt-4 pb-0 px-4">
          <CardTitle className="text-sm font-medium text-gray-700">Fixed Expenses</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <div className="text-3xl font-bold text-gray-900 mb-1 tabular-nums">
            {formatCurrency(totalExpense)}
          </div>
          <div className="text-xs text-gray-500 mb-1">
            of {formatCurrency(fixedExpensesTotal)}
          </div>
          <div className="mt-2 mb-1">
            <Progress 
              value={Math.min(fixedExpensesPercentage, 100)} 
              className="h-2 rounded-full bg-gray-200" 
              color="#737373"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-0 px-4 pt-0 pb-4">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-700">
              <IconTrendingDown className="size-3" />
              Expense transactions
            </div>
            <span className="text-xs font-medium text-gray-700">
              {formatCurrency(Math.max(remainingFixedBudget, 0))}
            </span>
          </div>
        </CardFooter>
      </Card>

      {/* Dynamic Expenses Card */}
      <Card className="@container/card rounded-xl bg-gray-50/80 shadow-sm border-0">
        <CardHeader className="pt-4 pb-0 px-4">
          <CardTitle className="text-sm font-medium text-gray-700">Dynamic Expenses</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <div className="text-3xl font-bold text-gray-900 mb-1 tabular-nums">
            {formatCurrency(netAmount)}
          </div>
          <div className="text-xs text-gray-500 mb-1">
            of {formatCurrency(dynamicExpensesTotal)}
          </div>
          <div className="mt-2 mb-1">
            <Progress 
              value={Math.min(dynamicExpensesPercentage, 100)} 
              className="h-2 rounded-full bg-gray-200" 
              color="#737373"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-0 px-4 pt-0 pb-4">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-700">
              <IconTrendingDown className="size-3" />
              Expense transactions
            </div>
            <span className="text-xs font-medium text-gray-700">
              {formatCurrency(Math.max(remainingDynamicBudget, 0))}
            </span>
          </div>
        </CardFooter>
      </Card>
      
      {/* Net Balance Card */}
      <Card className="@container/card rounded-xl bg-gray-50/80 shadow-sm border-0">
        <CardHeader className="pt-4 pb-0 px-4">
          <CardTitle className="text-sm font-medium text-gray-700">Net Balance</CardTitle>
        </CardHeader>
        <CardContent className="px-4 py-2">
          <div className={`text-3xl font-bold mb-1 tabular-nums ${isPositiveBalance ? 'text-gray-900' : 'text-red-600'}`}>
            {formatCurrency(netBalance)}
          </div>
          <div className="text-xs text-gray-500 mb-1">
            of {formatCurrency(totalIncome)}
          </div>
          <div className="mt-2 mb-1">
            <Progress 
              value={Math.min(Math.abs(netBalancePercentage), 100)} 
              className="h-2 rounded-full bg-gray-200" 
              color={isPositiveBalance ? '#737373' : '#ef4444'}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-0 px-4 pt-0 pb-4">
          <div className="flex items-center w-full justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-700">
              {isPositiveBalance ? 
                <IconTrendingUp className="size-3" /> : 
                <IconTrendingDown className="size-3" />
              }
              {isPositiveBalance ? 'Net surplus' : 'Net deficit'}
            </div>
            <span className="text-xs font-medium text-gray-700">
              {formatCurrency(Math.abs(netBalance))}
            </span>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
