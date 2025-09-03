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
      // Check if variable already exists
      const existing = await ctx.db
        .query("variables")
        .withIndex("by_name", (q) => q.eq("name", variable.name))
        .first();

      const now = Date.now();

      if (existing) {
        // Update existing variable
        await ctx.db.patch(existing._id, {
          basePattern: variable.basePattern,
          isNumbered: variable.isNumbered,
          maxNumber: variable.maxNumber,
          description: variable.description,
          examples: variable.examples,
          category: variable.category,
          promptIds: variable.promptIds,
          updatedAt: now,
        });
        results.push(existing._id);
      } else {
        // Create new variable
        const variableId = await ctx.db.insert("variables", {
          name: variable.name,
          basePattern: variable.basePattern,
          isNumbered: variable.isNumbered,
          maxNumber: variable.maxNumber,
          description: variable.description,
          examples: variable.examples,
          category: variable.category,
          promptIds: variable.promptIds,
          createdAt: now,
          updatedAt: now,
        });
        results.push(variableId);
      }
    }

    return results;
  },
});

// Get all variables with pagination
export const getVariables = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("variables"),
    _creationTime: v.number(),
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
    const limit = args.limit ?? 50;
    
    const variables = await ctx.db
      .query("variables")
      .order("desc")
      .take(limit);
    
    return variables.map(variable => ({
      _id: variable._id,
      _creationTime: variable._creationTime,
      name: variable.name,
      basePattern: variable.basePattern,
      isNumbered: variable.isNumbered,
      maxNumber: variable.maxNumber,
      description: variable.description,
      examples: variable.examples,
      category: variable.category,
      promptIds: variable.promptIds,
      createdAt: variable.createdAt,
      updatedAt: variable.updatedAt,
    }));
  },
});

// Get variables by category
export const getVariablesByCategory = query({
  args: {
    category: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("variables"),
    _creationTime: v.number(),
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
      _creationTime: v.number(),
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
    const variable = await ctx.db
      .query("variables")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    
    if (!variable) return null;
    
    return {
      _id: variable._id,
      _creationTime: variable._creationTime,
      name: variable.name,
      basePattern: variable.basePattern,
      isNumbered: variable.isNumbered,
      maxNumber: variable.maxNumber,
      description: variable.description,
      examples: variable.examples,
      category: variable.category,
      promptIds: variable.promptIds,
      createdAt: variable.createdAt,
      updatedAt: variable.updatedAt,
    };
  },
});

// Get variables by base pattern (useful for numbered variables)
export const getVariablesByBasePattern = query({
  args: {
    basePattern: v.string(),
  },
  returns: v.array(v.object({
    _id: v.id("variables"),
    _creationTime: v.number(),
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

// Get variables by prompt ID - OPTIMIZED VERSION
export const getVariablesByPromptId = query({
  args: {
    promptId: v.id("prompts"),
  },
  returns: v.array(v.object({
    _id: v.id("variables"),
    _creationTime: v.number(),
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
    // First get the prompt to see what variables it uses
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt || !prompt.variables || prompt.variables.length === 0) {
      return [];
    }
    
    // Then fetch only those specific variables by name (uses index!)
    const variables = [];
    for (const varName of prompt.variables) {
      const variable = await ctx.db
        .query("variables")
        .withIndex("by_name", (q) => q.eq("name", varName))
        .first();
      if (variable) {
        variables.push(variable);
      }
    }
    
    return variables;
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