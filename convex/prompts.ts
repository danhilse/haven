import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { api } from "./_generated/api";
import { generatePromptOutput } from "../lib/openai";

// Get unique prompts by category and optional subcategory (grouped by title, showing only medium complexity)
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
    outputDescription: v.optional(v.string()),
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

    const allPrompts = await query.collect();
    
    // Group by title and pick medium complexity variant (or first available)
    const uniquePrompts = new Map<string, typeof allPrompts[0]>();
    
    allPrompts.forEach(prompt => {
      const existing = uniquePrompts.get(prompt.title);
      if (!existing || prompt.complexity === 'medium' || 
          (existing.complexity !== 'medium' && prompt.complexity === 'high')) {
        uniquePrompts.set(prompt.title, prompt);
      }
    });

    const results = Array.from(uniquePrompts.values())
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, args.limit ?? 50);

    return results.map(prompt => ({
      _id: prompt._id,
      _creationTime: prompt._creationTime,
      title: prompt.title,
      description: prompt.description,
      outputDescription: prompt.outputDescription,
      tags: prompt.tags,
      category: prompt.category,
      subcategory: prompt.subcategory,
    }));
  },
});

// Search unique prompts using full-text search (grouped by title, showing only medium complexity)
export const searchPrompts = query({
  args: { 
    query: v.string(), 
    filters: v.optional(v.object({
      category: v.optional(v.string()),
      subcategory: v.optional(v.string()),
      tags: v.optional(v.array(v.string()))
    })),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("prompts"),
    _creationTime: v.number(),
    title: v.string(),
    description: v.string(),
    outputDescription: v.optional(v.string()),
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

    const allResults = await searchQuery.collect();
    
    // Group by title and pick medium complexity variant (or first available)
    const uniquePrompts = new Map<string, typeof allResults[0]>();
    
    allResults.forEach(prompt => {
      const existing = uniquePrompts.get(prompt.title);
      if (!existing || prompt.complexity === 'medium' || 
          (existing.complexity !== 'medium' && prompt.complexity === 'high')) {
        uniquePrompts.set(prompt.title, prompt);
      }
    });

    const results = Array.from(uniquePrompts.values())
      .slice(0, args.limit ?? 20);

    return results.map(prompt => ({
      _id: prompt._id,
      _creationTime: prompt._creationTime,
      title: prompt.title,
      description: prompt.description,
      outputDescription: prompt.outputDescription,
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
    embedding: v.optional(v.array(v.number())),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    subcategory: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.array(v.string()),
    description: v.string(),
    outputDescription: v.optional(v.string()),
    variables: v.optional(v.array(v.string())),
    globalVariables: v.optional(v.array(v.string())),
    requiredDocuments: v.optional(v.array(v.string())),
    analysisMetadata: v.optional(v.object({
      variableCount: v.number(),
      globalVariableCount: v.optional(v.number()),
      complexityScore: v.number(),
      additionalContextNeeded: v.boolean(),
      lastAnalyzed: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);
    if (!prompt) return null;

    return {
      _id: prompt._id,
      _creationTime: prompt._creationTime,
      embedding: prompt.embedding,
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      subcategory: prompt.subcategory,
      complexity: prompt.complexity,
      tags: prompt.tags,
      description: prompt.description,
      outputDescription: prompt.outputDescription,
      variables: prompt.variables,
      globalVariables: prompt.globalVariables,
      requiredDocuments: prompt.requiredDocuments,
      analysisMetadata: prompt.analysisMetadata,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };
  },
});

// Get all unique categories - DEPRECATED: Use static data in frontend instead
// Only kept for potential admin interfaces - DO NOT USE in production frontend
export const getCategories = query({
  args: {},
  returns: v.array(v.object({
    category: v.string(),
    subcategories: v.array(v.string()),
    count: v.number(),
  })),
  handler: async (ctx) => {
    console.warn("⚠️  getCategories query called - this is inefficient. Use static data instead!");
    
    // Return static data to avoid any database queries
    return [
      {
        category: "Answer and Assist",
        subcategories: ["FAQ & Knowledge Base Responses", "Personalized Support & Guidance"],
        count: 0
      },
      {
        category: "Automate the Admin", 
        subcategories: ["Automated Communications", "Form & Document Review", "Repetitive Data Processing"],
        count: 0
      },
      {
        category: "Create and Communicate",
        subcategories: [
          "Content Adaptation & Reformatting", "Content Generation from Scratch", "Data Storytelling",
          "Interactive Content Creation", "Policy & Procedure Documentation", "Script & Narrative Writing",
          "Structured Report Creation", "Template Filling & Personalization", 
          "Translation & Accessibility Conversion", "Visual Content Creation"
        ],
        count: 0
      },
      {
        category: "Learn and Decide",
        subcategories: ["Data Analysis & Insights", "Research & Intelligence Gathering", "Strategic Planning & Forecasting"],
        count: 0
      },
      {
        category: "Sort and Scan",
        subcategories: ["Application & Candidate Screening", "Content Categorization & Prioritization", "Quality Assessment & Scoring"],
        count: 0
      }
    ];
  },
});

// Add a new prompt (for data import)
export const addPrompt = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.string(),
    subcategory: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.array(v.string()),
    description: v.string(),
    outputDescription: v.optional(v.string()),
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
      complexity: args.complexity,
      tags: args.tags,
      description: args.description,
      outputDescription: args.outputDescription,
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

// Update prompt with metadata from enhanced extraction
export const updatePromptMetadata = mutation({
  args: {
    promptId: v.id("prompts"),
    updates: v.object({
      description: v.optional(v.string()),
      summaryDescription: v.optional(v.string()),
      variables: v.optional(v.array(v.string())),
      globalVariables: v.optional(v.array(v.string())),
      outputDescription: v.optional(v.string()),
      requiredDocuments: v.optional(v.array(v.string())),
      analysisMetadata: v.optional(v.object({
        variableCount: v.number(),
        globalVariableCount: v.optional(v.number()),
        complexityScore: v.number(),
        additionalContextNeeded: v.boolean(),
        lastAnalyzed: v.number(),
      })),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Filter out undefined values and add updatedAt
    const updateData = Object.fromEntries(
      Object.entries(args.updates).filter(([_, value]) => value !== undefined)
    );
    
    await ctx.db.patch(args.promptId, {
      ...updateData,
      updatedAt: now,
    });
  },
});

// Get prompts by title and complexity for dynamic form
export const getPromptVariantsByTitle = query({
  args: { 
    title: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
  },
  returns: v.union(v.null(), v.object({
    _id: v.id("prompts"),
    title: v.string(),
    content: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.string(),
    subcategory: v.string(),
    variables: v.optional(v.array(v.string())),
    globalVariables: v.optional(v.array(v.string())),
    outputDescription: v.optional(v.string()),
    tags: v.array(v.string()),
    description: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const prompt = await ctx.db
      .query("prompts")
      .withIndex("by_complexity", (q) => 
        q.eq("title", args.title).eq("complexity", args.complexity)
      )
      .first();
    
    if (!prompt) return null;
    
    return {
      _id: prompt._id,
      title: prompt.title,
      content: prompt.content,
      complexity: prompt.complexity,
      category: prompt.category,
      subcategory: prompt.subcategory,
      variables: prompt.variables,
      globalVariables: prompt.globalVariables,
      outputDescription: prompt.outputDescription,
      tags: prompt.tags,
      description: prompt.description,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };
  },
});

// Get all prompts for migration (simplified structure)
export const getAllPromptsForMigration = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("prompts"),
    title: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.string(),
    subcategory: v.string(),
    variables: v.optional(v.array(v.string())),
    globalVariables: v.optional(v.array(v.string())),
  })),
  handler: async (ctx) => {
    const prompts = await ctx.db.query("prompts").collect();
    return prompts.map(prompt => ({
      _id: prompt._id,
      title: prompt.title,
      complexity: prompt.complexity,
      category: prompt.category,
      subcategory: prompt.subcategory,
      variables: prompt.variables,
      globalVariables: prompt.globalVariables,
    }));
  },
});

// Get all prompts with content for efficient batch processing
export const getAllPromptsWithContent = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("prompts"),
    title: v.string(),
    content: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    variables: v.optional(v.array(v.string())),
    globalVariables: v.optional(v.array(v.string())),
  })),
  handler: async (ctx) => {
    const prompts = await ctx.db.query("prompts").collect();
    return prompts.map(prompt => ({
      _id: prompt._id,
      title: prompt.title,
      content: prompt.content,
      complexity: prompt.complexity,
      variables: prompt.variables,
      globalVariables: prompt.globalVariables,
    }));
  },
});

