import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Updates all categories with fixed nature to have a payment due day of 15
 */
export const updateFixedCategories = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const fixedCategories = await ctx.db
      .query("categories")
      .withIndex("by_type_and_nature", (q) => 
        q.eq("type", "expense").eq("nature", "fixed")
      )
      .collect();

    // Get fixed income categories as well
    const fixedIncomeCategories = await ctx.db
      .query("categories")
      .withIndex("by_type_and_nature", (q) => 
        q.eq("type", "income").eq("nature", "fixed")
      )
      .collect();
    
    const allFixedCategories = [...fixedCategories, ...fixedIncomeCategories];
    
    let updatedCount = 0;
    
    for (const category of allFixedCategories) {
      await ctx.db.patch(category._id, {
        paymentDueDay: 15
      });
      updatedCount++;
    }
    
    return updatedCount;
  },
}); 