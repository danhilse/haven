import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// Create a new prompt execution run
export const create = mutation({
  args: {
    promptId: v.id("prompts"),
    orgProfileId: v.id("orgProfiles"),
    userInput: v.string(),
    output: v.string(),
    outputFormat: v.union(v.literal("markdown"), v.literal("plaintext")),
    metadata: v.object({
      model: v.string(),
      tokens: v.number(),
      complexity: v.string(),
      verbosity: v.string(),
      reasoning_effort: v.string(),
      duration: v.optional(v.number()),
    }),
  },
  returns: v.id("runs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("runs", {
      promptId: args.promptId,
      orgProfileId: args.orgProfileId,
      userInput: args.userInput,
      output: args.output,
      outputFormat: args.outputFormat,
      metadata: args.metadata,
      createdAt: now,
    });
  },
});

// Get runs by prompt ID
export const getByPrompt = query({
  args: { 
    promptId: v.id("prompts"),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("runs"),
    _creationTime: v.number(),
    promptId: v.id("prompts"),
    orgProfileId: v.id("orgProfiles"),
    userInput: v.string(),
    output: v.string(),
    outputFormat: v.union(v.literal("markdown"), v.literal("plaintext")),
    metadata: v.object({
      model: v.string(),
      tokens: v.number(),
      complexity: v.string(),
      verbosity: v.string(),
      reasoning_effort: v.string(),
      duration: v.optional(v.number()),
    }),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("runs")
      .withIndex("by_prompt", (q) => q.eq("promptId", args.promptId))
      .order("desc")
      .take(args.limit ?? 10);

    return runs.map(run => ({
      _id: run._id,
      _creationTime: run._creationTime,
      promptId: run.promptId,
      orgProfileId: run.orgProfileId,
      userInput: run.userInput,
      output: run.output,
      outputFormat: run.outputFormat,
      metadata: run.metadata || {
        model: "unknown",
        tokens: 0,
        complexity: "low",
        verbosity: "medium",
        reasoning_effort: "minimal"
      },
      createdAt: run.createdAt,
    }));
  },
});

// Get runs by organization profile ID
export const getByOrg = query({
  args: { 
    orgProfileId: v.id("orgProfiles"),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("runs"),
    _creationTime: v.number(),
    promptId: v.id("prompts"),
    orgProfileId: v.id("orgProfiles"),
    userInput: v.string(),
    output: v.string(),
    outputFormat: v.union(v.literal("markdown"), v.literal("plaintext")),
    metadata: v.object({
      model: v.string(),
      tokens: v.number(),
      complexity: v.string(),
      verbosity: v.string(),
      reasoning_effort: v.string(),
      duration: v.optional(v.number()),
    }),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("runs")
      .withIndex("by_org", (q) => q.eq("orgProfileId", args.orgProfileId))
      .order("desc")
      .take(args.limit ?? 20);

    return runs.map(run => ({
      _id: run._id,
      _creationTime: run._creationTime,
      promptId: run.promptId,
      orgProfileId: run.orgProfileId,
      userInput: run.userInput,
      output: run.output,
      outputFormat: run.outputFormat,
      metadata: run.metadata || {
        model: "unknown",
        tokens: 0,
        complexity: "low",
        verbosity: "medium",
        reasoning_effort: "minimal"
      },
      createdAt: run.createdAt,
    }));
  },
});

// Get a single run by ID
export const getById = query({
  args: { runId: v.id("runs") },
  returns: v.union(v.null(), v.object({
    _id: v.id("runs"),
    _creationTime: v.number(),
    promptId: v.id("prompts"),
    orgProfileId: v.id("orgProfiles"),
    userInput: v.string(),
    output: v.string(),
    outputFormat: v.union(v.literal("markdown"), v.literal("plaintext")),
    metadata: v.object({
      model: v.string(),
      tokens: v.number(),
      complexity: v.string(),
      verbosity: v.string(),
      reasoning_effort: v.string(),
      duration: v.optional(v.number()),
    }),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runId);
    if (!run) return null;

    return {
      _id: run._id,
      _creationTime: run._creationTime,
      promptId: run.promptId,
      orgProfileId: run.orgProfileId,
      userInput: run.userInput,
      output: run.output,
      outputFormat: run.outputFormat,
      metadata: run.metadata || {
        model: "unknown",
        tokens: 0,
        complexity: "low",
        verbosity: "medium",
        reasoning_effort: "minimal"
      },
      createdAt: run.createdAt,
    };
  },
});

// Delete a run
export const deleteRun = mutation({
  args: { runId: v.id("runs") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.runId);
  },
});

// Get total runs count
export const getCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const runs = await ctx.db.query("runs").collect();
    return runs.length;
  },
});