#!/usr/bin/env node

/**
 * Enhanced Prompt Metadata Script
 * 
 * This script addresses the issue where prompt descriptions were too basic (just restating the title)
 * and adds a new "summaryDescription" field for search cards.
 * 
 * Goals:
 * - Replace existing descriptions with meaningful, user-facing descriptions
 * - Add summaryDescription field for quick understanding in search/browse contexts
 * - Ensure descriptions + outputDescription give users complete understanding without reading template
 * 
 * Usage: node scripts/enhance_descriptions_and_summaries.js
 */

const { ConvexHttpClient } = require("convex/browser");
const fs = require('fs').promises;
require('dotenv').config({ path: '.env.local' });

// Configuration
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const BATCH_SIZE = 15; // Conservative batch size
const MAX_CONCURRENT_REQUESTS = 3; // Conservative concurrency
const DELAY_BETWEEN_BATCHES = 2000; // 2 second delay

// Initialize client
const convex = new ConvexHttpClient(CONVEX_URL);

// Load copy style guide for consistent messaging
let copyStyleGuide = '';
async function loadCopyStyleGuide() {
  try {
    copyStyleGuide = await fs.readFile('./context/COPY_STYLE_GUIDE.md', 'utf-8');
  } catch (error) {
    console.warn('Could not load copy style guide, proceeding without it');
  }
}

function createEnhancementPrompt() {
  return `You are a copywriting expert specializing in nonprofit communications. Your task is to create compelling, user-facing descriptions for AI prompt templates.

${copyStyleGuide ? `COPY STYLE GUIDE:\n${copyStyleGuide}\n\n` : ''}

CONTEXT: Users browse templates to solve specific problems. They need to understand:
1. What value/outcome this template provides
2. Why they would choose this over other options
3. What they'll receive as output

CURRENT PROBLEM: Existing descriptions are too basic and just restate the title (e.g., "Partner organization capability assessment (high complexity)"). Users can't understand the value without reading the full template.

YOUR TASK: For each prompt template, create:

1. **description**: A compelling, benefit-focused description (2-3 sentences) that explains the value and outcome users will get. This should make users think "Yes, this solves my problem!" Focus on benefits, not features.

2. **summaryDescription**: A very concise summary (1 sentence, max 15 words) for search cards that captures the core value proposition at a glance.

GUIDELINES:
- Write for nonprofit professionals who are busy and results-focused
- Emphasize outcomes and benefits, not technical details
- Use action-oriented, confident language
- Make it scannable and compelling
- Avoid jargon and overly complex language
- Focus on the "so what?" - why should they care?

EXAMPLES:

Bad description: "Grant application support (medium complexity)"
Good description: "Get expert guidance to write compelling grant applications that win funding. Receive step-by-step instructions, persuasive language suggestions, and formatting tips that increase your approval odds."
Good summaryDescription: "Write winning grant applications with expert guidance"

Bad description: "Board member questions about governance"  
Good description: "Get clear, practical answers to your board's governance questions so you can act with confidence and keep meetings and decisions on track."
Good summaryDescription: "Clear answers to board governance questions"

Respond with a JSON object containing "description" and "summaryDescription" fields only.`;
}

class DescriptionEnhancer {
  constructor() {
    this.results = {
      enhancementDate: new Date().toISOString(),
      promptsProcessed: 0,
      promptsEnhanced: 0,
      errors: 0,
      errorDetails: [],
      results: []
    };
  }

