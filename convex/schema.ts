import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Core prompt collection
  prompts: defineTable({
    title: v.string(),
    content: v.string(), // The actual prompt template
    category: v.string(),
    subcategory: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.array(v.string()), // audience, content type, channel
    description: v.string(), // Auto-generated user-friendly description explaining value and outcomes
    outputDescription: v.optional(v.string()), // Clear description of what the user will receive
    summaryDescription: v.optional(v.string()), // Very concise summary for search cards (1 sentence, max 15 words)
    embedding: v.optional(v.array(v.number())), // Optional vector embedding for semantic search
    variables: v.optional(v.array(v.string())), // Normalized variable names found in this prompt (excludes global variables)
    globalVariables: v.optional(v.array(v.string())), // Global variables used in this prompt
    requiredDocuments: v.optional(v.array(v.string())), // Additional context docs needed
    analysisMetadata: v.optional(v.object({
      variableCount: v.number(),
      globalVariableCount: v.optional(v.number()),
      complexityScore: v.number(),
      additionalContextNeeded: v.boolean(),
      lastAnalyzed: v.number(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_subcategory", ["category", "subcategory"])
    .index("by_complexity", ["title", "complexity"])
    .index("by_created", ["createdAt"])
    .searchIndex("search_prompts", {
      searchField: "title",
      filterFields: ["category", "subcategory", "tags"]
    })
    // Vector search for semantic similarity (optional)
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 384, // e5-small-v2 dimension
      filterFields: ["category", "tags"]
    }),

  // Organization profiles (per user)
  orgProfiles: defineTable({
    userId: v.string(), // IP-based or simple identifier
    name: v.string(),
    mission: v.string(),
    tone: v.string(),
    region: v.string(),
    customFields: v.optional(v.record(v.string(), v.any())), // Flexible additional fields
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  // Prompt execution history
  runs: defineTable({
    promptId: v.id("prompts"),
    orgProfileId: v.id("orgProfiles"),
    userInput: v.string(), // The "situation" text
    output: v.string(), // GPT-5 generated content
    outputFormat: v.union(v.literal("markdown"), v.literal("plaintext")),
    metadata: v.optional(v.object({
      model: v.string(),
      tokens: v.number(),
      complexity: v.string(),
      verbosity: v.string(),
      reasoning_effort: v.string(),
      duration: v.optional(v.number()),
    })),
    createdAt: v.number(),
  })
    .index("by_prompt", ["promptId"])
    .index("by_org", ["orgProfileId"])
    .index("by_date", ["createdAt"]),

  // Global variables used across many prompts (ORGANIZATION_NAME, TARGET_AUDIENCE, etc.)
  globalVariables: defineTable({
    name: v.string(), // Variable name (e.g., "ORGANIZATION_NAME")
    description: v.string(), // What this variable represents
    questionPrompt: v.string(), // Context-driven question for users
    inputType: v.string(), // "short_text", "long_text", "select", "email", etc.
    examples: v.array(v.string()), // Example values
    category: v.string(), // Variable category
    isRequired: v.boolean(), // Whether this is required
    defaultValue: v.optional(v.string()), // Default value if any
    selectOptions: v.optional(v.array(v.string())), // Options for select/multi inputs
    usageCount: v.number(), // How many prompts use this variable
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_category", ["category"]),

  // Prompt-specific variables (unique to individual prompts)
  variables: defineTable({
    name: v.string(), // Variable name specific to this prompt
    promptId: v.id("prompts"), // Which prompt this variable belongs to
    description: v.string(), // What this variable represents in this context
    questionPrompt: v.string(), // Context-driven question for users
    inputType: v.string(), // "short_text", "long_text", "document", "select", "multi", etc.
    examples: v.array(v.string()), // Context-specific example values
    category: v.string(), // Variable category
    isRequired: v.boolean(), // Whether this variable is required
    sortOrder: v.number(), // Display order in the form
    grouping: v.optional(v.string()), // Logical grouping for related variables (e.g., "contact_info", "program_details")
    selectOptions: v.optional(v.array(v.string())), // Options for select/multi inputs
    validationRules: v.optional(v.array(v.string())), // Validation rules
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_prompt", ["promptId"])
    .index("by_name", ["name"])
    .index("by_category", ["category"])
    .index("by_sort_order", ["promptId", "sortOrder"])
    .index("by_grouping", ["promptId", "grouping"]),

  // Rate limiting tracking
  rateLimits: defineTable({
    identifier: v.string(), // IP address or user ID
    requests: v.number(),
    windowStart: v.number(), // Start of current time window
    lastRequest: v.number(),
  }).index("by_identifier", ["identifier"]),
});
