#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to recursively find all markdown files
function findMarkdownFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findMarkdownFiles(fullPath, files);
    } else if (item.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to extract input variables from template content
function extractInputVariables(content) {
  const variables = new Set();
  
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
        // Remove the brackets and add to our set
        const variable = match.slice(1, -1);
        variables.add(variable);
      });
    }
  }
  
  return Array.from(variables);
}

// Function to process all template files
async function analyzeTemplates() {
  console.log('🔍 Analyzing template files for input variables...');
  
  // Find all template files
  const templateDir = 'context/pages_nonprofit_ai_templates';
  const templateFiles = findMarkdownFiles(templateDir);
  
  console.log(`📁 Found ${templateFiles.length} template files`);
  
  const variableCount = {};
  const variableFiles = {};
  let totalFiles = 0;
  let filesWithVariables = 0;
  
  // Process each template file
  for (const filePath of templateFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const variables = extractInputVariables(content);
      
      totalFiles++;
      
      if (variables.length > 0) {
        filesWithVariables++;
        
        // Count occurrences and track files
        variables.forEach(variable => {
          if (!variableCount[variable]) {
            variableCount[variable] = 0;
            variableFiles[variable] = [];
          }
          variableCount[variable]++;
          variableFiles[variable].push(filePath);
        });
      }
      
      console.log(`✅ ${path.basename(filePath)}: ${variables.length} variables`);
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  // Sort variables by frequency
  const sortedVariables = Object.entries(variableCount)
    .sort(([,a], [,b]) => b - a)
    .map(([variable, count]) => ({
      variable,
      count,
      files: variableFiles[variable]
    }));
  
  return {
    totalFiles,
    filesWithVariables,
    variables: sortedVariables
  };
}

// Function to generate the report
function generateReport(analysis) {
  const { totalFiles, filesWithVariables, variables } = analysis;
  
  let report = `# Input Variables Analysis Report\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  report += `## Summary\n\n`;
  report += `- **Total template files analyzed**: ${totalFiles}\n`;
  report += `- **Files with input variables**: ${filesWithVariables}\n`;
  report += `- **Unique input variables found**: ${variables.length}\n`;
  report += `- **Total variable occurrences**: ${variables.reduce((sum, v) => sum + v.count, 0)}\n\n`;
  
  report += `## Variable Usage Frequency\n\n`;
  report += `Variables are listed in order of frequency of use across all templates.\n\n`;
  
  variables.forEach(({ variable, count, files }, index) => {
    report += `### ${index + 1}. ${variable}\n`;
    report += `- **Occurrences**: ${count}\n`;
    report += `- **Used in**: ${count} template${count !== 1 ? 's' : ''}\n\n`;
    
    if (count <= 10) { // Only show file list for variables used 10 times or fewer
      report += `**Files:**\n`;
      files.forEach(file => {
        const relativePath = file.replace('context/pages_nonprofit_ai_templates/', '');
        report += `- ${relativePath}\n`;
      });
      report += `\n`;
    } else {
      report += `*(Too many files to list - used in ${count} templates)*\n\n`;
    }
  });
  
  // Add a section for most common variables
  report += `## Most Common Variables (Top 20)\n\n`;
  report += `| Rank | Variable | Count | Usage Description |\n`;
  report += `|------|----------|-------|------------------|\n`;
  
  variables.slice(0, 20).forEach(({ variable, count }, index) => {
    // Try to infer what the variable is used for
    let description = 'Unknown';
    if (variable.includes('ORGANIZATION')) description = 'Organization identification';
    else if (variable.includes('PROGRAM')) description = 'Program/service reference';
    else if (variable.includes('NAME')) description = 'Name field';
    else if (variable.includes('DATE')) description = 'Date/time reference';
    else if (variable.includes('EVENT')) description = 'Event reference';
    else if (variable.includes('CONTACT')) description = 'Contact information';
    else if (variable.includes('EMAIL')) description = 'Email address';
    else if (variable.includes('PHONE')) description = 'Phone number';
    else if (variable.includes('ADDRESS')) description = 'Address information';
    else if (variable.includes('BUDGET') || variable.includes('AMOUNT')) description = 'Financial amount';
    else if (variable.includes('BOARD')) description = 'Board/governance related';
    else if (variable.includes('VOLUNTEER')) description = 'Volunteer management';
    else if (variable.includes('DONOR')) description = 'Donor/fundraising related';
    else if (variable.includes('CLIENT') || variable.includes('PARTICIPANT')) description = 'Service recipient';
    else if (variable.includes('STAFF') || variable.includes('EMPLOYEE')) description = 'Staff/HR related';
    
    report += `| ${index + 1} | \`${variable}\` | ${count} | ${description} |\n`;
  });
  
  report += `\n## Variable Categories\n\n`;
  
  // Group variables by category
  const categories = {
    'Organization Identity': [],
    'Programs & Services': [],
    'People & Contacts': [],
    'Events & Activities': [],
    'Financial': [],
    'Dates & Times': [],
    'Communications': [],
    'Other': []
  };
  
  variables.forEach(({ variable, count }) => {
    if (variable.includes('ORGANIZATION')) {
      categories['Organization Identity'].push({ variable, count });
    } else if (variable.includes('PROGRAM') || variable.includes('SERVICE')) {
      categories['Programs & Services'].push({ variable, count });
    } else if (variable.includes('NAME') || variable.includes('CONTACT') || variable.includes('EMAIL') || 
               variable.includes('PHONE') || variable.includes('ADDRESS') || variable.includes('PERSON') ||
               variable.includes('STAFF') || variable.includes('VOLUNTEER') || variable.includes('DONOR') ||
               variable.includes('CLIENT') || variable.includes('PARTICIPANT') || variable.includes('BOARD')) {
      categories['People & Contacts'].push({ variable, count });
    } else if (variable.includes('EVENT') || variable.includes('MEETING') || variable.includes('ACTIVITY')) {
      categories['Events & Activities'].push({ variable, count });
    } else if (variable.includes('BUDGET') || variable.includes('AMOUNT') || variable.includes('COST') ||
               variable.includes('PRICE') || variable.includes('FINANCIAL') || variable.includes('FUND')) {
      categories['Financial'].push({ variable, count });
    } else if (variable.includes('DATE') || variable.includes('TIME') || variable.includes('DEADLINE') ||
               variable.includes('SCHEDULE')) {
      categories['Dates & Times'].push({ variable, count });
    } else if (variable.includes('EMAIL') || variable.includes('MESSAGE') || variable.includes('COMMUNICATION') ||
               variable.includes('NEWSLETTER') || variable.includes('SOCIAL')) {
      categories['Communications'].push({ variable, count });
    } else {
      categories['Other'].push({ variable, count });
    }
  });
  
  Object.entries(categories).forEach(([category, vars]) => {
    if (vars.length > 0) {
      report += `### ${category}\n`;
      vars.sort((a, b) => b.count - a.count).forEach(({ variable, count }) => {
        report += `- \`${variable}\` (${count})\n`;
      });
      report += `\n`;
    }
  });
  
  report += `## Recommendations\n\n`;
  report += `Based on this analysis, consider implementing the following input field types:\n\n`;
  report += `1. **Organization Profile Fields**: Create reusable fields for organization name, mission, contact info\n`;
  report += `2. **Program/Service Fields**: Standard fields for program names, descriptions, and details\n`;
  report += `3. **Contact Information Fields**: Standardized contact fields that can be reused\n`;
  report += `4. **Date/Time Fields**: Date pickers and time inputs for scheduling\n`;
  report += `5. **Financial Fields**: Currency inputs for amounts and budgets\n`;
  report += `6. **Text Area Fields**: For longer descriptions and details\n\n`;
  report += `Variables used only once or twice may represent template-specific needs that require custom input fields.\n`;
  
  return report;
}

// Main execution
async function main() {
  try {
    // Ensure analysis directory exists
    const analysisDir = 'context/analysis';
    if (!fs.existsSync(analysisDir)) {
      fs.mkdirSync(analysisDir, { recursive: true });
    }
    
    // Run analysis
    const analysis = await analyzeTemplates();
    
    // Generate report
    const report = generateReport(analysis);
    
    // Write report to file
    const outputPath = path.join(analysisDir, 'INPUT_VARIABLES.md');
    fs.writeFileSync(outputPath, report);
    
    console.log(`\n✅ Analysis complete!`);
    console.log(`📊 Found ${analysis.variables.length} unique variables across ${analysis.totalFiles} templates`);
    console.log(`📄 Report saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

main();