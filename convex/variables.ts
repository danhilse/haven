import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a prompt-specific variable
export const createPromptVariable = mutation({
  args: {
    name: v.string(),
    promptId: v.id("prompts"),
    description: v.string(),
    questionPrompt: v.string(),
    inputType: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    isRequired: v.boolean(),
    sortOrder: v.number(),
    grouping: v.optional(v.string()),
    selectOptions: v.optional(v.array(v.string())),
    validationRules: v.optional(v.array(v.string())),
  },
  returns: v.id("variables"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("variables", {
      name: args.name,
      promptId: args.promptId,
      description: args.description,
      questionPrompt: args.questionPrompt,
      inputType: args.inputType,
      examples: args.examples,
      category: args.category,
      isRequired: args.isRequired,
      sortOrder: args.sortOrder,
      grouping: args.grouping,
      selectOptions: args.selectOptions,
      validationRules: args.validationRules,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Batch create prompt-specific variables
export const batchCreatePromptVariables = mutation({
  args: {
    variables: v.array(v.object({
      name: v.string(),
      promptId: v.id("prompts"),
      description: v.string(),
      questionPrompt: v.string(),
      inputType: v.string(),
      examples: v.array(v.string()),
      category: v.string(),
      isRequired: v.boolean(),
      sortOrder: v.number(),
      grouping: v.optional(v.string()),
      selectOptions: v.optional(v.array(v.string())),
      validationRules: v.optional(v.array(v.string())),
    }))
  },
  returns: v.array(v.id("variables")),
  handler: async (ctx, args) => {
    const results = [];
    const now = Date.now();

    for (const variable of args.variables) {
      const variableId = await ctx.db.insert("variables", {
        name: variable.name,
        promptId: variable.promptId,
        description: variable.description,
        questionPrompt: variable.questionPrompt,
        inputType: variable.inputType,
        examples: variable.examples,
        category: variable.category,
        isRequired: variable.isRequired,
        sortOrder: variable.sortOrder,
        grouping: variable.grouping,
        selectOptions: variable.selectOptions,
        validationRules: variable.validationRules,
        createdAt: now,
        updatedAt: now,
      });
      results.push(variableId);
    }

    return results;
  },
});

// Get variables for a specific prompt (sorted by sortOrder)
export const getVariablesByPrompt = query({
  args: {
    promptId: v.id("prompts"),
  },
  returns: v.array(v.object({
    _id: v.id("variables"),
    _creationTime: v.number(),
    name: v.string(),
    promptId: v.id("prompts"),
    description: v.string(),
    questionPrompt: v.string(),
    inputType: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    isRequired: v.boolean(),
    sortOrder: v.number(),
    grouping: v.optional(v.string()),
    selectOptions: v.optional(v.array(v.string())),
    validationRules: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variables")
      .withIndex("by_sort_order", (q) => q.eq("promptId", args.promptId))
      .collect();
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
    promptId: v.id("prompts"),
    description: v.string(),
    questionPrompt: v.string(),
    inputType: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    isRequired: v.boolean(),
    sortOrder: v.number(),
    grouping: v.optional(v.string()),
    selectOptions: v.optional(v.array(v.string())),
    validationRules: v.optional(v.array(v.string())),
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
      promptId: v.id("prompts"),
      description: v.string(),
      questionPrompt: v.string(),
      inputType: v.string(),
      examples: v.array(v.string()),
      category: v.string(),
      isRequired: v.boolean(),
      sortOrder: v.number(),
      grouping: v.optional(v.string()),
      selectOptions: v.optional(v.array(v.string())),
      validationRules: v.optional(v.array(v.string())),
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
    
    return variable;
  },
});

// Get variables by prompt (with name filter)
export const getVariablesByPromptAndName = query({
  args: {
    promptId: v.id("prompts"),
    name: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("variables"),
      _creationTime: v.number(),
      name: v.string(),
      promptId: v.id("prompts"),
      description: v.string(),
      questionPrompt: v.string(),
      inputType: v.string(),
      examples: v.array(v.string()),
      category: v.string(),
      isRequired: v.boolean(),
      sortOrder: v.number(),
      grouping: v.optional(v.string()),
      selectOptions: v.optional(v.array(v.string())),
      validationRules: v.optional(v.array(v.string())),
      createdAt: v.number(),
      updatedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variables")
      .withIndex("by_prompt", (q) => q.eq("promptId", args.promptId))
      .filter((q) => q.eq(q.field("name"), args.name))
      .first();
  },
});

// Get variables by prompt ID - UPDATED for new schema
export const getVariablesByPromptId = query({
  args: {
    promptId: v.id("prompts"),
  },
  returns: v.array(v.object({
    _id: v.id("variables"),
    _creationTime: v.number(),
    name: v.string(),
    promptId: v.id("prompts"),
    description: v.string(),
    questionPrompt: v.string(),
    inputType: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    isRequired: v.boolean(),
    sortOrder: v.number(),
    grouping: v.optional(v.string()),
    selectOptions: v.optional(v.array(v.string())),
    validationRules: v.optional(v.array(v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("variables")
      .withIndex("by_prompt", (q) => q.eq("promptId", args.promptId))
      .collect();
  },
});

// Get variable statistics
export const getVariableStats = query({
  args: {},
  returns: v.object({
    totalVariables: v.number(),
    requiredVariables: v.number(),
    categoryCounts: v.record(v.string(), v.number()),
    inputTypeCounts: v.record(v.string(), v.number()),
    averageVariablesPerPrompt: v.number(),
  }),
  handler: async (ctx) => {
    const variables = await ctx.db.query("variables").collect();
    
    const totalVariables = variables.length;
    const requiredVariables = variables.filter(v => v.isRequired).length;
    
    const categoryCounts: Record<string, number> = {};
    const inputTypeCounts: Record<string, number> = {};
    const promptIds = new Set<string>();
    
    variables.forEach(variable => {
      categoryCounts[variable.category] = (categoryCounts[variable.category] || 0) + 1;
      inputTypeCounts[variable.inputType] = (inputTypeCounts[variable.inputType] || 0) + 1;
      promptIds.add(variable.promptId);
    });
    
    return {
      totalVariables,
      requiredVariables,
      categoryCounts,
      inputTypeCounts,
      averageVariablesPerPrompt: promptIds.size > 0 ? totalVariables / promptIds.size : 0,
    };
  },
});

// Clear all variables for a prompt (for re-processing)
export const clearPromptVariables = mutation({
  args: {
    promptId: v.id("prompts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const variables = await ctx.db
      .query("variables")
      .withIndex("by_prompt", (q) => q.eq("promptId", args.promptId))
      .collect();
    
    for (const variable of variables) {
      await ctx.db.delete(variable._id);
    }
  },
});

// Clear all variables (for full re-processing)
export const clearAllVariables = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const allVariables = await ctx.db.query("variables").collect();
    
    for (const variable of allVariables) {
      await ctx.db.delete(variable._id);
    }
  },
});