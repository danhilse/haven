#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Variable extraction function (copied from test script to avoid import issues)
function extractAndNormalizeVariables(content) {
  const variables = new Map();
  const numberedPatterns = new Map();
  
  const lines = content.split('\n');
  let insideOutputBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.match(/^<OUTPUT>/i)) {
      insideOutputBlock = true;
      continue;
    }
    
    if (line.match(/^<\/OUTPUT>/i)) {
      insideOutputBlock = false;
      continue;
    }
    
    if (insideOutputBlock) {
      continue;
    }
    
    const matches = line.match(/\[([A-Z_][A-Z0-9_]*)\]/g);
    if (matches) {
      matches.forEach(match => {
        const variable = match.slice(1, -1);
        
        const numberedMatch = variable.match(/^(.+)_(\d+)$/);
        
        if (numberedMatch) {
          const basePattern = numberedMatch[1];
          const number = parseInt(numberedMatch[2]);
          
          if (!numberedPatterns.has(basePattern)) {
            numberedPatterns.set(basePattern, {
              maxNumber: number,
              instances: new Set([number])
            });
          } else {
            const existing = numberedPatterns.get(basePattern);
            existing.maxNumber = Math.max(existing.maxNumber, number);
            existing.instances.add(number);
          }
        } else {
          variables.set(variable, {
            name: variable,
            basePattern: variable,
            isNumbered: false,
            maxNumber: null,
            instances: 1
          });
        }
      });
    }
  }
  
  numberedPatterns.forEach((data, basePattern) => {
    variables.set(`${basePattern}_#`, {
      name: `${basePattern}_#`,
      basePattern: basePattern,
      isNumbered: true,
      maxNumber: data.maxNumber,
      instances: data.instances.size
    });
  });
  
  return Array.from(variables.values());
}

// Variable categorization function
function categorizeVariable(variableName, basePattern) {
  const name = variableName.toLowerCase();
  const base = basePattern.toLowerCase();
  
  if (name.includes('organization') || name.includes('org_')) {
    return 'Organization Identity';
  } else if (name.includes('program') || name.includes('service')) {
    return 'Programs & Services';
  } else if (name.includes('name') || name.includes('contact') || name.includes('email') || 
             name.includes('phone') || name.includes('address') || name.includes('person') ||
             name.includes('staff') || name.includes('volunteer') || name.includes('donor') ||
             name.includes('client') || name.includes('participant') || name.includes('board')) {
    return 'People & Contacts';
  } else if (name.includes('event') || name.includes('meeting') || name.includes('activity')) {
    return 'Events & Activities';
  } else if (name.includes('budget') || name.includes('amount') || name.includes('cost') ||
             name.includes('price') || name.includes('financial') || name.includes('fund')) {
    return 'Financial';
  } else if (name.includes('date') || name.includes('time') || name.includes('deadline') ||
             name.includes('schedule')) {
    return 'Dates & Times';
  } else if (name.includes('email') || name.includes('message') || name.includes('communication') ||
             name.includes('newsletter') || name.includes('social')) {
    return 'Communications';
  } else if (name.includes('mission') || name.includes('value') || name.includes('quality') ||
             name.includes('goal') || name.includes('objective')) {
    return 'Mission & Values';
  } else {
    return 'Other';
  }
}

// Production GPT-5-mini integration for variable enhancement
async function enhanceVariableMetadata(variables, promptContext) {
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
    console.log('🤖 Calling GPT-5-mini for variable enhancement...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY || process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',  // Optimized for cost and performance
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 3000,
        reasoning_effort: 'minimal'  // Fastest, cheapest for our use case
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GPT-5-mini API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`✅ GPT-5-mini response received (${data.usage?.total_tokens} tokens, ${data.usage?.completion_tokens_details?.reasoning_tokens || 0} reasoning tokens)`);
    
    const rawContent = data.choices[0].message.content;
    
    let result;
    try {
      // Extract JSON from response (handle any extra content)
      let jsonContent = rawContent;
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonContent = jsonMatch[0];
      }
      
      result = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError.message);
      console.log('📝 Raw content:', rawContent.substring(0, 500));
      throw new Error(`Failed to parse GPT-5-mini JSON response: ${parseError.message}`);
    }

    return {
      enhancedVariables: result.enhancedVariables || [],
      additionalDocuments: result.additionalDocuments || [],
      confidence: result.confidence || 0.8,
      modelUsed: 'gpt-5-mini',
      tokensUsed: data.usage?.total_tokens || 0,
      reasoningTokens: data.usage?.completion_tokens_details?.reasoning_tokens || 0
    };

  } catch (error) {
    console.error('❌ Variable enhancement error:', error.message);
    throw error;
  }
}

// Find all markdown template files
function findAllTemplateFiles(dir) {
  const files = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return files;
}

