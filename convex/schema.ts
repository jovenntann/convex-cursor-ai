import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Schema for personal spending tracker with the following access patterns:
 * 
 * Users table:
 * - Authenticate users by token identifier (by_token)
 * 
 * Categories table:
 * - List all categories of a specific type (income/expense) (by_type)
 * - Filter categories by type and nature (fixed/dynamic) (by_type_and_nature)
 * - Sort categories by name (by_name)
 * - Update/delete categories (by ID)
 * - Search categories by name with type filtering (search_name)
 * - Full-text search with fuzzy matching on category names
 * - Reactive queries that automatically update when categories change
 * - Support for pagination and limiting results
 * - Enforce schema validation on all fields
 * - Track relationships with transactions (via foreign key)
 * - Support for complex filtering with multiple conditions
 * 
 * Transactions table:
 * - Group transactions by category (by_category)
 * - View transactions chronologically (by_date)
 * - Track spending/income by category over time
 * - Support cascading delete when removing categories
 * - Search transactions by description with type filtering (search_description)
 */
export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    userId: v.string(),
    tokenIdentifier: v.string(),
    createdAt: v.string(),
  }).index("by_token", ["tokenIdentifier"]),
  
  // Categories table
  categories: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    nature: v.union(v.literal("fixed"), v.literal("dynamic")),
    budget: v.optional(v.number()),
    paymentDueDay: v.optional(v.number()), // Optional field for payment due day (1-31)
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_type", ["type"])
    .index("by_type_and_nature", ["type", "nature"])
    .index("by_name", ["name"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["type"]
    }),
    
  // Transactions table (for category relationships)
  transactions: defineTable({
    categoryId: v.id("categories"),
    amount: v.number(),
    description: v.string(),
    date: v.number(), // Timestamp
    type: v.union(v.literal("income"), v.literal("expense")),
    receiptId: v.optional(v.id("_storage")), // Add this to store file ID
    // Other fields would be here in the full implementation
  })
    .index("by_category", ["categoryId"])
    .index("by_date", ["date"])
    .index("by_type", ["type"])
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["type"]
    }),
}); 