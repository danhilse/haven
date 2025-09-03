"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";

interface CategoryGridProps {
  className?: string;
}

interface SparkFormStep {
  type: 'subcategories' | 'templates';
  selectedCategory?: string;
  selectedSubcategory?: string;
}

// Hardcoded categories and subcategories based on template structure
const CATEGORIES = [
  {
    category: "Answer and Assist",
    subcategories: [
      "FAQ & Knowledge Base Responses",
      "Personalized Support & Guidance"
    ],
    color: { backgroundColor: '#d1fae5', textColor: '#065f46' } // emerald
  },
  {
    category: "Automate the Admin", 
    subcategories: [
      "Automated Communications",
      "Form & Document Review", 
      "Repetitive Data Processing"
    ],
    color: { backgroundColor: '#e9d5ff', textColor: '#7c2d12' } // purple
  },
  {
    category: "Create and Communicate",
    subcategories: [
      "Content Adaptation & Reformatting",
      "Content Generation from Scratch",
      "Data Storytelling",
      "Interactive Content Creation", 
      "Policy & Procedure Documentation",
      "Script & Narrative Writing",
      "Structured Report Creation",
      "Template Filling & Personalization",
      "Translation & Accessibility Conversion",
      "Visual Content Creation"
    ],
    color: { backgroundColor: '#dbeafe', textColor: '#1e40af' } // blue
  },
  {
    category: "Learn and Decide",
    subcategories: [
      "Data Analysis & Insights",
      "Research & Intelligence Gathering", 
      "Strategic Planning & Forecasting"
    ],
    color: { backgroundColor: '#fed7aa', textColor: '#ea580c' } // orange
  },
  {
    category: "Sort and Scan",
    subcategories: [
      "Application & Candidate Screening",
      "Content Categorization & Prioritization",
      "Quality Assessment & Scoring"
    ],
    color: { backgroundColor: '#fce7f3', textColor: '#be185d' } // pink
  }
];

export function StaticCategoryGrid({ className = "" }: CategoryGridProps) {
  const [currentStep, setCurrentStep] = useState<SparkFormStep>({ type: 'subcategories' });
  const [fadeClass, setFadeClass] = useState('opacity-100');

  const handleStepTransition = (newStep: SparkFormStep) => {
    setFadeClass('opacity-0');
    setTimeout(() => {
      setCurrentStep(newStep);
      setFadeClass('opacity-100');
    }, 150);
  };

  const handleBackStep = () => {
    if (currentStep.type === 'templates') {
      handleStepTransition({ type: 'subcategories' });
    }
  };

  // Create flattened and shuffled subcategory list
  const allSubcategories = CATEGORIES.reduce((acc, cat) => {
    cat.subcategories.forEach(subcat => {
      acc.push({ 
        subcategory: subcat, 
        parentCategory: cat.category,
        color: cat.color
      });
    });
    return acc;
  }, [] as Array<{ subcategory: string; parentCategory: string; color: { backgroundColor: string; textColor: string } }>)
  .sort(() => Math.random() - 0.5); // shuffle

  return (
    <div className={`transition-opacity duration-300 ${fadeClass} ${className}`}>
      {/* Progress Indicator - 2 steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${currentStep.type === 'subcategories' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`w-12 h-0.5 ${currentStep.type === 'templates' ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${currentStep.type === 'templates' ? 'bg-blue-600' : 'bg-gray-300'}`} />
        </div>
      </div>

      {/* Back Button */}
      {currentStep.type === 'templates' && (
        <button
          onClick={handleBackStep}
          className="mb-6 flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}

      {/* Step Content */}
      {currentStep.type === 'subcategories' && (
        <SubcategoriesGridStep 
          subcategories={allSubcategories}
          onSelectSubcategory={(subcategory, parentCategory) =>
            handleStepTransition({ 
              type: 'templates', 
              selectedCategory: parentCategory,
              selectedSubcategory: subcategory 
            })
          }
        />
      )}

      {currentStep.type === 'templates' && currentStep.selectedCategory && (
        <TemplatesStep 
          category={currentStep.selectedCategory}
          subcategory={currentStep.selectedSubcategory}
        />
      )}
    </div>
  );
}

// Step 1: Subcategories Grid
interface SubcategoriesGridStepProps {
  subcategories: Array<{ 
    subcategory: string; 
    parentCategory: string; 
    color: { backgroundColor: string; textColor: string }
  }>;
  onSelectSubcategory: (subcategory: string, parentCategory: string) => void;
}

function SubcategoriesGridStep({ subcategories, onSelectSubcategory }: SubcategoriesGridStepProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          What do you need help with?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose from our ready-to-use guidance. Each color represents a different area of support.
        </p>
      </div>
      
      {/* Subcategory badges grid */}
      <div className="flex flex-wrap gap-2 justify-center">
        {subcategories.map((item, index) => (
          <button
            key={`${item.parentCategory}-${item.subcategory}-${index}`}
            onClick={() => onSelectSubcategory(item.subcategory, item.parentCategory)}
            style={{ 
              backgroundColor: item.color.backgroundColor, 
              color: item.color.textColor 
            }}
            className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium
                       transition-all duration-200 hover:scale-105 hover:shadow-md
                       border border-transparent hover:opacity-80"
          >
            <span>{item.subcategory}</span>
            <svg className="w-3 h-3 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>

      {/* Color legend */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">Color guide:</p>
        <div className="flex flex-wrap gap-2 justify-center text-xs">
          {CATEGORIES.map(cat => (
            <div 
              key={cat.category}
              style={{ 
                backgroundColor: cat.color.backgroundColor, 
                color: cat.color.textColor 
              }} 
              className="px-2 py-1 rounded"
            >
              {cat.category}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 2: Templates
interface TemplatesStepProps {
  category: string;
  subcategory?: string;
}

function TemplatesStep({ category, subcategory }: TemplatesStepProps) {
  const prompts = useQuery(api.prompts.getPromptsByCategory, { 
    category, 
    subcategory: subcategory || undefined 
  });

  if (prompts === undefined) {
    return <TemplatesStepSkeleton />;
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {subcategory || category} Guidance
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Found {prompts.length} conversation{prompts.length !== 1 ? 's' : ''} ready to help
        </p>
      </div>
      
      <div className="space-y-6">
        {prompts.map((prompt) => (
          <div
            key={prompt._id}
            className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                       rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {prompt.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {prompt.description}
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 
                              text-blue-800 dark:text-blue-200 rounded">
                {prompt.category}
              </span>
              {prompt.subcategory && (
                <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 
                                text-gray-600 dark:text-gray-300 rounded">
                  {prompt.subcategory}
                </span>
              )}
            </div>
            <Link 
              href={`/prompt/${prompt._id}`}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
            >
              Start this conversation →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesStepSkeleton() {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-48 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mx-auto"></div>
      </div>
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full mb-4"></div>
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}