import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Core prompt collection
  prompts: defineTable({
    title: v.string(),
    content: v.string(), // The actual prompt template
    category: v.string(),
    subcategory: v.string(),
    tags: v.array(v.string()), // audience, content type, channel
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    description: v.string(), // Auto-generated short description
    embedding: v.optional(v.array(v.number())), // Optional vector embedding for semantic search
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_subcategory", ["category", "subcategory"])
    .index("by_complexity", ["complexity"])
    .index("by_created", ["createdAt"])
    .searchIndex("search_prompts", {
      searchField: "title",
      filterFields: ["category", "subcategory", "tags", "complexity"]
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

  // Rate limiting tracking
  rateLimits: defineTable({
    identifier: v.string(), // IP address or user ID
    requests: v.number(),
    windowStart: v.number(), // Start of current time window
    lastRequest: v.number(),
  }).index("by_identifier", ["identifier"]),
});
