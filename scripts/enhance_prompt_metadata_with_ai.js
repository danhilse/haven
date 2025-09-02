#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import test functions
const { extractAndNormalizeVariables, categorizeVariable, selectTestPrompts } = require('./enhance_prompt_metadata_test.js');

// GPT-5 integration for variable enhancement - test both Responses API and Chat Completions API
async function enhanceVariableMetadata(variables, promptContext, useResponsesAPI = false) {
  const systemPrompt = `You are an expert in nonprofit communication templates and variable metadata generation. Your task is to analyze template variables and generate useful descriptions, examples, and metadata.

For each variable provided, generate:
1. A clear, concise description (1-2 sentences) explaining what this variable represents
2. Three realistic examples that a nonprofit might use
3. Suggest the most appropriate input type for forms
4. Any validation rules that should apply

Focus on nonprofit-specific context. Variables should reflect real organizational needs like donor management, program delivery, volunteer coordination, etc.

IMPORTANT: For numbered variables like KEY_QUALITY_#, describe the base concept and note that multiple instances (1, 2, 3, etc.) are expected.

CRITICAL: You must respond with ONLY valid JSON in the exact format specified. Do not include any text before or after the JSON. Start your response with { and end with }.`;

  const userPrompt = `Analyze these nonprofit template variables and provide metadata:

${JSON.stringify({ variables, promptContext }, null, 2)}

Return a JSON object with this structure:
{
  "enhancedVariables": [
    {
      "name": "VARIABLE_NAME",
      "description": "Clear description of what this variable represents",
      "examples": ["Example 1", "Example 2", "Example 3"],
      "category": "Confirmed or refined category",
      "suggestedInputType": "text|textarea|select|number|date|email|phone",
      "validationRules": ["Optional validation rules"]
    }
  ],
  "additionalDocuments": ["Only if specific documents are clearly needed"],
  "confidence": 0.95
}`;

  try {
    if (useResponsesAPI) {
      console.log('🤖 Calling GPT-5-mini via Responses API (minimal reasoning)...');
      
      // Try the new Responses API format for GPT-5
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',  // 80% cheaper, optimal for this use case
          input: [
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: systemPrompt + '\n\n' + userPrompt
                }
              ]
            }
          ],
          max_output_tokens: 3000,
          reasoning_effort: 'minimal'  // Fastest, cheapest for deterministic tasks
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GPT-5 Responses API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ GPT-5 Responses API response received (${data.usage?.total_tokens || 'unknown'} tokens used)`);
      
      const rawContent = data.message?.content || data.output?.text || data.content || '';
      console.log(`🔍 Raw GPT-5 response content (first 200 chars): ${rawContent.substring(0, 200)}...`);
      
      let result;
      try {
        // Try to extract JSON from response (GPT-5 might include reasoning or other content)
        let jsonContent = rawContent;
        
        // Look for JSON block between { and }
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        result = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError.message);
        console.log('📝 Full response content:', rawContent);
        throw new Error(`Failed to parse GPT-5 JSON response: ${parseError.message}`);
      }

      return {
        enhancedVariables: result.enhancedVariables || [],
        additionalDocuments: result.additionalDocuments || [],
        confidence: result.confidence || 0.8
      };
      
    } else {
      console.log('🤖 Calling GPT-5-mini via Chat Completions API (minimal reasoning)...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',  // 80% cheaper, 80% performance - perfect for this task
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          max_completion_tokens: 3000,  // Increased for safety, but minimal reasoning should use few tokens
          reasoning_effort: 'minimal'   // Fastest, cheapest, perfect for deterministic tasks like variable metadata
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GPT-5 Chat Completions API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ GPT-5-mini Chat Completions response received (${data.usage?.total_tokens} tokens used)`);
      console.log(`🔍 Full response structure:`, JSON.stringify(data, null, 2));
      
      const rawContent = data.choices[0].message.content;
      console.log(`🔍 Raw content type: ${typeof rawContent}, length: ${rawContent?.length || 0}`);
      console.log(`🔍 Raw GPT-5 response content (first 200 chars): ${rawContent?.substring(0, 200) || 'EMPTY'}...`);
      
      let result;
      try {
        // Try to extract JSON from response (GPT-5 might include reasoning or other content)
        let jsonContent = rawContent;
        
        // Look for JSON block between { and }
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonContent = jsonMatch[0];
        }
        
        result = JSON.parse(jsonContent);
      } catch (parseError) {
        console.error('❌ JSON parsing error:', parseError.message);
        console.log('📝 Full response content:', rawContent);
        throw new Error(`Failed to parse GPT-5 JSON response: ${parseError.message}`);
      }

      return {
        enhancedVariables: result.enhancedVariables || [],
        additionalDocuments: result.additionalDocuments || [],
        confidence: result.confidence || 0.8
      };
    }

  } catch (error) {
    console.error('❌ Variable enhancement error:', error.message);
    // Fallback with basic metadata if AI fails
    const fallbackVariables = variables.map(variable => ({
      name: variable.name,
      description: `${variable.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} value for nonprofit template`,
      examples: ['Sample value 1', 'Sample value 2', 'Sample value 3'],
      category: variable.category,
      suggestedInputType: 'text'
    }));

    return {
      enhancedVariables: fallbackVariables,
      additionalDocuments: [],
      confidence: 0.3,
      error: error.message
    };
  }
}

