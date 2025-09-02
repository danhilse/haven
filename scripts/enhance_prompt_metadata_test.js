#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test script for prompt metadata enhancement - processes 5-10 sample prompts first
console.log('🧪 Starting Prompt Metadata Enhancement Test Phase...\n');

// Function to extract and normalize variables with smart deduplication
function extractAndNormalizeVariables(content) {
  const variables = new Map(); // Store normalized variables
  const numberedPatterns = new Map(); // Track numbered patterns
  
  // Split content into sections to identify <OUTPUT> blocks
  const lines = content.split('\n');
  let insideOutputBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if we're entering an OUTPUT block
    if (line.match(/^<OUTPUT>/i)) {
      insideOutputBlock = true;
      continue;
    }
    
    // Check if we're exiting an OUTPUT block
    if (line.match(/^<\/OUTPUT>/i)) {
      insideOutputBlock = false;
      continue;
    }
    
    // Skip lines inside OUTPUT blocks
    if (insideOutputBlock) {
      continue;
    }
    
    // Extract variables wrapped in square brackets
    const matches = line.match(/\[([A-Z_][A-Z0-9_]*)\]/g);
    if (matches) {
      matches.forEach(match => {
        const variable = match.slice(1, -1); // Remove brackets
        
        // Check if this is a numbered variable (ends with _NUMBER)
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
          // Regular variable (not numbered)
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
  
  // Convert numbered patterns to normalized variables
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

// Function to categorize variables based on naming patterns
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

// Function to select test prompts from different categories
function selectTestPrompts(templateDir) {
  // Manually curate test prompts to ensure good diversity and numbered variable testing
  const testPrompts = [
    // Test numbered variables
    'Sort_and_Scan/Application_&_Candidate_Screening/Program_participant_selection_low.md',
    'Sort_and_Scan/Quality_Assessment_&_Scoring/Program_proposal_evaluation_and_feedback_medium.md',
    
    // Test different categories
    'Answer_and_Assist/FAQ_&_Knowledge_Base_Responses/Board_member_questions_about_governance_high.md',
    'Automate_the_Admin/Automated_Communications/Appointment_scheduling_and_calendar_management_high.md',
    'Build_your_Brand/Social_Media_Management/Multi-platform_social_media_calendar_planning_medium.md',
    'Fundraise_and_Engage/Donor_Communications/Major_donor_thank_you_letter_high.md',
    'Help_Hub/Legal_&_Compliance/Board_governance_policy_review_medium.md',
    'Ideate_and_Improve/Strategic_Planning/Annual_impact_assessment_and_planning_high.md'
  ];
  
  const validPaths = [];
  
  for (const relativePath of testPrompts) {
    const fullPath = path.join(templateDir, relativePath);
    if (fs.existsSync(fullPath)) {
      validPaths.push(fullPath);
    }
  }
  
  // If we can't find our curated list, fall back to automatic selection
  if (validPaths.length < 4) {
    const categories = ['Answer_and_Assist', 'Automate_the_Admin', 'Sort_and_Scan', 'Build_your_Brand'];
    
    for (const category of categories) {
      const categoryPath = path.join(templateDir, category);
      if (fs.existsSync(categoryPath)) {
        const subcategories = fs.readdirSync(categoryPath);
        
        for (let i = 0; i < Math.min(2, subcategories.length); i++) {
          const subcategory = subcategories[i];
          const subcategoryPath = path.join(categoryPath, subcategory);
          
          if (fs.statSync(subcategoryPath).isDirectory()) {
            const files = fs.readdirSync(subcategoryPath).filter(f => f.endsWith('.md'));
            if (files.length > 0) {
              const selectedFile = files[0];
              const fullPath = path.join(subcategoryPath, selectedFile);
              if (!validPaths.includes(fullPath)) {
                validPaths.push(fullPath);
              }
              
              if (validPaths.length >= 8) break;
            }
          }
        }
      }
      if (validPaths.length >= 8) break;
    }
  }
  
  return validPaths.slice(0, 8); // Ensure we have at most 8 test prompts
}

// Main test function
async function runTest() {
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
  
  const allVariables = new Map(); // Deduplicated across all test prompts
  const promptResults = [];
  
  // Process each test prompt
  for (const filePath of testPrompts) {
    try {
      console.log(`🔍 Processing: ${path.basename(filePath)}`);
      const content = fs.readFileSync(filePath, 'utf8');
      const variables = extractAndNormalizeVariables(content);
      
      console.log(`   Found ${variables.length} unique variables`);
      
      // Add to global variable tracking
      variables.forEach(variable => {
        const key = variable.name;
        if (!allVariables.has(key)) {
          allVariables.set(key, {
            ...variable,
            category: categorizeVariable(variable.name, variable.basePattern),
            promptFiles: [filePath],
            examples: [], // Will be filled by AI
            description: '' // Will be filled by AI
          });
        } else {
          // Add this prompt to the variable's usage list
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
  
  // Generate test results summary
  console.log('\n📊 Test Results Summary:');
  console.log(`   Total prompts processed: ${promptResults.length}`);
  console.log(`   Unique variables found: ${allVariables.size}`);
  
  // Show variable categories
  const categoryStats = {};
  allVariables.forEach(variable => {
    const category = variable.category;
    categoryStats[category] = (categoryStats[category] || 0) + 1;
  });
  
  console.log('\n📋 Variables by Category:');
  Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count} variables`);
    });
  
  // Show most common variables
  const sortedVariables = Array.from(allVariables.values())
    .sort((a, b) => b.promptFiles.length - a.promptFiles.length);
  
  console.log('\n🔝 Top Variables (by usage across test prompts):');
  sortedVariables.slice(0, 10).forEach((variable, index) => {
    const usageCount = variable.promptFiles.length;
    const numberedInfo = variable.isNumbered ? ` (numbered 1-${variable.maxNumber})` : '';
    console.log(`   ${index + 1}. ${variable.name}${numberedInfo} - used in ${usageCount} prompts`);
  });
  
  // Show numbered variable examples
  const numberedVariables = sortedVariables.filter(v => v.isNumbered);
  if (numberedVariables.length > 0) {
    console.log('\n🔢 Numbered Variable Examples:');
    numberedVariables.slice(0, 5).forEach(variable => {
      console.log(`   ${variable.name} (base: ${variable.basePattern}, max: ${variable.maxNumber})`);
    });
  }
  
  // Save detailed test results
  const testResults = {
    testDate: new Date().toISOString(),
    promptsProcessed: promptResults.length,
    uniqueVariables: allVariables.size,
    categoryStats,
    variables: Array.from(allVariables.entries()).map(([name, data]) => ({
      name,
      basePattern: data.basePattern,
      isNumbered: data.isNumbered,
      maxNumber: data.maxNumber,
      category: data.category,
      usageCount: data.promptFiles.length,
      promptFiles: data.promptFiles.map(f => f.replace(templateDir + '/', ''))
    })),
    promptResults
  };
  
  // Ensure test results directory exists
  const testResultsDir = 'context/test_results';
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }
  
  // Save results
  const resultsPath = path.join(testResultsDir, 'metadata_enhancement_test.json');
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  
  console.log(`\n✅ Test completed successfully!`);
  console.log(`📄 Detailed results saved to: ${resultsPath}`);
  console.log('\n🚀 Next Steps:');
  console.log('   1. Review the test results above');
  console.log('   2. Verify variable deduplication is working correctly');
  console.log('   3. Check that numbered variables are properly normalized');
  console.log('   4. If satisfied, proceed to GPT-5 integration for AI enhancement');
  
  return testResults;
}

// Run the test
if (require.main === module) {
  runTest().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { extractAndNormalizeVariables, categorizeVariable, selectTestPrompts };