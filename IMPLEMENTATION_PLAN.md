# Implementation Plan: Nonprofit Prompt Library MVP

## Project Overview

A flat prompt library containing ~365 nonprofit templates with two entry points: semantic search and category browsing. Users can execute chosen prompts with their organization profile and situational context to generate GPT-5 powered output.

## Phase 1: Data Model & Backend Architecture

### 1.1 Convex Schema Design

```typescript
// convex/schema.ts
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_subcategory", ["category", "subcategory"])
    .index("by_complexity", ["complexity"])
    .searchIndex("search_prompts", {
      searchField: "title",
      filterFields: ["category", "subcategory", "tags", "complexity"]
    })
    // Optional: Vector search for semantic similarity
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
    customFields: v.optional(v.object({})), // Flexible additional fields
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
      duration: v.number(),
    })),
    createdAt: v.number(),
  })
    .index("by_prompt", ["promptId"])
    .index("by_org", ["orgProfileId"])
    .index("by_date", ["createdAt"]),

  // Optional: Vector embeddings table (if implementing semantic search)
  embeddings: defineTable({
    promptId: v.id("prompts"),
    vector: v.array(v.number()),
    model: v.string(), // "e5-small-v2"
  }).index("by_prompt", ["promptId"]),
});
```

### 1.2 Core Backend Functions

```typescript
// convex/prompts.ts
export const getPromptsByCategory = query({
  args: { category: v.string(), subcategory: v.optional(v.string()) },
  returns: v.array(v.object({
    _id: v.id("prompts"),
    title: v.string(),
    description: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    tags: v.array(v.string())
  })),
  handler: async (ctx, args) => {
    // Implementation using withIndex for efficiency
  }
});

export const searchPrompts = query({
  args: { 
    query: v.string(), 
    filters: v.optional(v.object({
      category: v.optional(v.string()),
      complexity: v.optional(v.string()),
      tags: v.optional(v.array(v.string()))
    }))
  },
  returns: v.array(v.object({ /* prompt results */ })),
  handler: async (ctx, args) => {
    // Full-text search implementation
    // Optional: Semantic search with embeddings reranking
  }
});

export const executePrompt = action({
  args: {
    promptId: v.id("prompts"),
    orgProfileId: v.id("orgProfiles"),
    situation: v.string(),
    complexity: v.optional(v.string())
  },
  returns: v.object({
    output: v.string(),
    metadata: v.object({})
  }),
  handler: async (ctx, args) => {
    // 1. Fetch prompt and org profile
    // 2. Compose final prompt with org data + situation
    // 3. Call GPT-5 via Vercel SDK
    // 4. Store run record
    // 5. Return generated content
  }
});
```

## Phase 2: Frontend Architecture

### 2.1 Next.js App Structure

```
app/
├── page.tsx                    # Landing page with search/browse options
├── search/
│   └── page.tsx               # Search results page
├── category/
│   └── [slug]/
│       └── page.tsx           # Category listing page
├── prompt/
│   └── [id]/
│       ├── page.tsx           # Prompt details and execution
│       └── result/
│           └── page.tsx       # Generated output display
├── profile/
│   └── page.tsx               # Org profile setup/edit
└── api/
    └── generate/
        └── route.ts           # GPT-5 API endpoint (if needed)
```

### 2.2 Key Components

```typescript
// components/SearchBox.tsx - Main search interface
// components/CategoryGrid.tsx - Browse by category
// components/PromptCard.tsx - Prompt preview cards
// components/PromptExecutor.tsx - Prompt execution form
// components/OrgProfileForm.tsx - Organization setup
// components/OutputViewer.tsx - Generated content display
```

### 2.3 State Management

- **Convex Queries**: Real-time data fetching with `useQuery`
- **Form State**: React Hook Form for complex forms
- **Global State**: React Context for org profile and app settings
- **URL State**: Next.js router for search/filter parameters

## Phase 3: Data Import & Processing

### 3.1 Prompt Data Pipeline