  async enhancePromptMetadata(prompt) {
    try {
      const enhancementContext = {
        title: prompt.title,
        category: prompt.category,
        subcategory: prompt.subcategory,
        complexity: prompt.complexity,
        tags: prompt.tags,
        currentDescription: prompt.description,
        outputDescription: prompt.outputDescription,
        content: prompt.content.substring(0, 1000) // First 1000 chars for context
      };

      const userPrompt = `Enhance this prompt template:

Title: ${enhancementContext.title}
Category: ${enhancementContext.category} > ${enhancementContext.subcategory}
Complexity: ${enhancementContext.complexity}
Tags: ${enhancementContext.tags.join(', ')}
Current Description: ${enhancementContext.currentDescription}
Current Output Description: ${enhancementContext.outputDescription || 'Not provided'}

Template Content Preview:
${enhancementContext.content}...

Provide enhanced description and summaryDescription.`;

      console.log(`🤖 Enhancing descriptions for: ${prompt.title.substring(0, 50)}...`);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY || process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: [
            { role: 'system', content: createEnhancementPrompt() },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 500,
          reasoning_effort: 'low', // Light reasoning for better quality
          verbosity: 'medium',
          response_format: { type: "json_object" }
        })
      });

      let content;
      if (!response.ok) {
        // Fallback to GPT-4o-mini if GPT-5 is not available
        console.log('   GPT-5 not available, falling back to GPT-4o-mini...');
        
        const fallbackResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_KEY || process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: createEnhancementPrompt() },
              { role: 'user', content: userPrompt }
            ],
            max_tokens: 500,
            temperature: 0.3,
            response_format: { type: "json_object" }
          })
        });

        if (!fallbackResponse.ok) {
          throw new Error(`Fallback API request failed: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
        }

        const fallbackData = await fallbackResponse.json();
        content = fallbackData.choices[0].message.content;
      } else {
        const data = await response.json();
        content = data.choices[0].message.content;
      }
      
      // Try to parse JSON response
      let enhancement;
      try {
        enhancement = JSON.parse(content);
      } catch (parseError) {
        // If JSON parsing fails, try to extract from text
        const descMatch = content.match(/"description":\s*"([^"]+)"/);
        const summaryMatch = content.match(/"summaryDescription":\s*"([^"]+)"/);
        
        if (descMatch && summaryMatch) {
          enhancement = {
            description: descMatch[1],
            summaryDescription: summaryMatch[1]
          };
        } else {
          throw new Error(`Could not parse enhancement response: ${content}`);
        }
      }

      if (!enhancement.description || !enhancement.summaryDescription) {
        throw new Error(`Missing required fields in response: ${JSON.stringify(enhancement)}`);
      }

      return {
        success: true,
        promptId: prompt._id,
        originalTitle: prompt.title,
        currentDescription: prompt.description,
        enhancedDescription: enhancement.description,
        summaryDescription: enhancement.summaryDescription,
        modelUsed: "gpt-4o-mini"
      };

    } catch (error) {
      console.error(`Error enhancing prompt ${prompt._id}:`, error.message);
      
      return {
        success: false,
        promptId: prompt._id,
        originalTitle: prompt.title,
        error: error.message,
        modelUsed: "gpt-4o-mini"
      };
    }
  }

  async processBatch(prompts) {
    console.log(`Processing batch of ${prompts.length} prompts...`);
    
    const batchPromises = prompts.map(prompt => this.enhancePromptMetadata(prompt));
    const results = await Promise.all(batchPromises);
    
    // Update database with successful enhancements
    const updatePromises = results
      .filter(result => result.success)
      .map(async (result) => {
        try {
          // Use the internal mutation API format
          await convex.mutation("prompts:updatePromptMetadata", {
            promptId: result.promptId,
            updates: {
              description: result.enhancedDescription,
              summaryDescription: result.summaryDescription
            }
          });
          
          console.log(`✓ Updated prompt: ${result.originalTitle}`);
          this.results.promptsEnhanced++;
          
        } catch (error) {
          console.error(`Failed to update prompt ${result.promptId}:`, error);
          this.results.errors++;
          this.results.errorDetails.push({
            promptId: result.promptId,
            error: error.message,
            phase: 'database_update'
          });
          result.success = false;
          result.error = `Database update failed: ${error.message}`;
        }
      });

    await Promise.all(updatePromises);

    // Track errors
    results.forEach(result => {
      if (!result.success) {
        this.results.errors++;
        this.results.errorDetails.push({
          promptId: result.promptId,
          error: result.error,
          phase: 'enhancement'
        });
      }
    });

    this.results.results.push(...results);
    this.results.promptsProcessed += prompts.length;

    return results;
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async enhanceAllPrompts() {
    try {
      console.log('🚀 Starting enhanced description and summary generation...');
      console.log(`Configuration: ${BATCH_SIZE} batch size, ${MAX_CONCURRENT_REQUESTS} max concurrent`);

      // Fetch all prompts that need enhancement
      const allPrompts = await convex.query("prompts:getAllPrompts");
      console.log(`Found ${allPrompts.length} prompts to process`);

      if (allPrompts.length === 0) {
        console.log('No prompts found to enhance');
        return;
      }

      // Process in batches
      for (let i = 0; i < allPrompts.length; i += BATCH_SIZE) {
        const batch = allPrompts.slice(i, i + BATCH_SIZE);
        console.log(`\n--- Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allPrompts.length / BATCH_SIZE)} ---`);
        
        await this.processBatch(batch);
        
        // Delay between batches to respect rate limits
        if (i + BATCH_SIZE < allPrompts.length) {
          console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
          await this.delay(DELAY_BETWEEN_BATCHES);
        }
      }

      // Print summary
      console.log('\n=== ENHANCEMENT COMPLETE ===');
      console.log(`✅ Prompts processed: ${this.results.promptsProcessed}`);
      console.log(`✅ Prompts enhanced: ${this.results.promptsEnhanced}`);
      console.log(`❌ Errors: ${this.results.errors}`);
      console.log(`📊 Database updated with enhanced descriptions and summaries`);

      if (this.results.errors > 0) {
        console.log('\n=== ERROR SUMMARY ===');
        const errorsByPhase = this.results.errorDetails.reduce((acc, error) => {
          acc[error.phase] = (acc[error.phase] || 0) + 1;
          return acc;
        }, {});
        
        Object.entries(errorsByPhase).forEach(([phase, count]) => {
          console.log(`${phase}: ${count} errors`);
        });
      }

    } catch (error) {
      console.error('Fatal error during enhancement:', error);
      process.exit(1);
    }
  }
}

// Run the enhancement
async function main() {
  await loadCopyStyleGuide();
  const enhancer = new DescriptionEnhancer();
  
  try {
    await enhancer.enhanceAllPrompts();
    console.log('\n🎉 Enhancement process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Enhancement process failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DescriptionEnhancer;