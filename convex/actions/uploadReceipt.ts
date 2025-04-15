"use node";
import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

// Generate a URL for uploading a receipt file
export const generateUploadUrl = action({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Update a transaction with the uploaded receipt ID
export const uploadReceipt = action({
  args: {
    transactionId: v.id("transactions"),
    storageId: v.id("_storage"),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args): Promise<Id<"transactions">> => {
    // Call a mutation to update the transaction with the receipt ID
    return await ctx.runMutation(api.transactions.addReceiptToTransaction, {
      transactionId: args.transactionId,
      receiptId: args.storageId,
    });
  },
}); 