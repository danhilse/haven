#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

async function addVariablesToPrompt() {
  console.log('🔍 Finding a prompt to test with...');
  
  // Get the first prompt
  const prompts = await convex.query("prompts:getAllPromptsForMigration");
  
  if (prompts.length === 0) {
    console.error('❌ No prompts found in database');
    return;
  }
  
  const testPrompt = prompts[0];
  console.log(`📝 Using prompt: "${testPrompt.title}"`);
  
  // Common variables that appear in many prompts
  const testVariables = [
    "ORGANIZATION_NAME",
    "CONTACT_NAME", 
    "CONTACT_EMAIL",
    "EVENT_NAME",
    "EVENT_DATE"
  ];
  
  console.log(`🚀 Adding ${testVariables.length} variables to the prompt...`);
  
  try {
    // Update the prompt with variables
    await convex.mutation("variables:updatePromptWithVariables", {
      promptId: testPrompt._id,
      variables: testVariables,
      analysisMetadata: {
        variableCount: testVariables.length,
        complexityScore: testVariables.length * 0.2,
        additionalContextNeeded: testVariables.length > 3,
        lastAnalyzed: Date.now()
      }
    });
    
    console.log('✅ Successfully added variables to prompt!');
    
    // Update the variables with this prompt ID
    console.log('🔗 Linking variables back to the prompt...');
    
    for (const varName of testVariables) {
      try {
        const existingVar = await convex.query("variables:getVariableByName", {
          name: varName
        });
        
        if (existingVar) {
          // Add this prompt to the variable's promptIds if not already there
          const promptIds = existingVar.promptIds || [];
          if (!promptIds.includes(testPrompt._id)) {
            promptIds.push(testPrompt._id);
            
            await convex.mutation("variables:createOrUpdateVariable", {
              name: existingVar.name,
              basePattern: existingVar.basePattern,
              isNumbered: existingVar.isNumbered,
              maxNumber: existingVar.maxNumber,
              description: existingVar.description,
              examples: existingVar.examples,
              category: existingVar.category,
              promptIds: promptIds
            });
            
            console.log(`   ✅ Linked ${varName} to prompt`);
          }
        }
      } catch (error) {
        console.error(`   ❌ Failed to link variable ${varName}:`, error.message);
      }
    }
    
    console.log('\n🎉 Test setup complete!');
    console.log(`📋 Prompt "${testPrompt.title}" now has these variables:`);
    testVariables.forEach(varName => {
      console.log(`   • ${varName}`);
    });
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Open your app at http://localhost:3000');
    console.log('2. Navigate to this prompt to test the dynamic form');
    console.log(`3. Look for input fields for: ${testVariables.join(', ')}`);
    
  } catch (error) {
    console.error('❌ Failed to add variables:', error);
  }
}

// Check environment
if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  console.error('❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables');
  process.exit(1);
}

addVariablesToPrompt().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});