#!/usr/bin/env node

const { ConvexHttpClient } = require("convex/browser");
const fs = require('fs');
const path = require('path');

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

// Parse markdown files properly
function parseTemplateFile(filePath, content) {
  const lines = content.split('\n');
  let title = '';
  let category = '';
  let subcategory = '';
  let complexity = '';
  let templateContent = '';
  
  // Extract metadata from the header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('# ') && !title) {
      // Title is the first heading, extract complexity from it
      const titleLine = line.substring(2).trim();
      const complexityMatch = titleLine.match(/- (low|medium|high) complexity/i);
      if (complexityMatch) {
        complexity = complexityMatch[1].toLowerCase();
        title = titleLine.replace(/ - (low|medium|high) complexity/i, '').trim();
      } else {
        title = titleLine;
      }
    }
    
    if (line.startsWith('**Category:**')) {
      category = line.replace('**Category:**', '').trim();
    }
    
    if (line.startsWith('**Template Type:**')) {
      subcategory = line.replace('**Template Type:**', '').trim();
    }
    
    if (line.startsWith('**Complexity:**')) {
      complexity = line.replace('**Complexity:**', '').trim().toLowerCase();
    }
    
    // Look for template content in code blocks
    if (line === '```' && templateContent === '') {
      // Start of template content
      i++; // Skip the opening ```
      const templateLines = [];
      while (i < lines.length && lines[i] !== '```') {
        templateLines.push(lines[i]);
        i++;
      }
      templateContent = templateLines.join('\n').trim();
      break;
    }
  }
  
  // Fallback: if no code block found, use everything after the metadata
  if (!templateContent) {
    const templateStartIndex = lines.findIndex(line => line === '## Template');
    if (templateStartIndex !== -1) {
      templateContent = lines.slice(templateStartIndex + 1).join('\n').trim();
    }
  }
  
  // Extract filename-based info as fallback
  const fileName = path.basename(filePath, '.md');
  const filenameParts = fileName.split('_');
  const filenameComplexity = filenameParts[filenameParts.length - 1];
  
  if (!complexity && ['low', 'medium', 'high'].includes(filenameComplexity)) {
    complexity = filenameComplexity;
  }
  
  return {
    title: title || fileName.replace(/_/g, ' '),
    category: category || 'Uncategorized',
    subcategory: subcategory || 'General',
    complexity: complexity || 'medium',
    content: templateContent || content,
    originalPath: filePath
  };
}

// Get all template files
function getAllTemplateFiles() {
  const templatesDir = 'context/pages_nonprofit_ai_templates';
  const files = [];
  
  function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDirectory(templatesDir);
  return files;
}

// Extract tags from category and subcategory
function generateTags(category, subcategory) {
  const categoryTags = {
    'Automate the Admin': ['automation', 'administration', 'workflow'],
    'Engage Your Community': ['community', 'engagement', 'outreach'],
    'Enhance Program Impact': ['programs', 'impact', 'outcomes'],
    'Sort and Scan': ['analysis', 'review', 'assessment'],
    'Plan Your Path Forward': ['planning', 'strategy', 'development'],
    'Raise More Money': ['fundraising', 'donations', 'revenue']
  };
  
  const subcategoryTags = {
    'Repetitive Data Processing': ['data', 'processing', 'workflow'],
    'Communication Templates': ['communication', 'templates', 'messaging'],
    'Quality Assessment & Scoring': ['quality', 'assessment', 'evaluation'],
    'Strategic Planning': ['strategy', 'planning', 'goals'],
    'Grant Applications': ['grants', 'applications', 'funding']
  };
  
  const baseTags = ['fundraising', 'volunteers', 'governance', 'grants', 'programs', 
                   'client-services', 'human-resources', 'finance', 'reporting', 
                   'compliance', 'donors', 'board-members', 'staff', 'clients', 'community'];
  
  const tags = new Set(baseTags);
  
  if (categoryTags[category]) {
    categoryTags[category].forEach(tag => tags.add(tag));
  }
  
  if (subcategoryTags[subcategory]) {
    subcategoryTags[subcategory].forEach(tag => tags.add(tag));
  }
  
  return Array.from(tags);
}

