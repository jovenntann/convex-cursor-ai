"use client";

import { Progress } from "./ui/progress";

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
  
  // Get softer colors based on percentage
  const getProgressColor = (category: Category) => {
    // Override with custom color if present
    if (category.color) return category.color;
    
    if (category.type === "expense") {
      if (category.percentageUsed > 100) return "#fecaca"; // red-200 (much lighter)
      if (category.percentageUsed > 80) return "#fed7aa"; // amber-200 (much lighter)
      return "#a7f3d0"; // emerald-200 (much lighter)
    } else {
      return "#bfdbfe"; // blue-200 (much lighter)
    }
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
        {sortedCategories.map((category) => (
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
            <Progress 
              value={Math.min(category.percentageUsed, 100)} 
              color={getProgressColor(category)}
              className="h-3 rounded-lg"
            />
          </div>
        ))}
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