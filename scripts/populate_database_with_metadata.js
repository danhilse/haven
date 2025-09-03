#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");
const fs = require('fs');
const path = require('path');

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Helper function to chunk arrays
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

// Populate variables table with enhanced metadata
async function populateVariables() {
  console.log('🔄 Loading enhanced variable metadata...');
  
  const resultsPath = 'context/production_results/full_metadata_enhancement.json';
  if (!fs.existsSync(resultsPath)) {
    console.error(`❌ Enhanced metadata file not found: ${resultsPath}`);
    console.log('💡 Run the enhancement script first: node scripts/full_metadata_enhancement.js');
    process.exit(1);
  }
  
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const enhancedVariables = results.enhancedVariables || [];
  const extractedVariables = results.extractedVariables || [];
  
  if (enhancedVariables.length === 0) {
    console.error('❌ No enhanced variables found in results file');
    process.exit(1);
  }
  
  console.log(`📊 Found ${enhancedVariables.length} enhanced variables to process`);
  
  // Create a map of extracted variables for additional data
  const extractedMap = new Map(extractedVariables.map(v => [v.name, v]));
  
  // Prepare variables for database insertion
  const variablesForDb = enhancedVariables.map(enhanced => {
    const extracted = extractedMap.get(enhanced.name);
    
    return {
      name: enhanced.name,
      basePattern: extracted?.basePattern || enhanced.name,
      isNumbered: extracted?.isNumbered || false,
      maxNumber: extracted?.maxNumber || undefined,
      description: enhanced.description,
      examples: enhanced.examples,
      category: enhanced.category,
      promptIds: [] // Will be populated when we update prompts
    };
  });
  
  console.log('🚀 Starting variable creation in database...');
  
  // Process variables in chunks to avoid overwhelming the database
  const chunkSize = 10;
  const chunks = chunkArray(variablesForDb, chunkSize);
  let processedCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`📦 Processing chunk ${i + 1}/${chunks.length} (${chunk.length} variables)`);
    
    try {
      // Create variables in this chunk
      for (const variable of chunk) {
        try {
          await convex.mutation("variables:createOrUpdateVariable", {
            name: variable.name,
            basePattern: variable.basePattern,
            isNumbered: variable.isNumbered,
            maxNumber: variable.maxNumber,
            description: variable.description,
            examples: variable.examples,
            category: variable.category,
            promptIds: variable.promptIds
          });
          
          processedCount++;
          
          if (processedCount % 50 === 0) {
            console.log(`   ✅ Progress: ${processedCount}/${variablesForDb.length} variables processed`);
          }
          
        } catch (variableError) {
          console.error(`   ❌ Failed to create variable ${variable.name}:`, variableError.message);
          errorCount++;
        }
      }
      
      // Small delay between chunks
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (chunkError) {
      console.error(`❌ Error processing chunk ${i + 1}:`, chunkError.message);
      errorCount += chunk.length;
    }
  }
  
  console.log('\n✅ Variable population complete!');
  console.log(`📊 Results:`);
  console.log(`   ✅ Variables processed: ${processedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  return { processedCount, errorCount };
}

// Update existing prompts with their variables arrays
async function updatePromptsWithVariables() {
  console.log('\n🔄 Loading prompt-variable mappings...');
  
  const resultsPath = 'context/production_results/full_metadata_enhancement.json';
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const promptResults = results.promptResults || [];
  
  console.log(`📊 Found ${promptResults.length} prompts to update`);
  
  // Get all existing prompts from database
  console.log('🔍 Fetching existing prompts from database...');
  const existingPrompts = await convex.query("prompts:getAllPromptsForMigration");
  console.log(`📋 Found ${existingPrompts.length} prompts in database`);
  
  // Create a mapping from file path to prompt variables
  const promptVariableMap = new Map();
  promptResults.forEach(result => {
    const relativePath = result.filePath.replace('context/pages_nonprofit_ai_templates/', '');
    promptVariableMap.set(relativePath, result.variables || []);
  });
  
  let updatedCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;
  
  console.log('🚀 Starting prompt updates...');
  
  for (const prompt of existingPrompts) {
    try {
      // Try to match prompt by title and category/subcategory
      let promptVariables = [];
      
      // Look for matching file based on prompt title and categories
      for (const [filePath, variables] of promptVariableMap.entries()) {
        // Extract expected filename pattern from prompt data
        const titleSlug = prompt.title.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_');
        
        const complexitySlug = prompt.complexity;
        
        if (filePath.includes(titleSlug) && filePath.includes(complexitySlug)) {
          promptVariables = variables;
          break;
        }
      }
      
      // If we found variables, update the prompt
      if (promptVariables.length > 0) {
        await convex.mutation("variables:updatePromptWithVariables", {
          promptId: prompt._id,
          variables: promptVariables,
          analysisMetadata: {
            variableCount: promptVariables.length,
            complexityScore: promptVariables.length * 0.1,
            additionalContextNeeded: promptVariables.length > 5,
            lastAnalyzed: Date.now()
          }
        });
        
        updatedCount++;
        
        if (updatedCount % 50 === 0) {
          console.log(`   ✅ Progress: ${updatedCount} prompts updated`);
        }
        
      } else {
        notFoundCount++;
      }
      
    } catch (error) {
      console.error(`❌ Failed to update prompt ${prompt.title}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n✅ Prompt update complete!');
  console.log(`📊 Results:`);
  console.log(`   ✅ Prompts updated: ${updatedCount}`);
  console.log(`   ⚠️  No variables found: ${notFoundCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  return { updatedCount, notFoundCount, errorCount };
}

// Update variable records with prompt IDs
async function updateVariablesWithPromptIds() {
  console.log('\n🔄 Updating variables with prompt IDs...');
  
  // Get all prompts that now have variables
  const prompts = await convex.query("prompts:getAllPromptsForMigration");
  const promptsWithVariables = prompts.filter(p => p.variables && p.variables.length > 0);
  
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
      // Get the existing variable
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
        
        if (updatedCount % 100 === 0) {
          console.log(`   ✅ Progress: ${updatedCount} variables updated`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to update variable ${variableName}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n✅ Variable-prompt linking complete!');
  console.log(`📊 Results:`);
  console.log(`   ✅ Variables updated: ${updatedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  return { updatedCount, errorCount };
}

// Main execution function
async function main() {
  console.log('🚀 Starting Database Population with Enhanced Metadata\n');
  
  // Check environment
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log(`🔗 Using Convex URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}`);
  
  try {
    // Step 1: Populate variables table
    console.log('\n=== STEP 1: Populating Variables Table ===');
    const variableResults = await populateVariables();
    
    // Step 2: Update prompts with variables
    console.log('\n=== STEP 2: Updating Prompts with Variables ===');
    const promptResults = await updatePromptsWithVariables();
    
    // Step 3: Update variables with prompt IDs
    console.log('\n=== STEP 3: Linking Variables to Prompts ===');
    const linkResults = await updateVariablesWithPromptIds();
    
    // Final summary
    console.log('\n🎉 DATABASE POPULATION COMPLETE!');
    console.log('\n📊 Final Summary:');
    console.log(`   Variables Created: ${variableResults.processedCount}`);
    console.log(`   Prompts Updated: ${promptResults.updatedCount}`);
    console.log(`   Variable Links: ${linkResults.updatedCount}`);
    console.log(`   Total Errors: ${variableResults.errorCount + promptResults.errorCount + linkResults.errorCount}`);
    
    console.log('\n✅ Your database is now populated with:');
    console.log('   🔹 Enhanced variable metadata with descriptions and examples');
    console.log('   🔹 Prompt-variable associations');
    console.log('   🔹 Dynamic form data ready for use');
    
    console.log('\n🚀 Next: Test your dynamic forms in the application!');
    
  } catch (error) {
    console.error('\n❌ Database population failed:', error);
    process.exit(1);
  }
}

// I need to first add the migration query to the prompts.ts file
console.log('⚠️  Note: Make sure you have added the getAllPromptsForMigration query to convex/prompts.ts');
console.log('Add this query to your prompts.ts file:');
console.log(`
export const getAllPromptsForMigration = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("prompts"),
    title: v.string(),
    complexity: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    category: v.string(),
    subcategory: v.string(),
    variables: v.optional(v.array(v.string())),
  })),
  handler: async (ctx) => {
    return await ctx.db.query("prompts").collect();
  },
});
`);

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { populateVariables, updatePromptsWithVariables, updateVariablesWithPromptIds };