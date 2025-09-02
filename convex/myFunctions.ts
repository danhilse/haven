// Simple stats functions for the nonprofit prompt library
// The main application functions are in:
// - prompts.ts - prompt queries and management
// - orgProfiles.ts - organization profile management  
// - execution.ts - prompt execution with GPT integration

import { v } from "convex/values";
import { query } from "./_generated/server";

// Get basic stats about the prompt library
export const getLibraryStats = query({
  args: {},
  returns: v.object({
    viewer: v.union(v.string(), v.null()),
    totalPrompts: v.number(),
    totalCategories: v.number(),
    recentPrompts: v.array(v.object({
      _id: v.id("prompts"),
      title: v.string(),
      category: v.string(),
      complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    })),
  }),
  handler: async (ctx) => {
    const prompts = await ctx.db.query("prompts").collect();
    const categories = new Set(prompts.map(p => p.category));
    
    const recentPrompts = await ctx.db
      .query("prompts")
      .withIndex("by_created")
      .order("desc")
      .take(5);
    
    return {
      viewer: (await ctx.auth.getUserIdentity())?.name ?? null,
      totalPrompts: prompts.length,
      totalCategories: categories.size,
      recentPrompts: recentPrompts.map(p => ({
        _id: p._id,
        title: p.title,
        category: p.category,
        complexity: p.complexity,
      })),
    };
  },
});

// For backward compatibility with old demo code
export const listNumbers = query({
  args: { count: v.number() },
  returns: v.object({
    viewer: v.union(v.string(), v.null()),
    numbers: v.array(v.number()),
  }),
  handler: async (ctx, args) => {
    // Return empty data for compatibility
    return {
      viewer: (await ctx.auth.getUserIdentity())?.name ?? null,
      numbers: [], // Empty array since we don't have numbers table
    };
  },
});