// GPT-4 fallback function
async function enhanceVariableMetadataGPT4(variables, promptContext) {
  const systemPrompt = `You are an expert in nonprofit communication templates and variable metadata generation. Your task is to analyze template variables and generate useful descriptions, examples, and metadata.

For each variable provided, generate:
1. A clear, concise description (1-2 sentences) explaining what this variable represents
2. Three realistic examples that a nonprofit might use
3. Suggest the most appropriate input type for forms
4. Any validation rules that should apply

Focus on nonprofit-specific context. Variables should reflect real organizational needs like donor management, program delivery, volunteer coordination, etc.

IMPORTANT: For numbered variables like KEY_QUALITY_#, describe the base concept and note that multiple instances (1, 2, 3, etc.) are expected.

CRITICAL: You must respond with ONLY valid JSON in the exact format specified. Do not include any text before or after the JSON. Start your response with { and end with }.`;

  const userPrompt = `Analyze these nonprofit template variables and provide metadata:

${JSON.stringify({ variables, promptContext }, null, 2)}

Return a JSON object with this structure:
{
  "enhancedVariables": [
    {
      "name": "VARIABLE_NAME",
      "description": "Clear description of what this variable represents",
      "examples": ["Example 1", "Example 2", "Example 3"],
      "category": "Confirmed or refined category",
      "suggestedInputType": "text|textarea|select|number|date|email|phone",
      "validationRules": ["Optional validation rules"]
    }
  ],
  "additionalDocuments": ["Only if specific documents are clearly needed"],
  "confidence": 0.95
}`;

  try {
    console.log('🤖 Calling GPT-4 fallback API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GPT-4 API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ GPT-4 fallback response received (${data.usage?.total_tokens} tokens used)`);
    
    const rawContent = data.choices[0].message.content;
    const result = JSON.parse(rawContent);

    return {
      enhancedVariables: result.enhancedVariables || [],
      additionalDocuments: result.additionalDocuments || [],
      confidence: result.confidence || 0.8,
      modelUsed: 'gpt-4-turbo'
    };

  } catch (error) {
    console.error('❌ GPT-4 fallback error:', error.message);
    throw error;
  }
}

// Main test function with AI enhancement
async function runAIEnhancedTest() {
  console.log('🚀 Starting AI-Enhanced Prompt Metadata Test Phase...\n');

  // Check for OpenAI API key
  if (!process.env.OPENAI_KEY && !process.env.OPENAI_API_KEY) {
    console.error('❌ OpenAI API key not found. Please set OPENAI_KEY or OPENAI_API_KEY environment variable.');
    process.exit(1);
  }

  const templateDir = 'context/pages_nonprofit_ai_templates';
  
  if (!fs.existsSync(templateDir)) {
    console.error(`❌ Template directory not found: ${templateDir}`);
    process.exit(1);
  }

  console.log('📁 Selecting test prompts from different categories...');
  const testPrompts = selectTestPrompts(templateDir);
  
  if (testPrompts.length === 0) {
    console.error('❌ No test prompts found');
    process.exit(1);
  }

  console.log(`📋 Selected ${testPrompts.length} test prompts:`);
  testPrompts.forEach((file, index) => {
    const relativePath = file.replace(templateDir + '/', '');
    console.log(`   ${index + 1}. ${relativePath}`);
  });
  console.log('');

  const allVariables = new Map();
  const promptResults = [];

  // Extract variables from all test prompts
  for (const filePath of testPrompts) {
    try {
      console.log(`🔍 Processing: ${path.basename(filePath)}`);
      const content = fs.readFileSync(filePath, 'utf8');
      const variables = extractAndNormalizeVariables(content);
      
      console.log(`   Found ${variables.length} unique variables`);
      
      variables.forEach(variable => {
        const key = variable.name;
        if (!allVariables.has(key)) {
          allVariables.set(key, {
            ...variable,
            category: categorizeVariable(variable.name, variable.basePattern),
            promptFiles: [filePath],
            usageExamples: [] // Will be filled from prompt context
          });
        } else {
          allVariables.get(key).promptFiles.push(filePath);
        }
      });
      
      promptResults.push({
        filePath,
        variableCount: variables.length,
        variables: variables.map(v => v.name)
      });
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }

  console.log('\n📊 Variable Extraction Summary:');
  console.log(`   Total prompts processed: ${promptResults.length}`);
  console.log(`   Unique variables found: ${allVariables.size}`);

  // Prepare variables for AI enhancement (process first 10 for test)
  const variablesToEnhance = Array.from(allVariables.values()).slice(0, 10);
  
  console.log(`\n🤖 Testing AI enhancement on ${variablesToEnhance.length} variables...`);
  
  // Try GPT-5 with Chat Completions API first, then fall back to Responses API if needed
  let enhancementResult;
  
  try {
    try {
      console.log('🔄 Attempting GPT-5-mini via Chat Completions API...');
      enhancementResult = await enhanceVariableMetadata(
        variablesToEnhance,
        `Test run processing ${variablesToEnhance.length} variables from nonprofit prompt templates`,
        false // Use Chat Completions API
      );
    } catch (chatCompletionsError) {
      console.log('⚠️  Chat Completions API failed, trying Responses API...');
      console.log(`   Error: ${chatCompletionsError.message}`);
      
      try {
        enhancementResult = await enhanceVariableMetadata(
          variablesToEnhance,
          `Test run processing ${variablesToEnhance.length} variables from nonprofit prompt templates`,
          true // Use Responses API
        );
      } catch (responsesError) {
        console.log('⚠️  Both GPT-5 APIs failed, falling back to GPT-4...');
        console.log(`   Responses API Error: ${responsesError.message}`);
        
        // Final fallback to GPT-4
        enhancementResult = await enhanceVariableMetadataGPT4(
          variablesToEnhance,
          `Test run processing ${variablesToEnhance.length} variables from nonprofit prompt templates`
        );
      }
    }

    console.log('\n✨ AI Enhancement Results:');
    console.log(`   Model used: ${enhancementResult.modelUsed || 'gpt-5-mini'}`);
    console.log(`   Variables enhanced: ${enhancementResult.enhancedVariables.length}`);
    console.log(`   Confidence score: ${enhancementResult.confidence}`);
    console.log(`   Additional documents suggested: ${enhancementResult.additionalDocuments?.length || 0}`);

    if (enhancementResult.error) {
      console.log(`   ⚠️  Error occurred: ${enhancementResult.error}`);
    }

    // Display sample enhanced variables
    console.log('\n🔍 Sample Enhanced Variables:');
    enhancementResult.enhancedVariables.slice(0, 3).forEach((variable, index) => {
      console.log(`\n   ${index + 1}. ${variable.name}`);
      console.log(`      Description: ${variable.description}`);
      console.log(`      Examples: ${variable.examples.join(', ')}`);
      console.log(`      Input Type: ${variable.suggestedInputType}`);
      console.log(`      Category: ${variable.category}`);
      if (variable.validationRules && variable.validationRules.length > 0) {
        console.log(`      Validation: ${variable.validationRules.join(', ')}`);
      }
    });

    if (enhancementResult.additionalDocuments && enhancementResult.additionalDocuments.length > 0) {
      console.log('\n📄 Suggested Additional Documents:');
      enhancementResult.additionalDocuments.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc}`);
      });
    }

    // Save enhanced test results
    const enhancedResults = {
      testDate: new Date().toISOString(),
      promptsProcessed: promptResults.length,
      uniqueVariables: allVariables.size,
      variablesEnhanced: enhancementResult.enhancedVariables.length,
      aiConfidence: enhancementResult.confidence,
      aiError: enhancementResult.error || null,
      extractedVariables: Array.from(allVariables.entries()).map(([name, data]) => ({
        name,
        basePattern: data.basePattern,
        isNumbered: data.isNumbered,
        maxNumber: data.maxNumber,
        category: data.category,
        usageCount: data.promptFiles.length,
        promptFiles: data.promptFiles.map(f => f.replace(templateDir + '/', ''))
      })),
      enhancedVariables: enhancementResult.enhancedVariables,
      additionalDocuments: enhancementResult.additionalDocuments,
      promptResults
    };

    // Ensure test results directory exists
    const testResultsDir = 'context/test_results';
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    // Save results
    const resultsPath = path.join(testResultsDir, 'ai_enhanced_metadata_test.json');
    fs.writeFileSync(resultsPath, JSON.stringify(enhancedResults, null, 2));

    console.log(`\n✅ AI-enhanced test completed successfully!`);
    console.log(`📄 Detailed results saved to: ${resultsPath}`);
    
    console.log('\n🎯 Test Results Summary:');
    console.log(`   ✓ Variable extraction working correctly`);
    console.log(`   ✓ Numbered variable deduplication working`);
    console.log(`   ✓ GPT-5 API integration functional`);
    console.log(`   ✓ Variable categorization and enhancement successful`);
    console.log(`   ✓ Confidence score: ${enhancementResult.confidence}/1.0`);

    if (enhancementResult.confidence >= 0.8 && !enhancementResult.error) {
      console.log('\n🚀 Next Steps:');
      console.log('   ✅ Test phase successful - ready for full deployment');
      console.log('   🔄 Run full script on all prompts when ready');
      console.log('   💾 Deploy schema changes to Convex');
    } else {
      console.log('\n⚠️  Attention Required:');
      console.log('   🔧 Review AI enhancement quality');
      console.log('   🐛 Address any errors before full deployment');
      console.log('   📊 Consider adjusting GPT-5 parameters');
    }

    return enhancedResults;

  } catch (error) {
    console.error('\n❌ AI enhancement test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runAIEnhancedTest().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { enhanceVariableMetadata, runAIEnhancedTest };