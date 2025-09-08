"use client";

import { useState, useMemo, useImperativeHandle, forwardRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import Link from "next/link";
import { PromptCard } from "./PromptCard";

interface CategoryGridProps {
  className?: string;
}

export interface StaticCategoryGridRef {
  resetToSubcategories: () => void;
}

interface SparkFormStep {
  type: 'subcategories' | 'templates';
  selectedCategory?: string;
  selectedSubcategory?: string;
}

// Icon mapping for each subcategory
const SUBCATEGORY_ICONS = {
  // Answer and Assist
  "FAQ & Knowledge Base Responses": "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  "Personalized Support & Guidance": "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
  
  // Automate the Admin
  "Automated Communications": "M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  "Form & Document Review": "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "Repetitive Data Processing": "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  
  // Create and Communicate
  "Content Adaptation & Reformatting": "M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2",
  "Content Generation from Scratch": "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  "Data Storytelling": "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  "Interactive Content Creation": "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z",
  "Policy & Procedure Documentation": "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "Script & Narrative Writing": "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  "Structured Report Creation": "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "Template Filling & Personalization": "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  "Translation & Accessibility Conversion": "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
  "Visual Content Creation": "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  
  // Learn and Decide
  "Data Analysis & Insights": "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  "Research & Intelligence Gathering": "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  "Strategic Planning & Forecasting": "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  
  // Sort and Scan
  "Application & Candidate Screening": "M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  "Content Categorization & Prioritization": "M19 11H5m14-7H3a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z",
  "Quality Assessment & Scoring": "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
};

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

export const StaticCategoryGrid = forwardRef<StaticCategoryGridRef, CategoryGridProps>(({ className = "" }, ref) => {
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

  // Expose reset function to parent via ref
  useImperativeHandle(ref, () => ({
    resetToSubcategories: () => {
      if (currentStep.type !== 'subcategories') {
        handleStepTransition({ type: 'subcategories' });
      }
    }
  }), [currentStep.type]);

  // Create flattened and shuffled subcategory list (memoized to prevent re-shuffling)
  const allSubcategories = useMemo(() => {
    return CATEGORIES.reduce((acc, cat) => {
      cat.subcategories.forEach(subcat => {
        acc.push({ 
          subcategory: subcat, 
          parentCategory: cat.category,
          color: cat.color,
          icon: SUBCATEGORY_ICONS[subcat as keyof typeof SUBCATEGORY_ICONS]
        });
      });
      return acc;
    }, [] as Array<{ subcategory: string; parentCategory: string; color: { backgroundColor: string; textColor: string }; icon: string }>)
    .sort(() => Math.random() - 0.5); // shuffle once
  }, []); // empty dependency array ensures this only runs once

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
});

// Step 1: Subcategories Grid
interface SubcategoriesGridStepProps {
  subcategories: Array<{ 
    subcategory: string; 
    parentCategory: string; 
    color: { backgroundColor: string; textColor: string };
    icon: string;
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
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt) => (
          <PromptCard key={prompt._id} prompt={prompt} />
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="animate-pulse">
              <div className="flex gap-2 mb-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
              </div>
              <div className="flex gap-2 mb-4">
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-12"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-14"></div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}