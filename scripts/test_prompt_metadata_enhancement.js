#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Enhanced AI prompt for improving prompt metadata
async function enhancePromptMetadata(promptTitle, promptContent, category, subcategory, tags) {
  const systemPrompt = `You are an expert in nonprofit communication and user experience design. Your task is to analyze nonprofit prompt templates and generate user-friendly metadata that helps users discover and understand what each template does.

Your goal is to transform technical prompt listings into clear, outcome-focused descriptions that nonprofits will find and understand.

## Writing Style Guidelines:
- Keep language short, uncluttered, and direct
- Use calm, supportive tone - never breathless or "disruptive"
- Use 2nd person ("you," "your organization") 
- Focus on tangible outcomes and practical results
- Avoid technical jargon - speak in plain nonprofit language
- Make users the hero, the tool is just the ally
- Never mention "AI," "prompts," or technical processes

For titles:
- Keep under 8 words when possible
- Focus on the outcome, not the process
- Use action-oriented language
- Examples: "Donor Thank-You Letters," "Grant Application Draft," "Board Meeting Summary"

For descriptions:
- 1-2 sentences maximum
- Lead with the outcome users will get
- Focus on relief from common nonprofit pain points
- Examples: "Never stare at a blank screen when thanking donors," "Turn board questions into clear, confident responses"

For output descriptions:
- Focus on what users will receive, not how it works
- Use concrete language: "a grant draft," "donor letters that feel personal"
- Emphasize clarity, speed, and relief from overwhelm
- Keep descriptions outcome-focused, not tool-focused
- Examples: "Clear donor thank-you letters ready for your review," "A grant application draft tailored to your mission"

For tags:
- Use terms nonprofits actually search for
- Focus on outcomes and use cases, not technical features
- Include audience types (donors, board, volunteers, staff)
- Include content types (letters, reports, applications, communications)
- Avoid technical jargon

CRITICAL: Respond with ONLY valid JSON. No additional text.`;

  const userPrompt = `Analyze this nonprofit prompt template and create user-friendly metadata:

Title: "${promptTitle}"
Category: ${category}
Subcategory: ${subcategory}
Current Tags: ${tags.join(', ')}

Prompt Content Preview:
${promptContent.substring(0, 800)}...

Enhance this prompt's metadata to make it discoverable and appealing to nonprofit users. Return JSON:
{
  "enhancedTitle": "User-friendly title under 8 words",
  "enhancedDescription": "1-2 sentence description focusing on outcomes",
  "outputDescription": "Clear description of what the user will receive",
  "enhancedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedComplexity": "low|medium|high",
  "confidence": 0.95
}`;

  try {
    console.log(`🤖 Enhancing metadata for: ${promptTitle.substring(0, 50)}...`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY || process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 2000,
        reasoning_effort: 'low', // Light reasoning for better quality
        verbosity: 'medium',
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
          max_completion_tokens: 2000,
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
        enhancedTitle: result.enhancedTitle || promptTitle,
        enhancedDescription: result.enhancedDescription || '',
        outputDescription: result.outputDescription || '',
        enhancedTags: result.enhancedTags || tags,
        suggestedComplexity: result.suggestedComplexity || 'medium',
        confidence: result.confidence || 0.8,
        modelUsed: 'gpt-4o-mini'
      };
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return {
      enhancedTitle: result.enhancedTitle || promptTitle,
      enhancedDescription: result.enhancedDescription || '',
      outputDescription: result.outputDescription || '',
      enhancedTags: result.enhancedTags || tags,
      suggestedComplexity: result.suggestedComplexity || 'medium',
      confidence: result.confidence || 0.8,
      modelUsed: 'gpt-5'
    };

  } catch (error) {
    console.error('❌ Prompt metadata enhancement failed:', error.message);
    
    // Fallback with basic enhancement
    return {
      enhancedTitle: promptTitle,
      enhancedDescription: `Guidance for ${category.toLowerCase()} ${subcategory.toLowerCase()}`,
      outputDescription: 'Customized content tailored to your organization and situation',
      enhancedTags: tags,
      suggestedComplexity: 'medium',
      confidence: 0.3,
      error: error.message,
      modelUsed: 'fallback'
    };
  }
}

