#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

// Initialize Convex client
const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://proficient-lapwing-99.convex.cloud");

function extractVariables(content) {
  // Match variables in square brackets like [VARIABLE_NAME]
  const variableMatches = content.match(/\[[A-Z][A-Z0-9_]*\]/g);
  if (!variableMatches) return [];
  
  // Clean up the brackets and deduplicate
  const variables = [...new Set(variableMatches.map(match => match.slice(1, -1)))];
  
  // Filter out output variables
  return filterOutputVariables(content, variables);
}

function filterOutputVariables(content, variables) {
  // Convert content to lowercase for easier matching
  const lowerContent = content.toLowerCase();
  
  // Find the OUTPUT section
  let outputSectionStart = -1;
  let outputSectionEnd = content.length;
  
  // Look for <OUTPUT> tag or **OUTPUT:** heading
  const outputTagMatch = lowerContent.match(/<output>/);
  const outputHeadingMatch = lowerContent.match(/\*\*output:\*\*/);
  
  if (outputTagMatch) {
    outputSectionStart = outputTagMatch.index;
    // Look for closing tag
    const closingTagMatch = lowerContent.match(/<\/output>/);
    if (closingTagMatch) {
      outputSectionEnd = closingTagMatch.index + closingTagMatch[0].length;
    }
  } else if (outputHeadingMatch) {
    outputSectionStart = outputHeadingMatch.index;
    // Look for next major section or end of content
    const nextSectionMatch = lowerContent.slice(outputHeadingMatch.index).match(/\n\s*#{1,2}\s+[A-Z]/);
    if (nextSectionMatch) {
      outputSectionEnd = outputHeadingMatch.index + nextSectionMatch.index;
    }
  }
  
  if (outputSectionStart === -1) {
    // No output section found, return all variables
    return variables;
  }
  
  // Extract the output section
  const outputSection = content.slice(outputSectionStart, outputSectionEnd);
  
  // Find variables that appear in the output section
  const outputVariables = new Set();
  variables.forEach(variable => {
    if (outputSection.includes(`[${variable}]`)) {
      outputVariables.add(variable);
    }
  });
  
  // Return variables that are NOT in the output section
  return variables.filter(variable => !outputVariables.has(variable));
}

async function clearAllPromptVariables() {
  console.log("Fetching all prompts...");
  
  // Get all prompts
  const prompts = await client.query(api.prompts.getAllPromptsForMigration);
  console.log(`Found ${prompts.length} prompts to process`);
  
  let updated = 0;
  
  for (const prompt of prompts) {
    try {
      // Clear the variables field
      await client.mutation(api.variables.updatePromptWithVariables, {
        promptId: prompt._id,
        variables: [], // Clear all variables
        analysisMetadata: {
          variableCount: 0,
          complexityScore: 1.0,
          additionalContextNeeded: false,
          lastAnalyzed: Date.now()
        }
      });
      updated++;
      
      if (updated % 10 === 0) {
        console.log(`Cleared variables for ${updated} prompts...`);
      }
    } catch (error) {
      console.error(`Error clearing variables for prompt ${prompt._id}:`, error);
    }
  }
  
  console.log(`Successfully cleared variables for ${updated} prompts`);
}

async function resyncVariablesToPrompts() {
  console.log("Re-syncing variables to prompts with filtering...");
  
  // Get all prompts with full content
  const prompts = await client.query(api.prompts.getAllPromptsForMigration);
  console.log(`Processing ${prompts.length} prompts for variable extraction`);
  
  let processed = 0;
  const allVariables = new Map(); // variable name -> prompt IDs
  
  for (const prompt of prompts) {
    try {
      // Get full prompt content
      const fullPrompt = await client.query(api.prompts.getPromptById, { promptId: prompt._id });
      if (!fullPrompt) {
        console.error(`Could not fetch full prompt ${prompt._id}`);
        continue;
      }
      
      // Extract filtered variables
      const variables = extractVariables(fullPrompt.content);
      
      // Update the prompt with filtered variables
      await client.mutation(api.variables.updatePromptWithVariables, {
        promptId: prompt._id,
        variables,
        analysisMetadata: {
          variableCount: variables.length,
          complexityScore: variables.length * 0.2,
          additionalContextNeeded: variables.length > 3,
          lastAnalyzed: Date.now()
        }
      });
      
      // Track variables for bulk creation
      variables.forEach(variable => {
        if (!allVariables.has(variable)) {
          allVariables.set(variable, []);
        }
        allVariables.get(variable).push(prompt._id);
      });
      
      processed++;
      
      if (processed % 10 === 0) {
        console.log(`Processed ${processed} prompts...`);
      }
      
    } catch (error) {
      console.error(`Error processing prompt ${prompt._id}:`, error);
    }
  }
  
  console.log(`Successfully processed ${processed} prompts`);
  console.log(`Found ${allVariables.size} unique variables`);
  
  // Create/update variable records
  const variableData = Array.from(allVariables.entries()).map(([name, promptIds]) => ({
    name,
    basePattern: name.replace(/_\d+$/, ''), // Remove trailing numbers
    isNumbered: /_\d+$/.test(name),
    maxNumber: /_\d+$/.test(name) ? parseInt(name.match(/_(\d+)$/)?.[1] || '1') : undefined,
    description: `Variable used in ${promptIds.length} prompt${promptIds.length > 1 ? 's' : ''}`,
    examples: [], // Will be populated later if needed
    category: 'organization', // Default category
    promptIds
  }));
  
  console.log("Creating/updating variable records...");
  await client.mutation(api.variables.batchCreateVariables, { variables: variableData });
  console.log(`Created/updated ${variableData.length} variable records`);
}

async function main() {
  try {
    console.log("Starting prompt variable cleanup and re-sync process...");
    
    // Step 1: Clear existing variables
    await clearAllPromptVariables();
    
    // Step 2: Re-sync with filtering
    await resyncVariablesToPrompts();
    
    console.log("Process completed successfully!");
    
  } catch (error) {
    console.error("Error during processing:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { extractVariables, filterOutputVariables };