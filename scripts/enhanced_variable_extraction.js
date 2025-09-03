#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");
const fs = require('fs');
const path = require('path');

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Global variables to exclude from prompt-specific extraction
const GLOBAL_VARIABLES = [
  'ORGANIZATION_NAME',
  'TARGET_AUDIENCE', 
  'PROGRAM_NAME',
  'MISSION_STATEMENT',
  // Add more as identified
];

// Enhanced variable extraction that identifies different types
function extractVariablesFromContent(content, promptTitle = '') {
  const promptSpecificVariables = new Set();
  const globalVariables = new Set();
  const impliedDocuments = new Set();
  
  // 1. Extract bracketed variables
  const matches = content.match(/\[([A-Z_][A-Z0-9_]*)\]/g);
  
  if (matches) {
    matches.forEach(match => {
      const variable = match.slice(1, -1); // Remove brackets
      
      // Handle numbered variables by converting to base pattern
      const numberedMatch = variable.match(/^(.+)_(\d+)$/);
      const baseVariable = numberedMatch ? `${numberedMatch[1]}_#` : variable;
      
      // Categorize as global or prompt-specific
      if (GLOBAL_VARIABLES.includes(variable) || GLOBAL_VARIABLES.includes(baseVariable)) {
        globalVariables.add(baseVariable);
      } else {
        promptSpecificVariables.add(baseVariable);
      }
    });
  }
  
  // 2. Detect implied document variables from context clues
  const documentKeywords = [
    'attach', 'upload', 'document', 'file', 'pdf', 'report', 
    'proposal', 'grant', 'budget', 'financial statement', 'annual report',
    'case study', 'testimonial', 'photo', 'image', 'brochure',
    'policy', 'procedure', 'handbook', 'manual', 'guide'
  ];
  
  const contentLower = content.toLowerCase();
  documentKeywords.forEach(keyword => {
    if (contentLower.includes(keyword)) {
      // Extract context around the keyword to create meaningful variable name
      const contextMatch = contentLower.match(new RegExp(`([\\w\\s]{0,20})${keyword}([\\w\\s]{0,20})`, 'i'));
      if (contextMatch) {
        const context = contextMatch[0].trim();
        // Create a document variable name based on context
        const docVarName = `DOCUMENT_${keyword.toUpperCase().replace(/\\s+/g, '_')}`;
        impliedDocuments.add(docVarName);
      }
    }
  });
  
  // 3. Detect context-specific variables that might be missing
  const contextPatterns = [
    { pattern: /event|workshop|training/i, variable: 'EVENT_NAME' },
    { pattern: /deadline|due date|timeline/i, variable: 'DEADLINE_DATE' },
    { pattern: /contact|reach out|email/i, variable: 'CONTACT_PERSON' },
    { pattern: /location|address|venue/i, variable: 'LOCATION' },
    { pattern: /budget|cost|price|fee/i, variable: 'BUDGET_AMOUNT' },
    { pattern: /volunteer|staff|team member/i, variable: 'VOLUNTEER_NAME' },
  ];
  
  contextPatterns.forEach(({ pattern, variable }) => {
    if (pattern.test(content) && !promptSpecificVariables.has(variable) && !globalVariables.has(variable)) {
      promptSpecificVariables.add(variable);
    }
  });
  
  return {
    promptSpecific: Array.from(promptSpecificVariables),
    global: Array.from(globalVariables),
    documents: Array.from(impliedDocuments)
  };
}

