import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { 
  ArrowUpIcon,
  PiggyBankIcon,
  BadgePercentIcon,
  ReceiptIcon,
  CreditCardIcon
} from "lucide-react"

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
import { BudgetProgressBar } from "@/components/BudgetProgressBar"
import { cn } from "@/lib/utils"

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
              <span className={`text-2xl font-bold ${COLOR_SCHEME.income.textColor}`}>{formatCurrency(totalIncome)}</span>
              <span className="text-xs text-muted-foreground">of {formatCurrency(incomeCategoriesTotal)}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-bold ${COLOR_SCHEME.income.textColor}`}>
                {incomePercentage.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">Target Achievement</span>
            </div>
          </div>
          <div className="mt-4">
            <BudgetProgressBar 
              value={Math.min(incomePercentage, 100)}
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
                {formatCurrency(Math.max(remainingIncome, 0))}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Fixed Expenses Card */}
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
              <span className={`text-2xl font-bold ${COLOR_SCHEME.fixed.textColor}`}>{formatCurrency(totalExpense)}</span>
              <span className="text-xs text-muted-foreground">of {formatCurrency(fixedExpensesTotal)}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-bold ${COLOR_SCHEME.fixed.textColor}`}>
                {fixedExpensesPercentage.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">Budget Used</span>
            </div>
          </div>
          <div className="mt-4">
            <BudgetProgressBar 
              value={Math.min(fixedExpensesPercentage, 100)} 
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
                {formatCurrency(Math.max(remainingFixedBudget, 0))}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Dynamic Expenses Card */}
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
              <span className={`text-2xl font-bold ${COLOR_SCHEME.dynamic.textColor}`}>{formatCurrency(netAmount)}</span>
              <span className="text-xs text-muted-foreground">of {formatCurrency(dynamicExpensesTotal)}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-bold ${COLOR_SCHEME.dynamic.textColor}`}>
                {dynamicExpensesPercentage.toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">Budget Used</span>
            </div>
          </div>
          <div className="mt-4">
            <BudgetProgressBar 
              value={Math.min(dynamicExpensesPercentage, 100)} 
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
                {formatCurrency(Math.max(remainingDynamicBudget, 0))}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      {/* Net Balance Card */}
      <Card className={`border-0 shadow-md bg-gradient-to-br ${isPositiveBalance ? COLOR_SCHEME.income.bgLight : 'from-red-50/90 to-white dark:from-red-900/20 dark:to-background/90'}`}>
        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className={`text-base font-medium ${isPositiveBalance ? COLOR_SCHEME.income.textColor : 'text-red-700 dark:text-red-300'}`}>Net Balance</CardTitle>
            <CardDescription>Overall financial position</CardDescription>
          </div>
          <div className={`p-2 rounded-full ${isPositiveBalance ? COLOR_SCHEME.income.bgAccent : 'bg-red-200 dark:bg-red-800/40'}`}>
            {isPositiveBalance ? 
              <ArrowUpIcon className={`h-5 w-5 ${COLOR_SCHEME.income.accentColor}`} /> : 
              <IconTrendingDown className={`h-5 w-5 text-red-600 dark:text-red-400`} />
            }
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className={`text-2xl font-bold ${isPositiveBalance ? COLOR_SCHEME.income.textColor : 'text-red-700 dark:text-red-300'}`}>{formatCurrency(netBalance)}</span>
              <span className="text-xs text-muted-foreground">of {formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex flex-col">
              <span className={`text-2xl font-bold ${isPositiveBalance ? COLOR_SCHEME.income.textColor : 'text-red-700 dark:text-red-300'}`}>
                {Math.abs(netBalancePercentage).toFixed(1)}%
              </span>
              <span className="text-xs text-muted-foreground">{isPositiveBalance ? 'Savings Rate' : 'Deficit Rate'}</span>
            </div>
          </div>
          <div className="mt-4">
            <BudgetProgressBar 
              value={Math.min(Math.abs(netBalancePercentage), 100)} 
              gradientFrom={isPositiveBalance ? COLOR_SCHEME.income.gradientFrom : "#fee2e2"}
              gradientTo={isPositiveBalance ? COLOR_SCHEME.income.gradientTo : "#ef4444"}
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
                {isPositiveBalance ? 'Net surplus' : 'Net deficit'}
              </span>
              <span className={`font-medium ${isPositiveBalance ? COLOR_SCHEME.income.accentColor : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(Math.abs(netBalance))}
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
