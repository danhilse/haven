"use client";

import Link from "next/link";
import { Id } from "../convex/_generated/dataModel";

interface PromptCardProps {
  prompt: {
    _id: Id<"prompts">;
    title: string;
    description: string;
    tags: string[];
    category: string;
    subcategory: string;
  };
  className?: string;
}

// Category colors mapping
const CATEGORY_COLORS = {
  "Answer and Assist": { backgroundColor: '#d1fae5', textColor: '#065f46' },
  "Automate the Admin": { backgroundColor: '#e9d5ff', textColor: '#7c2d12' },
  "Create and Communicate": { backgroundColor: '#dbeafe', textColor: '#1e40af' },
  "Learn and Decide": { backgroundColor: '#fed7aa', textColor: '#ea580c' },
  "Sort and Scan": { backgroundColor: '#fce7f3', textColor: '#be185d' }
};

export function PromptCard({ prompt, className = "" }: PromptCardProps) {
  const categoryColor = CATEGORY_COLORS[prompt.category as keyof typeof CATEGORY_COLORS] || 
    { backgroundColor: '#f3f4f6', textColor: '#374151' };

  return (
    <Link 
      href={`/prompt/${prompt._id}`}
      className={`block group ${className}`}
    >
      <div className="h-full p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                     rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200
                     group-hover:border-blue-300 dark:group-hover:border-blue-600">
        
        {/* Category badges at top */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span 
            style={{ 
              backgroundColor: categoryColor.backgroundColor, 
              color: categoryColor.textColor 
            }}
            className="px-2 py-1 text-xs font-medium rounded"
          >
            {prompt.category}
          </span>
          {prompt.subcategory && (
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 
                            text-gray-600 dark:text-gray-300 rounded">
              {prompt.subcategory}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 
                        group-hover:text-blue-600 dark:group-hover:text-blue-400 
                        transition-colors duration-200 line-clamp-2">
            {prompt.title}
          </h3>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
          {prompt.description}
        </p>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {prompt.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 
                        text-gray-700 dark:text-gray-300 rounded"
            >
              {tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
              +{prompt.tags.length - 3} more
            </span>
          )}
        </div>

        {/* Improved CTA */}
        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 
                         group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Start conversation</span>
          </div>
          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 
                         transition-all duration-200" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}