// Enhanced AI prompt for context-driven variable analysis
async function enhanceVariableMetadata(variables, promptContext, promptTitle) {
  const systemPrompt = `You are an expert in nonprofit communication templates and user experience design. Your task is to analyze template variables and generate user-friendly questions and metadata.

For each variable, create:
1. A conversational question that guides the user (not just a label)
2. Appropriate input type based on the expected content
3. Realistic examples specific to nonprofits
4. Whether the field should be required
5. Smart grouping for related variables that should be shown together

Focus on making the prompt "invisible" to users - they should understand exactly what to provide without seeing the technical variable names.

## Writing Style Guidelines:
- Keep questions short, uncluttered, and direct
- Use calm, supportive tone - never breathless or "disruptive"
- Use 2nd person ("you," "your organization")
- Focus on tangible outcomes and practical results
- Avoid technical jargon - speak in plain nonprofit language
- Make users the hero, the tool is just the ally

For output descriptions:
- Focus on what users will receive, not how it works
- Use concrete language: "a grant draft," "donor letters that feel personal"
- Emphasize clarity, speed, and relief from overwhelm
- Keep descriptions outcome-focused, not tool-focused
- Example good descriptions: "Clear donor thank-you letters that feel personal," "A grant application draft ready for your review," "Board communication that builds confidence"

Input types available:
- short_text: Single line text (names, titles, dates)
- long_text: Multi-line text (descriptions, messages)
- document: File upload requirement
- select: Dropdown with predefined options
- multi: Multiple selection
- email: Email address
- phone: Phone number
- date: Date picker
- number: Numeric input
- currency: Money amount

Variable grouping guidelines:
- Only group variables that are clearly related and make sense to ask together
- Use conservative grouping - when in doubt, keep variables separate
- Common groupings: "contact_info" (name, email, phone), "program_details" (location, date, time), "financial" (budget, costs, ROI), "documents" (all document uploads)
- Keep grouping names short and descriptive
- Variables without clear relationships should have no grouping (null/undefined)

CRITICAL: Respond with ONLY valid JSON. No additional text.`;

  const userPrompt = `Analyze these nonprofit template variables for the prompt "${promptTitle}":

Context: ${promptContext}

Variables to enhance:
${JSON.stringify(variables, null, 2)}

Create user-friendly form questions for each variable. Return JSON:
{
  "enhancedVariables": [
    {
      "name": "VARIABLE_NAME",
      "questionPrompt": "What is your organization's name?",
      "description": "Brief technical description", 
      "inputType": "short_text|long_text|document|select|multi|email|phone|date|number|currency",
      "examples": ["Example 1", "Example 2", "Example 3"],
      "isRequired": true,
      "grouping": "contact_info", // optional - only for related variables
      "selectOptions": ["Option1", "Option2"] // only for select/multi types
    }
  ],
  "outputDescription": "Clear description of what the user will receive from this prompt",
  "additionalDocuments": ["Document types that should be uploaded"],
  "confidence": 0.95
}`;

  try {
    console.log(`🤖 Enhancing ${variables.length} variables with AI...`);
    
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
        max_completion_tokens: 4000, // Increased to account for reasoning tokens
        reasoning_effort: 'low', // Light reasoning for better quality while maintaining speed
        verbosity: 'medium', // Balanced detail level
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
          max_completion_tokens: 3000,
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
        enhancedVariables: result.enhancedVariables || [],
        outputDescription: result.outputDescription || '',
        additionalDocuments: result.additionalDocuments || [],
        confidence: result.confidence || 0.8,
        modelUsed: 'gpt-4o-mini'
      };
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      enhancedVariables: result.enhancedVariables || [],
      outputDescription: result.outputDescription || '',
      additionalDocuments: result.additionalDocuments || [],
      confidence: result.confidence || 0.8,
      modelUsed: 'gpt-5-mini'
    };

  } catch (error) {
    console.error('❌ AI enhancement failed:', error.message);
    
    // Fallback with basic enhancement
    const fallbackVariables = variables.map((variable, index) => ({
      name: variable,
      questionPrompt: `What is the ${variable.replace(/_/g, ' ').toLowerCase()}?`,
      description: `${variable.replace(/_/g, ' ')} for the template`,
      inputType: variable.includes('DOCUMENT') ? 'document' : 'short_text',
      examples: ['Sample value 1', 'Sample value 2', 'Sample value 3'],
      isRequired: true,
      grouping: variable.includes('DOCUMENT') ? 'documents' : null,
      selectOptions: undefined
    }));

    return {
      enhancedVariables: fallbackVariables,
      outputDescription: 'Generated content based on your organization and template variables',
      additionalDocuments: [],
      confidence: 0.3,
      error: error.message
    };
  }
}

