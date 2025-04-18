import { internalAction, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Send a daily spending summary to all users at 7pm Philippine time
 * This function is called by the cron job in crons.ts
 */
export const sendSpendingSummary = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx, args) => {
    // Telegram bot token from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("Telegram bot token is not defined");
      return null;
    }

    try {
      // Get all users with Telegram IDs
      const users = await ctx.runQuery(internal.telegramBot.getUsersWithTelegramId, {});
      
      for (const user of users) {
        // Skip users without Telegram ID
        if (!user.telegramUserId) continue;
        
        // Get the current month's spending summary by category
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const now = new Date();
        
        const summary = await ctx.runQuery(internal.telegramBot.getMonthlySpendingSummary, {
          userId: user.userId,
          startDate: startOfMonth.getTime(),
          endDate: now.getTime()
        });
        
        // Format the message
        let message = `📊 *Spending Summary for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*\n\n`;
        
        if (summary.categories.length === 0) {
          message += "No spending recorded this month.";
        } else {
          // Add total
          message += `*Total Spending:* ${summary.totalSpending.toFixed(2)}\n\n`;
          
          // Add breakdown by category
          message += "*Breakdown by Category:*\n";
          for (const category of summary.categories) {
            const percentage = (category.amount / summary.totalSpending * 100).toFixed(1);
            message += `- ${category.name}: ${category.amount.toFixed(2)} (${percentage}%)\n`;
          }
        }
        
        // Send the message
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: user.telegramUserId,
            text: message,
            parse_mode: "Markdown"
          }),
        });
      }
      
      return null;
    } catch (error) {
      console.error("Error sending spending summary:", error);
      return null;
    }
  },
});

/**
 * Test function to send a spending summary to a specific user
 */
export const testSendSpendingSummary = internalAction({
  args: {
    telegramUserId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Telegram bot token from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("Telegram bot token is not defined");
      return null;
    }

    try {
      // Get user by Telegram ID
      const user = await ctx.runMutation(internal.users.getUserByTelegramId, {
        telegramUserId: args.telegramUserId
      });
      
      if (!user) {
        console.error("User not found for Telegram ID:", args.telegramUserId);
        return null;
      }

      // Get the current month's spending summary by category
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const now = new Date();
      
      const summary = await ctx.runQuery(internal.telegramBot.getMonthlySpendingSummary, {
        userId: user.userId,
        startDate: startOfMonth.getTime(),
        endDate: now.getTime()
      });
      
      // Format the message
      let message = `📊 *Spending Summary for ${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}*\n\n`;
      
      if (summary.categories.length === 0) {
        message += "No spending recorded this month.";
      } else {
        // Add total
        message += `*Total Spending:* ${summary.totalSpending.toFixed(2)}\n\n`;
        
        // Add breakdown by category
        message += "*Breakdown by Category:*\n";
        for (const category of summary.categories) {
          const percentage = (category.amount / summary.totalSpending * 100).toFixed(1);
          message += `- ${category.name}: ${category.amount.toFixed(2)} (${percentage}%)\n`;
        }
      }
      
      // Send the message
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: args.telegramUserId,
          text: message,
          parse_mode: "Markdown"
        }),
      });
      
      return null;
    } catch (error) {
      console.error("Error sending test spending summary:", error);
      return null;
    }
  },
});

/**
 * Get all users who have linked their Telegram accounts
 */
export const getUsersWithTelegramId = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      userId: v.string(),
      telegramUserId: v.string()
    })
  ),
  handler: async (ctx, args) => {
    // Get all users with Telegram IDs
    const users = await ctx.db
      .query("users")
      .filter((q) => q.neq(q.field("telegramUserId"), undefined))
      .collect();
    
    return users.map((user) => ({
      userId: user.userId,
      telegramUserId: user.telegramUserId!
    }));
  }
});

/**
 * Get the monthly spending summary by category for a user
 */
export const getMonthlySpendingSummary = internalQuery({
  args: {
    userId: v.string(),
    startDate: v.number(),
    endDate: v.number()
  },
  returns: v.object({
    totalSpending: v.number(),
    categories: v.array(
      v.object({
        name: v.string(),
        amount: v.number()
      })
    )
  }),
  handler: async (ctx, args) => {
    // Get all expense transactions for the month for this user
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_userId_and_date", (q) => 
        q.eq("userId", args.userId)
         .gte("date", args.startDate)
         .lte("date", args.endDate)
      )
      .filter((q) => q.eq(q.field("type"), "expense"))
      .collect();
    
    // Group by category and sum amounts
    const categoryMap = new Map<string, { id: string, name: string, amount: number }>();
    
    for (const transaction of transactions) {
      const category = await ctx.db.get(transaction.categoryId);
      if (!category) continue;
      
      const categoryId = category._id.toString();
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          id: categoryId,
          name: category.name,
          amount: 0
        });
      }
      
      const existing = categoryMap.get(categoryId)!;
      existing.amount += transaction.amount;
      categoryMap.set(categoryId, existing);
    }
    
    // Calculate total
    const categories = Array.from(categoryMap.values());
    const totalSpending = categories.reduce((sum, category) => sum + category.amount, 0);
    
    // Sort categories by amount (highest first)
    categories.sort((a, b) => b.amount - a.amount);
    
    return {
      totalSpending,
      categories: categories.map(cat => ({ name: cat.name, amount: cat.amount }))
    };
  }
}); 