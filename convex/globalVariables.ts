import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { api } from "./_generated/api";

// Get all global variables
export const getGlobalVariables = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("globalVariables"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    questionPrompt: v.string(),
    inputType: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    isRequired: v.boolean(),
    defaultValue: v.optional(v.string()),
    selectOptions: v.optional(v.array(v.string())),
    usageCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx) => {
    const variables = await ctx.db
      .query("globalVariables")
      .order("desc")
      .collect();
    
    return variables;
  },
});

// Get global variables by category
export const getGlobalVariablesByCategory = query({
  args: { category: v.string() },
  returns: v.array(v.object({
    _id: v.id("globalVariables"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    questionPrompt: v.string(),
    inputType: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    isRequired: v.boolean(),
    defaultValue: v.optional(v.string()),
    selectOptions: v.optional(v.array(v.string())),
    usageCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("globalVariables")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .collect();
  },
});

// Get a global variable by name
export const getGlobalVariableByName = query({
  args: { name: v.string() },
  returns: v.union(v.null(), v.object({
    _id: v.id("globalVariables"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    questionPrompt: v.string(),
    inputType: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    isRequired: v.boolean(),
    defaultValue: v.optional(v.string()),
    selectOptions: v.optional(v.array(v.string())),
    usageCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("globalVariables")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
  },
});

// Create or update a global variable
export const createOrUpdateGlobalVariable = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    questionPrompt: v.string(),
    inputType: v.string(),
    examples: v.array(v.string()),
    category: v.string(),
    isRequired: v.boolean(),
    defaultValue: v.optional(v.string()),
    selectOptions: v.optional(v.array(v.string())),
    usageCount: v.optional(v.number()),
  },
  returns: v.id("globalVariables"),
  handler: async (ctx, args) => {
    // Check if global variable already exists
    const existing = await ctx.db
      .query("globalVariables")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing global variable
      await ctx.db.patch(existing._id, {
        description: args.description,
        questionPrompt: args.questionPrompt,
        inputType: args.inputType,
        examples: args.examples,
        category: args.category,
        isRequired: args.isRequired,
        defaultValue: args.defaultValue,
        selectOptions: args.selectOptions,
        usageCount: args.usageCount ?? existing.usageCount,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new global variable
      return await ctx.db.insert("globalVariables", {
        name: args.name,
        description: args.description,
        questionPrompt: args.questionPrompt,
        inputType: args.inputType,
        examples: args.examples,
        category: args.category,
        isRequired: args.isRequired,
        defaultValue: args.defaultValue,
        selectOptions: args.selectOptions,
        usageCount: args.usageCount ?? 1,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update usage count for a global variable
export const updateGlobalVariableUsage = mutation({
  args: {
    name: v.string(),
    usageCount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("globalVariables")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        usageCount: args.usageCount,
        updatedAt: Date.now(),
      });
    }
  },
});

// Initialize default global variables
export const initializeDefaultGlobalVariables = mutation({
  args: {},
  returns: v.array(v.id("globalVariables")),
  handler: async (ctx) => {
    const defaultGlobalVariables = [
      {
        name: 'ORGANIZATION_NAME',
        description: 'The official name of the nonprofit organization',
        questionPrompt: 'What is your organization\'s official name?',
        inputType: 'short_text',
        examples: ['Helping Hands Foundation', 'City Community Center', 'Green Valley Environmental Society'],
        category: 'organization',
        isRequired: true,
        usageCount: 353,
      },
      {
        name: 'TARGET_AUDIENCE',
        description: 'The primary audience or beneficiaries of the organization',
        questionPrompt: 'Who is your primary target audience or who do you serve?',
        inputType: 'short_text',
        examples: ['Low-income families with children', 'Senior citizens', 'Students and young professionals'],
        category: 'audience',
        isRequired: true,
        usageCount: 89,
      },
      {
        name: 'PROGRAM_NAME',
        description: 'Name of a specific program or initiative',
        questionPrompt: 'What is the name of the specific program or initiative this relates to?',
        inputType: 'short_text',
        examples: ['After School Tutoring Program', 'Community Garden Initiative', 'Senior Meal Delivery'],
        category: 'program',
        isRequired: false,
        usageCount: 83,
      },
      {
        name: 'MISSION_STATEMENT',
        description: 'The organization\'s mission statement or core purpose',
        questionPrompt: 'What is your organization\'s mission statement or core purpose?',
        inputType: 'long_text',
        examples: [
          'To provide educational opportunities for underserved youth in our community',
          'To protect and preserve local wildlife habitats through community engagement',
          'To support seniors in aging with dignity through comprehensive care services'
        ],
        category: 'organization',
        isRequired: true,
        usageCount: 65,
      }
    ];

    const results = [];
    const now = Date.now();
    
    for (const variable of defaultGlobalVariables) {
      // Check if global variable already exists
      const existing = await ctx.db
        .query("globalVariables")
        .withIndex("by_name", (q) => q.eq("name", variable.name))
        .first();

      if (existing) {
        // Update existing global variable
        await ctx.db.patch(existing._id, {
          description: variable.description,
          questionPrompt: variable.questionPrompt,
          inputType: variable.inputType,
          examples: variable.examples,
          category: variable.category,
          isRequired: variable.isRequired,
          usageCount: variable.usageCount,
          updatedAt: now,
        });
        results.push(existing._id);
      } else {
        // Create new global variable
        const variableId = await ctx.db.insert("globalVariables", {
          name: variable.name,
          description: variable.description,
          questionPrompt: variable.questionPrompt,
          inputType: variable.inputType,
          examples: variable.examples,
          category: variable.category,
          isRequired: variable.isRequired,
          usageCount: variable.usageCount,
          createdAt: now,
          updatedAt: now,
        });
        results.push(variableId);
      }
    }

    return results;
  },
});

// Clear all global variables (for testing/migration)
export const clearAllGlobalVariables = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const allVariables = await ctx.db.query("globalVariables").collect();
    
    for (const variable of allVariables) {
      await ctx.db.delete(variable._id);
    }
  },
});

// Get global variable statistics
export const getGlobalVariableStats = query({
  args: {},
  returns: v.object({
    totalGlobalVariables: v.number(),
    totalUsage: v.number(),
    categoryCounts: v.record(v.string(), v.number()),
    topUsedVariables: v.array(v.object({
      name: v.string(),
      usageCount: v.number(),
    })),
  }),
  handler: async (ctx) => {
    const variables = await ctx.db.query("globalVariables").collect();
    
    const totalGlobalVariables = variables.length;
    const totalUsage = variables.reduce((sum, v) => sum + v.usageCount, 0);
    
    const categoryCounts: Record<string, number> = {};
    variables.forEach(variable => {
      categoryCounts[variable.category] = (categoryCounts[variable.category] || 0) + 1;
    });
    
    const topUsedVariables = variables
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10)
      .map(v => ({ name: v.name, usageCount: v.usageCount }));
    
    return {
      totalGlobalVariables,
      totalUsage,
      categoryCounts,
      topUsedVariables,
    };
  },
});