# New Variables and Prompts System

## Overview

This document outlines the redesigned variable and prompt metadata system that moves from a global variable library approach to prompt-specific variables with enhanced user experience and AI-driven enhancement.

## Key Philosophy Changes

### Before: Global Variable Library
- All variables shared across prompts in a global library
- Technical variable names exposed to users (e.g., `ORGANIZATION_NAME`)
- Generic labels without context
- One-size-fits-all approach

### After: Prompt-Specific Variables with Context
- Each prompt has its own variables tailored to its specific use case
- User-friendly, conversational questions instead of technical names
- Context-driven questions that guide users naturally
- Smart grouping of related variables for better UX
- Clear separation between global common variables and prompt-specific ones

## Database Schema Design

### Enhanced Prompts Table
```typescript
prompts: {
  // Core fields
  title: string,
  content: string,
  category: string,
  subcategory: string,
  complexity: "low" | "medium" | "high",
  tags: string[],
  
  // New metadata fields
  description: string, // Auto-generated user-friendly description
  outputDescription?: string, // Clear description of what user will receive
  variables?: string[], // Prompt-specific variable names
  globalVariables?: string[], // Global variables used
  requiredDocuments?: string[], // Document types needed
  
  // Analysis metadata
  analysisMetadata?: {
    variableCount: number,
    globalVariableCount?: number,
    complexityScore: number,
    additionalContextNeeded: boolean,
    lastAnalyzed: number
  }
}
```

### Global Variables Table
```typescript
globalVariables: {
  name: string, // e.g., "ORGANIZATION_NAME"
  description: string,
  questionPrompt: string, // Context-driven question
  inputType: string,
  examples: string[],
  category: string,
  isRequired: boolean,
  defaultValue?: string,
  selectOptions?: string[],
  usageCount: number
}
```

### Prompt-Specific Variables Table
```typescript
variables: {
  name: string, // Variable name for this specific prompt
  promptId: Id<"prompts">, // Which prompt this belongs to
  description: string,
  questionPrompt: string, // Conversational question for users
  inputType: string, // "short_text", "long_text", "document", etc.
  examples: string[], // Context-specific examples
  category: string,
  isRequired: boolean,
  sortOrder: number, // Display order
  grouping?: string, // Logical grouping for UX
  selectOptions?: string[],
  validationRules?: string[]
}
```

## Variable Input Types

- **short_text**: Single line text (names, titles, dates)
- **long_text**: Multi-line text (descriptions, messages)  
- **document**: File upload requirement
- **select**: Dropdown with predefined options
- **multi**: Multiple selection
- **email**: Email address with validation
- **phone**: Phone number with formatting
- **date**: Date picker
- **number**: Numeric input
- **currency**: Money amount with formatting

## Variable Grouping System

### Grouping Philosophy
- **Conservative approach**: Only group clearly related variables
- **User-centric**: Groups should make sense to users filling out forms
- **Context-aware**: Groupings based on how variables are typically used together

### Common Grouping Patterns
- **contact_info**: Name, email, phone, address
- **program_details**: Location, date, time, duration
- **financial**: Budget, costs, ROI, funding amounts
- **documents**: All document uploads grouped together
- **timing**: Dates, times, deadlines, timeframes
- **credibility**: Ratings, certifications, testimonials
- **stories**: Beneficiary names, quotes, testimonials

## AI Enhancement Process

### Two-Pass Enhancement Strategy

#### Pass 1: Prompt Metadata Enhancement
- **Model**: GPT-5-mini with light reasoning
- **Focus**: Titles, descriptions, output descriptions, tags
- **Copy Guidelines**: Follows nonprofit-specific style guide
- **Concurrency**: 20 batch size, 5 concurrent requests

#### Pass 2: Variable Extraction and Enhancement  
- **Model**: GPT-5-mini with light reasoning
- **Focus**: Variable questions, input types, grouping, examples
- **Processing**: Extracts variables → Enhances with AI → Creates database records
- **Concurrency**: 15 batch size, 3 concurrent requests (more conservative)

### AI Prompt Engineering
The system uses carefully crafted prompts that:
- Emphasize user experience over technical accuracy
- Follow nonprofit copywriting guidelines
- Generate conversational, helpful questions
- Determine appropriate input types automatically
- Create logical groupings for related variables

## User Experience Improvements

### Before: Technical Interface
```
ORGANIZATION_NAME: [text input]
TARGET_AUDIENCE: [text input]  
PROGRAM_NAME: [text input]
```

### After: Conversational Interface
```
Organization Details:
  What's your organization's name? 
  [Helping Hands Community Center]

  Who is your primary audience for this program?
  [Local families with children under 12]

Program Information:
  What's the name of this program?
  [After-School Learning Hub]
```

### Key UX Benefits
1. **Contextual Questions**: Users understand exactly what to provide
2. **Logical Grouping**: Related fields appear together
3. **Progressive Disclosure**: Can show one group at a time
4. **Smart Input Types**: Appropriate widgets for each data type
5. **Helpful Examples**: Real nonprofit examples guide users

## Implementation Scripts

### Processing Pipeline
1. **enhance_prompt_metadata.js**: First pass for prompt titles/descriptions
2. **enhanced_variable_extraction.js**: Second pass for variable creation
3. **Concurrency**: Both scripts use batch processing with API rate limiting
4. **Error Handling**: Robust error handling with detailed logging

### Global vs Prompt-Specific Separation
- **Global Variables**: ORGANIZATION_NAME, TARGET_AUDIENCE, PROGRAM_NAME, MISSION_STATEMENT
- **Prompt-Specific**: Everything else, tailored to each prompt's needs
- **Documents**: Automatically detected and grouped appropriately

## Benefits of New System

### For Users
- **Invisible Complexity**: Technical prompt details hidden from users
- **Guided Input**: Clear questions instead of technical variable names  
- **Better Organization**: Logical grouping reduces cognitive load
- **Context Awareness**: Questions tailored to specific use cases

### For Developers
- **Scalable Architecture**: Each prompt manages its own variables
- **AI-Enhanced**: Automated generation of user-friendly metadata
- **Type Safety**: Strong typing for all variable types
- **Flexible Grouping**: Easy to modify grouping logic per prompt

### For the Platform
- **Better Data Quality**: Users provide more accurate information
- **Reduced Support**: Self-explanatory interface
- **Improved Conversion**: Easier forms increase completion rates
- **Enhanced Personalization**: Better variable data enables better outputs

## Migration Strategy

1. **Schema Updates**: Deploy new database schema with optional fields
2. **Metadata Enhancement**: Run prompt metadata enhancement script
3. **Variable Extraction**: Run variable extraction and enhancement script
4. **Frontend Updates**: Update UI to use new variable system with grouping
5. **Testing**: Validate with sample prompts before full deployment

This new system transforms the user experience from technical variable filling to conversational form completion, while maintaining the flexibility and power needed for sophisticated prompt templating.