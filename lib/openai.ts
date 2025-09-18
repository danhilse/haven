import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

// GPT-5 configuration types
export interface GPT5Config {
  maxTokens: number;
  temperature: number;
}

export interface GenerateRequest {
  prompt: string;
  orgProfile: {
    name: string;
    mission: string;
    tone: string;
    region: string;
  };
  situation: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface GenerateResponse {
  output: string;
  metadata: {
    model: string;
    tokens: number;
    complexity: string;
    verbosity: string;
    reasoning_effort: string;
    duration?: number;
  };
}

export interface ParsedQuery {
  searchTerms: string[];
  context: string;
  category?: string;
  tags?: string[];
  intentType: 'fundraising' | 'communication' | 'marketing' | 'advocacy' | 'volunteer' | 'general';
}

export interface SemanticCandidate {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  subcategory: string;
  similarity: number;
}

export interface RankedRecommendation {
  promptId: string;
  rank: number;
  reason: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface RankedRecommendationResponse {
  recommendations: RankedRecommendation[];
}

// Different configs based on prompt complexity
export const getGPT5Config = (complexity: string): GPT5Config => {
  switch (complexity) {
    case 'high':
      return {
        maxTokens: 4000,
        temperature: 0.3,
      };
    case 'medium':
      return {
        maxTokens: 2000,
        temperature: 0.4,
      };
    case 'low':
    default:
      return {
        maxTokens: 1000,
        temperature: 0.5,
      };
  }
};

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

// Build system prompt with organization context
function buildSystemPrompt(orgProfile: GenerateRequest['orgProfile'], complexity: string): string {
  return `You are an expert nonprofit communications assistant helping ${orgProfile.name}.

Organization Context:
- Mission: ${orgProfile.mission}
- Tone: ${orgProfile.tone}
- Region: ${orgProfile.region}

Guidelines:
- Maintain a ${orgProfile.tone} tone throughout
- Align all content with the organization's mission
- Consider the ${orgProfile.region} context for cultural appropriateness
- Output complexity level: ${complexity}
- Provide actionable, professional content suitable for nonprofit use

Generate high-quality content that reflects the organization's values and mission.`;
}

// Interpolate prompt template with situation context
function interpolatePrompt(promptTemplate: string, situation: string): string {
  // Replace common placeholders in the prompt template
  return promptTemplate
    .replace(/\{situation\}/g, situation)
    .replace(/\{context\}/g, situation)
    .replace(/\{details\}/g, situation);
}

// Main GPT-5 generation function using Vercel AI SDK
export async function generatePromptOutput({
  prompt,
  orgProfile,
  situation,
  complexity
}: GenerateRequest): Promise<GenerateResponse> {
  // Validate input size for GPT-5 context window
  const orgString = JSON.stringify(orgProfile);
  validateInputSize(prompt, orgString, situation);

  const config = getGPT5Config(complexity);
  const systemPrompt = buildSystemPrompt(orgProfile, complexity);
  const userPrompt = interpolatePrompt(prompt, situation);

  // Use Vercel AI SDK with OpenAI provider; target GPT-5 explicitly
  const openai = createOpenAI({ apiKey: process.env.OPENAI_KEY || process.env.OPENAI_API_KEY });
  try {
    const { text, usage } = await generateText({
      model: openai('gpt-5'),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    });

    return {
      output: text,
      metadata: {
        model: 'gpt-5',
        tokens: usage.totalTokens ?? 0,
        complexity,
        verbosity: complexity,
        reasoning_effort: 'standard',
      }
    };
  } catch (error) {
    // Surface a precise error so callers know GPT-5 was not used
    console.error('GPT-5 generation error (AI SDK):', error);
    throw error instanceof Error ? error : new Error('GPT-5 generation failed');
  }
}

// Alternative direct OpenAI client approach (for GPT-5 specific parameters)
export async function generatePromptOutputDirect({
  prompt,
  orgProfile,
  situation,
  complexity
}: GenerateRequest): Promise<GenerateResponse> {
  const config = getGPT5Config(complexity);
  const systemPrompt = buildSystemPrompt(orgProfile, complexity);
  const userPrompt = interpolatePrompt(prompt, situation);

  try {
    // Direct fetch to OpenAI API targeting gpt-5 (no fallback)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: config.maxTokens,
        temperature: config.temperature
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      output: data.choices[0].message.content,
      metadata: {
        model: 'gpt-5',
        tokens: data.usage?.total_tokens || 0,
        complexity,
        verbosity: complexity,
        reasoning_effort: 'standard',
      }
    };

  } catch (error) {
    console.error('Direct GPT-5 API error:', error);
    throw error;
  }
}

// Parse semantic query using a lightweight LLM call
export async function parseSemanticQuery(userQuery: string): Promise<ParsedQuery> {
  const systemPrompt = `You are a query parser for nonprofit communication templates. Extract key information from the user's natural language description.

Return a JSON object with:
- searchTerms: array of 3-5 key search terms/phrases
- context: cleaned version of the original query (1-2 sentences)
- category: one of "fundraising", "communication", "marketing", "advocacy", "volunteer", "general" 
- tags: array of relevant tags like ["donor", "email", "thank-you", "annual", "gala"]
- intentType: the main category this request falls into

Focus on extracting the communication purpose, audience, and context.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this query: "${userQuery}"` }
        ],
        max_tokens: 300,
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      console.error('Query parsing failed, using fallback');
      // Fallback parsing
      return {
        searchTerms: userQuery.split(' ').filter(word => word.length > 3).slice(0, 5),
        context: userQuery,
        intentType: 'general'
      };
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    
    return {
      searchTerms: parsed.searchTerms || [userQuery],
      context: parsed.context || userQuery,
      category: parsed.category,
      tags: parsed.tags,
      intentType: parsed.intentType || 'general'
    };

  } catch (error) {
    console.error('Query parsing error:', error);
    // Fallback parsing
    return {
      searchTerms: userQuery.split(' ').filter(word => word.length > 3).slice(0, 5),
      context: userQuery,
      intentType: 'general'
    };
  }
}

