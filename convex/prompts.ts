import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { generatePromptOutput } from "../lib/openai";

// Get prompts by category and optional subcategory
export const getPromptsByCategory = query({
  args: { 
    category: v.string(), 
    subcategory: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("prompts"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.array(v.string()),
    category: v.string(),
    subcategory: v.string(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("prompts")
      .withIndex("by_category", (q) => q.eq("category", args.category));

    if (args.subcategory) {
      query = ctx.db
        .query("prompts")
        .withIndex("by_subcategory", (q) => 
          q.eq("category", args.category).eq("subcategory", args.subcategory!)
        );
    }

    const prompts = await query
      .order("desc")
      .take(args.limit ?? 50);

    return prompts.map(prompt => ({
      _id: prompt._id,
      _creationTime: prompt._creationTime,
      title: prompt.title,
      description: prompt.description,
      complexity: prompt.complexity,
      tags: prompt.tags,
      category: prompt.category,
      subcategory: prompt.subcategory,
    }));
  },
});

// Search prompts using full-text search
export const searchPrompts = query({
  args: { 
    query: v.string(), 
    filters: v.optional(v.object({
      category: v.optional(v.string()),
      subcategory: v.optional(v.string()),
      complexity: v.optional(v.string()),
      tags: v.optional(v.array(v.string()))
    })),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("prompts"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.array(v.string()),
    category: v.string(),
    subcategory: v.string(),
  })),
  handler: async (ctx, args) => {
    let searchQuery = ctx.db
      .query("prompts")
      .withSearchIndex("search_prompts", (q) => q.search("title", args.query));

    // Apply filters
    if (args.filters?.category) {
      searchQuery = searchQuery.filter((q) => q.eq(q.field("category"), args.filters!.category!));
    }
    if (args.filters?.subcategory) {
      searchQuery = searchQuery.filter((q) => q.eq(q.field("subcategory"), args.filters!.subcategory!));
    }
    if (args.filters?.complexity) {
      searchQuery = searchQuery.filter((q) => q.eq(q.field("complexity"), args.filters!.complexity!));
    }

    const results = await searchQuery.take(args.limit ?? 20);

    return results.map(prompt => ({
      _id: prompt._id,
      _creationTime: prompt._creationTime,
      title: prompt.title,
      description: prompt.description,
      complexity: prompt.complexity,
      tags: prompt.tags,
      category: prompt.category,
      subcategory: prompt.subcategory,
    }));
  },
});

// Get a single prompt by ID with full details
export const getPromptById = query({
  args: { promptId: v.id("prompts") },
  returns: v.union(v.null(), v.object({
    _id: v.id("prompts"),
    _creationTime: v.number(),
    title: v.string(),
    content: v.string(),
    description: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.array(v.string()),
    category: v.string(),
    subcategory: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) return null;

    return {
      _id: prompt._id,
      _creationTime: prompt._creationTime,
      title: prompt.title,
      content: prompt.content,
      description: prompt.description,
      complexity: prompt.complexity,
      tags: prompt.tags,
      category: prompt.category,
      subcategory: prompt.subcategory,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };
  },
});

// Get all unique categories
export const getCategories = query({
  args: {},
  returns: v.array(v.object({
    category: v.string(),
    subcategories: v.array(v.string()),
    count: v.number(),
  })),
  handler: async (ctx) => {
    const prompts = await ctx.db.query("prompts").collect();
    
    const categoryMap = new Map<string, Set<string>>();
    
    prompts.forEach(prompt => {
      if (!categoryMap.has(prompt.category)) {
        categoryMap.set(prompt.category, new Set());
      }
      categoryMap.get(prompt.category)!.add(prompt.subcategory);
    });

    return Array.from(categoryMap.entries()).map(([category, subcategories]) => ({
      category,
      subcategories: Array.from(subcategories),
      count: prompts.filter(p => p.category === category).length,
    }));
  },
});

// Add a new prompt (for data import)
export const addPrompt = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.string(),
    subcategory: v.string(),
    tags: v.array(v.string()),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    description: v.string(),
    embedding: v.optional(v.array(v.number())),
  },
  returns: v.id("prompts"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("prompts", {
      title: args.title,
      content: args.content,
      category: args.category,
      subcategory: args.subcategory,
      tags: args.tags,
      complexity: args.complexity,
      description: args.description,
      embedding: args.embedding,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update prompt embedding (for semantic search setup)
export const updatePromptEmbedding = mutation({
  args: {
    promptId: v.id("prompts"),
    embedding: v.array(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.promptId, {
      embedding: args.embedding,
      updatedAt: Date.now(),
    });
  },
});

// Get prompt by title (for import script deduplication)
export const getByTitle = query({
  args: { title: v.string() },
  returns: v.union(v.null(), v.object({
    _id: v.id("prompts"),
    title: v.string(),
  })),
  handler: async (ctx, args) => {
    const prompt = await ctx.db
      .query("prompts")
      .filter((q) => q.eq(q.field("title"), args.title))
      .unique();
    
    if (!prompt) return null;
    
    return {
      _id: prompt._id,
      title: prompt.title,
    };
  },
});

// Create a new prompt (alias for addPrompt to match import script)
export const create = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.string(),
    subcategory: v.string(),
    tags: v.array(v.string()),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    description: v.string(),
    embedding: v.optional(v.array(v.number())),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  returns: v.id("prompts"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("prompts", {
      title: args.title,
      content: args.content,
      category: args.category,
      subcategory: args.subcategory,
      tags: args.tags,
      complexity: args.complexity,
      description: args.description,
      embedding: args.embedding,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
  },
});

// Execute a prompt with organization context and situation using GPT-5
export const executePrompt = action({
  args: {
    promptId: v.id("prompts"),
    orgProfileId: v.id("orgProfiles"),
    situation: v.string(),
    complexity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high")))
  },
  returns: v.object({
    output: v.string(),
    metadata: v.object({
      model: v.string(),
      tokens: v.number(),
      complexity: v.string(),
      verbosity: v.string(),
      reasoning_effort: v.string(),
    })
  }),
  handler: async (ctx, args) => {
    // 1. Fetch prompt and org profile
    const prompt = await ctx.runQuery(api.prompts.getPromptById, { promptId: args.promptId });
    if (!prompt) {
      throw new Error("Prompt not found");
    }

    const orgProfile = await ctx.runQuery(api.orgProfiles.getById, { id: args.orgProfileId });
    if (!orgProfile) {
      throw new Error("Organization profile not found");
    }

    // 2. Use the prompt's complexity or the provided override
    const complexity = args.complexity || prompt.complexity;

    // 3. Call GPT-5 via our integration
    const result = await generatePromptOutput({
      prompt: prompt.content,
      orgProfile: {
        name: orgProfile.name,
        mission: orgProfile.mission,
        tone: orgProfile.tone,
        region: orgProfile.region,
      },
      situation: args.situation,
      complexity,
    });

    // 4. Store run record
    await ctx.runMutation(api.runs.create, {
      promptId: args.promptId,
      orgProfileId: args.orgProfileId,
      userInput: args.situation,
      output: result.output,
      outputFormat: "markdown",
      metadata: result.metadata,
    });

    // 5. Return generated content
    return result;
  },
});