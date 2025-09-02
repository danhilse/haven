// Note: AI SDK imports commented out until packages are properly installed
// import { openai } from '@ai-sdk/openai';
// import { generateText } from 'ai';

// GPT-5 configuration types
export interface GPT5Config {
  verbosity: 'low' | 'medium' | 'high';
  reasoning_effort: 'minimal' | 'standard' | 'extensive';
  max_output_tokens: number;
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

  try {
    // Use direct OpenAI API call for now (Vercel AI SDK commented out)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        verbosity: config.verbosity,
        reasoning_effort: config.reasoning_effort,
        max_output_tokens: config.max_output_tokens,
        temperature: config.temperature,
      })
    });

    if (!response.ok) {
      // Try fallback to GPT-4 if GPT-5 fails
      console.log('GPT-5 failed, falling back to GPT-4...');
      const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_tokens: config.max_output_tokens,
          temperature: config.temperature,
        })
      });

      if (!fallbackResponse.ok) {
        throw new Error(`OpenAI API error: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
      }

      const fallbackData = await fallbackResponse.json();
      return {
        output: fallbackData.choices[0].message.content,
        metadata: {
          model: 'gpt-4-turbo',
          tokens: fallbackData.usage?.total_tokens || 0,
          complexity,
          verbosity: config.verbosity,
          reasoning_effort: config.reasoning_effort,
        }
      };
    }

    const data = await response.json();
    return {
      output: data.choices[0].message.content,
      metadata: {
        model: 'gpt-5',
        tokens: data.usage?.total_tokens || 0,
        complexity,
        verbosity: config.verbosity,
        reasoning_effort: config.reasoning_effort,
      }
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
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
    // Direct fetch to OpenAI API with GPT-5 specific parameters
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        verbosity: config.verbosity,
        reasoning_effort: config.reasoning_effort,
        max_output_tokens: config.max_output_tokens,
        temperature: config.temperature,
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
        verbosity: config.verbosity,
        reasoning_effort: config.reasoning_effort,
      }
    };

  } catch (error) {
    console.error('Direct GPT-5 API error:', error);
    throw error;
  }
}