import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    userId: v.string(),
    tokenIdentifier: v.string(),
    createdAt: v.string(),
  }).index("by_token", ["tokenIdentifier"]),
}); 