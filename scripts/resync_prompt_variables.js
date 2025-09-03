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

// Update a single prompt with correct variables
async function updatePromptVariables(prompt) {
  try {
    console.log(`🔄 Processing: ${prompt.title} (${prompt.complexity})`);
    
    // Get the full prompt content
    const fullPrompt = await convex.query("prompts:getPromptById", {
      promptId: prompt._id
    });
    
    if (!fullPrompt) {
      console.log(`   ⚠️  Full content not found, skipping`);
      return { success: false, reason: 'content_not_found' };
    }
    
    // Extract variables from the content (excluding output sections)
    const variables = extractVariablesFromContent(fullPrompt.content);
    
    console.log(`   Variables found: ${variables.length > 0 ? variables.join(', ') : 'None'}`);
    
    // Only update if variables have changed
    const currentVariables = fullPrompt.variables || [];
    const variablesChanged = 
      variables.length !== currentVariables.length || 
      !variables.every(v => currentVariables.includes(v));
    
    if (!variablesChanged) {
      console.log(`   ✅ Variables already up to date`);
      return { success: true, reason: 'no_change' };
    }
    
    // Update the prompt with new variables
    await convex.mutation("variables:updatePromptWithVariables", {
      promptId: prompt._id,
      variables: variables,
      analysisMetadata: {
        variableCount: variables.length,
        complexityScore: variables.length * 0.15,
        additionalContextNeeded: variables.length > 5,
        lastAnalyzed: Date.now()
      }
    });
    
    console.log(`   ✅ Updated with ${variables.length} variables`);
    return { success: true, reason: 'updated', variableCount: variables.length };
    
  } catch (error) {
    console.error(`   ❌ Error processing ${prompt.title}:`, error.message);
    return { success: false, reason: 'error', error: error.message };
  }
}

// Main function to resync all prompt variables
async function resyncPromptVariables() {
  console.log('🚀 Starting Prompt Variables Resync\n');
  
  // Check environment
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log(`🔗 Using Convex URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}\n`);
  
  console.log('🔍 Fetching all prompts from database...');
  const prompts = await convex.query("prompts:getAllPromptsForMigration");
  console.log(`📋 Found ${prompts.length} prompts to process\n`);
  
  let processedCount = 0;
  let updatedCount = 0;
  let noChangeCount = 0;
  let errorCount = 0;
  
  // Process prompts in batches to avoid overwhelming the system
  const batchSize = 10;
  const batches = [];
  for (let i = 0; i < prompts.length; i += batchSize) {
    batches.push(prompts.slice(i, i + batchSize));
  }
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} prompts)`);
    
    for (const prompt of batch) {
      const result = await updatePromptVariables(prompt);
      
      processedCount++;
      
      if (result.success) {
        if (result.reason === 'updated') {
          updatedCount++;
        } else if (result.reason === 'no_change') {
          noChangeCount++;
        }
      } else {
        errorCount++;
      }
      
      // Small delay to be nice to the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`   Batch complete. Progress: ${processedCount}/${prompts.length}\n`);
    
    // Longer delay between batches
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log('🎉 PROMPT VARIABLES RESYNC COMPLETE!\n');
  console.log(`📊 Final Results:`);
  console.log(`   📋 Prompts processed: ${processedCount}`);
  console.log(`   ✅ Prompts updated: ${updatedCount}`);
  console.log(`   ⚡ No changes needed: ${noChangeCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🚀 All prompt variables successfully resynced!');
    console.log('💡 Variables now exclude output section placeholders');
  } else {
    console.log(`\n⚠️  ${errorCount} prompts had errors. Please review the logs above.`);
  }
  
  return { 
    processedCount, 
    updatedCount, 
    noChangeCount, 
    errorCount 
  };
}

// Test the variable extraction on a sample
async function testVariableExtraction() {
  console.log('🧪 Testing variable extraction...\n');
  
  // Get a sample prompt
  const prompts = await convex.query("prompts:getAllPromptsForMigration");
  if (prompts.length === 0) {
    console.log('❌ No prompts found for testing');
    return;
  }
  
  const samplePrompt = prompts.find(p => p.title === 'Reviewing expense reports and receipts' && p.complexity === 'medium');
  if (!samplePrompt) {
    console.log('❌ Sample prompt not found, using first available');
    return;
  }
  
  console.log(`📄 Testing on: ${samplePrompt.title} (${samplePrompt.complexity})`);
  
  const fullPrompt = await convex.query("prompts:getPromptById", {
    promptId: samplePrompt._id
  });
  
  if (!fullPrompt) {
    console.log('❌ Could not fetch full prompt content');
    return;
  }
  
  console.log('\n📝 Content preview:');
  console.log(fullPrompt.content.substring(0, 200) + '...\n');
  
  const variables = extractVariablesFromContent(fullPrompt.content);
  console.log(`🔍 Extracted variables: ${variables.join(', ')}`);
  console.log(`📊 Variable count: ${variables.length}\n`);
  
  // Show what would be filtered out by checking for output section
  const allMatches = fullPrompt.content.match(/\[([A-Z_][A-Z0-9_]*)\]/g) || [];
  const allVariables = [...new Set(allMatches.map(match => match.slice(1, -1)))];
  const filteredOut = allVariables.filter(v => !variables.includes(v));
  
  if (filteredOut.length > 0) {
    console.log(`🚫 Variables filtered out (likely from output sections): ${filteredOut.join(', ')}`);
  } else {
    console.log('✅ No variables were filtered out');
  }
  
  console.log('\n✅ Variable extraction test complete!\n');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testVariableExtraction();
  } else {
    await resyncPromptVariables();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { 
  resyncPromptVariables, 
  extractVariablesFromContent,
  testVariableExtraction 
};