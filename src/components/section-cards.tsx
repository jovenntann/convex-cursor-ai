import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Income</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalIncome)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {incomeCount} transactions
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Income transactions <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total income from all sources
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Expenses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalExpense)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              {expenseCount} transactions
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Expense tracking <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Total expenses across all categories
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Net Balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(netAmount)}
          </CardTitle>
          <CardAction>
            <Badge variant={netAmount >= 0 ? "outline" : "destructive"}>
              {netAmount >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {transactionCount} total
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {netAmount >= 0 ? "Positive balance" : "Negative balance"} 
            {netAmount >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">Income minus expenses</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Categories</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {categoryCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Spending categories <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Active spending categories</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Income Categories</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(incomeCategoriesTotal)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Expected
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Income sources <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Total expected monthly income</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Fixed Expenses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(fixedExpensesTotal)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              Monthly
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Fixed expenses <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Total monthly fixed expenses</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Dynamic Expenses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(dynamicExpensesTotal)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              Variable
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Variable expenses <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Total variable expense budgets</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Budgeted Expenses</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(totalExpensesCategories)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              Combined
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All expenses <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Fixed + dynamic expense budgets</div>
        </CardFooter>
      </Card>
    </div>
  )
}
