#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");
const { openai } = require('@ai-sdk/openai');
const { generateText } = require('ai');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Set OPENAI_API_KEY from OPENAI_KEY for AI SDK compatibility
if (process.env.OPENAI_KEY && !process.env.OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.OPENAI_KEY;
}

// Initialize clients
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Helper function to delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function expandVariableExamples() {
  console.log('🔄 Fetching current global variables...');
  
  // Get all current global variables
  const variables = await convex.query("globalVariables:getGlobalVariables");
  console.log(`📊 Found ${variables.length} variables to expand examples for`);
  
  let processedCount = 0;
  let errorCount = 0;
  
  for (const variable of variables) {
    try {
      console.log(`\n🔄 Processing: ${variable.name} (current: ${variable.examples.length} examples)`);
      
      // Skip if already has 8 or more examples
      if (variable.examples.length >= 8) {
        console.log(`   ⚠️ Skipping ${variable.name} - already has ${variable.examples.length} examples`);
        continue;
      }
      
      // Generate additional examples using OpenAI
      const examplesNeeded = 8 - variable.examples.length;
      const existingExamplesText = variable.examples.join(', ');
      
      const prompt = `You are helping expand examples for a nonprofit organization form variable.

Variable: ${variable.name}
Description: ${variable.description}
Category: ${variable.category}
Current Examples: ${existingExamplesText}

Generate exactly ${examplesNeeded} additional examples that are:
1. Different from the existing examples
2. Realistic and practical for nonprofit organizations
3. Varied in style, size, and approach
4. Appropriate for the variable description and category`;

      let newExamples = [];
      try {
        const response = await generateText({
          model: openai('gpt-4o-mini'),
          system: "You are an expert in nonprofit organizations and form design. Generate realistic, diverse examples for form variables. Return only a JSON array of strings, nothing else.",
          prompt: prompt + `\n\nReturn exactly ${examplesNeeded} examples as a JSON array of strings:`,
          temperature: 0.8,
          maxTokens: 400,
        });
        
        // Parse the JSON response (handle markdown code blocks)
        let cleanedText = response.text.trim();
        
        // Remove markdown code blocks if present
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        newExamples = JSON.parse(cleanedText);
        
        // Ensure we have the right number of examples
        if (!Array.isArray(newExamples) || newExamples.length !== examplesNeeded) {
          throw new Error(`Expected ${examplesNeeded} examples, got ${newExamples.length}`);
        }
      } catch (aiError) {
        console.error(`   ❌ Failed to generate examples for ${variable.name}:`, aiError.message);
        errorCount++;
        continue;
      }
      
      // Combine existing and new examples
      const allExamples = [...variable.examples, ...newExamples];
      
      // Update the variable in the database
      await convex.mutation("globalVariables:createOrUpdateGlobalVariable", {
        name: variable.name,
        description: variable.description,
        category: variable.category,
        inputType: variable.inputType,
        isRequired: variable.isRequired,
        questionPrompt: variable.questionPrompt,
        examples: allExamples,
        selectOptions: variable.selectOptions || undefined,
        defaultValue: variable.defaultValue || undefined,
        usageCount: variable.usageCount
      });
      
      processedCount++;
      console.log(`   ✅ Updated ${variable.name}: ${variable.examples.length} → ${allExamples.length} examples`);
      
      // Rate limiting delay
      await delay(1000);
      
    } catch (error) {
      console.error(`❌ Failed to process ${variable.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n✅ Variable example expansion complete!');
  console.log(`📊 Results:`);
  console.log(`   ✅ Variables processed: ${processedCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  return { processedCount, errorCount };
}

// Main execution function
async function main() {
  console.log('🚀 Starting Variable Example Expansion\n');
  
  // Check environment variables
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    process.exit(1);
  }
  
  console.log(`🔗 Using Convex URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}`);
  
  try {
    const results = await expandVariableExamples();
    
    console.log('\n🎉 EXAMPLE EXPANSION COMPLETE!');
    console.log('\n📊 Final Summary:');
    console.log(`   Variables Expanded: ${results.processedCount}`);
    console.log(`   Total Errors: ${results.errorCount}`);
    
    console.log('\n✅ Your global variables now have 8 examples each!');
    
  } catch (error) {
    console.error('\n❌ Example expansion failed:', error);
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

module.exports = { expandVariableExamples };