```typescript
// scripts/importPrompts.ts
export async function processMarkdownFiles() {
  // 1. Read raw MD files from source directory
  // 2. Extract metadata from folder structure (category/subcategory)
  // 3. Parse content and generate descriptions using GPT-4
  // 4. Create complexity variants (high/medium/low merged)
  // 5. Generate embeddings using e5-small-v2 (optional)
  // 6. Batch insert into Convex
}

// Enhanced metadata extraction
interface PromptMetadata {
  category: string;        // From folder structure
  subcategory: string;     // From folder structure  
  tags: string[];          // Auto-generated from content analysis
  complexity: string;      // Merged from variants
  audience: string[];      // Extracted from content
  contentType: string[];   // "letter", "social", "grant", etc.
  channel: string[];       // "email", "print", "web", etc.
}
```

### 3.2 Search Implementation Strategy

**Baseline Search (MVP)**:
- Full-text search on prompt titles and descriptions
- Category/tag filtering
- Complexity level filtering

**Enhanced Search (Stretch)**:
- Semantic search using e5-small-v2 embeddings
- Hybrid approach: keyword filter → embedding rerank → top N results
- Query expansion and intent understanding

```typescript
// Enhanced search flow
export const semanticSearch = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    // 1. Generate query embedding
    // 2. Vector search for semantic matches
    // 3. Full-text search for keyword matches  
    // 4. Merge and rerank results
    // 5. Return top N prompts
  }
});
```

## Phase 4: AI Integration & Rate Limiting

### 4.1 GPT-5 Integration

```typescript
// lib/openai.ts
import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generatePromptOutput({
  prompt,
  orgProfile,
  situation,
  complexity
}: GenerateRequest): Promise<GenerateResponse> {
  const systemPrompt = buildSystemPrompt(orgProfile, complexity);
  const userPrompt = interpolatePrompt(prompt, situation);

  // Use GPT-5 via Chat Completions API with new parameters
  const response = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    verbosity: "medium", // GPT-5 specific: low, medium, high
    reasoning_effort: "minimal", // GPT-5 specific: minimal, standard, extensive
    max_output_tokens: 2000,
    temperature: 0.4,
  });

  // Alternative: Use Responses API for advanced features (optional)
  /*
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: "gpt-5",
      input: [
        { role: "system", content: [{ type: "input_text", text: systemPrompt }] },
        { role: "user", content: [{ type: "input_text", text: userPrompt }] }
      ],
      verbosity: "medium",
      reasoning_effort: "minimal",
      max_output_tokens: 2000
    })
  });
  */

  return {
    output: response.choices[0].message.content,
    metadata: {
      model: 'gpt-5',
      tokens: response.usage?.total_tokens || 0,
      complexity,
      verbosity: 'medium',
      reasoning_effort: 'minimal',
    }
  };
}

// Context window and token management for GPT-5
export function estimateTokens(text: string): number {
  // GPT-5 supports up to ~400k total tokens (~272k input + 128k output)
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

export function validateInputSize(prompt: string, orgProfile: string, situation: string): boolean {
  const totalInput = prompt + orgProfile + situation;
  const estimatedTokens = estimateTokens(totalInput);
  
  // Leave buffer for system prompts and response
  const MAX_INPUT_TOKENS = 200000; // Conservative limit for 272k input capacity
  
  if (estimatedTokens > MAX_INPUT_TOKENS) {
    throw new Error(`Input too large: ${estimatedTokens} tokens exceeds ${MAX_INPUT_TOKENS} limit`);
  }
  
  return true;
}
```

### 4.2 GPT-5 Configuration Strategy

```typescript
// lib/gpt5-config.ts
export interface GPT5Config {
  verbosity: 'low' | 'medium' | 'high';
  reasoning_effort: 'minimal' | 'standard' | 'extensive';
  max_output_tokens: number;
  temperature: number;
}

// Different configs based on prompt complexity
export const getGPT5Config = (complexity: string): GPT5Config => {
  switch (complexity) {
    case 'high':
      return {
        verbosity: 'high',
        reasoning_effort: 'extensive',
        max_output_tokens: 4000,
        temperature: 0.3,
      };
    case 'medium':
      return {
        verbosity: 'medium',
        reasoning_effort: 'standard',
        max_output_tokens: 2000,
        temperature: 0.4,
      };
    case 'low':
    default:
      return {
        verbosity: 'low',
        reasoning_effort: 'minimal',
        max_output_tokens: 1000,
        temperature: 0.5,
      };
  }
};
```

