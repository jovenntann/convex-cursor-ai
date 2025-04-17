import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

// Create a new transaction
export const create = mutation({
  args: {
    categoryId: v.id("categories"),
    amount: v.number(),
    description: v.string(),
    date: v.number(), // Timestamp
    type: v.union(v.literal("income"), v.literal("expense")),
    receiptId: v.optional(v.id("_storage"))
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    return await ctx.db.insert("transactions", {
      userId,
      categoryId: args.categoryId,
      amount: args.amount,
      description: args.description,
      date: args.date,
      type: args.type,
      receiptId: args.receiptId
    });
  },
}); 

// Get transactions with their category information
export const getWithCategory = query({
  args: {
    limit: v.optional(v.number()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc")))
  },
  returns: v.array(
    v.object({
      _id: v.id("transactions"),
      _creationTime: v.number(),
      userId: v.string(),
      categoryId: v.id("categories"),
      amount: v.number(),
      description: v.string(),
      date: v.number(),
      type: v.union(v.literal("income"), v.literal("expense")),
      receiptId: v.optional(v.id("_storage")),
      category: v.object({
        _id: v.id("categories"),
        name: v.string(),
        icon: v.optional(v.string()),
        color: v.optional(v.string())
      })
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    const limit = args.limit ?? 10;
    
    // Start building our query
    let query;
    
    // If date range is provided, use the date index
    if (args.startDate !== undefined && args.endDate !== undefined) {
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_date", q => 
          q.eq("userId", userId)
           .gte("date", args.startDate as number)
           .lte("date", args.endDate as number)
        );
      
      // Apply type filter if needed
      if (args.type) {
        query = query.filter(q => q.eq(q.field("type"), args.type as "income" | "expense"));
      }
    }
    // Filter by type if specified
    else if (args.type) {
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_type", q => 
          q.eq("userId", userId)
           .eq("type", args.type as "income" | "expense")
        );
    } else {
      // Get all transactions for the user
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId", q => q.eq("userId", userId));
    }
    
    // Apply sort direction to the date-filtered query
    const direction = args.sortDirection || "desc";
    query = query.order(direction);
    
    // Take the limit
    const transactions = await query.take(limit);
    
    // Fetch category details for each transaction
    return await Promise.all(
      transactions.map(async (transaction) => {
        const category = await ctx.db.get(transaction.categoryId);
        
        return {
          ...transaction,
          category: category ? {
            _id: category._id,
            name: category.name,
            icon: category.icon,
            color: category.color
          } : {
            _id: transaction.categoryId,
            name: "Unknown Category",
            icon: undefined,
            color: undefined
          }
        };
      })
    );
  },
}); 

// Calculate sum of income transactions
export const sumIncome = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    categoryId: v.optional(v.id("categories"))
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    let query;
    
    // If date range is provided, use the date index
    if (args.startDate !== undefined && args.endDate !== undefined) {
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_date", q => 
          q.eq("userId", userId)
            .gte("date", args.startDate as number)
            .lte("date", args.endDate as number)
        );
      
      // Apply type filter
      query = query.filter(q => q.eq(q.field("type"), "income"));
      
      // Apply category filter if provided
      if (args.categoryId !== undefined) {
        query = query.filter(q => q.eq(q.field("categoryId"), args.categoryId as Id<"categories">));
      }
    } else {
      // Use the type index when no date range
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_type", q => 
          q.eq("userId", userId)
          .eq("type", "income")
        );
      
      // Apply category filter if provided
      if (args.categoryId !== undefined) {
        query = query.filter(q => q.eq(q.field("categoryId"), args.categoryId as Id<"categories">));
      }
    }
    
    // Collect all matching transactions
    const transactions = await query.collect();
    
    // Sum up the amounts
    return transactions.reduce((total, transaction) => total + transaction.amount, 0);
  }
});

// Calculate sum of expense transactions
export const sumExpense = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    categoryId: v.optional(v.id("categories"))
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    let query;
    
    // If date range is provided, use the date index
    if (args.startDate !== undefined && args.endDate !== undefined) {
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_date", q => 
          q.eq("userId", userId)
            .gte("date", args.startDate as number)
            .lte("date", args.endDate as number)
        );
      
      // Apply type filter
      query = query.filter(q => q.eq(q.field("type"), "expense"));
      
      // Apply category filter if provided
      if (args.categoryId !== undefined) {
        query = query.filter(q => q.eq(q.field("categoryId"), args.categoryId as Id<"categories">));
      }
    } else {
      // Use the type index when no date range
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_type", q => 
          q.eq("userId", userId)
          .eq("type", "expense")
        );
      
      // Apply category filter if provided
      if (args.categoryId !== undefined) {
        query = query.filter(q => q.eq(q.field("categoryId"), args.categoryId as Id<"categories">));
      }
    }
    
    // Collect all matching transactions
    const transactions = await query.collect();
    
    // Sum up the amounts
    return transactions.reduce((total, transaction) => total + transaction.amount, 0);
  }
});

