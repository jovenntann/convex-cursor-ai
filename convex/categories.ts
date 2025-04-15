import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { ConvexError } from "convex/values";

// Get all categories for the authenticated user
export const getAll = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    nature: v.union(v.literal("fixed"), v.literal("dynamic")),
    budget: v.optional(v.number()),
    paymentDueDay: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.boolean(),
  })),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    return await ctx.db
      .query("categories")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();
  },
});

// Get all categories with pagination for the authenticated user
export const getAllPaginated = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    sortByName: v.optional(v.boolean()),
    sortByBudget: v.optional(v.boolean()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    searchQuery: v.optional(v.string())
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("income"), v.literal("expense")),
      nature: v.union(v.literal("fixed"), v.literal("dynamic")),
      budget: v.optional(v.number()),
      paymentDueDay: v.optional(v.number()),
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
      isActive: v.boolean(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    // Default sort direction
    const direction = args.sortDirection || "asc";
    const searchQuery = args.searchQuery?.trim();
    
    // Build our query with the appropriate filters and sorting
    let query;
    let resultsNeedSorting = false;
    
    // If search query is provided, use the search index
    if (searchQuery && searchQuery.length > 0) {
      // Use search index with optional type filter
      if (args.type) {
        query = ctx.db
          .query("categories")
          .withSearchIndex("search_name", q => 
            q.search("name", searchQuery)
             .eq("userId", userId)
             .eq("type", args.type as "income" | "expense")
          );
      } else {
        query = ctx.db
          .query("categories")
          .withSearchIndex("search_name", q => 
            q.search("name", searchQuery)
             .eq("userId", userId)
          );
      }
      
      // If we want to sort by something other than search relevance
      if (args.sortByName || args.sortByBudget) {
        resultsNeedSorting = true;
      }
      
      // Get results with pagination for search query
      const paginationResult = await query.paginate(args.paginationOpts);
      
      // If we need to sort by name or budget instead of search relevance
      if (resultsNeedSorting) {
        let sortedPage;
        if (args.sortByName) {
          sortedPage = [...paginationResult.page].sort((a, b) => {
            if (direction === "asc") {
              return a.name.localeCompare(b.name);
            } else {
              return b.name.localeCompare(a.name);
            }
          });
        } else if (args.sortByBudget) {
          sortedPage = [...paginationResult.page].sort((a, b) => {
            const budgetA = a.budget ?? 0;
            const budgetB = b.budget ?? 0;
            
            if (direction === "asc") {
              return budgetA - budgetB;
            } else {
              return budgetB - budgetA;
            }
          });
        }
        
        return {
          page: sortedPage!,
          isDone: paginationResult.isDone,
          continueCursor: paginationResult.continueCursor
        };
      }
      
      return {
        page: paginationResult.page,
        isDone: paginationResult.isDone,
        continueCursor: paginationResult.continueCursor
      };
    } 
    // Otherwise use regular indexes with sorting
    else {
      if (args.type) {
        // If filtering by type
        query = ctx.db
          .query("categories")
          .withIndex("by_userId_and_type", q => 
            q.eq("userId", userId)
             .eq("type", args.type as "income" | "expense")
          );
      } else {
        // No type filter
        if (args.sortByName) {
          // Name sorting
          query = ctx.db
            .query("categories")
            .withIndex("by_userId_and_name", q => q.eq("userId", userId));
        } else {
          // Default sort or budget sort (we'll handle budget sort in memory)
          query = ctx.db
            .query("categories")
            .withIndex("by_userId", q => q.eq("userId", userId));
        }
      }
      
      // Get results with pagination
      let paginationResult;
      
      // For budget sorting, we need to fetch all results and sort in memory
      if (args.sortByBudget) {
        // First get all the results
        paginationResult = await query.paginate(args.paginationOpts);
        
        // Sort by budget
        const sortedPage = [...paginationResult.page].sort((a, b) => {
          const budgetA = a.budget ?? 0;
          const budgetB = b.budget ?? 0;
          
          if (direction === "asc") {
            return budgetA - budgetB;
          } else {
            return budgetB - budgetA;
          }
        });
        
        return {
          page: sortedPage,
          isDone: paginationResult.isDone,
          continueCursor: paginationResult.continueCursor
        };
      } else {
        // Apply sorting for non-search, non-budget queries
        query = query.order(direction);
        paginationResult = await query.paginate(args.paginationOpts);
        
        return {
          page: paginationResult.page,
          isDone: paginationResult.isDone,
          continueCursor: paginationResult.continueCursor
        };
      }
    }
  },
});

