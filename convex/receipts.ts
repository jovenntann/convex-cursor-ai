import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

/**
 * Insert a new receipt into the database
 */
export const insertReceipt = internalMutation({
  args: {
    userId: v.string(),
    date: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    description: v.string(),
    categoryId: v.id("categories"),
    amount: v.number(),
    status: v.union(v.literal("PENDING"), v.literal("APPROVED")),
    receiptId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const receiptId = await ctx.db.insert("receipts", {
      userId: args.userId,
      date: args.date,
      type: args.type,
      description: args.description,
      categoryId: args.categoryId,
      amount: args.amount,
      status: args.status,
      receiptId: args.receiptId,
    });
    
    return receiptId;
  },
}); 