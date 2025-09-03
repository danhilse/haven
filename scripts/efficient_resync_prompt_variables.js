#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Extract variables from content, excluding output sections
function extractVariablesFromContent(content) {
  const variables = new Set();
  
  // Split content into sections to identify output areas
  const lines = content.split('\n');
  let inOutputSection = false;
  const inputContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for output section markers (case insensitive)
    if (line.match(/^<OUTPUT>|^\*\*OUTPUT:\*\*|^## OUTPUT|^# OUTPUT/i)) {
      inOutputSection = true;
      continue;
    }
    
    // Check for end of output section
    if (inOutputSection && line.match(/^<\/OUTPUT>|^<CONSTRAINTS>|^<CONTEXT>|^<FEW_SHOT_EXAMPLES>|^<RECAP>/i)) {
      inOutputSection = false;
      continue;
    }
    
    // Only include lines that are not in output sections
    if (!inOutputSection) {
      inputContent.push(lines[i]);
    }
  }
  
  // Now extract variables from the input content only
  const inputText = inputContent.join('\n');
  const matches = inputText.match(/\[([A-Z_][A-Z0-9_]*)\]/g);
  
  if (matches) {
    matches.forEach(match => {
      const variable = match.slice(1, -1); // Remove brackets
      
      // Handle numbered variables by converting to base pattern
      const numberedMatch = variable.match(/^(.+)_(\d+)$/);
      if (numberedMatch) {
        variables.add(`${numberedMatch[1]}_#`);
      } else {
        variables.add(variable);
      }
    });
  }
  
  return Array.from(variables);
}

// EFFICIENT VERSION: Process all prompts at once instead of individual queries
async function efficientResyncPromptVariables() {
  console.log('🚀 Starting EFFICIENT Prompt Variables Resync\n');
  
  // Check environment
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log(`🔗 Using Convex URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}\n`);
  
  console.log('🔍 Fetching ALL prompts with content in single query...');
  
  // Get all prompts with content in ONE query instead of 365 separate queries!
  const allPrompts = await convex.query("prompts:getAllPromptsWithContent");
  
  console.log(`📋 Found ${allPrompts.length} prompts to process\n`);
  
  let updatedCount = 0;
  let noChangeCount = 0;
  let errorCount = 0;
  
  // Process all prompts locally without additional database calls
  console.log('🚀 Processing variables locally (no additional DB calls)...');
  
  const updateBatch = [];
  
  for (const prompt of allPrompts) {
    try {
      // Extract variables from the content (excluding output sections)
      const variables = extractVariablesFromContent(prompt.content);
      
      // Only update if variables have changed
      const currentVariables = prompt.variables || [];
      const variablesChanged = 
        variables.length !== currentVariables.length || 
        !variables.every(v => currentVariables.includes(v));
      
      if (variablesChanged) {
        updateBatch.push({
          promptId: prompt._id,
          variables: variables,
          analysisMetadata: {
            variableCount: variables.length,
            complexityScore: variables.length * 0.15,
            additionalContextNeeded: variables.length > 5,
            lastAnalyzed: Date.now()
          }
        });
        updatedCount++;
        
        if (updatedCount % 50 === 0) {
          console.log(`   ✅ Processed: ${updatedCount} prompts`);
        }
      } else {
        noChangeCount++;
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing ${prompt.title}:`, error.message);
      errorCount++;
    }
  }
  
  // Now do batch updates to minimize database calls
  if (updateBatch.length > 0) {
    console.log(`\n🔄 Batch updating ${updateBatch.length} prompts...`);
    
    // Process in chunks of 10 to avoid overwhelming the database
    const chunkSize = 10;
    for (let i = 0; i < updateBatch.length; i += chunkSize) {
      const chunk = updateBatch.slice(i, i + chunkSize);
      
      // Update each prompt in this chunk
      for (const update of chunk) {
        try {
          await convex.mutation("variables:updatePromptWithVariables", update);
        } catch (error) {
          console.error(`❌ Failed batch update:`, error.message);
          errorCount++;
        }
      }
      
      console.log(`   ✅ Updated chunk ${Math.floor(i/chunkSize) + 1}/${Math.ceil(updateBatch.length/chunkSize)}`);
      
      // Small delay between chunks
      if (i + chunkSize < updateBatch.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  console.log('\n🎉 EFFICIENT RESYNC COMPLETE!\n');
  console.log(`📊 Final Results:`);
  console.log(`   📋 Prompts processed: ${allPrompts.length}`);
  console.log(`   ✅ Prompts updated: ${updatedCount}`);
  console.log(`   ⚡ No changes needed: ${noChangeCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  const totalBandwidthSaved = (allPrompts.length - 1) * 100; // Rough estimate in KB
  console.log(`   💰 Bandwidth saved: ~${totalBandwidthSaved}KB (1 query vs ${allPrompts.length} queries)`);
  
  return { 
    processedCount: allPrompts.length,
    updatedCount, 
    noChangeCount, 
    errorCount 
  };
}

// Main execution
async function main() {
  await efficientResyncPromptVariables();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { 
  efficientResyncPromptVariables,
  extractVariablesFromContent 
};