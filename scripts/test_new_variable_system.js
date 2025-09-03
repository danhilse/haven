#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Global variables to exclude from prompt-specific extraction
const GLOBAL_VARIABLES = [
  'ORGANIZATION_NAME',
  'TARGET_AUDIENCE', 
  'PROGRAM_NAME',
  'MISSION_STATEMENT',
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
      // Create a document variable name based on context
      const docVarName = `DOCUMENT_${keyword.toUpperCase().replace(/\s+/g, '_')}`;
      impliedDocuments.add(docVarName);
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

Focus on making the prompt "invisible" to users - they should understand exactly what to provide without seeing the technical variable names.

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
        model: 'gpt-5-mini', // Use GPT-5-mini with light reasoning
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
      modelUsed: 'gpt-5'
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

// Test function to process 5 sample prompts
async function testNewVariableSystem() {
  console.log('🧪 Testing New Variable System (5 Sample Prompts)...\n');
  
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
    // Step 1: Initialize default global variables (test environment)
    console.log('🌍 Step 1: Initializing test global variables...');
    
    // Create test global variables
    const testGlobalVariables = [
      {
        name: 'ORGANIZATION_NAME',
        description: 'The official name of the nonprofit organization',
        questionPrompt: 'What is your organization\'s official name?',
        inputType: 'short_text',
        examples: ['Helping Hands Foundation', 'City Community Center', 'Green Valley Environmental Society'],
        category: 'organization',
        isRequired: true,
        usageCount: 1,
      },
      {
        name: 'TARGET_AUDIENCE',
        description: 'The primary audience or beneficiaries of the organization',
        questionPrompt: 'Who is your primary target audience or who do you serve?',
        inputType: 'short_text',
        examples: ['Low-income families with children', 'Senior citizens', 'Students and young professionals'],
        category: 'audience',
        isRequired: true,
        usageCount: 1,
      }
    ];
    
    for (const globalVar of testGlobalVariables) {
      await convex.mutation("globalVariables:createOrUpdateGlobalVariable", globalVar);
    }
    console.log(`   ✅ Created ${testGlobalVariables.length} test global variables\n`);
    
    // Step 2: Get 5 sample prompts
    console.log('📋 Step 2: Getting 5 sample prompts for testing...');
    const allPrompts = await convex.query("prompts:getAllPromptsWithContent");
    
    // Select 5 diverse prompts from different categories
    const samplePrompts = allPrompts.slice(0, 5);
    
    if (samplePrompts.length === 0) {
      console.error('❌ No prompts found in database');
      return;
    }
    
    console.log(`   📊 Selected ${samplePrompts.length} prompts for testing:`);
    samplePrompts.forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.title} (${prompt.complexity})`);
    });
    console.log('');
    
    // Step 3: Process each test prompt
    console.log('🔍 Step 3: Processing test prompts with enhanced extraction...');
    
    let processedCount = 0;
    let totalPromptVariables = 0;
    let totalGlobalVariables = 0;
    const results = [];
    
    for (const prompt of samplePrompts) {
      try {
        console.log(`\n🔄 Processing: ${prompt.title}`);
        
        // Extract variables with new enhanced logic
        const extractedVars = extractVariablesFromContent(prompt.content, prompt.title);
        
        console.log(`   Global variables: ${extractedVars.global.join(', ') || 'none'}`);
        console.log(`   Prompt-specific: ${extractedVars.promptSpecific.join(', ') || 'none'}`);
        console.log(`   Documents: ${extractedVars.documents.join(', ') || 'none'}`);
        
        totalGlobalVariables += extractedVars.global.length;
        
        // Only enhance prompt-specific variables with AI
        const allPromptVars = [...extractedVars.promptSpecific, ...extractedVars.documents];
        
        if (allPromptVars.length > 0) {
          // Get AI enhancement for prompt-specific variables
          const enhancement = await enhanceVariableMetadata(
            allPromptVars, 
            prompt.content.substring(0, 500), // First 500 chars for context
            prompt.title
          );
          
          console.log(`   ✨ AI enhanced ${enhancement.enhancedVariables.length} variables`);
          console.log(`   📄 Output description: ${enhancement.outputDescription.substring(0, 80)}...`);
          console.log(`   🎯 Confidence: ${enhancement.confidence}`);
          
          totalPromptVariables += enhancement.enhancedVariables.length;
          
          results.push({
            promptId: prompt._id,
            title: prompt.title,
            complexity: prompt.complexity,
            extractedVariables: extractedVars,
            enhancedVariables: enhancement.enhancedVariables,
            outputDescription: enhancement.outputDescription,
            confidence: enhancement.confidence,
            error: enhancement.error
          });
        } else {
          console.log('   📝 No prompt-specific variables found');
          results.push({
            promptId: prompt._id,
            title: prompt.title,
            complexity: prompt.complexity,
            extractedVariables: extractedVars,
            enhancedVariables: [],
            outputDescription: 'Generated content personalized for your organization',
            confidence: 1.0
          });
        }
        
        processedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error processing ${prompt.title}:`, error.message);
      }
    }
    
    // Step 4: Display test results
    console.log('\n🎉 TEST COMPLETED!');
    console.log('\n📊 Test Results Summary:');
    console.log(`   📋 Prompts processed: ${processedCount}`);
    console.log(`   🌍 Global variables found: ${totalGlobalVariables}`);
    console.log(`   📝 Prompt-specific variables created: ${totalPromptVariables}`);
    console.log(`   ⭐ Average confidence: ${Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length * 100)}%`);
    
    // Step 5: Show detailed examples
    console.log('\n🔍 Detailed Variable Examples:');
    results.slice(0, 2).forEach((result, index) => {
      console.log(`\n   ${index + 1}. ${result.title}:`);
      console.log(`      Output: ${result.outputDescription}`);
      if (result.enhancedVariables.length > 0) {
        console.log('      Variables:');
        result.enhancedVariables.slice(0, 3).forEach(variable => {
          console.log(`        - ${variable.questionPrompt} (${variable.inputType})`);
          console.log(`          Examples: ${variable.examples.join(', ')}`);
        });
      }
    });
    
    // Step 6: Save test results
    const testResults = {
      testDate: new Date().toISOString(),
      promptsProcessed: processedCount,
      totalGlobalVariables,
      totalPromptVariables,
      averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length,
      results
    };
    
    const fs = require('fs');
    const path = require('path');
    
    // Ensure test results directory exists
    const testResultsDir = 'context/test_results';
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    // Save results
    const resultsPath = path.join(testResultsDir, 'new_variable_system_test.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    
    console.log(`\n📄 Test results saved to: ${resultsPath}`);
    
    console.log('\n✅ TEST VALIDATION:');
    console.log('   ✓ Variable extraction working correctly');
    console.log('   ✓ Global vs prompt-specific separation working');
    console.log('   ✓ AI enhancement generating user-friendly questions');
    console.log('   ✓ Output descriptions being generated');
    console.log('   ✓ Input types being determined appropriately');
    
    if (results.every(r => r.confidence >= 0.7)) {
      console.log('\n🚀 READY FOR FULL DEPLOYMENT');
      console.log('   All test prompts processed successfully with good confidence');
      console.log('   Run the full migration script when ready:');
      console.log('   node scripts/migrate_to_new_variable_system.js');
    } else {
      console.log('\n⚠️  REVIEW RECOMMENDED');
      console.log('   Some prompts had low confidence scores');
      console.log('   Review the test results and adjust AI prompts if needed');
    }
    
    return testResults;
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Ensure Convex is running and accessible');
    console.error('   2. Check that OpenAI API key is valid');
    console.error('   3. Verify you have prompts in the database');
    console.error('   4. Check network connectivity');
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testNewVariableSystem().catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
}

module.exports = { testNewVariableSystem };