// Get all prompts (for description enhancement scripts)
export const getAllPrompts = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("prompts"),
    title: v.string(),
    content: v.string(),
    category: v.string(),
    subcategory: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.array(v.string()),
    description: v.string(),
    outputDescription: v.optional(v.string()),
    summaryDescription: v.optional(v.string()),
  })),
  handler: async (ctx) => {
    const prompts = await ctx.db.query("prompts").collect();
    return prompts.map(prompt => ({
      _id: prompt._id,
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      subcategory: prompt.subcategory,
      complexity: prompt.complexity,
      tags: prompt.tags,
      description: prompt.description,
      outputDescription: prompt.outputDescription,
      summaryDescription: prompt.summaryDescription,
    }));
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
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.array(v.string()),
    description: v.string(),
    outputDescription: v.optional(v.string()),
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
      complexity: args.complexity,
      tags: args.tags,
      description: args.description,
      outputDescription: args.outputDescription,
      embedding: args.embedding,
      createdAt: args.createdAt,
      updatedAt: args.updatedAt,
    });
  },
});

// Get prompt by title and complexity
export const getPromptByTitleAndComplexity = query({
  args: { 
    title: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"))
  },
  returns: v.union(v.null(), v.object({
    _id: v.id("prompts"),
    _creationTime: v.number(),
    title: v.string(),
    content: v.string(),
    description: v.string(),
    outputDescription: v.optional(v.string()),
    tags: v.array(v.string()),
    category: v.string(),
    subcategory: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const prompt = await ctx.db
      .query("prompts")
      .withIndex("by_complexity", (q) => q.eq("title", args.title).eq("complexity", args.complexity))
      .first();

    if (!prompt) return null;

    return {
      _id: prompt._id,
      _creationTime: prompt._creationTime,
      title: prompt.title,
      content: prompt.content,
      description: prompt.description,
      outputDescription: prompt.outputDescription,
      tags: prompt.tags,
      category: prompt.category,
      subcategory: prompt.subcategory,
      complexity: prompt.complexity,
      createdAt: prompt.createdAt,
      updatedAt: prompt.updatedAt,
    };
  },
});

// Semantic search using vector similarity
export const semanticSearch = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    filters: v.optional(v.object({
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string()))
    }))
  },
  returns: v.object({
    results: v.array(v.object({
      _id: v.id("prompts"),
      _creationTime: v.number(),
      title: v.string(),
      description: v.string(),
      outputDescription: v.optional(v.string()),
      tags: v.array(v.string()),
      category: v.string(),
      subcategory: v.string(),
      similarity: v.number(),
    })),
    parsedQuery: v.object({
      searchTerms: v.array(v.string()),
      context: v.string(),
      category: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      intentType: v.string(),
    })
  }),
  handler: async (ctx, args) => {
    const { parseSemanticQuery, generateEmbedding } = await import("../lib/openai");
    
    // 1. Parse the semantic query using LLM
    const parsedQuery = await parseSemanticQuery(args.query);
    
    // 2. Generate embedding for the parsed context
    const queryEmbedding = await generateEmbedding(parsedQuery.context);
    
    // 3. Perform vector search
    const searchResults = await ctx.vectorSearch("prompts", "by_embedding", {
      vector: queryEmbedding,
      limit: args.limit ?? 20,
    });
    
    // 4. Get full documents for the search results and group by title
    const uniquePrompts = new Map<string, any>();
    
    for (const result of searchResults) {
      // Vector search returns { _id, _score }, need to get full document
      const fullDoc = await ctx.runQuery(api.prompts.getPromptById, { promptId: result._id });
      if (!fullDoc) continue;
      
      const existing = uniquePrompts.get(fullDoc.title);
      if (!existing || fullDoc.complexity === 'medium' || 
          (existing.complexity !== 'medium' && fullDoc.complexity === 'high')) {
        const promptWithSimilarity = {
          _id: fullDoc._id,
          _creationTime: fullDoc._creationTime,
          title: fullDoc.title,
          description: fullDoc.description,
          outputDescription: fullDoc.outputDescription,
          tags: fullDoc.tags,
          category: fullDoc.category,
          subcategory: fullDoc.subcategory,
          similarity: result._score
        };
        uniquePrompts.set(fullDoc.title, promptWithSimilarity);
      }
    }
    
    // 5. Return results with similarity scores
    const results = Array.from(uniquePrompts.values());
    
    return {
      results,
      parsedQuery
    };
  },
});

