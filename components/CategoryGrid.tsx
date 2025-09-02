"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface CategoryGridProps {
  className?: string;
}

interface SparkFormStep {
  type: 'subcategories' | 'templates';
  selectedCategory?: string;
  selectedSubcategory?: string;
}

// Color mapping for different categories
const categoryColors: Record<string, { bg: string; text: string; hover: string }> = {
  'Fundraising': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-200', hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-800/50' },
  'Marketing': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', hover: 'hover:bg-blue-200 dark:hover:bg-blue-800/50' },
  'Operations': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', hover: 'hover:bg-purple-200 dark:hover:bg-purple-800/50' },
  'Communications': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', hover: 'hover:bg-orange-200 dark:hover:bg-orange-800/50' },
  'Volunteer Management': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200', hover: 'hover:bg-pink-200 dark:hover:bg-pink-800/50' },
  'Board Management': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-800/50' },
  'Programs': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', hover: 'hover:bg-green-200 dark:hover:bg-green-800/50' },
  'HR': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800/50' },
  'Finance': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', hover: 'hover:bg-red-200 dark:hover:bg-red-800/50' },
  'default': { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-200', hover: 'hover:bg-gray-200 dark:hover:bg-gray-600' }
};

export function CategoryGrid({ className = "" }: CategoryGridProps) {
  const categories = useQuery(api.prompts.getCategories);
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

  // Create flattened and shuffled subcategory list with parent category info
  const allSubcategories = useMemo(() => {
    if (!categories) return [];
    
    const subcatList: Array<{ subcategory: string; parentCategory: string }> = [];
    categories.forEach(cat => {
      cat.subcategories.forEach(subcat => {
        subcatList.push({ subcategory: subcat, parentCategory: cat.category });
      });
    });
    
    // Shuffle the array for randomized layout
    return subcatList.sort(() => Math.random() - 0.5);
  }, [categories]);

  if (categories === undefined) {
    return <CategoryGridSkeleton />;
  }

  if (categories.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium mb-2">No categories found</h3>
          <p className="text-sm">Prompt templates will appear here when available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`transition-opacity duration-300 ${fadeClass} ${className}`}>
      {/* Progress Indicator - Now only 2 steps */}
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
  subcategories: Array<{ subcategory: string; parentCategory: string }>;
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
          Choose from our specialized template areas. Each color represents a different category.
        </p>
      </div>
      
      {/* Randomized subcategory badges grid */}
      <div className="flex flex-wrap gap-2 justify-center">
        {subcategories.map((item, index) => {
          
          const getColorStyle = (category: string) => {
            // Use inline styles to ensure colors show up - match actual database categories
            if (category === 'Answer and Assist') {
              return { backgroundColor: '#d1fae5', color: '#065f46' }; // emerald
            } else if (category === 'Create and Communicate') {
              return { backgroundColor: '#dbeafe', color: '#1e40af' }; // blue
            } else if (category === 'Automate the Admin') {
              return { backgroundColor: '#e9d5ff', color: '#7c2d12' }; // purple
            } else if (category === 'Learn and Decide') {
              return { backgroundColor: '#fed7aa', color: '#ea580c' }; // orange
            } else if (category === 'Sort and Scan') {
              return { backgroundColor: '#fce7f3', color: '#be185d' }; // pink
            } else {
              return { backgroundColor: '#f3f4f6', color: '#374151' }; // gray
            }
          };
          
          return (
            <button
              key={`${item.parentCategory}-${item.subcategory}-${index}`}
              onClick={() => onSelectSubcategory(item.subcategory, item.parentCategory)}
              style={getColorStyle(item.parentCategory)}
              className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium
                         transition-all duration-200 hover:scale-105 hover:shadow-md
                         border border-transparent hover:opacity-80"
            >
              <span>{item.subcategory}</span>
              <svg className="w-3 h-3 ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Color legend */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">Color guide:</p>
        <div className="flex flex-wrap gap-2 justify-center text-xs">
          <div style={{ backgroundColor: '#d1fae5', color: '#065f46' }} className="px-2 py-1 rounded">
            Answer and Assist
          </div>
          <div style={{ backgroundColor: '#dbeafe', color: '#1e40af' }} className="px-2 py-1 rounded">
            Create and Communicate
          </div>
          <div style={{ backgroundColor: '#e9d5ff', color: '#7c2d12' }} className="px-2 py-1 rounded">
            Automate the Admin
          </div>
          <div style={{ backgroundColor: '#fed7aa', color: '#ea580c' }} className="px-2 py-1 rounded">
            Learn and Decide
          </div>
          <div style={{ backgroundColor: '#fce7f3', color: '#be185d' }} className="px-2 py-1 rounded">
            Sort and Scan
          </div>
        </div>
      </div>
    </div>
  );
}


// Step 3: Templates
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
          {subcategory || category} Templates
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Found {prompts.length} template{prompts.length !== 1 ? 's' : ''}
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
            <button className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
              Use this template →
            </button>
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

function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-8"></div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
            </div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
}