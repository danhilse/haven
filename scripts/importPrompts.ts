import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';

// Load environment variables
config({ path: path.join(process.cwd(), '.env.local') });

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!CONVEX_URL) {
  throw new Error('NEXT_PUBLIC_CONVEX_URL environment variable is required');
}

const client = new ConvexHttpClient(CONVEX_URL);

interface TemplateMetadata {
  title: string;
  category: string;
  subcategory: string;
  complexity: 'low' | 'medium' | 'high';
  content: string;
  description: string;
  tags: string[];
}

// Parse filename to extract metadata
function parseFilename(filename: string): { title: string; complexity: 'low' | 'medium' | 'high' } {
  const nameWithoutExt = path.basename(filename, '.md');
  const parts = nameWithoutExt.split('_');
  const complexity = parts[parts.length - 1] as 'low' | 'medium' | 'high';
  const title = parts.slice(0, -1).join(' ').replace(/_/g, ' ');
  
  return { title, complexity };
}

// Extract category and subcategory from file path
function extractCategoryInfo(filePath: string): { category: string; subcategory: string } {
  const pathParts = filePath.split(path.sep);
  const templateIndex = pathParts.findIndex(part => part === 'pages_nonprofit_ai_templates');
  
  if (templateIndex === -1) {
    throw new Error(`Invalid template path: ${filePath}`);
  }
  
  const category = pathParts[templateIndex + 1]?.replace(/_/g, ' ') || 'Unknown';
  const subcategory = pathParts[templateIndex + 2]?.replace(/_/g, ' ').replace(/&/g, '&') || 'General';
  
  return { category, subcategory };
}

// Parse markdown file content
function parseMarkdownContent(content: string): { extractedContent: string; description: string } {
  const lines = content.split('\n');
  let inTemplate = false;
  let templateContent = '';
  let description = '';
  
  // Extract title from first line for description
  const firstLine = lines[0];
  if (firstLine.startsWith('# ')) {
    description = firstLine.replace('# ', '').replace(/ - (High|Medium|Low) Complexity$/, '');
  }
  
  // Find and extract template content between ``` blocks
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.trim() === '```' && !inTemplate) {
      inTemplate = true;
      continue;
    }
    
    if (line.trim() === '```' && inTemplate) {
      inTemplate = false;
      break;
    }
    
    if (inTemplate) {
      templateContent += line + '\n';
    }
  }
  
  // If no template block found, use content after "## Template" header
  if (!templateContent.trim()) {
    const templateHeaderIndex = lines.findIndex(line => line.trim() === '## Template');
    if (templateHeaderIndex !== -1) {
      templateContent = lines.slice(templateHeaderIndex + 1).join('\n');
    }
  }
  
  return {
    extractedContent: templateContent.trim(),
    description: description || 'Nonprofit AI template'
  };
}

// Generate tags based on content and path
function generateTags(category: string, subcategory: string, content: string): string[] {
  const tags: string[] = [];
  
  // Category-based tags
  const categoryTags: Record<string, string[]> = {
    'Answer and Assist': ['support', 'guidance', 'assistance'],
    'Automate the Admin': ['automation', 'administration', 'workflow'],
    'Connect and Create': ['engagement', 'outreach', 'communication'],
    'Generate and Grow': ['fundraising', 'development', 'growth'],
    'Measure and Monitor': ['analytics', 'reporting', 'evaluation'],
    'Plan and Prepare': ['planning', 'strategy', 'preparation'],
  };
  
  if (categoryTags[category]) {
    tags.push(...categoryTags[category]);
  }
  
  // Content-based tags
  const contentLower = content.toLowerCase();
  const contentTags = [
    { keywords: ['donor', 'donation', 'giving'], tag: 'fundraising' },
    { keywords: ['volunteer', 'volunteering'], tag: 'volunteers' },
    { keywords: ['board', 'governance'], tag: 'governance' },
    { keywords: ['event', 'events'], tag: 'events' },
    { keywords: ['grant', 'grants'], tag: 'grants' },
    { keywords: ['social media', 'facebook', 'twitter', 'instagram'], tag: 'social-media' },
    { keywords: ['email', 'newsletter'], tag: 'email-marketing' },
    { keywords: ['program', 'programs'], tag: 'programs' },
    { keywords: ['client', 'clients', 'beneficiary'], tag: 'client-services' },
    { keywords: ['staff', 'employee'], tag: 'human-resources' },
    { keywords: ['budget', 'financial', 'finance'], tag: 'finance' },
    { keywords: ['marketing', 'outreach'], tag: 'marketing' },
    { keywords: ['report', 'reporting'], tag: 'reporting' },
    { keywords: ['legal', 'compliance'], tag: 'compliance' },
  ];
  
  contentTags.forEach(({ keywords, tag }) => {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      tags.push(tag);
    }
  });
  
  // Audience-based tags
  const audienceTags = [
    { keywords: ['donor', 'donors'], tag: 'donors' },
    { keywords: ['volunteer', 'volunteers'], tag: 'volunteers' },
    { keywords: ['board'], tag: 'board-members' },
    { keywords: ['staff'], tag: 'staff' },
    { keywords: ['client', 'beneficiary'], tag: 'clients' },
    { keywords: ['community'], tag: 'community' },
    { keywords: ['partner', 'partners'], tag: 'partners' },
  ];
  
  audienceTags.forEach(({ keywords, tag }) => {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      tags.push(tag);
    }
  });
  
  // Remove duplicates and return
  return [...new Set(tags)];
}

