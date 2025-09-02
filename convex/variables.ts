import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update a variable in the database
export const createOrUpdateVariable = mutation({
  args: {
    name: v.string(),
    basePattern: v.string(),
    isNumbered: v.boolean(),
    maxNumber: v.optional(v.number()),
    description: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    promptIds: v.array(v.id("prompts")),
    suggestedInputType: v.optional(v.string()),
    validationRules: v.optional(v.array(v.string())),
  },
  returns: v.id("variables"),
  handler: async (ctx, args) => {
    // Check if variable already exists
    const existing = await ctx.db
      .query("variables")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing variable
      await ctx.db.patch(existing._id, {
        basePattern: args.basePattern,
        isNumbered: args.isNumbered,
        maxNumber: args.maxNumber,
        description: args.description,
        examples: args.examples,
        category: args.category,
        promptIds: args.promptIds,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new variable
      return await ctx.db.insert("variables", {
        name: args.name,
        basePattern: args.basePattern,
        isNumbered: args.isNumbered,
        maxNumber: args.maxNumber,
        description: args.description,
        examples: args.examples,
        category: args.category,
        promptIds: args.promptIds,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Batch create/update multiple variables
export const batchCreateVariables = mutation({
  args: {
    variables: v.array(v.object({
      name: v.string(),
      basePattern: v.string(),
      isNumbered: v.boolean(),
      maxNumber: v.optional(v.number()),
      description: v.string(),
      examples: v.array(v.string()),
      category: v.string(),
      promptIds: v.array(v.id("prompts")),
      suggestedInputType: v.optional(v.string()),
      validationRules: v.optional(v.array(v.string())),
    }))
  },
  returns: v.array(v.id("variables")),
  handler: async (ctx, args) => {
    const results = [];

    for (const variable of args.variables) {
      const variableId = await createOrUpdateVariable(ctx, variable);
      results.push(variableId);
    }

    return results;
  },
});

// Get all variables with pagination
export const getVariables = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    variables: v.array(v.object({
      _id: v.id("variables"),
      name: v.string(),
      basePattern: v.string(),
      isNumbered: v.boolean(),
      maxNumber: v.optional(v.number()),
      description: v.string(),
      examples: v.array(v.string()),
      category: v.string(),
      promptIds: v.array(v.id("prompts")),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
    nextCursor: v.optional(v.string()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    
    let query = ctx.db.query("variables").order("desc");
    
    if (args.cursor) {
      query = query.startAfter(args.cursor);
    }
    
    const variables = await query.take(limit + 1);
    const hasMore = variables.length > limit;
    const results = hasMore ? variables.slice(0, -1) : variables;
    
    return {
      variables: results,
      nextCursor: hasMore ? results[results.length - 1]._id : undefined,
      isDone: !hasMore,
    };
  },
});

// Get variables by category
export const getVariablesByCategory = query({
  args: {
    category: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("variables"),
    name: v.string(),
    basePattern: v.string(),
    isNumbered: v.boolean(),
    maxNumber: v.optional(v.number()),
    description: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    promptIds: v.array(v.id("prompts")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variables")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// Get variable by name
export const getVariableByName = query({
  args: {
    name: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("variables"),
      name: v.string(),
      basePattern: v.string(),
      isNumbered: v.boolean(),
      maxNumber: v.optional(v.number()),
      description: v.string(),
      examples: v.array(v.string()),
      category: v.string(),
      promptIds: v.array(v.id("prompts")),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variables")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// Get variables by base pattern (useful for numbered variables)
export const getVariablesByBasePattern = query({
  args: {
    basePattern: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("variables"),
    name: v.string(),
    basePattern: v.string(),
    isNumbered: v.boolean(),
    maxNumber: v.optional(v.number()),
    description: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    promptIds: v.array(v.id("prompts")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variables")
      .withIndex("by_base_pattern", (q) => q.eq("basePattern", args.basePattern))
      .collect();
  },
});

// Get variable statistics
export const getVariableStats = query({
  args: {},
  returns: v.object({
    totalVariables: v.number(),
    numberedVariables: v.number(),
    categoryCounts: v.record(v.string(), v.number()),
    averageExamplesPerVariable: v.number(),
  }),
  handler: async (ctx) => {
    const variables = await ctx.db.query("variables").collect();
    
    const totalVariables = variables.length;
    const numberedVariables = variables.filter(v => v.isNumbered).length;
    
    const categoryCounts: Record<string, number> = {};
    let totalExamples = 0;
    
    variables.forEach(variable => {
      categoryCounts[variable.category] = (categoryCounts[variable.category] || 0) + 1;
      totalExamples += variable.examples.length;
    });
    
    return {
      totalVariables,
      numberedVariables,
      categoryCounts,
      averageExamplesPerVariable: totalVariables > 0 ? totalExamples / totalVariables : 0,
    };
  },
});

// Update prompt with variable information
export const updatePromptWithVariables = mutation({
  args: {
    promptId: v.id("prompts"),
    variables: v.array(v.string()),
    requiredDocuments: v.optional(v.array(v.string())),
    analysisMetadata: v.optional(v.object({
      variableCount: v.number(),
      complexityScore: v.number(),
      additionalContextNeeded: v.boolean(),
      lastAnalyzed: v.number(),
    })),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    await ctx.db.patch(args.promptId, {
      variables: args.variables,
      requiredDocuments: args.requiredDocuments,
      analysisMetadata: args.analysisMetadata || {
        variableCount: args.variables.length,
        complexityScore: 1.0,
        additionalContextNeeded: false,
        lastAnalyzed: now,
      },
      updatedAt: now,
    });
  },
});