// Process prompts in batches with concurrency control
async function processBatchConcurrent(prompts, batchSize, concurrency, globalVariableUsage) {
  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  // Process in batches
  for (let i = 0; i < prompts.length; i += batchSize) {
    const batch = prompts.slice(i, i + batchSize);
    console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(prompts.length/batchSize)} (${batch.length} prompts)...`);
    
    // Process batch with concurrency limit
    const batchPromises = batch.map(async (prompt, index) => {
      try {
        console.log(`🔄 [${i + index + 1}/${prompts.length}] Processing: ${prompt.title.substring(0, 50)}...`);
        
        // Extract variables with new enhanced logic
        const extractedVars = extractVariablesFromContent(prompt.content, prompt.title);
        
        console.log(`   Global variables: ${extractedVars.global.join(', ') || 'none'}`);
        console.log(`   Prompt-specific: ${extractedVars.promptSpecific.join(', ') || 'none'}`);
        console.log(`   Documents: ${extractedVars.documents.join(', ') || 'none'}`);
        
        // Track global variable usage
        extractedVars.global.forEach(globalVar => {
          globalVariableUsage.set(globalVar, (globalVariableUsage.get(globalVar) || 0) + 1);
        });
        
        // Only enhance prompt-specific variables with AI
        const allPromptVars = [...extractedVars.promptSpecific, ...extractedVars.documents];
        
        if (allPromptVars.length > 0) {
          // Get AI enhancement for prompt-specific variables
          const enhancement = await enhanceVariableMetadata(
            allPromptVars, 
            prompt.content.substring(0, 500), // First 500 chars for context
            prompt.title
          );
          
          console.log(`   ✨ [${i + index + 1}] AI enhanced ${enhancement.enhancedVariables.length} variables (confidence: ${enhancement.confidence})`);
          
          // Update prompt with new metadata
          await convex.mutation("prompts:updatePromptMetadata", {
            promptId: prompt._id,
            variables: extractedVars.promptSpecific,
            globalVariables: extractedVars.global,
            outputDescription: enhancement.outputDescription,
            requiredDocuments: extractedVars.documents,
            analysisMetadata: {
              variableCount: allPromptVars.length,
              globalVariableCount: extractedVars.global.length,
              complexityScore: (allPromptVars.length * 0.1) + (extractedVars.global.length * 0.05),
              additionalContextNeeded: extractedVars.documents.length > 0,
              lastAnalyzed: Date.now()
            }
          });
          
          // Create prompt-specific variable records
          for (let j = 0; j < enhancement.enhancedVariables.length; j++) {
            const variable = enhancement.enhancedVariables[j];
            
            await convex.mutation("variables:createPromptVariable", {
              name: variable.name,
              promptId: prompt._id,
              description: variable.description,
              questionPrompt: variable.questionPrompt,
              inputType: variable.inputType,
              examples: variable.examples,
              category: variable.name.split('_')[0].toLowerCase(),
              isRequired: variable.isRequired,
              sortOrder: j + 1,
              grouping: variable.grouping || undefined, // Convert null to undefined for Convex
              selectOptions: variable.selectOptions || undefined, // Convert null to undefined for Convex
              validationRules: []
            });
          }
          
          return { success: true, updated: true };
        } else {
          console.log(`   📝 [${i + index + 1}] No prompt-specific variables found`);
          
          // Still update prompt with global variables if any
          if (extractedVars.global.length > 0) {
            await convex.mutation("prompts:updatePromptMetadata", {
              promptId: prompt._id,
              variables: [],
              globalVariables: extractedVars.global,
              outputDescription: 'Generated content personalized for your organization',
              analysisMetadata: {
                variableCount: 0,
                globalVariableCount: extractedVars.global.length,
                complexityScore: extractedVars.global.length * 0.05,
                additionalContextNeeded: false,
                lastAnalyzed: Date.now()
              }
            });
            return { success: true, updated: true };
          }
          return { success: true, updated: false };
        }
        
      } catch (error) {
        console.error(`   ❌ [${i + index + 1}] Error processing ${prompt.title}:`, error.message);
        return { success: false, updated: false, error: error.message };
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
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          if (result.value.updated) updatedCount++;
        } else {
          errorCount++;
        }
      } else {
        errorCount++;
      }
      processedCount++;
    });
    
    console.log(`   ✅ Batch complete: ${updatedCount} updated, ${errorCount} errors`);
    
    // Small delay between batches to be nice to the API
    if (i + batchSize < prompts.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return { processedCount, updatedCount, errorCount };
}

// Main function to process all prompts with enhanced extraction
async function processPromptsWithEnhancedExtraction() {
  console.log('🚀 Starting Enhanced Variable Extraction with Concurrency...\n');
  
  // Configuration
  const BATCH_SIZE = 15; // Process in batches of 15 (smaller than metadata since variables are more complex)
  const CONCURRENCY = 3; // Lower concurrency for variable processing (more complex operations)
  
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

  console.log('🔍 Fetching all prompts from database...');
  const prompts = await convex.query("prompts:getAllPromptsWithContent");
  console.log(`📋 Found ${prompts.length} prompts to process\n`);
  
  const globalVariableUsage = new Map();
  const startTime = Date.now();
  
  // Process with concurrency
  const { processedCount, updatedCount, errorCount } = await processBatchConcurrent(
    prompts, 
    BATCH_SIZE, 
    CONCURRENCY,
    globalVariableUsage
  );
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  console.log('\n🎉 ENHANCED VARIABLE EXTRACTION COMPLETE!');
  console.log('\n📊 Final Results:');
  console.log(`   📋 Prompts processed: ${processedCount}`);
  console.log(`   ✅ Prompts updated: ${updatedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   ⏱️  Total time: ${duration}s (${Math.round(processedCount/duration * 60)} prompts/min)`);
  
  console.log('\n🌍 Global Variable Usage:');
  globalVariableUsage.forEach((count, variable) => {
    console.log(`   ${variable}: ${count} prompts`);
  });
  
  return { processedCount, updatedCount, errorCount, globalVariableUsage };
}

// Run if called directly
if (require.main === module) {
  processPromptsWithEnhancedExtraction().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { processPromptsWithEnhancedExtraction, extractVariablesFromContent, enhanceVariableMetadata };