// Process a single template file
function processTemplateFile(filePath: string): TemplateMetadata | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const { title, complexity } = parseFilename(filePath);
    const { category, subcategory } = extractCategoryInfo(filePath);
    const { extractedContent, description } = parseMarkdownContent(content);
    
    if (!extractedContent) {
      console.warn(`No template content found in ${filePath}`);
      return null;
    }
    
    const tags = generateTags(category, subcategory, extractedContent);
    
    return {
      title,
      category,
      subcategory,
      complexity,
      content: extractedContent,
      description,
      tags,
    };
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return null;
  }
}

// Get all markdown files from templates directory
function getAllTemplateFiles(): string[] {
  const templatesDir = path.join(process.cwd(), 'context', 'pages_nonprofit_ai_templates');
  const files: string[] = [];
  
  function walkDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  walkDir(templatesDir);
  return files;
}

// Merge complexity variants into single prompts
function mergeComplexityVariants(templates: TemplateMetadata[]): TemplateMetadata[] {
  const grouped = new Map<string, TemplateMetadata[]>();
  
  // Group templates by title
  templates.forEach(template => {
    const baseTitle = template.title;
    if (!grouped.has(baseTitle)) {
      grouped.set(baseTitle, []);
    }
    grouped.get(baseTitle)!.push(template);
  });
  
  const merged: TemplateMetadata[] = [];
  
  grouped.forEach((variants, title) => {
    if (variants.length === 1) {
      // Single variant, keep as-is
      merged.push(variants[0]);
    } else {
      // Multiple variants, create merged template
      // Use medium complexity as default, or high if medium doesn't exist
      const defaultVariant = variants.find(v => v.complexity === 'medium') 
        || variants.find(v => v.complexity === 'high') 
        || variants[0];
      
      // Combine all complexity levels in content
      const combinedContent = `# ${title} - Multiple Complexity Levels

## Low Complexity
${variants.find(v => v.complexity === 'low')?.content || 'Not available'}

## Medium Complexity  
${variants.find(v => v.complexity === 'medium')?.content || 'Not available'}

## High Complexity
${variants.find(v => v.complexity === 'high')?.content || 'Not available'}`;
      
      merged.push({
        ...defaultVariant,
        content: combinedContent,
        description: `${defaultVariant.description} (Available in multiple complexity levels)`,
        tags: [...new Set(variants.flatMap(v => v.tags))], // Combine all tags
      });
    }
  });
  
  return merged;
}

// Main import function
export async function importPrompts() {
  console.log('Starting prompt import process...');
  
  try {
    // Get all template files
    const templateFiles = getAllTemplateFiles();
    console.log(`Found ${templateFiles.length} template files`);
    
    // Process each file
    const templates: TemplateMetadata[] = [];
    for (const filePath of templateFiles) {
      const template = processTemplateFile(filePath);
      if (template) {
        templates.push(template);
      }
    }
    
    console.log(`Processed ${templates.length} templates`);
    
    // Merge complexity variants according to build sheet requirement
    const mergedTemplates = mergeComplexityVariants(templates);
    console.log(`After merging complexity variants: ${mergedTemplates.length} unique prompts`);
    
    // Import to Convex database
    let imported = 0;
    for (const template of mergedTemplates) {
      try {
        await client.mutation(api.prompts.addPrompt, {
          title: template.title,
          content: template.content,
          category: template.category,
          subcategory: template.subcategory,
          tags: template.tags,
          complexity: template.complexity,
          description: template.description,
        });
        imported++;
        
        if (imported % 10 === 0) {
          console.log(`Imported ${imported}/${mergedTemplates.length} prompts...`);
        }
      } catch (error) {
        console.error(`Failed to import template "${template.title}":`, error);
      }
    }
    
    console.log(`✅ Import complete! Successfully imported ${imported} prompts.`);
    
    // Print summary statistics
    const categories = [...new Set(mergedTemplates.map(t => t.category))];
    const complexityDistribution = mergedTemplates.reduce((acc, t) => {
      acc[t.complexity] = (acc[t.complexity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📊 Import Summary:');
    console.log(`Categories: ${categories.join(', ')}`);
    console.log(`Complexity distribution:`, complexityDistribution);
    console.log(`Total unique prompts: ${imported}`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run import if called directly
if (require.main === module) {
  importPrompts().catch(console.error);
}