// Extract variables from content
function extractVariables(content) {
  const variables = new Set();
  const matches = content.match(/\[([A-Z_][A-Z0-9_]*)\]/g);
  
  if (matches) {
    matches.forEach(match => {
      const variable = match.slice(1, -1); // Remove brackets
      variables.add(variable);
    });
  }
  
  return Array.from(variables);
}

async function clearExistingPrompts() {
  console.log('🗑️  Clearing existing prompts from database...');
  
  try {
    await convex.mutation("prompts:clearAllPrompts");
    console.log('✅ Existing prompts cleared');
  } catch (error) {
    console.error('❌ Error clearing prompts:', error.message);
    throw error;
  }
}

async function transferTemplates() {
  console.log('🚀 Starting Corrected Template Transfer\n');
  
  // Check environment
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    console.error('❌ NEXT_PUBLIC_CONVEX_URL not found in environment variables');
    process.exit(1);
  }
  
  console.log(`🔗 Using Convex URL: ${process.env.NEXT_PUBLIC_CONVEX_URL}\n`);
  
  // Clear existing prompts first
  await clearExistingPrompts();
  
  // Get all template files
  console.log('📁 Scanning template directory...');
  const templateFiles = getAllTemplateFiles();
  console.log(`📋 Found ${templateFiles.length} template files\n`);
  
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  
  for (const filePath of templateFiles) {
    try {
      console.log(`📄 Processing: ${filePath}`);
      
      // Read and parse the file
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = parseTemplateFile(filePath, content);
      
      console.log(`   Title: ${parsed.title}`);
      console.log(`   Category: ${parsed.category}`);
      console.log(`   Subcategory: ${parsed.subcategory}`);
      console.log(`   Complexity: ${parsed.complexity}`);
      
      // Generate tags and extract variables
      const tags = generateTags(parsed.category, parsed.subcategory);
      const variables = extractVariables(parsed.content);
      
      console.log(`   Variables: ${variables.length > 0 ? variables.join(', ') : 'None'}`);
      
      // Create the prompt in database
      const promptId = await convex.mutation("prompts:createPrompt", {
        title: parsed.title,
        content: parsed.content,
        category: parsed.category,
        subcategory: parsed.subcategory,
        complexity: parsed.complexity,
        tags: tags,
        description: `${parsed.title} (${parsed.complexity} complexity)`
      });
      
      console.log(`   ✅ Created with ID: ${promptId}\n`);
      successCount++;
      
    } catch (error) {
      console.error(`   ❌ Error processing ${filePath}:`, error.message);
      console.error(`   Stack: ${error.stack}\n`);
      errorCount++;
    }
    
    processedCount++;
    
    if (processedCount % 20 === 0) {
      console.log(`📊 Progress: ${processedCount}/${templateFiles.length} files processed`);
      console.log(`   ✅ Success: ${successCount}, ❌ Errors: ${errorCount}\n`);
    }
  }
  
  console.log('🎉 TEMPLATE TRANSFER COMPLETE!\n');
  console.log(`📊 Final Results:`);
  console.log(`   📁 Files processed: ${processedCount}`);
  console.log(`   ✅ Successfully transferred: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🚀 All templates transferred successfully!');
    console.log('💡 Next: Run the variable population script to add variable metadata');
  } else {
    console.log(`\n⚠️  ${errorCount} templates had errors. Please review the logs above.`);
  }
  
  return { processedCount, successCount, errorCount };
}

// Main execution
async function main() {
  try {
    await transferTemplates();
  } catch (error) {
    console.error('\n❌ Script failed:', error);
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

module.exports = { transferTemplates, parseTemplateFile, extractVariables };