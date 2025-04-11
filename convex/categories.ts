import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

// Get all categories
export const getAll = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    nature: v.union(v.literal("fixed"), v.literal("dynamic")),
    budget: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.boolean(),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});

// Get all categories with pagination
export const getAllPaginated = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    sortByName: v.optional(v.boolean()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    searchQuery: v.optional(v.string())
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("income"), v.literal("expense")),
      nature: v.union(v.literal("fixed"), v.literal("dynamic")),
      budget: v.optional(v.number()),
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
      isActive: v.boolean(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    // Default sort direction
    const direction = args.sortDirection || "asc";
    const searchQuery = args.searchQuery?.trim().toLowerCase();
    
    // Create the appropriate query based on sort preferences and filters
    let paginationResult;
    
    // Standard pagination approach for all cases
    if (args.type) {
      // If filtering by type
      if (args.sortByName) {
        paginationResult = await ctx.db
          .query("categories")
          .withIndex("by_type", q => q.eq("type", args.type as "income" | "expense"))
          .order(direction)
          .paginate(args.paginationOpts);
      } else {
        paginationResult = await ctx.db
          .query("categories")
          .withIndex("by_type", q => q.eq("type", args.type as "income" | "expense"))
          .order(direction)
          .paginate(args.paginationOpts);
      }
    } else {
      // No type filter
      if (args.sortByName) {
        paginationResult = await ctx.db
          .query("categories")
          .withIndex("by_name")
          .order(direction)
          .paginate(args.paginationOpts);
      } else {
        paginationResult = await ctx.db
          .query("categories")
          .order(direction)
          .paginate(args.paginationOpts);
      }
    }
    
    // If search query exists, filter the paginated results
    if (searchQuery) {
      const filteredPage = paginationResult.page.filter(
        category => category.name.toLowerCase().includes(searchQuery)
      );
      
      // If we filtered everything out and there are more pages, try to get more results
      if (filteredPage.length === 0 && !paginationResult.isDone) {
        // Recursively call with next cursor to get more results
        // This is a simplified implementation - in production code,
        // you might want a more sophisticated approach to avoid deep recursion
        const nextResults = await ctx.db
          .query("categories")
          .collect()
          .then(allCategories => {
            // Filter by search and type
            let filtered = allCategories;
            
            if (searchQuery) {
              filtered = filtered.filter(
                category => category.name.toLowerCase().includes(searchQuery)
              );
            }
            
            if (args.type) {
              filtered = filtered.filter(
                category => category.type === args.type
              );
            }
            
            // Sort results
            if (args.sortByName) {
              filtered.sort((a, b) => {
                const result = a.name.localeCompare(b.name);
                return direction === "asc" ? result : -result;
              });
            } else {
              filtered.sort((a, b) => {
                const result = a._creationTime - b._creationTime;
                return direction === "asc" ? result : -result;
              });
            }
            
            // Manual pagination
            const startIndex = 0;
            const endIndex = args.paginationOpts.numItems;
            const pageResults = filtered.slice(startIndex, endIndex);
            
            return {
              page: pageResults,
              isDone: endIndex >= filtered.length,
              continueCursor: endIndex < filtered.length ? endIndex.toString() : null,
            };
          });
        
        return nextResults;
      }
      
      return {
        page: filteredPage,
        isDone: paginationResult.isDone,
        continueCursor: paginationResult.continueCursor,
      };
    }
    
    // Return standard paginated results
    return {
      page: paginationResult.page,
      isDone: paginationResult.isDone,
      continueCursor: paginationResult.continueCursor,
    };
  },
});

// Get categories by type
export const getByType = query({
  args: { type: v.union(v.literal("income"), v.literal("expense")) },
  returns: v.array(v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    nature: v.union(v.literal("fixed"), v.literal("dynamic")),
    budget: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.boolean(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("categories")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
  },
});

// Get categories by type with pagination
export const getByTypePaginated = query({
  args: { 
    type: v.union(v.literal("income"), v.literal("expense")),
    paginationOpts: paginationOptsValidator 
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("income"), v.literal("expense")),
      nature: v.union(v.literal("fixed"), v.literal("dynamic")),
      budget: v.optional(v.number()),
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
      isActive: v.boolean(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null())
  }),
  handler: async (ctx, args) => {
    const paginationResult = await ctx.db
      .query("categories")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .order("desc")
      .paginate(args.paginationOpts);
    
    // Return only the fields our validator expects
    return {
      page: paginationResult.page,
      isDone: paginationResult.isDone,
      continueCursor: paginationResult.continueCursor,
    };
  },
});

// Get category by ID
export const getById = query({
  args: { id: v.id("categories") },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("income"), v.literal("expense")),
      nature: v.union(v.literal("fixed"), v.literal("dynamic")),
      budget: v.optional(v.number()),
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Count categories (useful for pagination UI)
export const count = query({
  args: { type: v.optional(v.union(v.literal("income"), v.literal("expense"))) },
  returns: v.number(),
  handler: async (ctx, args) => {
    if (args.type !== undefined) {
      const categories = await ctx.db
        .query("categories")
        .withIndex("by_type", (q) => q.eq("type", args.type as "income" | "expense"))
        .collect();
      return categories.length;
    } else {
      const categories = await ctx.db.query("categories").collect();
      return categories.length;
    }
  },
});

// Create a new category
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    nature: v.union(v.literal("fixed"), v.literal("dynamic")),
    budget: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("categories", {
      name: args.name,
      description: args.description,
      type: args.type,
      nature: args.nature,
      budget: args.budget,
      icon: args.icon,
      color: args.color,
      isActive: true,
    });
  },
});

// Update a category
export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    nature: v.optional(v.union(v.literal("fixed"), v.literal("dynamic"))),
    budget: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Count transactions using a category
export const countRelatedTransactions = query({
  args: { categoryId: v.id("categories") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_category", (q) => q.eq("categoryId", args.categoryId))
      .collect();
    
    return transactions.length;
  },
});

// Delete a category and all related transactions (cascading delete)
export const removeWithCascade = mutation({
  args: { id: v.id("categories") },
  returns: v.object({
    success: v.boolean(),
    deletedTransactions: v.number(),
  }),
  handler: async (ctx, args) => {
    // First find all transactions using this category
    const relatedTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_category", (q) => q.eq("categoryId", args.id))
      .collect();
    
    // Delete all related transactions
    for (const transaction of relatedTransactions) {
      await ctx.db.delete(transaction._id);
    }
    
    // Then delete the category
    await ctx.db.delete(args.id);
    
    return {
      success: true,
      deletedTransactions: relatedTransactions.length,
    };
  },
}); 