### 4.3 Rate Limiting Strategy

```typescript
// convex/rateLimiting.ts
export const checkRateLimit = mutation({
  args: { identifier: v.string() }, // IP address or user ID
  handler: async (ctx, args) => {
    // IP-based rate limiting
    // Track requests per hour/day
    // Return boolean + remaining quota
  }
});
```

## Phase 5: UX Implementation

### 5.1 "Formspark Flow" Design Patterns


**Landing Page**:
- Clean hero with two primary sections: "Search Prompts" -- which is a semantic search with examples-- and "Browse Categories", whcih allows a user to navigate categories

**Search Experience**:
- Real-time search with debounced queries
- Filter sidebar (category, complexity, tags)
- Grid layout with prompt cards
- Infinite scroll or pagination

**Category Browse**:
- Breadcrumb navigation
- Category grid → subcategory list → prompt cards
- Clear hierarchy without overwhelming tree views

**Prompt Execution**:
- Prompt preview with complexity selector
- Organization profile injection (auto-filled)
- Situation input textarea
- Real-time character/token counting
- Generate button with loading states

**Output Display**:
- Markdown rendering with syntax highlighting
- Copy to clipboard functionality
- Download as file options
- "Generate Variation" quick action

### 5.2 Responsive Design

- Mobile-first approach using Tailwind CSS
- Progressive disclosure of advanced features
- Touch-friendly interface elements
- Optimized loading states and error handling

## Phase 6: Technical Implementation Priorities

### Sprint 1 (Foundation)
1. ✅ Set up Convex schema and basic queries
2. ✅ Create prompt import pipeline
3. ✅ Build landing page and basic navigation
4. ✅ Implement organization profile setup

### Sprint 2 (Search & Browse)
1. ✅ Full-text search implementation
2. ✅ Category browsing with filtering
3. ✅ Prompt card components and layouts
4. ✅ Basic responsive design

### Sprint 3 (Execution Engine)
1. ✅ GPT-5 integration with direct OpenAI API calls (with GPT-4 fallback)
2. ✅ Prompt template interpolation system
3. ✅ Output rendering and display  
4. ✅ Rate limiting implementation

### Sprint 4 (Polish & Optimization)
1. ✅ Enhanced search with embeddings (if needed)
2. ✅ Performance optimization and caching
3. ✅ Error handling and edge cases
4. ✅ Security hardening and IP filtering

## Phase 7: Deployment & Infrastructure

### 7.1 Environment Setup

```bash
# Environment variables
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud
OPENAI_API_KEY=sk-...
CONVEX_DEPLOYMENT=your-deployment
RATE_LIMIT_REDIS_URL=redis://... (if using Redis for rate limiting)
```

### 7.2 Security Considerations

- IP-based access control (private link + allowlist)
- Rate limiting per IP address
- Input validation and sanitization
- Prompt injection protection
- API key security and rotation

### 7.3 Monitoring & Analytics

- Convex built-in metrics for database performance
- Custom analytics for prompt usage patterns
- Error tracking and alerting
- Rate limit monitoring and adjustment

## Success Metrics

- **Prompt Library**: 365+ templates successfully imported and searchable
- **Search Quality**: <2s search response time, >90% relevant results
- **Generation Speed**: <10s average prompt execution time
- **User Experience**: Clean, intuitive flow from search → execute → output
- **Technical Performance**: 99.9% uptime, scalable to 1000+ daily users

## Risks & Mitigations

- **Data Quality**: Implement robust prompt validation and testing
- **API Costs**: Monitor usage and implement smart caching
- **Search Relevance**: Start with keyword search, add embeddings if needed
- **Rate Limiting**: Begin conservative, adjust based on usage patterns
- **Security**: IP allowlisting and comprehensive input validation

## Future Enhancements (Post-MVP)

1. Google Docs export integration
2. Multi-language localization support
3. Advanced analytics and user feedback
4. Multi-tenant architecture with user roles
5. Playbook system (multi-step prompt flows)
6. Auto-fill organization data from uploaded documents
7. Style memory and personalization features