// Main production function
async function runFullMetadataEnhancement() {
  console.log('🚀 Starting Full Prompt Metadata Enhancement...\n');

  // Check for OpenAI API key
  const apiKey = process.env.OPENAI_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OpenAI API key not found. Please set OPENAI_KEY or OPENAI_API_KEY environment variable.');
    console.log('💡 Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI')));
    process.exit(1);
  }
  
  console.log('✅ OpenAI API key found, proceeding with enhancement...');

  const templateDir = 'context/pages_nonprofit_ai_templates';
  
  if (!fs.existsSync(templateDir)) {
    console.error(`❌ Template directory not found: ${templateDir}`);
    process.exit(1);
  }

  console.log('📁 Scanning all template files...');
  const allTemplateFiles = findAllTemplateFiles(templateDir);
  
  console.log(`📋 Found ${allTemplateFiles.length} template files to process`);
  console.log('🔄 Extracting variables from all templates...\n');

  const allVariables = new Map();
  const promptResults = [];
  let totalVariableInstances = 0;

  // Extract variables from all template files
  for (let i = 0; i < allTemplateFiles.length; i++) {
    const filePath = allTemplateFiles[i];
    
    try {
      if (i % 50 === 0) {
        console.log(`📊 Progress: ${i}/${allTemplateFiles.length} files processed`);
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const variables = extractAndNormalizeVariables(content);
      
      totalVariableInstances += variables.length;
      
      variables.forEach(variable => {
        const key = variable.name;
        if (!allVariables.has(key)) {
          allVariables.set(key, {
            ...variable,
            category: categorizeVariable(variable.name, variable.basePattern),
            promptFiles: [filePath],
            usageExamples: []
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
      console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
    }
  }

  console.log('\n📊 Variable Extraction Complete:');
  console.log(`   Templates processed: ${allTemplateFiles.length}`);
  console.log(`   Unique variables found: ${allVariables.size}`);
  console.log(`   Total variable instances: ${totalVariableInstances}`);

  // Prepare variables for AI enhancement
  const variablesToEnhance = Array.from(allVariables.values());
  
  console.log(`\n🤖 Starting AI enhancement for ${variablesToEnhance.length} variables...`);
  console.log('💡 Using GPT-5-mini with minimal reasoning for optimal cost/performance\n');
  
  const batchSize = 15; // Process variables in batches
  const enhancedVariables = [];
  let totalTokensUsed = 0;
  let totalReasoningTokens = 0;
  let batchErrors = 0;

  for (let i = 0; i < variablesToEnhance.length; i += batchSize) {
    const batch = variablesToEnhance.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(variablesToEnhance.length / batchSize);
    
    console.log(`🔄 Processing batch ${batchNum}/${totalBatches} (${batch.length} variables)...`);
    
    try {
      const result = await enhanceVariableMetadata(
        batch,
        `Production batch ${batchNum}/${totalBatches} processing ${batch.length} variables from nonprofit prompt templates`
      );
      
      enhancedVariables.push(...result.enhancedVariables);
      totalTokensUsed += result.tokensUsed;
      totalReasoningTokens += result.reasoningTokens;
      
      console.log(`   ✅ Batch completed: ${result.enhancedVariables.length} variables enhanced, confidence: ${result.confidence}`);
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < variablesToEnhance.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`   ❌ Batch ${batchNum} failed:`, error.message);
      batchErrors++;
      
      // Add fallback data for failed variables
      batch.forEach(variable => {
        enhancedVariables.push({
          name: variable.name,
          description: `${variable.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} for nonprofit template`,
          examples: ['Example 1', 'Example 2', 'Example 3'],
          category: variable.category,
          suggestedInputType: 'text',
          validationRules: ['required'],
          error: 'AI enhancement failed - using fallback'
        });
      });
    }
  }

  // Generate final results
  const finalResults = {
    completionDate: new Date().toISOString(),
    summary: {
      templatesProcessed: allTemplateFiles.length,
      uniqueVariables: allVariables.size,
      variablesEnhanced: enhancedVariables.length,
      batchErrors: batchErrors,
      totalTokensUsed: totalTokensUsed,
      totalReasoningTokens: totalReasoningTokens,
      estimatedCost: `$${((totalTokensUsed / 1000000) * 2.25).toFixed(4)}` // Rough estimate
    },
    extractedVariables: Array.from(allVariables.entries()).map(([name, data]) => ({
      name,
      basePattern: data.basePattern,
      isNumbered: data.isNumbered,
      maxNumber: data.maxNumber,
      category: data.category,
      usageCount: data.promptFiles.length,
      promptFiles: data.promptFiles.map(f => f.replace(templateDir + '/', ''))
    })),
    enhancedVariables: enhancedVariables,
    promptResults: promptResults
  };

  // Save results
  const outputDir = 'context/production_results';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const resultsPath = path.join(outputDir, 'full_metadata_enhancement.json');
  fs.writeFileSync(resultsPath, JSON.stringify(finalResults, null, 2));

  console.log('\n🎉 Full Metadata Enhancement Complete!');
  console.log(`📄 Results saved to: ${resultsPath}`);
  console.log('\n📊 Final Summary:');
  console.log(`   ✅ Templates processed: ${finalResults.summary.templatesProcessed}`);
  console.log(`   ✅ Unique variables: ${finalResults.summary.uniqueVariables}`);  
  console.log(`   ✅ Variables enhanced: ${finalResults.summary.variablesEnhanced}`);
  console.log(`   ✅ Total tokens used: ${finalResults.summary.totalTokensUsed.toLocaleString()}`);
  console.log(`   ✅ Reasoning tokens: ${finalResults.summary.totalReasoningTokens} (${((finalResults.summary.totalReasoningTokens/finalResults.summary.totalTokensUsed)*100).toFixed(1)}%)`);
  console.log(`   ✅ Estimated cost: ${finalResults.summary.estimatedCost}`);
  
  if (batchErrors > 0) {
    console.log(`   ⚠️  Batch errors: ${batchErrors} (fallback data used)`);
  }

  console.log('\n🚀 Next Steps:');
  console.log('   1. Review the results in the JSON file');
  console.log('   2. Deploy schema changes to Convex if not already done');
  console.log('   3. Use the enhanced metadata to build dynamic forms');
  console.log('   4. Consider running additional batches if there were errors');

  return finalResults;
}

// Run the enhancement if this file is executed directly
if (require.main === module) {
  runFullMetadataEnhancement().catch(error => {
    console.error('❌ Full enhancement failed:', error);
    process.exit(1);
  });
}

module.exports = { runFullMetadataEnhancement, enhanceVariableMetadata };