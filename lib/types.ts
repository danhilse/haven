import { Doc, Id } from "@/convex/_generated/dataModel";

// Core application types extending Convex types
export type Prompt = Doc<"prompts">;
export type OrgProfile = Doc<"orgProfiles">;
export type Run = Doc<"runs">;
export type RateLimit = Doc<"rateLimits">;

// API response types
export interface PromptSearchResult {
  _id: Id<"prompts">;
  _creationTime: number;
  title: string;
  description: string;
  complexity: "low" | "medium" | "high";
  tags: string[];
  category: string;
  subcategory: string;
}

export interface CategoryInfo {
  category: string;
  subcategories: string[];
  count: number;
}

export interface ExecutionResult {
  output: string;
  metadata: {
    model: string;
    tokens?: number;
    duration: number;
    complexity?: string;
  };
  rateLimitInfo: {
    remaining: number;
    resetTime: number;
  };
}

export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

// Form types
export interface OrgProfileForm {
  name: string;
  mission: string;
  tone: string;
  region: string;
  customFields?: Record<string, any>;
}

export interface PromptExecutionForm {
  promptId: Id<"prompts">;
  situation: string;
  complexity?: "low" | "medium" | "high";
}

export interface SearchFilters {
  category?: string;
  subcategory?: string;
  complexity?: string;
  tags?: string[];
}

// UI component prop types
export interface PromptCardProps {
  prompt: PromptSearchResult;
  onSelect?: (prompt: PromptSearchResult) => void;
  showCategory?: boolean;
}

export interface SearchBoxProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  loading?: boolean;
  placeholder?: string;
}

export interface CategoryGridProps {
  categories: CategoryInfo[];
  onCategorySelect: (category: string, subcategory?: string) => void;
}

// Constants
export const COMPLEXITY_LEVELS = ['low', 'medium', 'high'] as const;
export const OUTPUT_FORMATS = ['markdown', 'plaintext'] as const;

export const TONE_OPTIONS = [
  'Professional',
  'Friendly', 
  'Formal',
  'Conversational',
  'Inspiring',
  'Direct',
  'Empathetic',
  'Urgent',
  'Celebratory',
  'Educational'
] as const;

export const REGION_OPTIONS = [
  'United States',
  'Canada', 
  'United Kingdom',
  'Australia',
  'European Union',
  'International',
  'Local Community',
  'State/Provincial',
  'National',
  'Global'
] as const;

// Utility types
export type ComplexityLevel = typeof COMPLEXITY_LEVELS[number];
export type OutputFormat = typeof OUTPUT_FORMATS[number];
export type ToneOption = typeof TONE_OPTIONS[number];
export type RegionOption = typeof REGION_OPTIONS[number];

// Error types
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

export class RateLimitError extends Error {
  constructor(public resetTime: number) {
    super(`Rate limit exceeded. Try again after ${new Date(resetTime).toISOString()}`);
    this.name = 'RateLimitError';
  }
}

export class PromptNotFoundError extends Error {
  constructor(promptId: string) {
    super(`Prompt with ID ${promptId} not found`);
    this.name = 'PromptNotFoundError';
  }
}

export class OrgProfileNotFoundError extends Error {
  constructor(userId: string) {
    super(`Organization profile not found for user ${userId}. Please set up your profile first.`);
    this.name = 'OrgProfileNotFoundError';
  }
}