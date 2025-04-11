import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Called storeUser without authentication present");
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