// Get transaction sums (income, expense, and net) in a single query
export const getSummary = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  returns: v.object({
    totalIncome: v.number(),
    totalExpense: v.number(),
    netAmount: v.number()
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    let incomeQuery;
    let expenseQuery;
    
    // If date range is provided, use the date index
    if (args.startDate !== undefined && args.endDate !== undefined) {
      incomeQuery = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_date", q => 
          q.eq("userId", userId)
            .gte("date", args.startDate as number)
            .lte("date", args.endDate as number)
        )
        .filter(q => q.eq(q.field("type"), "income"));
        
      expenseQuery = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_date", q => 
          q.eq("userId", userId)
            .gte("date", args.startDate as number)
            .lte("date", args.endDate as number)
        )
        .filter(q => q.eq(q.field("type"), "expense"));
    } else {
      // Without date range, use the type index
      incomeQuery = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_type", q => 
          q.eq("userId", userId)
           .eq("type", "income")
        );
        
      expenseQuery = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_type", q => 
          q.eq("userId", userId)
           .eq("type", "expense")
        );
    }
    
    // Collect transactions by type
    const incomeTransactions = await incomeQuery.collect();
    const expenseTransactions = await expenseQuery.collect();
    
    // Calculate sums
    const totalIncome = incomeTransactions.reduce((total, transaction) => total + transaction.amount, 0);
    const totalExpense = expenseTransactions.reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
    
    return {
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense
    };
  }
});

// Get all transactions with pagination, sorting, filtering, and search
export const getAllPaginated = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    sortByAmount: v.optional(v.boolean()),
    sortByDate: v.optional(v.boolean()),
    sortByDescription: v.optional(v.boolean()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    categoryId: v.optional(v.id("categories")),
    searchQuery: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("transactions"),
      _creationTime: v.number(),
      userId: v.string(),
      categoryId: v.id("categories"),
      amount: v.number(),
      description: v.string(),
      date: v.number(),
      type: v.union(v.literal("income"), v.literal("expense")),
      receiptId: v.optional(v.id("_storage")),
      category: v.object({
        _id: v.id("categories"),
        name: v.string(),
        icon: v.optional(v.string()),
        color: v.optional(v.string())
      })
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
          .query("transactions")
          .withSearchIndex("search_description", q => 
            q.search("description", searchQuery)
             .eq("userId", userId)
             .eq("type", args.type as "income" | "expense")
          );
      } else {
        query = ctx.db
          .query("transactions")
          .withSearchIndex("search_description", q => 
            q.search("description", searchQuery)
             .eq("userId", userId)
          );
      }
    } 
    // If date range is provided, use the date index
    else if (args.startDate !== undefined && args.endDate !== undefined) {
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_date", q => 
          q.eq("userId", userId)
           .gte("date", args.startDate as number)
           .lte("date", args.endDate as number)
        );
        
      // Apply additional type filter if needed
      if (args.type) {
        query = query.filter(q => q.eq(q.field("type"), args.type as "income" | "expense"));
      }
      
      // Apply category filter if needed
      if (args.categoryId) {
        query = query.filter(q => q.eq(q.field("categoryId"), args.categoryId as Id<"categories">));
      }
      
      // Apply sort direction for date-filtered query
      query = query.order(direction);
    }
    // Otherwise use regular indexes with sorting
    else {
      if (args.type) {
        // If filtering by type
        query = ctx.db
          .query("transactions")
          .withIndex("by_userId_and_type", q => 
            q.eq("userId", userId)
             .eq("type", args.type as "income" | "expense")
          );
      } else if (args.sortByDate) {
        // If sorting by date
        query = ctx.db
          .query("transactions")
          .withIndex("by_userId_and_date", q => q.eq("userId", userId));
      } else if (args.categoryId) {
        // If filtering by category
        query = ctx.db
          .query("transactions")
          .withIndex("by_userId_and_category", q => 
            q.eq("userId", userId)
             .eq("categoryId", args.categoryId as Id<"categories">)
          );
      } else {
        // Default sort (by creation time)
        query = ctx.db
          .query("transactions")
          .withIndex("by_userId", q => q.eq("userId", userId));
      }
      
      // Apply sorting direction if not using the search index
      query = query.order(direction);
    }
    
    // Get results with pagination
    const paginationResult = await query.paginate(args.paginationOpts);
    
    // Fetch category details for each transaction
    const transactionsWithCategories = await Promise.all(
      paginationResult.page.map(async (transaction) => {
        const category = await ctx.db.get(transaction.categoryId);
        
        return {
          ...transaction,
          category: category ? {
            _id: category._id,
            name: category.name,
            icon: category.icon,
            color: category.color
          } : {
            _id: transaction.categoryId,
            name: "Unknown Category",
            icon: undefined,
            color: undefined
          }
        };
      })
    );
    
    // Apply in-memory sorting if needed and not already sorted by the database
    if (args.sortByAmount || (args.sortByDescription && !searchQuery)) {
      let sortedTransactions;
      
      if (args.sortByAmount) {
        sortedTransactions = [...transactionsWithCategories].sort((a, b) => {
          const amountA = Math.abs(a.amount);
          const amountB = Math.abs(b.amount);
          
          if (direction === "asc") {
            return amountA - amountB;
          } else {
            return amountB - amountA;
          }
        });
      } else if (args.sortByDescription) {
        sortedTransactions = [...transactionsWithCategories].sort((a, b) => {
          if (direction === "asc") {
            return a.description.localeCompare(b.description);
          } else {
            return b.description.localeCompare(a.description);
          }
        });
      }
      
      return {
        page: sortedTransactions!,
        isDone: paginationResult.isDone,
        continueCursor: paginationResult.continueCursor
      };
    }
    
    return {
      page: transactionsWithCategories,
      isDone: paginationResult.isDone,
      continueCursor: paginationResult.continueCursor
    };
  },
});

