#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Enhanced AI prompt for improving prompt metadata
async function enhancePromptMetadata(promptTitle, promptContent, category, subcategory, tags) {
  const systemPrompt = `You are an expert in nonprofit communication and user experience design. Your task is to analyze nonprofit prompt templates and generate user-friendly metadata that helps users discover and understand what each template does.

Your goal is to transform technical prompt listings into clear, outcome-focused descriptions that nonprofits will find and understand.

## Writing Style Guidelines:
- Keep language short, uncluttered, and direct
- Use calm, supportive tone - never breathless or "disruptive"
- Use 2nd person ("you," "your organization") 
- Focus on tangible outcomes and practical results
- Avoid technical jargon - speak in plain nonprofit language
- Make users the hero, the tool is just the ally
- Never mention "AI," "prompts," or technical processes

For titles:
- Keep under 8 words when possible
- Focus on the outcome, not the process
- Use action-oriented language
- Examples: "Donor Thank-You Letters," "Grant Application Draft," "Board Meeting Summary"

For descriptions:
- 1-2 sentences maximum
- Lead with the outcome users will get
- Focus on relief from common nonprofit pain points
- Examples: "Never stare at a blank screen when thanking donors," "Turn board questions into clear, confident responses"

For output descriptions:
- Focus on what users will receive, not how it works
- Use concrete language: "a grant draft," "donor letters that feel personal"
- Emphasize clarity, speed, and relief from overwhelm
- Keep descriptions outcome-focused, not tool-focused
- Examples: "Clear donor thank-you letters ready for your review," "A grant application draft tailored to your mission"

For tags:
- Use terms nonprofits actually search for
- Focus on outcomes and use cases, not technical features
- Include audience types (donors, board, volunteers, staff)
- Include content types (letters, reports, applications, communications)
- Avoid technical jargon

CRITICAL: Respond with ONLY valid JSON. No additional text.`;

  const userPrompt = `Analyze this nonprofit prompt template and create user-friendly metadata:

Title: "${promptTitle}"
Category: ${category}
Subcategory: ${subcategory}
Current Tags: ${tags.join(', ')}

Prompt Content Preview:
${promptContent.substring(0, 800)}...

Enhance this prompt's metadata to make it discoverable and appealing to nonprofit users. Return JSON:
{
  "enhancedTitle": "User-friendly title under 8 words",
  "enhancedDescription": "1-2 sentence description focusing on outcomes",
  "outputDescription": "Clear description of what the user will receive",
  "enhancedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedComplexity": "low|medium|high",
  "confidence": 0.95
}`;

  try {
    console.log(`🤖 Enhancing metadata for: ${promptTitle.substring(0, 50)}...`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY || process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2000,
        reasoning_effort: 'low', // Light reasoning for better quality
        verbosity: 'medium',
        response_format: { type: "json_object" }
      })
    });

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
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 2000,
          temperature: 0.3,
          response_format: { type: "json_object" }
        })
      });
      
      if (!fallbackResponse.ok) {
        throw new Error(`OpenAI API error: ${fallbackResponse.status}`);
      }
      
      const fallbackData = await fallbackResponse.json();
      const result = JSON.parse(fallbackData.choices[0].message.content);
      
      return {
        enhancedTitle: result.enhancedTitle || promptTitle,
        enhancedDescription: result.enhancedDescription || '',
        outputDescription: result.outputDescription || '',
        enhancedTags: result.enhancedTags || tags,
        suggestedComplexity: result.suggestedComplexity || 'medium',
        confidence: result.confidence || 0.8,
        modelUsed: 'gpt-4o-mini'
      };
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      enhancedTitle: result.enhancedTitle || promptTitle,
      enhancedDescription: result.enhancedDescription || '',
      outputDescription: result.outputDescription || '',
      enhancedTags: result.enhancedTags || tags,
      suggestedComplexity: result.suggestedComplexity || 'medium',
      confidence: result.confidence || 0.8,
      modelUsed: 'gpt-5-mini'
    };

  } catch (error) {
    console.error('❌ Prompt metadata enhancement failed:', error.message);
    
    // Fallback with basic enhancement
    return {
      enhancedTitle: promptTitle,
      enhancedDescription: `Guidance for ${category.toLowerCase()} ${subcategory.toLowerCase()}`,
      outputDescription: 'Customized content tailored to your organization and situation',
      enhancedTags: tags,
      suggestedComplexity: 'medium',
      confidence: 0.3,
      error: error.message,
      modelUsed: 'fallback'
    };
  }
}

