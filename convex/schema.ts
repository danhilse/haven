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
    description: v.string(), // Auto-generated short description
    embedding: v.optional(v.array(v.number())), // Optional vector embedding for semantic search
    variables: v.optional(v.array(v.string())), // Normalized variable names found in this prompt
    requiredDocuments: v.optional(v.array(v.string())), // Additional context docs needed
    analysisMetadata: v.optional(v.object({
      variableCount: v.number(),
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

  // Variable metadata for prompt templates
  variables: defineTable({
    name: v.string(), // Base variable name (e.g., "KEY_QUALITY_#" for numbered sequences)
    basePattern: v.string(), // Pattern without numbers (e.g., "KEY_QUALITY")
    isNumbered: v.boolean(), // Whether this variable has numbered variants
    maxNumber: v.optional(v.number()), // Highest number found (e.g., 3 for KEY_QUALITY_1,2,3)
    description: v.string(), // AI-generated description
    examples: v.array(v.string()), // 3 example values
    category: v.string(), // Auto-categorized type (organization, program, contact, etc.)
    promptIds: v.array(v.id("prompts")), // Which prompts use this variable
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_base_pattern", ["basePattern"])
    .index("by_category", ["category"])
    .index("by_created", ["createdAt"]),

  // Rate limiting tracking
  rateLimits: defineTable({
    identifier: v.string(), // IP address or user ID
    requests: v.number(),
    windowStart: v.number(), // Start of current time window
    lastRequest: v.number(),
  }).index("by_identifier", ["identifier"]),
});