// Count transactions
export const count = query({
  args: { 
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    categoryId: v.optional(v.id("categories"))
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    // Build query based on provided filters
    if (args.type !== undefined && args.categoryId !== undefined) {
      // If both filters are applied, use one index and filter by the other field
      const results = await ctx.db
        .query("transactions")
        .withIndex("by_type", q => q.eq("type", args.type as "income" | "expense"))
        .filter(q => q.eq(q.field("categoryId"), args.categoryId as Id<"categories">))
        .collect();
        
      return results.length;
    } else if (args.type !== undefined) {
      // Only filter by type
      const results = await ctx.db
        .query("transactions")
        .withIndex("by_type", q => q.eq("type", args.type as "income" | "expense"))
        .collect();
        
      return results.length;
    } else if (args.categoryId !== undefined) {
      // Only filter by category
      const results = await ctx.db
        .query("transactions")
        .withIndex("by_category", q => q.eq("categoryId", args.categoryId as Id<"categories">))
        .collect();
        
      return results.length;
    } else {
      // No filters, get all transactions
      const results = await ctx.db.query("transactions").collect();
      return results.length;
    }
  },
});

// Get transaction by ID with category details
export const getById = query({
  args: { id: v.id("transactions") },
  returns: v.union(
    v.object({
      _id: v.id("transactions"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      amount: v.number(),
      description: v.string(),
      date: v.number(),
      type: v.union(v.literal("income"), v.literal("expense")),
      receiptId: v.optional(v.id("_storage")),
      category: v.object({
        _id: v.id("categories"),
        name: v.string(),
        icon: v.optional(v.string()),
        color: v.optional(v.string())
      })
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.id);
    if (!transaction) return null;
    
    const category = await ctx.db.get(transaction.categoryId);
    
    return {
      ...transaction,
      category: category ? {
        _id: category._id,
        name: category.name,
        icon: category.icon,
        color: category.color
      } : {
        _id: transaction.categoryId,
        name: "Unknown Category",
        icon: undefined,
        color: undefined
      }
    };
  },
});

// Update a transaction
export const update = mutation({
  args: {
    id: v.id("transactions"),
    categoryId: v.optional(v.id("categories")),
    amount: v.optional(v.number()),
    description: v.optional(v.string()),
    date: v.optional(v.number()),
    type: v.optional(v.union(v.literal("income"), v.literal("expense"))),
    receiptId: v.optional(v.id("_storage"))
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return id;
  },
});

// Delete a transaction
export const remove = mutation({
  args: { id: v.id("transactions") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

// Add receipt to transaction
export const addReceiptToTransaction = mutation({
  args: {
    transactionId: v.id("transactions"),
    receiptId: v.id("_storage"),
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transactionId, {
      receiptId: args.receiptId,
    });
    return args.transactionId;
  },
});

// Get receipt URL
export const getReceiptUrl = query({
  args: {
    receiptId: v.id("_storage"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.receiptId);
  },
});

// Get all transactions with receipts (paginated)
export const getReceiptsPaginated = query({
  args: { 
    paginationOpts: paginationOptsValidator,
    categoryId: v.optional(v.id("categories")),
    searchQuery: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc")))
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("transactions"),
      _creationTime: v.number(),
      categoryId: v.id("categories"),
      amount: v.number(),
      description: v.string(),
      date: v.number(),
      type: v.union(v.literal("income"), v.literal("expense")),
      receiptId: v.optional(v.id("_storage")),
      receiptUrl: v.union(v.string(), v.null()),
      category: v.object({
        _id: v.id("categories"),
        name: v.string(),
        icon: v.optional(v.string()),
        color: v.optional(v.string())
      })
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
    const direction = args.sortDirection || "desc";
    
    // Start building our query
    let query;
    
    // If date range is provided, use the date index
    if (args.startDate !== undefined && args.endDate !== undefined) {
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_date", q => 
          q.eq("userId", userId)
           .gte("date", args.startDate as number)
           .lte("date", args.endDate as number)
        )
        // Filter for receipt existence
        .filter(q => q.neq(q.field("receiptId"), undefined));
        
      // Apply category filter if needed
      if (args.categoryId) {
        query = query.filter(q => q.eq(q.field("categoryId"), args.categoryId as Id<"categories">));
      }
    } else {
      // Without date range, use the userId index
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId", q => q.eq("userId", userId))
        // Filter for receipt existence
        .filter(q => q.neq(q.field("receiptId"), undefined));
        
      // Apply category filter if needed
      if (args.categoryId) {
        query = query.filter(q => q.eq(q.field("categoryId"), args.categoryId as Id<"categories">));
      }
    }
    
    // Apply ordering and paginate
    const paginationResult = await query.order(direction).paginate(args.paginationOpts);
    
    // Get categories for all transactions
    const transactionsWithCategory = await Promise.all(
      paginationResult.page.map(async (transaction) => {
        const category = await ctx.db.get(transaction.categoryId);
        
        // Get receipt URL if available
        let receiptUrl = null;
        if (transaction.receiptId) {
          receiptUrl = await ctx.storage.getUrl(transaction.receiptId);
        }
        
        return {
          ...transaction,
          receiptUrl,
          category: category ? {
            _id: category._id,
            name: category.name,
            icon: category.icon,
            color: category.color
          } : {
            _id: transaction.categoryId,
            name: "Unknown Category",
            icon: undefined,
            color: undefined
          }
        };
      })
    );
    
    // Search filtering (after fetching to search in normalized data)
    let filteredTransactions = transactionsWithCategory;
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      filteredTransactions = transactionsWithCategory.filter(t => 
        t.description.toLowerCase().includes(query) || 
        t.category.name.toLowerCase().includes(query)
      );
    }
    
    return {
      page: filteredTransactions,
      isDone: paginationResult.isDone,
      continueCursor: paginationResult.continueCursor,
    };
  },
});

// Get recent income transactions based on date range
export const getRecentIncome = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    limit: v.optional(v.number()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc")))
  },
  returns: v.array(
    v.object({
      _id: v.id("transactions"),
      _creationTime: v.number(),
      userId: v.string(),
      categoryId: v.id("categories"),
      amount: v.number(),
      description: v.string(),
      date: v.number(),
      type: v.union(v.literal("income"), v.literal("expense")),
      receiptId: v.optional(v.id("_storage")),
      category: v.object({
        _id: v.id("categories"),
        name: v.string(),
        icon: v.optional(v.string()),
        color: v.optional(v.string())
      })
    })
  ),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    const limit = args.limit ?? 10;
    const direction = args.sortDirection || "desc";
    
    // Query income transactions within the date range using the date index
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_date", q => 
        q.eq("userId", userId)
         .gte("date", args.startDate)
         .lte("date", args.endDate)
      )
      .filter(q => q.eq(q.field("type"), "income"))
      .order(direction)
      .take(limit);
    
    // Fetch category details for each transaction
    return await Promise.all(
      transactions.map(async (transaction) => {
        const category = await ctx.db.get(transaction.categoryId);
        
        return {
          ...transaction,
          category: category ? {
            _id: category._id,
            name: category.name,
            icon: category.icon,
            color: category.color
          } : {
            _id: transaction.categoryId,
            name: "Unknown Category",
            icon: undefined,
            color: undefined
          }
        };
      })
    );
  },
});

