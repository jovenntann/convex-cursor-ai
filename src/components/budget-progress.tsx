"use client";

import { BudgetProgressBar } from "./BudgetProgressBar";
import { Button } from "./ui/button";
import { ArrowUp } from "lucide-react";

type Category = {
  _id: string;
  name: string;
  type: "income" | "expense";
  nature: "fixed" | "dynamic";
  budget?: number;
  amountSpent: number;
  percentageUsed: number;
  color?: string;
  icon?: string;
  isActive: boolean;
  description: string;
};

interface BudgetProgressProps {
  categories: Category[];
  hideTitle?: boolean;
  singleType?: "fixed" | "dynamic" | "income";
  onAdjustBudget?: (categoryId: string, newBudget: number) => Promise<void>;
}

export function BudgetProgress({ categories, hideTitle = false, singleType, onAdjustBudget }: BudgetProgressProps) {
  // Filter categories by nature or type if singleType is provided
  const getCategoriesToRender = () => {
    if (singleType === "fixed") {
      return categories.filter(c => c.nature === "fixed" && c.type === "expense");
    } else if (singleType === "dynamic") {
      return categories.filter(c => c.nature === "dynamic" && c.type === "expense");
    } else if (singleType === "income") {
      return categories.filter(c => c.type === "income");
    }
    
    // Otherwise, use the existing filtering
    return {
      fixedCategories: categories
        .filter(category => category.nature === "fixed" && category.type === "expense")
        .sort((a, b) => {
          // First sort by percentage (descending)
          if (b.percentageUsed !== a.percentageUsed) {
            return b.percentageUsed - a.percentageUsed;
          }
          // If percentages are equal, sort by budget amount (descending)
          const budgetA = a.budget || 0;
          const budgetB = b.budget || 0;
          return budgetB - budgetA;
        }),
      
      dynamicCategories: categories
        .filter(category => category.nature === "dynamic" && category.type === "expense")
        .sort((a, b) => {
          // First sort by percentage (descending)
          if (b.percentageUsed !== a.percentageUsed) {
            return b.percentageUsed - a.percentageUsed;
          }
          // If percentages are equal, sort by budget amount (descending)
          const budgetA = a.budget || 0;
          const budgetB = b.budget || 0;
          return budgetB - budgetA;
        }),
      
      incomeCategories: categories
        .filter(category => category.type === "income")
        .sort((a, b) => {
          // First sort by percentage (descending)
          if (b.percentageUsed !== a.percentageUsed) {
            return b.percentageUsed - a.percentageUsed;
          }
          // If percentages are equal, sort by budget amount (descending)
          const budgetA = a.budget || 0;
          const budgetB = b.budget || 0;
          return budgetB - budgetA;
        })
    };
  };
  
  // Get gradient colors based on category and percentage
  const getGradientColors = (category: Category) => {
    // Add debug logging
    console.log(`Category: ${category.name}, Type: ${category.type}, Percentage: ${category.percentageUsed}`);
    
    // Override with custom color if present (convert to gradient)
    if (category.color) {
      // Check if this is the specific red gradient we want to replace
      if (category.color === "#f44336" || category.color === "#e02f22") {
        // Replace the red gradient with cyan blue gradient
        console.log(`Replacing red gradient with cyan blue for ${category.name}`);
        return { from: "#e0f7fa", to: "#00bcd4" }; // Light cyan to cyan-500
      }
      
      // Create a slightly darker variant for the end of gradient
      const lighterColor = category.color;
      const darkerColor = adjustColor(category.color, -20); // slightly darker
      console.log(`Using custom color: ${lighterColor} to ${darkerColor}`);
      return { from: lighterColor, to: darkerColor };
    }
    
    // Parse percentage to ensure it's a number and not a string
    const percentage = parseFloat(String(category.percentageUsed));
    
    if (percentage > 100) {
      // Red gradient for over budget
      console.log(`Using RED gradient (over budget): ${percentage}%`);
      return { from: "#f44336", to: "#e02f22" }; // Red gradient
    }
    // Green gradient for 100 and less than 100
    console.log(`Using GREEN gradient (within budget): ${percentage}%`);
    return { from: "#e0f7fa", to: "#34d399" }; // Light cyan to green-400
  };
  
  // Helper to adjust color brightness
  const adjustColor = (hex: string, amount: number): string => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse the hex string
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Adjust the color
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  const getTextColor = (category: Category) => {
    if (category.percentageUsed > 100) return "text-red-700";
    return "text-emerald-700";
  };
  
  const renderCategoryList = (categoriesToRender: Category[]) => {
    if (categoriesToRender.length === 0) return null;
    
    // Sort by percentage first (highest to lowest), then by budgeted amount (highest to lowest)
    const sortedCategories = [...categoriesToRender].sort((a, b) => {
      // First sort by percentage (descending)
      if (b.percentageUsed !== a.percentageUsed) {
        return b.percentageUsed - a.percentageUsed;
      }
      
      // If percentages are equal, sort by budget amount (descending)
      const budgetA = a.budget || 0;
      const budgetB = b.budget || 0;
      return budgetB - budgetA;
    });
    
    return (
      <div className="space-y-5">
        {sortedCategories.map((category) => {
          const gradientColors = getGradientColors(category);
          const isOverBudget = category.percentageUsed > 100;
          
          return (
            <div key={category._id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <div className="flex items-center gap-2">
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                  <span className="font-medium">{category.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>
                    ${category.amountSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {category.budget 
                      ? ` / $${category.budget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : ''}
                  </span>
                  <span className={`font-medium ${getTextColor(category)}`}>
                    {category.percentageUsed.toFixed(1)}%
                  </span>
                </div>
              </div>
              <BudgetProgressBar 
                value={Math.min(category.percentageUsed, 100)} 
                gradientFrom={gradientColors.from}
                gradientTo={gradientColors.to}
                height="h-3"
                rounded={true}
                animate={true}
              />
              {/* Add adjust budget button when over budget */}
              {isOverBudget && onAdjustBudget && category.budget && (
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onAdjustBudget(category._id, category.amountSpent)}
                    className="text-xs h-7 px-2 gap-1.5 border-orange-200 hover:border-orange-300 hover:bg-orange-50 text-orange-700"
                  >
                    <ArrowUp className="h-3 w-3" />
                    Adjust Budget to ${category.amountSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  // Handle single type rendering
  if (singleType) {
    const categoriesToRender = getCategoriesToRender() as Category[];
    
    return (
      <div className="space-y-4 p-2">
        {!hideTitle && (
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h3 className="text-xl font-medium text-gray-800">
              {singleType === "fixed" ? "Fixed Expenses" : 
               singleType === "dynamic" ? "Dynamic Expenses" : "Income"}
            </h3>
          </div>
        )}
        
        {renderCategoryList(categoriesToRender)}
        
        {categoriesToRender.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No data available for this period
          </div>
        )}
      </div>
    );
  }
  
  // Handle multi-type rendering (original behavior)
  const { fixedCategories, dynamicCategories, incomeCategories } = getCategoriesToRender() as { 
    fixedCategories: Category[], 
    dynamicCategories: Category[], 
    incomeCategories: Category[] 
  };
  
  const renderCategorySection = (sectionCategories: Category[], title: string) => {
    if (sectionCategories.length === 0) return null;
    
    return (
      <div className="mb-8">
        <h4 className="text-md font-medium text-gray-700 mb-3">{title}</h4>
        {renderCategoryList(sectionCategories)}
      </div>
    );
  };
  
  return (
    <div className="space-y-4 p-2">
      {!hideTitle && (
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-medium text-gray-800">Budget Usage</h3>
        </div>
      )}
      
      {renderCategorySection(fixedCategories, "Fixed Expenses")}
      {renderCategorySection(dynamicCategories, "Dynamic Expenses")}
      {renderCategorySection(incomeCategories, "Income")}
      
      {categories.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No budget data available for this period
        </div>
      )}
    </div>
  );
} 