const FALLBACK_SUMMARY_LIMIT = 120;
const FALLBACK_REASON_LIMIT = 160;

function sanitizeReasonCopy(text: string): string {
  if (!text) return '';
  return text
    .replace(/\btemplates?\b/gi, 'guidance')
    .replace(/\bprompts?\b/gi, 'guidance')
    .trim();
}

function buildFallbackReason(candidate: SemanticCandidate, requestSummary: string, isPrimary: boolean): string {
  const summary = requestSummary.trim()
    ? requestSummary.trim()
    : `${candidate.category.toLowerCase()} support`;
  const summarySnippet = summary.length > FALLBACK_SUMMARY_LIMIT
    ? `${summary.slice(0, FALLBACK_SUMMARY_LIMIT - 1)}…`
    : summary;

  let description = candidate.description.trim();
  if (!description) {
    const tagPreview = candidate.tags.slice(0, 2).join(', ');
    description = tagPreview
      ? `covering ${tagPreview.toLowerCase()} guidance`
      : `providing practical guidance`;
  }

  if (description.endsWith('.')) {
    description = description.slice(0, -1);
  }

  if (description.length > FALLBACK_REASON_LIMIT) {
    description = `${description.slice(0, FALLBACK_REASON_LIMIT - 1)}…`;
  }

  const descriptionFragment = description.charAt(0).toLowerCase() + description.slice(1);
  const lead = isPrimary ? 'helps with' : 'also supports';

  const reason = `${candidate.title} ${lead} "${summarySnippet}" by ${descriptionFragment}.`;
  return sanitizeReasonCopy(reason);
}

export async function rankSemanticCandidates({
  userQuery,
  parsedQuery,
  candidates,
  maxRecommendations = 2,
}: {
  userQuery: string;
  parsedQuery: ParsedQuery;
  candidates: SemanticCandidate[];
  maxRecommendations?: number;
}): Promise<RankedRecommendationResponse> {
  if (candidates.length === 0) {
    return { recommendations: [] };
  }

  const systemPrompt = `You are an assistant that compares nonprofit support options to a user's request. Recommend the most helpful options with a single friendly sentence that explains how each one addresses the request. Never mention words like "template" or "prompt"—describe the guidance itself.`;

  const payload = {
    request: userQuery,
    parsedContext: parsedQuery,
    candidates: candidates.map((candidate) => ({
      id: candidate.id,
      title: candidate.title,
      description: candidate.description,
      tags: candidate.tags,
      category: candidate.category,
      subcategory: candidate.subcategory,
      similarity: Number(candidate.similarity.toFixed(4)),
    })),
    maxRecommendations,
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Compare the user request to the candidate options and return a JSON object with this shape:\n{\n  "recommendations": [\n    {\n      "promptId": "<id>",\n      "rank": <number>,\n      "reason": "<one sentence explaining how this guidance helps the request>",\n      "confidence": "high | medium | low"\n    }\n  ]\n}\n\nKeep each reason to a single sentence that references the user's request, sounds user-facing, and never mentions words such as template, prompt, or library.\n\nRequest and candidates (JSON):\n${JSON.stringify(payload)}`,
          },
        ],
        max_tokens: 500,
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ranking API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Ranking API returned empty content');
    }

    const parsed = JSON.parse(content);
    const rawRecommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations
      : [];

    const sanitized: RankedRecommendation[] = rawRecommendations
      .slice(0, maxRecommendations)
      .map((recommendation: any, index: number) => ({
        promptId: recommendation.promptId ?? recommendation.id,
        rank: recommendation.rank ?? index + 1,
        reason: sanitizeReasonCopy(
          recommendation.reason ?? 'Recommended match based on semantic fit.'
        ),
        confidence: recommendation.confidence,
      }))
      .filter((recommendation: any) => Boolean(recommendation.promptId));

    if (sanitized.length === 0) {
      throw new Error('Ranking API returned no usable recommendations');
    }

    return { recommendations: sanitized };
  } catch (error) {
    console.error('Semantic ranking failed:', error);

    return {
      recommendations: candidates
        .slice(0, maxRecommendations)
        .map((candidate, index) => ({
          promptId: candidate.id,
          rank: index + 1,
          reason: buildFallbackReason(candidate, parsedQuery.context || userQuery, index === 0),
          confidence: 'medium',
        })),
    };
  }
}