// Get transactions sum for fixed expense categories for the authenticated user
export const sumFixedCategoryExpenses = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    // Get all fixed expense categories for the user
    const fixedExpenseCategories = await ctx.db
      .query("categories")
      .withIndex("by_userId_type_and_nature", q => 
        q.eq("userId", userId)
         .eq("type", "expense")
         .eq("nature", "fixed")
      )
      .collect();
    
    // Extract the category IDs
    const fixedCategoryIds = fixedExpenseCategories.map(category => category._id);
    
    // If no fixed categories, return 0
    if (fixedCategoryIds.length === 0) {
      return 0;
    }
    
    let transactions = [];
    
    // Build query based on date range
    if (args.startDate !== undefined && args.endDate !== undefined) {
      const query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_date", q => 
          q.eq("userId", userId)
           .gte("date", args.startDate as number)
           .lte("date", args.endDate as number)
        )
        .filter(q => q.eq(q.field("type"), "expense"));
      
      // Get all expense transactions
      transactions = await query.collect();
      
      // Filter by fixed category IDs
      transactions = transactions.filter(transaction => 
        fixedCategoryIds.includes(transaction.categoryId));
    } else {
      const query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_type", q => 
          q.eq("userId", userId)
           .eq("type", "expense")
        );
        
      // Get all expense transactions
      transactions = await query.collect();
      
      // Filter by fixed category IDs
      transactions = transactions.filter(transaction => 
        fixedCategoryIds.includes(transaction.categoryId));
    }
    
    // Sum up the amounts
    return transactions.reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  }
});

