import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const getUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      return null;
    }
    return identity;
  }
});

export const getUserByToken = query({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();
  },
});

export const store = mutation({
  args: {},
  returns: v.union(v.string(), v.null()),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // Return null instead of throwing an error when authentication is not present
      return null;
    }

    // Check if we've already stored this identity before
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (user !== null) {
      // If we've seen this identity before but the user details have changed, update them
      if (
        user.name !== identity.name ||
        user.email !== identity.email ||
        user.imageUrl !== (identity.imageUrl as string | undefined)
      ) {
        await ctx.db.patch(user._id, {
          name: identity.name,
          email: identity.email,
          imageUrl: identity.imageUrl as string | undefined,
        });
      }
      return user._id;
    }

    // If it's a new identity, create a new User
    return await ctx.db.insert("users", {
      name: identity.name,
      email: identity.email,
      imageUrl: identity.imageUrl as string | undefined,
      userId: identity.subject,
      tokenIdentifier: identity.tokenIdentifier,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Link a Telegram user ID to an existing user
 */
export const linkTelegramUser = internalMutation({
  args: {
    telegramUserId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the user by userId
    const users = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .collect();
    
    if (users.length === 0) {
      throw new Error(`User not found with userId: ${args.userId}`);
    }
    
    // Update the user with the telegramUserId
    const userId = users[0]._id;
    await ctx.db.patch(userId, {
      telegramUserId: args.telegramUserId,
      updatedAt: new Date().toISOString(),
    });

    return userId;
  },
});

/**
 * Get a user by Telegram user ID
 */
export const getUserByTelegramId = internalMutation({
  args: {
    telegramUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const users = await ctx.db
      .query("users")
      .withIndex("by_telegramUserId", (q) => q.eq("telegramUserId", args.telegramUserId))
      .collect();
    
    return users.length > 0 ? users[0] : null;
  },
}); 