// Get categories by type for the authenticated user
export const getByType = query({
  args: { type: v.union(v.literal("income"), v.literal("expense")) },
  returns: v.array(v.object({
    _id: v.id("categories"),
    _creationTime: v.number(),
    userId: v.string(),
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    nature: v.union(v.literal("fixed"), v.literal("dynamic")),
    budget: v.optional(v.number()),
    paymentDueDay: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.boolean(),
  })),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    return await ctx.db
      .query("categories")
      .withIndex("by_userId_and_type", q => 
        q.eq("userId", userId)
         .eq("type", args.type)
      )
      .collect();
  },
});

// Get categories by type with pagination for the authenticated user
export const getByTypePaginated = query({
  args: { 
    type: v.union(v.literal("income"), v.literal("expense")),
    paginationOpts: paginationOptsValidator 
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("income"), v.literal("expense")),
      nature: v.union(v.literal("fixed"), v.literal("dynamic")),
      budget: v.optional(v.number()),
      paymentDueDay: v.optional(v.number()),
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
      isActive: v.boolean(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null())
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    const paginationResult = await ctx.db
      .query("categories")
      .withIndex("by_userId_and_type", q => 
        q.eq("userId", userId)
         .eq("type", args.type)
      )
      .order("desc")
      .paginate(args.paginationOpts);
    
    // Return only the fields our validator expects
    return {
      page: paginationResult.page,
      isDone: paginationResult.isDone,
      continueCursor: paginationResult.continueCursor
    };
  },
});

// Get category by ID (ensuring it belongs to the authenticated user)
export const getById = query({
  args: { id: v.id("categories") },
  returns: v.union(
    v.object({
      _id: v.id("categories"),
      _creationTime: v.number(),
      userId: v.string(),
      name: v.string(),
      description: v.string(),
      type: v.union(v.literal("income"), v.literal("expense")),
      nature: v.union(v.literal("fixed"), v.literal("dynamic")),
      budget: v.optional(v.number()),
      paymentDueDay: v.optional(v.number()),
      icon: v.optional(v.string()),
      color: v.optional(v.string()),
      isActive: v.boolean(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    const category = await ctx.db.get(args.id);
    
    // Return null if category doesn't exist or doesn't belong to user
    if (!category || category.userId !== userId) {
      return null;
    }
    
    return category;
  },
});

// Count categories for the authenticated user (useful for pagination UI)
export const count = query({
  args: { type: v.optional(v.union(v.literal("income"), v.literal("expense"))) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    if (args.type !== undefined) {
      const categories = await ctx.db
        .query("categories")
        .withIndex("by_userId_and_type", q => 
          q.eq("userId", userId)
           .eq("type", args.type as "income" | "expense")
        )
        .collect();
      return categories.length;
    } else {
      const categories = await ctx.db
        .query("categories")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .collect();
      return categories.length;
    }
  },
});

// Create a new category for the authenticated user
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal("income"), v.literal("expense")),
    nature: v.union(v.literal("fixed"), v.literal("dynamic")),
    budget: v.optional(v.number()),
    paymentDueDay: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    return await ctx.db.insert("categories", {
      userId,
      name: args.name,
      description: args.description,
      type: args.type,
      nature: args.nature,
      budget: args.budget,
      paymentDueDay: args.paymentDueDay,
      icon: args.icon,
      color: args.color,
      isActive: true,
    });
  },
});

// Update a category (ensuring it belongs to the authenticated user)
export const update = mutation({
  args: {
    id: v.id("categories"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    nature: v.optional(v.union(v.literal("fixed"), v.literal("dynamic"))),
    budget: v.optional(v.number()),
    paymentDueDay: v.optional(v.number()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  returns: v.id("categories"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    const { id, ...updates } = args;
    
    // Verify the category belongs to the user
    const category = await ctx.db.get(id);
    if (!category || category.userId !== userId) {
      throw new ConvexError("Category not found or access denied");
    }
    
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Count transactions using a category for the authenticated user
export const countRelatedTransactions = query({
  args: { categoryId: v.id("categories") },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    // Verify the category belongs to the user
    const category = await ctx.db.get(args.categoryId);
    if (!category || category.userId !== userId) {
      throw new ConvexError("Category not found or access denied");
    }
    
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_category", q => 
        q.eq("userId", userId)
         .eq("categoryId", args.categoryId)
      )
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    // Verify the category belongs to the user
    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new ConvexError("Category not found or access denied");
    }
    
    // First find all transactions using this category
    const relatedTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_category", q => 
        q.eq("userId", userId)
         .eq("categoryId", args.id)
      )
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

// Simple delete function for categories (no cascade)
export const remove = mutation({
  args: { id: v.id("categories") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    // Verify the category belongs to the user
    const category = await ctx.db.get(args.id);
    if (!category || category.userId !== userId) {
      throw new ConvexError("Category not found or access denied");
    }
    
    await ctx.db.delete(args.id);
    return true;
  },
}); 