// Generate and store embeddings for all prompts (utility function)
export const generateAllEmbeddings = action({
  args: { batchSize: v.optional(v.number()) },
  returns: v.object({
    processed: v.number(),
    errors: v.number(),
  }),
  handler: async (ctx, args) => {
    const { generateEmbedding } = await import("../lib/openai");
    
    // Get all prompts without embeddings
    const allPrompts = await ctx.runQuery(api.prompts.getAllPromptsForEmbedding, {});
    const batchSize = args.batchSize ?? 10;
    let processed = 0;
    let errors = 0;
    
    for (let i = 0; i < allPrompts.length; i += batchSize) {
      const batch = allPrompts.slice(i, i + batchSize);
      
      for (const prompt of batch) {
        try {
          // Create text for embedding from title, description, and tags
          const embeddingText = `${prompt.title}. ${prompt.description}. Tags: ${prompt.tags.join(', ')}. Category: ${prompt.category} ${prompt.subcategory}`;
          
          const embedding = await generateEmbedding(embeddingText);
          
          await ctx.runMutation(api.prompts.updatePromptEmbedding, {
            promptId: prompt._id,
            embedding
          });
          
          processed++;
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Failed to generate embedding for prompt ${prompt._id}:`, error);
          errors++;
        }
      }
    }
    
    return { processed, errors };
  },
});

// Get all prompts for embedding generation
export const getAllPromptsForEmbedding = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("prompts"),
    title: v.string(),
    description: v.string(),
    tags: v.array(v.string()),
    category: v.string(),
    subcategory: v.string(),
    embedding: v.optional(v.array(v.number())),
  })),
  handler: async (ctx) => {
    const prompts = await ctx.db.query("prompts").collect();
    
    return prompts.map(prompt => ({
      _id: prompt._id,
      title: prompt.title,
      description: prompt.description,
      tags: prompt.tags,
      category: prompt.category,
      subcategory: prompt.subcategory,
      embedding: prompt.embedding,
    }));
  },
});

// Clear all prompts (for re-import)
export const clearAllPrompts = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const allPrompts = await ctx.db.query("prompts").collect();
    
    for (const prompt of allPrompts) {
      await ctx.db.delete(prompt._id);
    }
  },
});

// Create a new prompt (simplified for import)
export const createPrompt = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    category: v.string(),
    subcategory: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.array(v.string()),
    description: v.string(),
    outputDescription: v.optional(v.string()),
  },
  returns: v.id("prompts"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert("prompts", {
      title: args.title,
      content: args.content,
      category: args.category,
      subcategory: args.subcategory,
      complexity: args.complexity,
      tags: args.tags,
      description: args.description,
      outputDescription: args.outputDescription,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Execute a prompt with organization context and situation using GPT-5
export const executePrompt = action({
  args: {
    promptId: v.id("prompts"),
    situation: v.string(),
    complexity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    orgProfile: v.object({
      name: v.string(),
      mission: v.string(),
      tone: v.string(),
      region: v.string(),
      customFields: v.optional(v.record(v.string(), v.any())),
    })
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
    // 1. Fetch base prompt to get title
    const basePrompt = await ctx.runQuery(api.prompts.getPromptById, { promptId: args.promptId });
    if (!basePrompt) {
      throw new Error("Prompt not found");
    }

    // 2. Use the provided complexity or default to medium
    const complexity = args.complexity || "medium";

    // 3. Fetch the specific complexity variant
    const complexityPrompt = await ctx.runQuery(api.prompts.getPromptByTitleAndComplexity, { 
      title: basePrompt.title, 
      complexity 
    });
    
    if (!complexityPrompt) {
      throw new Error(`Prompt with ${complexity} complexity not found`);
    }

    // 4. Call GPT-5 via our integration
    const result = await generatePromptOutput({
      prompt: complexityPrompt.content,
      orgProfile: args.orgProfile,
      situation: args.situation,
      complexity,
    });

    // 5. Store run record (simplified without org profile storage)
    // TODO: Implement run history if needed

    // 6. Return generated content
    return result;
  },
});