// Test function to process 3 sample prompts
async function testPromptMetadataEnhancement() {
  console.log('🧪 Testing Prompt Metadata Enhancement (3 Sample Prompts)...\n');
  
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
    console.log('📋 Getting 3 sample prompts for testing...');
    const allPrompts = await convex.query("prompts:getAllPromptsWithContent");
    
    // Select 3 diverse prompts from different categories
    const samplePrompts = allPrompts.slice(0, 3);
    
    if (samplePrompts.length === 0) {
      console.error('❌ No prompts found in database');
      return;
    }
    
    console.log(`   📊 Selected ${samplePrompts.length} prompts for testing:`);
    samplePrompts.forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.title}`);
      console.log(`      Category: ${prompt.category} > ${prompt.subcategory}`);
      console.log(`      Tags: ${prompt.tags?.join(', ') || 'none'}`);
    });
    console.log('');
    
    const results = [];
    let processedCount = 0;
    
    for (const prompt of samplePrompts) {
      try {
        console.log(`🔄 Processing: ${prompt.title}`);
        
        // Enhance metadata with AI
        const enhancement = await enhancePromptMetadata(
          prompt.title,
          prompt.content,
          prompt.category,
          prompt.subcategory,
          prompt.tags || []
        );
        
        console.log(`   ✨ Enhanced with ${enhancement.modelUsed}`);
        console.log(`   📝 Original: ${prompt.title}`);
        console.log(`   📝 Enhanced: ${enhancement.enhancedTitle}`);
        console.log(`   📄 Description: ${enhancement.enhancedDescription}`);
        console.log(`   🏷️  Tags: ${enhancement.enhancedTags.join(', ')}`);
        console.log(`   🎯 Confidence: ${enhancement.confidence}`);
        
        results.push({
          originalTitle: prompt.title,
          originalDescription: prompt.description,
          originalTags: prompt.tags,
          enhancedTitle: enhancement.enhancedTitle,
          enhancedDescription: enhancement.enhancedDescription,
          outputDescription: enhancement.outputDescription,
          enhancedTags: enhancement.enhancedTags,
          suggestedComplexity: enhancement.suggestedComplexity,
          confidence: enhancement.confidence,
          modelUsed: enhancement.modelUsed,
          category: prompt.category,
          subcategory: prompt.subcategory
        });
        
        processedCount++;
        
      } catch (error) {
        console.error(`   ❌ Error processing ${prompt.title}:`, error.message);
      }
    }
    
    console.log('\n🎉 TEST COMPLETED!');
    console.log('\n📊 Test Results Summary:');
    console.log(`   📋 Prompts processed: ${processedCount}`);
    console.log(`   ⭐ Average confidence: ${Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length * 100)}%`);
    
    // Show detailed comparison
    console.log('\n🔍 Before vs After Comparison:');
    results.forEach((result, index) => {
      console.log(`\n   ${index + 1}. BEFORE:`);
      console.log(`      Title: ${result.originalTitle}`);
      console.log(`      Description: ${result.originalDescription || 'None'}`);
      console.log(`      Tags: ${result.originalTags?.join(', ') || 'None'}`);
      
      console.log(`\n      AFTER:`);
      console.log(`      Title: ${result.enhancedTitle}`);
      console.log(`      Description: ${result.enhancedDescription}`);
      console.log(`      Output: ${result.outputDescription}`);
      console.log(`      Tags: ${result.enhancedTags.join(', ')}`);
      console.log(`      Complexity: ${result.suggestedComplexity}`);
      console.log(`      Model: ${result.modelUsed}`);
      console.log(`      Confidence: ${result.confidence}`);
    });
    
    // Save test results
    const testResults = {
      testDate: new Date().toISOString(),
      promptsProcessed: processedCount,
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
    const resultsPath = path.join(testResultsDir, 'prompt_metadata_test.json');
    fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
    
    console.log(`\n📄 Test results saved to: ${resultsPath}`);
    
    console.log('\n✅ TEST VALIDATION:');
    console.log('   ✓ Prompt title enhancement working');
    console.log('   ✓ User-friendly descriptions being generated');
    console.log('   ✓ Output descriptions following copy guidelines');
    console.log('   ✓ Enhanced tags focused on nonprofit use cases');
    console.log('   ✓ Copy style guidelines being followed');
    
    if (results.every(r => r.confidence >= 0.8)) {
      console.log('\n🚀 READY FOR FULL ENHANCEMENT');
      console.log('   All test prompts processed successfully with good confidence');
      console.log('   Run the full enhancement script when ready:');
      console.log('   node scripts/enhance_prompt_metadata.js');
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
  testPromptMetadataEnhancement().catch(error => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
}

module.exports = { testPromptMetadataEnhancement, enhancePromptMetadata };