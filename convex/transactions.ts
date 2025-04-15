import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import { Doc } from "./_generated/dataModel";

interface TransactionWithCategory extends Doc<"transactions"> {
  category: {
    _id: Id<"categories">;
    name: string;
    icon?: string;
    color?: string;
  };
}

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
    return await ctx.db.insert("transactions", {
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
    limit: v.optional(v.number())
  },
  returns: v.array(
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
    })
  ),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    
    // Get transactions ordered by creation time
    const transactions = await ctx.db
      .query("transactions")
      .order("desc")
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

// Calculate sum of income transactions
export const sumIncome = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    categoryId: v.optional(v.id("categories"))
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("transactions")
      .withIndex("by_type", q => q.eq("type", "income"));
    
    // Apply date range filter if provided
    if (args.startDate !== undefined && args.endDate !== undefined) {
      query = query.filter(q => 
        q.gte(q.field("date"), args.startDate as number) && 
        q.lte(q.field("date"), args.endDate as number)
      );
    }
    
    // Apply category filter if provided
    if (args.categoryId !== undefined) {
      query = query.filter(q => q.eq(q.field("categoryId"), args.categoryId as Id<"categories">));
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
    let query = ctx.db
      .query("transactions")
      .withIndex("by_type", q => q.eq("type", "expense"));
    
    // Apply date range filter if provided
    if (args.startDate !== undefined && args.endDate !== undefined) {
      query = query.filter(q => 
        q.gte(q.field("date"), args.startDate as number) && 
        q.lte(q.field("date"), args.endDate as number)
      );
    }
    
    // Apply category filter if provided
    if (args.categoryId !== undefined) {
      query = query.filter(q => q.eq(q.field("categoryId"), args.categoryId as Id<"categories">));
    }
    
    // Collect all matching transactions
    const transactions = await query.collect();
    
    // Sum up the amounts (get absolute values for expenses)
    return transactions.reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
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
    let incomeQuery = ctx.db
      .query("transactions")
      .withIndex("by_type", q => q.eq("type", "income"));
    
    let expenseQuery = ctx.db
      .query("transactions")
      .withIndex("by_type", q => q.eq("type", "expense"));
    
    // Apply date range filter if provided
    if (args.startDate !== undefined && args.endDate !== undefined) {
      incomeQuery = incomeQuery.filter(q => 
        q.gte(q.field("date"), args.startDate as number) && 
        q.lte(q.field("date"), args.endDate as number)
      );
      
      expenseQuery = expenseQuery.filter(q => 
        q.gte(q.field("date"), args.startDate as number) && 
        q.lte(q.field("date"), args.endDate as number)
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
    // Default sort direction
    const direction = args.sortDirection || "asc";
    const searchQuery = args.searchQuery?.trim();
    
    // Build our query with the appropriate filters and sorting
    let resultsNeedSorting = false;
    let paginationResult;
    
    // If search query is provided
    if (searchQuery && searchQuery.length > 0) {
      // Use the search index
      let query;
      if (args.type) {
        query = ctx.db
          .query("transactions")
          .withSearchIndex("search_description", q => 
            q.search("description", searchQuery)
             .eq("type", args.type as "income" | "expense")
          );
      } else {
        query = ctx.db
          .query("transactions")
          .withSearchIndex("search_description", q => 
            q.search("description", searchQuery)
          );
      }
      
      // If we want specific sorting
      if (args.sortByAmount || args.sortByDescription || args.sortByDate) {
        resultsNeedSorting = true;
      }
      
      // Paginate the search results
      paginationResult = await query.paginate(args.paginationOpts);
    } 
    // Apply category filter if provided
    else if (args.categoryId) {
      let query = ctx.db
        .query("transactions")
        .withIndex("by_category", q => q.eq("categoryId", args.categoryId as Id<"categories">));
        
      // Apply type filter if provided along with category
      if (args.type) {
        query = query.filter(q => q.eq(q.field("type"), args.type as "income" | "expense"));
      }
      
      // Apply ordering and paginate
      paginationResult = await query.order(direction).paginate(args.paginationOpts);
    }
    // Apply date range filter if provided
    else if (args.startDate !== undefined && args.endDate !== undefined) {
      // Ensure we have valid numbers for the date range
      const startDate = args.startDate;
      const endDate = args.endDate;
      
      let query = ctx.db
        .query("transactions")
        .withIndex("by_date", q => 
          q.gte("date", startDate).lte("date", endDate)
        );
          
      // Apply type filter if provided along with date range
      if (args.type) {
        query = query.filter(q => q.eq(q.field("type"), args.type as "income" | "expense"));
      }
      
      // Apply ordering and paginate
      paginationResult = await query.order(direction).paginate(args.paginationOpts);
    }
    // Otherwise use regular indexes with filtering
    else {
      let query;
      
      if (args.type) {
        // Filter by type
        query = ctx.db
          .query("transactions")
          .withIndex("by_type", q => q.eq("type", args.type as "income" | "expense"));
          
        // Apply ordering and paginate
        paginationResult = await query.order(direction).paginate(args.paginationOpts);
      } else if (args.sortByDate) {
        // Sort by date using the by_date index
        query = ctx.db
          .query("transactions")
          .withIndex("by_date");
          
        // Apply ordering and paginate
        paginationResult = await query.order(direction).paginate(args.paginationOpts);
      } else {
        // Default sorting by creation time
        query = ctx.db
          .query("transactions");
          
        // Apply ordering and paginate
        paginationResult = await query.order(direction).paginate(args.paginationOpts);
      }
    }
    
    // Process the results
    let transactionsToProcess = paginationResult.page;
    
    // Apply custom in-memory sorting if needed
    if (resultsNeedSorting || args.sortByAmount || args.sortByDescription) {
      if (args.sortByAmount) {
        transactionsToProcess.sort((a: Doc<"transactions">, b: Doc<"transactions">) => {
          if (direction === "asc") {
            return a.amount - b.amount;
          } else {
            return b.amount - a.amount;
          }
        });
      } else if (args.sortByDescription) {
        transactionsToProcess.sort((a: Doc<"transactions">, b: Doc<"transactions">) => {
          if (direction === "asc") {
            return a.description.localeCompare(b.description);
          } else {
            return b.description.localeCompare(a.description);
          }
        });
      } else if (args.sortByDate) {
        transactionsToProcess.sort((a: Doc<"transactions">, b: Doc<"transactions">) => {
          if (direction === "asc") {
            return a.date - b.date;
          } else {
            return b.date - a.date;
          }
        });
      }
    }
    
    // Fetch category details for each transaction
    const transactionsWithCategories = await Promise.all(
      transactionsToProcess.map(async (transaction: Doc<"transactions">) => {
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
        } as TransactionWithCategory;
      })
    );
    
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
    endDate: v.optional(v.number())
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
    // Query only transactions that have receipts
    let query = ctx.db
      .query("transactions")
      .filter((q) => q.neq(q.field("receiptId"), undefined));
    
    // Apply additional filters
    if (args.categoryId) {
      query = query.filter((q) => q.eq(q.field("categoryId"), args.categoryId));
    }
    
    // Date range filter (only if both start and end dates are provided)
    if (args.startDate !== undefined && args.endDate !== undefined) {
      query = query.filter((q) => 
        q.and(
          q.gte(q.field("date"), args.startDate as number), 
          q.lte(q.field("date"), args.endDate as number)
        )
      );
    }
    
    // Apply ordering and paginate
    const paginationResult = await query.order("desc").paginate(args.paginationOpts);
    
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