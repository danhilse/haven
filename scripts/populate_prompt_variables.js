#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");
const fs = require('fs');
const path = require('path');

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Extract variables from prompt content
function extractVariablesFromContent(content) {
  const variables = new Set();
  const matches = content.match(/\[([A-Z_][A-Z0-9_]*)\]/g);
  
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

async function populatePromptVariables() {
  console.log('🚀 Starting Prompt Variables Population...\n');
  
  console.log('🔍 Fetching all prompts from database...');
  const prompts = await convex.query("prompts:getAllPromptsForMigration");
  console.log(`📋 Found ${prompts.length} prompts to process\n`);
  
  let processedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const prompt of prompts) {
    try {
      // Get the full prompt content
      const fullPrompt = await convex.query("prompts:getPromptById", {
        promptId: prompt._id
      });
      
      if (!fullPrompt) {
        console.log(`   ⚠️  Skipping ${prompt.title} - full content not found`);
        continue;
      }
      
      // Extract variables from the content
      const variables = extractVariablesFromContent(fullPrompt.content);
      
      if (variables.length > 0) {
        console.log(`🔄 ${prompt.title}`);
        console.log(`   Variables found: ${variables.join(', ')}`);
        
        // Update the prompt with variables
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
        
        updatedCount++;
        console.log(`   ✅ Updated with ${variables.length} variables\n`);
      } else {
        console.log(`   📝 ${prompt.title} - No variables found`);
      }
      
      processedCount++;
      
      if (processedCount % 50 === 0) {
        console.log(`📊 Progress: ${processedCount}/${prompts.length} prompts processed`);
        console.log(`   ✅ Updated: ${updatedCount}, ❌ Errors: ${errorCount}\n`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error processing ${prompt.title}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n🎉 PROMPT VARIABLES POPULATION COMPLETE!');
  console.log('\n📊 Final Results:');
  console.log(`   📋 Prompts processed: ${processedCount}`);
  console.log(`   ✅ Prompts updated: ${updatedCount}`);
  console.log(`   📝 Prompts without variables: ${processedCount - updatedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (updatedCount > 0) {
    console.log('\n🚀 Next: Update variables with prompt IDs...');
    await updateVariablesWithPromptIds();
  }
  
  return { processedCount, updatedCount, errorCount };
}

// Update variables table with prompt IDs
async function updateVariablesWithPromptIds() {
  console.log('\n🔗 Linking Variables to Prompts...');
  
  // Get all prompts that now have variables
  const prompts = await convex.query("prompts:getAllPromptsForMigration");
  const promptsWithVariables = [];
  
  // Check each prompt for variables by querying the full prompt
  for (const prompt of prompts) {
    try {
      const fullPrompt = await convex.query("prompts:getPromptById", {
        promptId: prompt._id
      });
      
      if (fullPrompt && fullPrompt.variables && fullPrompt.variables.length > 0) {
        promptsWithVariables.push({
          _id: fullPrompt._id,
          variables: fullPrompt.variables
        });
      }
    } catch (error) {
      console.error(`Error checking prompt ${prompt.title}:`, error.message);
    }
  }
  
  console.log(`📊 Found ${promptsWithVariables.length} prompts with variables`);
  
  // Build a map of variable name to prompt IDs
  const variableToPrompts = new Map();
  
  promptsWithVariables.forEach(prompt => {
    prompt.variables.forEach(variableName => {
      if (!variableToPrompts.has(variableName)) {
        variableToPrompts.set(variableName, []);
      }
      variableToPrompts.get(variableName).push(prompt._id);
    });
  });
  
  console.log(`🔗 Updating ${variableToPrompts.size} variables with prompt references...`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  // Update each variable with its associated prompt IDs
  for (const [variableName, promptIds] of variableToPrompts.entries()) {
    try {
      // Get the existing variable (only check first 100 for performance)
      const existingVariable = await convex.query("variables:getVariableByName", {
        name: variableName
      });
      
      if (existingVariable) {
        // Update with prompt IDs
        await convex.mutation("variables:createOrUpdateVariable", {
          name: existingVariable.name,
          basePattern: existingVariable.basePattern,
          isNumbered: existingVariable.isNumbered,
          maxNumber: existingVariable.maxNumber,
          description: existingVariable.description,
          examples: existingVariable.examples,
          category: existingVariable.category,
          promptIds: promptIds
        });
        
        updatedCount++;
        
        if (updatedCount % 50 === 0) {
          console.log(`   ✅ Progress: ${updatedCount} variables updated`);
        }
      } else {
        console.log(`   ⚠️  Variable ${variableName} not found in variables table`);
      }
      
    } catch (error) {
      console.error(`   ❌ Failed to update variable ${variableName}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n✅ Variable-prompt linking complete!');
  console.log(`📊 Results:`);
  console.log(`   ✅ Variables updated: ${updatedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  return { updatedCount, errorCount };
}

// Main execution
async function main() {
  // Check environment
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log(`🔗 Using Convex URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}\n`);
  
  try {
    const results = await populatePromptVariables();
    
    console.log('\n🎉 ALL OPERATIONS COMPLETE!');
    console.log('\n🚀 Your dynamic forms should now work with real variable data!');
    console.log('💡 Test by visiting any prompt page in your application.');
    
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { populatePromptVariables, extractVariablesFromContent };