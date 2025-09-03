#!/usr/bin/env node

// Simple test to verify grouping functionality with explicit examples

async function testGroupingLogic() {
  console.log('🧪 Testing Variable Grouping Logic...\n');
  
  // Test variables that should clearly be grouped
  const testVariables = [
    'DONOR_NAME', 'DONOR_EMAIL', 'DONOR_PHONE', // contact_info group
    'PROGRAM_NAME', 'PROGRAM_LOCATION', 'PROGRAM_DATE', // program_details group  
    'DOCUMENT_BUDGET', 'DOCUMENT_REPORT', 'DOCUMENT_PROPOSAL' // documents group
  ];
  
  const systemPrompt = `You are an expert in nonprofit communication templates and user experience design. Your task is to analyze template variables and generate user-friendly questions and metadata.

For each variable, create:
1. A conversational question that guides the user (not just a label)
2. Appropriate input type based on the expected content
3. Realistic examples specific to nonprofits
4. Whether the field should be required
5. Smart grouping for related variables that should be shown together

Variable grouping guidelines:
- Only group variables that are clearly related and make sense to ask together
- Use conservative grouping - when in doubt, keep variables separate
- Common groupings: "contact_info" (name, email, phone), "program_details" (location, date, time), "financial" (budget, costs, ROI), "documents" (all document uploads)
- Keep grouping names short and descriptive
- Variables without clear relationships should have no grouping (null/undefined)

CRITICAL: Respond with ONLY valid JSON. No additional text.`;

  const userPrompt = `Analyze these nonprofit template variables for the prompt "Test Grouping":

Context: This is a test to verify variable grouping works correctly.

Variables to enhance:
${JSON.stringify(testVariables, null, 2)}

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
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_completion_tokens: 3000,
        reasoning_effort: 'low',
        verbosity: 'medium',
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error Details:', JSON.stringify(errorData, null, 2));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    console.log('🎉 GROUPING TEST RESULTS:');
    result.enhancedVariables.forEach((variable, index) => {
      console.log(`\\n${index + 1}. ${variable.name}:`);
      console.log(`   Question: ${variable.questionPrompt}`);
      console.log(`   Type: ${variable.inputType}`);
      console.log(`   Grouping: ${variable.grouping || 'none'}`);
      console.log(`   Required: ${variable.isRequired}`);
    });
    
    // Check if grouping worked as expected
    const contactFields = result.enhancedVariables.filter(v => v.grouping === 'contact_info');
    const programFields = result.enhancedVariables.filter(v => v.grouping === 'program_details');
    const documentFields = result.enhancedVariables.filter(v => v.grouping === 'documents');
    
    console.log('\\n📊 GROUPING ANALYSIS:');
    console.log(`   Contact Info Group: ${contactFields.length} variables`);
    console.log(`   Program Details Group: ${programFields.length} variables`);
    console.log(`   Documents Group: ${documentFields.length} variables`);
    console.log(`   Ungrouped: ${result.enhancedVariables.length - contactFields.length - programFields.length - documentFields.length} variables`);
    
    if (contactFields.length >= 2 && documentFields.length >= 2) {
      console.log('\\n✅ GROUPING WORKING CORRECTLY');
      console.log('   AI is successfully grouping related variables');
    } else {
      console.log('\\n⚠️  GROUPING NEEDS IMPROVEMENT');
      console.log('   AI is not consistently grouping related variables');
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Grouping test failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  // Set environment variables if not already set
  if (!process.env.OPENAI_KEY) {
    process.env.OPENAI_KEY = 'REDACTED_API_KEY';
  }
  
  testGroupingLogic().catch(error => {
    console.error('❌ Grouping test script failed:', error);
    process.exit(1);
  });
}

module.exports = { testGroupingLogic };