// Process prompts in batches with concurrency control
async function processBatchConcurrent(prompts, batchSize, concurrency) {
  const results = [];
  let processedCount = 0;
  let enhancedCount = 0;
  let errorCount = 0;
  
  // Process in batches
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(prompts.length/batchSize)} (${batch.length} prompts)...`);
    
    // Process batch with concurrency limit
    const batchPromises = batch.map(async (prompt, index) => {
      try {
        console.log(`🔄 [${i + index + 1}/${prompts.length}] Processing: ${prompt.title.substring(0, 50)}...`);
        
        // Enhance metadata with AI
        const enhancement = await enhancePromptMetadata(
          prompt.title,
          prompt.content,
          prompt.category,
          prompt.subcategory,
          prompt.tags || []
        );
        
        console.log(`   ✨ [${i + index + 1}] Enhanced with ${enhancement.modelUsed} (confidence: ${enhancement.confidence})`);
        
        return {
          success: true,
          promptId: prompt._id,
          originalTitle: prompt.title,
          originalDescription: prompt.description,
          originalTags: prompt.tags,
          enhancedTitle: enhancement.enhancedTitle,
          enhancedDescription: enhancement.enhancedDescription,
          outputDescription: enhancement.outputDescription,
          enhancedTags: enhancement.enhancedTags,
          suggestedComplexity: enhancement.suggestedComplexity,
          confidence: enhancement.confidence,
          modelUsed: enhancement.modelUsed,
          error: enhancement.error
        };
        
      } catch (error) {
        console.error(`   ❌ [${i + index + 1}] Error processing ${prompt.title}:`, error.message);
        return {
          success: false,
          promptId: prompt._id,
          originalTitle: prompt.title,
          error: error.message
        };
      }
    });
    
    // Process with concurrency control
    const concurrentBatches = [];
    for (let j = 0; j < batchPromises.length; j += concurrency) {
      const concurrentBatch = batchPromises.slice(j, j + concurrency);
      concurrentBatches.push(Promise.allSettled(concurrentBatch));
    }
    
    // Wait for all concurrent batches
    const allBatchResults = await Promise.all(concurrentBatches);
    const batchResults = allBatchResults.flat();
    
    // Collect results
    batchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value.success) {
        results.push(result.value);
        enhancedCount++;
      } else {
        errorCount++;
      }
      processedCount++;
    });
    
    console.log(`   ✅ Batch complete: ${enhancedCount} enhanced, ${errorCount} errors`);
    
    // Small delay between batches to be nice to the API
    if (i + batchSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { results, processedCount, enhancedCount, errorCount };
}

// Main function to enhance prompt metadata for all prompts
async function enhanceAllPromptMetadata() {
  console.log('🚀 Starting Prompt Metadata Enhancement with Concurrency...\n');
  
  // Configuration
  const BATCH_SIZE = 20; // Process in batches of 20
  const CONCURRENCY = 5; // Max 5 concurrent API calls
  
  // Check environment
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_KEY && !process.env.OPENAI_API_KEY) {
    console.error('❌ OpenAI API key not found. Set OPENAI_KEY or OPENAI_API_KEY');
    process.exit(1);
  }

  console.log(`🔗 Using Convex URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}`);
  console.log(`⚙️  Configuration: ${BATCH_SIZE} batch size, ${CONCURRENCY} concurrent requests\n`);
  
  try {
    console.log('📋 Fetching all prompts from database...');
    const prompts = await convex.query("prompts:getAllPromptsWithContent");
    console.log(`   Found ${prompts.length} prompts to enhance\n`);
    
    if (prompts.length === 0) {
      console.error('❌ No prompts found in database');
      return;
    }
    
    const startTime = Date.now();
    
    // Process with concurrency
    const { results, processedCount, enhancedCount, errorCount } = await processBatchConcurrent(
      prompts, 
      BATCH_SIZE, 
      CONCURRENCY
    );
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎉 PROMPT METADATA ENHANCEMENT COMPLETE!');
    console.log('\n📊 Final Results:');
    console.log(`   📋 Prompts processed: ${processedCount}`);
    console.log(`   ✅ Prompts enhanced: ${enhancedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⏱️  Total time: ${duration}s (${Math.round(processedCount/duration * 60)} prompts/min)`);
    console.log(`   ⭐ Average confidence: ${Math.round(results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length * 100)}%`);
    
    // Save results for review
    const fs = require('fs');
    const path = require('path');
    
    const testResultsDir = 'context/test_results';
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    const resultsData = {
      enhancementDate: new Date().toISOString(),
      promptsProcessed: processedCount,
      promptsEnhanced: enhancedCount,
      errors: errorCount,
      averageConfidence: results.reduce((sum, r) => sum + (r.confidence || 0), 0) / results.length,
      results: results
    };
    
    const resultsPath = path.join(testResultsDir, 'prompt_metadata_enhancement.json');
    fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2));
    
    console.log(`\n📄 Results saved to: ${resultsPath}`);
    
    // Show some examples
    console.log('\n🔍 Sample Enhanced Prompts:');
    results.slice(0, 3).forEach((result, index) => {
      console.log(`\n   ${index + 1}. ${result.originalTitle}`);
      console.log(`      ➜ ${result.enhancedTitle}`);
      console.log(`      📝 ${result.enhancedDescription}`);
      console.log(`      🏷️  Tags: ${result.enhancedTags.join(', ')}`);
      console.log(`      🎯 Confidence: ${result.confidence}`);
    });
    
    console.log('\n✅ READY FOR NEXT STEP');
    console.log('   Prompt metadata has been enhanced with user-friendly language');
    console.log('   Next: Run variable extraction script to process prompt variables');
    console.log('   Command: node scripts/enhanced_variable_extraction.js');
    
    return results;
    
  } catch (error) {
    console.error('\n❌ Enhancement failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Ensure Convex is running and accessible');
    console.error('   2. Check that OpenAI API key is valid');
    console.error('   3. Verify you have prompts in the database');
    console.error('   4. Check network connectivity');
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  enhanceAllPromptMetadata().catch(error => {
    console.error('❌ Enhancement script failed:', error);
    process.exit(1);
  });
}

module.exports = { enhanceAllPromptMetadata, enhancePromptMetadata };