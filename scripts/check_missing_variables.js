#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function checkMissingVariables() {
  console.log('🔍 Checking for variables that exist in database but not in prompts...\n');
  
  // Get all variables from the variables table
  const allVariables = await convex.query("variables:getVariables", { limit: 1000 });
  console.log(`📊 Found ${allVariables.length} variables in database`);
  
  // Get all prompts and their variables
  const prompts = await convex.query("prompts:getAllPromptsForMigration");
  const promptsWithVariables = [];
  
  for (const prompt of prompts) {
    const fullPrompt = await convex.query("prompts:getPromptById", {
      promptId: prompt._id
    });
    
    if (fullPrompt && fullPrompt.variables && fullPrompt.variables.length > 0) {
      promptsWithVariables.push({
        title: fullPrompt.title,
        variables: fullPrompt.variables
      });
    }
  }
  
  console.log(`📋 Found ${promptsWithVariables.length} prompts with variables`);
  
  // Collect all variables used in prompts
  const usedVariables = new Set();
  promptsWithVariables.forEach(prompt => {
    prompt.variables.forEach(varName => {
      usedVariables.add(varName);
    });
  });
  
  console.log(`🔗 Found ${usedVariables.size} unique variables used in prompts\n`);
  
  // Find variables in database that aren't used in any prompt
  const unusedVariables = allVariables.filter(dbVar => !usedVariables.has(dbVar.name));
  
  console.log(`📊 ANALYSIS RESULTS:`);
  console.log(`   Variables in database: ${allVariables.length}`);
  console.log(`   Variables used in prompts: ${usedVariables.size}`);
  console.log(`   Unused variables: ${unusedVariables.length}\n`);
  
  if (unusedVariables.length > 0) {
    console.log('🔍 Sample unused variables (first 20):');
    unusedVariables.slice(0, 20).forEach((variable, index) => {
      console.log(`   ${index + 1}. ${variable.name} (${variable.category})`);
      console.log(`      Description: ${variable.description.substring(0, 100)}...`);
      console.log(`      Examples: ${variable.examples.slice(0, 2).join(', ')}\n`);
    });
    
    // Check if these variables appear in prompt content even if not bracketed
    console.log('🔍 Checking if unused variables are mentioned in prompt content...\n');
    
    let foundInContent = 0;
    const samplePrompts = promptsWithVariables.slice(0, 10); // Check first 10 prompts
    
    for (const unusedVar of unusedVariables.slice(0, 10)) { // Check first 10 unused vars
      const varNameLower = unusedVar.name.toLowerCase().replace(/_/g, ' ');
      
      for (const prompt of samplePrompts) {
        const fullPrompt = await convex.query("prompts:getPromptById", {
          promptId: prompt._id
        });
        
        if (fullPrompt && fullPrompt.content.toLowerCase().includes(varNameLower)) {
          console.log(`   ✅ "${unusedVar.name}" found in "${prompt.title}"`);
          foundInContent++;
          break;
        }
      }
    }
    
    console.log(`\n📊 Of ${Math.min(10, unusedVariables.length)} unused variables checked, ${foundInContent} were found in prompt content`);
  }
  
  // Show some examples of variables that are heavily used
  const variableUsage = new Map();
  promptsWithVariables.forEach(prompt => {
    prompt.variables.forEach(varName => {
      variableUsage.set(varName, (variableUsage.get(varName) || 0) + 1);
    });
  });
  
  const sortedUsage = Array.from(variableUsage.entries()).sort((a, b) => b[1] - a[1]);
  
  console.log('\n🔥 Most frequently used variables:');
  sortedUsage.slice(0, 10).forEach(([varName, count], index) => {
    console.log(`   ${index + 1}. ${varName}: used in ${count} prompts`);
  });
}

// Check environment
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error('❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables');
  process.exit(1);
}

checkMissingVariables().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});