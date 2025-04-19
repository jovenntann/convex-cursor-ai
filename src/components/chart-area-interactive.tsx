"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

interface Transaction {
  _id: string;
  _creationTime: number;
  type: "income" | "expense";
  description: string;
  categoryId: string;
  amount: number;
  date: number;
  category: {
    _id: string;
    name: string;
    icon?: string;
    color?: string;
  };
}

interface ChartAreaInteractiveProps {
  transactions: Transaction[];
}

// Chart configuration for income and expense display
const chartConfig = {
  income: {
    label: "Income",
    color: "var(--success)",
  },
  expense: {
    label: "Expense",
    color: "var(--destructive)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ transactions }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Process transactions into daily aggregates for chart
  const processTransactionsForChart = React.useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    // Create a map to aggregate daily totals
    const dailyTotals = new Map<string, { date: string; income: number; expense: number }>();
    
    // Determine the start date based on the selected time range
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    // Initialize the daily totals map with all days in range
    for (let i = 0; i <= daysToSubtract; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      dailyTotals.set(dateString, { date: dateString, income: 0, expense: 0 });
    }
    
    // Process each transaction
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      
      // Skip if outside our time range
      if (date < startDate) {
        return;
      }
      
      // Get or initialize the daily entry
      let dailyEntry = dailyTotals.get(dateString);
      if (!dailyEntry) {
        dailyEntry = { date: dateString, income: 0, expense: 0 };
      }
      
      // Add to the appropriate category
      if (transaction.type === "income") {
        dailyEntry.income += transaction.amount;
      } else {
        dailyEntry.expense += Math.abs(transaction.amount);
      }
      
      // Update the map
      dailyTotals.set(dateString, dailyEntry);
    });
    
    // Convert map to array and sort by date
    return Array.from(dailyTotals.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [transactions, timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Income & Expenses</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Spending activity over time
          </span>
          <span className="@[540px]/card:hidden">Financial Tracking</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={processTransactionsForChart}>
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-income)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expense)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expense)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const date = new Date(label);
                  const formattedDate = date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                  
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="font-medium">{formattedDate}</div>
                      <div className="flex flex-col gap-1 pt-1">
                        {payload.map((entry, index) => (
                          <div
                            key={`item-${index}`}
                            className="flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-1">
                              <div
                                className="size-2 rounded-full"
                                style={{
                                  backgroundColor:
                                    entry.dataKey === "income"
                                      ? "var(--color-income)"
                                      : "var(--color-expense)",
                                }}
                              />
                              <span className="capitalize">
                                {entry.dataKey === "income" ? "Income" : "Expense"}
                              </span>
                            </div>
                            <div className="font-medium">
                              ${Number(entry.value).toFixed(2)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="income"
              stroke="var(--color-income)"
              fillOpacity={1}
              fill="url(#fillIncome)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="var(--color-expense)"
              fillOpacity={1}
              fill="url(#fillExpense)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