// Get transactions sum for dynamic expense categories for the authenticated user
export const sumDynamicCategoryExpenses = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    // Get all dynamic expense categories for the user
    const dynamicExpenseCategories = await ctx.db
      .query("categories")
      .withIndex("by_userId_type_and_nature", q => 
        q.eq("userId", userId)
         .eq("type", "expense")
         .eq("nature", "dynamic")
      )
      .collect();
    
    // Extract the category IDs
    const dynamicCategoryIds = dynamicExpenseCategories.map(category => category._id);
    
    // If no dynamic categories, return 0
    if (dynamicCategoryIds.length === 0) {
      return 0;
    }
    
    let transactions = [];
    
    // Build query based on date range
    if (args.startDate !== undefined && args.endDate !== undefined) {
      const query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_date", q => 
          q.eq("userId", userId)
           .gte("date", args.startDate as number)
           .lte("date", args.endDate as number)
        )
        .filter(q => q.eq(q.field("type"), "expense"));
        
      // Get all expense transactions
      transactions = await query.collect();
      
      // Filter by dynamic category IDs
      transactions = transactions.filter(transaction => 
        dynamicCategoryIds.includes(transaction.categoryId));
    } else {
      const query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_type", q => 
          q.eq("userId", userId)
           .eq("type", "expense")
        );
        
      // Get all expense transactions
      transactions = await query.collect();
      
      // Filter by dynamic category IDs
      transactions = transactions.filter(transaction => 
        dynamicCategoryIds.includes(transaction.categoryId));
    }
    
    // Sum up the amounts
    return transactions.reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  }
});

// Get all transactions expenses (total spending across all categories)
export const getTotalTransactionExpenses = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number())
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }
    const userId = identity.subject;
    
    let query;
    
    // If date range is provided, use the date index
    if (args.startDate !== undefined && args.endDate !== undefined) {
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_date", q => 
          q.eq("userId", userId)
           .gte("date", args.startDate as number)
           .lte("date", args.endDate as number)
        )
        .filter(q => q.eq(q.field("type"), "expense"));
    } else {
      // Use the type index when no date range
      query = ctx.db
        .query("transactions")
        .withIndex("by_userId_and_type", q => 
          q.eq("userId", userId)
           .eq("type", "expense")
        );
    }
    
    // Collect all matching transactions
    const transactions = await query.collect();
    
    // Sum up the amounts
    return transactions.reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  }
});

// Insert a transaction from a confirmed receipt
export const insertTransaction = mutation({
  args: {
    userId: v.string(),
    categoryId: v.id("categories"),
    amount: v.number(),
    description: v.string(),
    date: v.number(), // Timestamp
    type: v.union(v.literal("income"), v.literal("expense")),
    receiptId: v.optional(v.id("_storage"))
  },
  returns: v.id("transactions"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", {
      userId: args.userId,
      categoryId: args.categoryId,
      amount: args.amount,
      description: args.description,
      date: args.date,
      type: args.type,
      receiptId: args.receiptId
    });
  },
}); 