// Generate embeddings for text using OpenAI's embedding model
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        dimensions: 384, // Specify 384 dimensions to match schema
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;

  } catch (error) {
    console.error('Embedding generation error:', error);
    throw error;
  }
}

// Interface for variable metadata enhancement
export interface VariableEnhancementRequest {
  variables: Array<{
    name: string;
    basePattern: string;
    isNumbered: boolean;
    maxNumber?: number;
    category: string;
    usageExamples: string[]; // Context from prompts where it's used
  }>;
  promptContext?: string; // Additional context about the prompts being processed
}

export interface VariableEnhancementResponse {
  enhancedVariables: Array<{
    name: string;
    description: string;
    examples: string[];
    category: string;
    suggestedInputType: 'text' | 'textarea' | 'select' | 'number' | 'date' | 'email' | 'phone';
    validationRules?: string[];
  }>;
  additionalDocuments?: string[];
  confidence: number;
}

// Enhanced variable metadata generation using GPT-5 with 2025 parameters
export async function enhanceVariableMetadata({
  variables,
  promptContext
}: VariableEnhancementRequest): Promise<VariableEnhancementResponse> {
  const systemPrompt = `You are an expert in nonprofit communication templates and variable metadata generation. Your task is to analyze template variables and generate useful descriptions, examples, and metadata.

For each variable provided, generate:
1. A clear, concise description (1-2 sentences) explaining what this variable represents
2. Three realistic examples that a nonprofit might use
3. Suggest the most appropriate input type for forms
4. Any validation rules that should apply

Focus on nonprofit-specific context. Variables should reflect real organizational needs like donor management, program delivery, volunteer coordination, etc.

IMPORTANT: For numbered variables like KEY_QUALITY_#, describe the base concept and note that multiple instances (1, 2, 3, etc.) are expected.

Return valid JSON only.`;

  const userPrompt = `Analyze these nonprofit template variables and provide metadata:

${JSON.stringify({ variables, promptContext }, null, 2)}

Return a JSON object with this structure:
{
  "enhancedVariables": [
    {
      "name": "VARIABLE_NAME",
      "description": "Clear description of what this variable represents",
      "examples": ["Example 1", "Example 2", "Example 3"],
      "category": "Confirmed or refined category",
      "suggestedInputType": "text|textarea|select|number|date|email|phone",
      "validationRules": ["Optional validation rules"]
    }
  ],
  "additionalDocuments": ["Only if specific documents are clearly needed"],
  "confidence": 0.95
}`;

  try {
    // Use GPT-5 with new 2025 parameters for enhanced metadata generation
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" },
        // New GPT-5 2025 parameters
        reasoning: { effort: "medium" }, // Balanced reasoning for good quality
        text: { verbosity: "medium" } // Medium verbosity for detailed but not excessive descriptions
      })
    });

    if (!response.ok) {
      throw new Error(`GPT-5 API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return {
      enhancedVariables: result.enhancedVariables || [],
      additionalDocuments: result.additionalDocuments || [],
      confidence: result.confidence || 0.8
    };

  } catch (error) {
    console.error('Variable enhancement error:', error);
    // Fallback with basic metadata if AI fails
    const fallbackVariables = variables.map(variable => ({
      name: variable.name,
      description: `${variable.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} value for nonprofit template`,
      examples: ['Sample value 1', 'Sample value 2', 'Sample value 3'],
      category: variable.category,
      suggestedInputType: 'text' as const
    }));

    return {
      enhancedVariables: fallbackVariables,
      additionalDocuments: [],
      confidence: 0.3
    };
  }
}

// Batch enhance variables in smaller groups to avoid token limits
export async function batchEnhanceVariables(
  allVariables: Array<{
    name: string;
    basePattern: string;
    isNumbered: boolean;
    maxNumber?: number;
    category: string;
    usageExamples: string[];
  }>,
  batchSize: number = 10
): Promise<VariableEnhancementResponse[]> {
  const results: VariableEnhancementResponse[] = [];
  
  for (let i = 0; i < allVariables.length; i += batchSize) {
    const batch = allVariables.slice(i, i + batchSize);
    console.log(`Processing variable batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allVariables.length/batchSize)}`);
    
    try {
      const result = await enhanceVariableMetadata({
        variables: batch,
        promptContext: `Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(allVariables.length/batchSize)} variable batches for nonprofit prompt templates`
      });
      
      results.push(result);
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < allVariables.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Error processing batch ${Math.floor(i/batchSize) + 1}:`, error);
      // Continue with other batches even if one fails
    }
  }
  
  return results;
}
