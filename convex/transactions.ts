import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// Create a new transaction
export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    amount: v.number(),
    description: v.string(),
    date: v.number(), // Timestamp
    type: v.union(v.literal("income"), v.literal("expense"))
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", {
      categoryId: args.categoryId,
      amount: args.amount,
      description: args.description,
      date: args.date,
      type: args.type
    });
  },
}); 