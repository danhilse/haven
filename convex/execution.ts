import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Rate limiting constants
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per hour per IP

// Check and update rate limit
export const checkRateLimit = mutation({
  args: { identifier: v.string() },
  returns: v.object({
    allowed: v.boolean(),
    remaining: v.number(),
    resetTime: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Get existing rate limit record
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_identifier", (q) => q.eq("identifier", args.identifier))
      .first();

    if (!existing) {
      // First request for this identifier
      await ctx.db.insert("rateLimits", {
        identifier: args.identifier,
        requests: 1,
        windowStart: now,
        lastRequest: now,
      });
      return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      };
    }

    // Check if we need to reset the window
    if (existing.windowStart < windowStart) {
      // Reset the window
      await ctx.db.patch(existing._id, {
        requests: 1,
        windowStart: now,
        lastRequest: now,
      });
      return {
        allowed: true,
        remaining: RATE_LIMIT_MAX_REQUESTS - 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      };
    }

    // Check if limit exceeded
    if (existing.requests >= RATE_LIMIT_MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.windowStart + RATE_LIMIT_WINDOW,
      };
    }

    // Increment request count
    await ctx.db.patch(existing._id, {
      requests: existing.requests + 1,
      lastRequest: now,
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - existing.requests - 1,
      resetTime: existing.windowStart + RATE_LIMIT_WINDOW,
    };
  },
});

// Template interpolation helper
function interpolatePrompt(template: string, orgProfile: Doc<"orgProfiles">, situation: string): string {
  const placeholders = {
    '{{organization_name}}': orgProfile.name,
    '{{mission}}': orgProfile.mission,
    '{{tone}}': orgProfile.tone,
    '{{region}}': orgProfile.region,
    '{{situation}}': situation,
  };

  let result = template;
  for (const [placeholder, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }

  // Handle custom fields
  if (orgProfile.customFields) {
    for (const [key, value] of Object.entries(orgProfile.customFields)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
  }

  return result;
}

// Execute prompt with GPT integration
export const executePrompt = action({
  args: {
    promptId: v.id("prompts"),
    orgProfileId: v.id("orgProfiles"),
    situation: v.string(),
    complexity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
    userIdentifier: v.string(), // IP address or user identifier for rate limiting
  },
  returns: v.object({
    output: v.string(),
    metadata: v.object({
      model: v.string(),
      tokens: v.number(),
      complexity: v.string(),
      verbosity: v.string(),
      reasoning_effort: v.string(),
      duration: v.optional(v.number()),
    }),
    rateLimitInfo: v.object({
      remaining: v.number(),
      resetTime: v.number(),
    }),
  }),
  handler: async (ctx, args): Promise<{
    output: string;
    metadata: {
      model: string;
      tokens: number;
      complexity: string;
      verbosity: string;
      reasoning_effort: string;
      duration?: number;
    };
    rateLimitInfo: {
      remaining: number;
      resetTime: number;
    };
  }> => {
    const startTime = Date.now();

    // Check rate limit
    const rateLimitResult: {
      allowed: boolean;
      remaining: number;
      resetTime: number;
    } = await ctx.runMutation(api.execution.checkRateLimit, {
      identifier: args.userIdentifier,
    });

    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded. Try again after ${new Date(rateLimitResult.resetTime).toISOString()}`);
    }

    // Fetch prompt and org profile
    const prompt: Doc<"prompts"> | null = await ctx.runQuery(api.prompts.getPromptById, {
      promptId: args.promptId,
    });

    if (!prompt) {
      throw new Error("Prompt not found");
    }

    const orgProfile: Doc<"orgProfiles"> | null = await ctx.runQuery(api.orgProfiles.getOrgProfile, {
      userId: args.userIdentifier, // Using same identifier for now
    });

    if (!orgProfile) {
      throw new Error("Organization profile not found. Please set up your profile first.");
    }

    // Interpolate prompt with org data and situation
    const finalPrompt = interpolatePrompt(prompt.content, orgProfile, args.situation);
    
    // Build system prompt based on complexity and org profile
    const systemPrompt = buildSystemPrompt(orgProfile, args.complexity || prompt.complexity);

    try {
      // TODO: Replace with actual GPT API call
      // For now, return a mock response
      const mockOutput: string = `# Generated Content

Based on your request: "${args.situation}"

Organization: ${orgProfile.name}
Mission: ${orgProfile.mission}
Tone: ${orgProfile.tone}

This is a mock response for the prompt: "${prompt.title}"

The actual GPT integration will be implemented with the AI SDK.

---

*Generated with complexity level: ${args.complexity || prompt.complexity}*`;

      const duration = Date.now() - startTime;

      // Store the execution record
      await ctx.runMutation(api.execution.saveRun, {
        promptId: args.promptId,
        orgProfileId: orgProfile._id,
        userInput: args.situation,
        output: mockOutput,
        outputFormat: "markdown",
        metadata: {
          model: "gpt-4-mock",
          tokens: 150, // Mock token count
          complexity: args.complexity || prompt.complexity,
          verbosity: "medium",
          reasoning_effort: "minimal",
          duration,
        },
      });

      return {
        output: mockOutput,
        metadata: {
          model: "gpt-4-mock",
          tokens: 150,
          complexity: args.complexity || prompt.complexity,
          verbosity: "medium",
          reasoning_effort: "minimal",
          duration,
        },
        rateLimitInfo: {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        },
      };

    } catch (error) {
      console.error("Error executing prompt:", error);
      throw new Error("Failed to generate content. Please try again.");
    }
  },
});

// Save execution run to database
export const saveRun = mutation({
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
    return await ctx.db.insert("runs", {
      promptId: args.promptId,
      orgProfileId: args.orgProfileId,
      userInput: args.userInput,
      output: args.output,
      outputFormat: args.outputFormat,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

// Get execution history for a user
export const getUserRuns = query({
  args: { 
    orgProfileId: v.id("orgProfiles"),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("runs"),
    _creationTime: v.number(),
    promptId: v.id("prompts"),
    userInput: v.string(),
    output: v.string(),
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
  })),
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("runs")
      .withIndex("by_org", (q) => q.eq("orgProfileId", args.orgProfileId))
      .order("desc")
      .take(args.limit ?? 20);

    return runs;
  },
});

// Helper function to build system prompt
function buildSystemPrompt(orgProfile: Doc<"orgProfiles">, complexity: string): string {
  const basePrompt = `You are a professional nonprofit communication assistant helping ${orgProfile.name}.

Organization Details:
- Mission: ${orgProfile.mission}
- Tone: ${orgProfile.tone}
- Region: ${orgProfile.region}

Please generate content that:
- Aligns with the organization's mission and values
- Uses the specified tone (${orgProfile.tone})
- Is appropriate for the ${orgProfile.region} context
- Follows nonprofit best practices`;

  const complexityGuidance = {
    low: "Keep the content simple, direct, and accessible to all audiences.",
    medium: "Provide balanced detail with clear structure and professional language.",
    high: "Create comprehensive, detailed content with sophisticated language and thorough analysis."
  };

  return `${basePrompt}

Complexity Level: ${complexity}
${complexityGuidance[complexity as keyof typeof complexityGuidance]}

Generate the content in markdown format.`;
}