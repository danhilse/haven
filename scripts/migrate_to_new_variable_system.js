#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function migrateToNewVariableSystem() {
  console.log('🚀 Starting Migration to New Variable System...\n');
  
  // Check environment
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_KEY && !process.env.OPENAI_API_KEY) {
    console.error('❌ OpenAI API key not found. Set OPENAI_KEY or OPENAI_API_KEY');
    process.exit(1);
  }

  console.log(`🔗 Using Convex URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}\n`);
  
  try {
    // Step 1: Initialize default global variables
    console.log('🌍 Step 1: Initializing default global variables...');
    const globalVarIds = await convex.mutation("globalVariables:initializeDefaultGlobalVariables", {});
    console.log(`   ✅ Created ${globalVarIds.length} global variables\n`);
    
    // Step 2: Clear existing variables table
    console.log('🗑️  Step 2: Clearing existing variables table...');
    await convex.mutation("variables:clearAllVariables", {});
    console.log('   ✅ Cleared all existing prompt-specific variables\n');
    
    // Step 3: Run enhanced variable extraction
    console.log('🔍 Step 3: Running enhanced variable extraction...');
    console.log('   This will process all prompts with the new extraction logic...\n');
    
    // Import and run the enhanced extraction
    const { processPromptsWithEnhancedExtraction } = require('./enhanced_variable_extraction.js');
    const extractionResults = await processPromptsWithEnhancedExtraction();
    
    console.log('\n✅ Enhanced variable extraction completed!');
    console.log(`   📊 Results: ${extractionResults.processedCount} processed, ${extractionResults.updatedCount} updated, ${extractionResults.errorCount} errors`);
    
    // Step 4: Update global variable usage counts
    console.log('\n📊 Step 4: Updating global variable usage counts...');
    if (extractionResults.globalVariableUsage) {
      for (const [varName, count] of extractionResults.globalVariableUsage.entries()) {
        await convex.mutation("globalVariables:updateGlobalVariableUsage", {
          name: varName,
          usageCount: count
        });
        console.log(`   ✅ ${varName}: ${count} usages`);
      }
    }
    
    // Step 5: Get migration statistics
    console.log('\n📈 Step 5: Getting migration statistics...');
    
    const [globalStats, variableStats] = await Promise.all([
      convex.query("globalVariables:getGlobalVariableStats", {}),
      convex.query("variables:getVariableStats", {})
    ]);
    
    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('\n📊 Final Statistics:');
    console.log('   🌍 Global Variables:');
    console.log(`      Total: ${globalStats.totalGlobalVariables}`);
    console.log(`      Total Usage: ${globalStats.totalUsage}`);
    console.log('      Top Used:');
    globalStats.topUsedVariables.forEach(v => {
      console.log(`        ${v.name}: ${v.usageCount} prompts`);
    });
    
    console.log('\n   📝 Prompt-Specific Variables:');
    console.log(`      Total: ${variableStats.totalVariables}`);
    console.log(`      Required: ${variableStats.requiredVariables}`);
    console.log(`      Average per prompt: ${Math.round(variableStats.averageVariablesPerPrompt * 10) / 10}`);
    console.log('      Input types:');
    Object.entries(variableStats.inputTypeCounts).forEach(([type, count]) => {
      console.log(`        ${type}: ${count}`);
    });
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Test the updated DynamicPromptForm with the new variable system');
    console.log('   2. Verify that global variables appear in the Organization Information section');
    console.log('   3. Check that prompt-specific variables show context-driven questions');
    console.log('   4. Ensure output descriptions are displayed prominently');
    console.log('   5. Test different input types (text, textarea, select, etc.)');
    
    return {
      globalVariables: globalStats.totalGlobalVariables,
      promptVariables: variableStats.totalVariables,
      globalUsage: globalStats.totalUsage,
      extractionResults
    };
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Ensure Convex is running and accessible');
    console.error('   2. Check that OpenAI API key is valid');
    console.error('   3. Verify database schema has been deployed');
    console.error('   4. Check network connectivity');
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  migrateToNewVariableSystem().catch(error => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateToNewVariableSystem };