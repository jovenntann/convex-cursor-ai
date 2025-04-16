"use client";

import { BudgetProgressBar } from "./BudgetProgressBar";

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
}

export function BudgetProgress({ categories, hideTitle = false, singleType }: BudgetProgressProps) {
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
        .sort((a, b) => b.percentageUsed - a.percentageUsed),
      
      dynamicCategories: categories
        .filter(category => category.nature === "dynamic" && category.type === "expense")
        .sort((a, b) => b.percentageUsed - a.percentageUsed),
      
      incomeCategories: categories
        .filter(category => category.type === "income")
        .sort((a, b) => b.percentageUsed - a.percentageUsed)
    };
  };
  
  // Get gradient colors based on category and percentage
  const getGradientColors = (category: Category) => {
    // Add debug logging
    console.log(`Category: ${category.name}, Type: ${category.type}, Percentage: ${category.percentageUsed}`);
    
    // Override with custom color if present (convert to gradient)
    if (category.color) {
      // Create a slightly darker variant for the end of gradient
      const lighterColor = category.color;
      const darkerColor = adjustColor(category.color, -20); // slightly darker
      console.log(`Using custom color: ${lighterColor} to ${darkerColor}`);
      return { from: lighterColor, to: darkerColor };
    }
    
    // Parse percentage to ensure it's a number and not a string
    const percentage = parseFloat(String(category.percentageUsed));
    
    if (category.type === "expense") {
      if (percentage >= 100) {
        // Red gradient for over budget (matching the image with lighter start)
        console.log(`Using RED gradient (over budget): ${percentage}%`);
        return { from: "#fef2f2", to: "#e11d48" }; // Ultra light pink to rich red
      }
      if (percentage >= 80) {
        // Amber gradient for approaching budget limit (extra light version)
        console.log(`Using AMBER gradient (near limit): ${percentage}%`);
        return { from: "#fffbeb", to: "#fcd34d" }; // Ultra light amber to amber-300
      }
      // Green gradient for under budget (extra light version)
      console.log(`Using GREEN gradient (under budget): ${percentage}%`);
      return { from: "#ecfdf5", to: "#6ee7b7" }; // Ultra light emerald to emerald-300
    } else {
      // Blue gradient for income (extra light version)
      console.log(`Using BLUE gradient (income): ${percentage}%`);
      return { from: "#f0f9ff", to: "#93c5fd" }; // Ultra light blue to blue-300
    }
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
    if (category.type === "expense") {
      if (category.percentageUsed > 100) return "text-red-700";
      if (category.percentageUsed > 80) return "text-amber-700";
      return "text-emerald-700";
    } else {
      return "text-blue-700";
    }
  };
  
  const renderCategoryList = (categoriesToRender: Category[]) => {
    if (categoriesToRender.length === 0) return null;
    
    // Sort by percentage used
    const sortedCategories = [...categoriesToRender].sort((a, b) => b.percentageUsed - a.percentageUsed);
    
    return (
      <div className="space-y-5">
        {sortedCategories.map((category) => {
          const gradientColors = getGradientColors(category);
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