"use client";

import Link from "next/link";
import { Id } from "../convex/_generated/dataModel";

interface PromptCardProps {
  prompt: {
    _id: Id<"prompts">;
    title: string;
    description: string;
    complexity: "low" | "medium" | "high";
    tags: string[];
    category: string;
    subcategory: string;
  };
  className?: string;
}

const complexityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
};

const complexityLabels = {
  low: "Low",
  medium: "Medium", 
  high: "High"
};

export function PromptCard({ prompt, className = "" }: PromptCardProps) {
  return (
    <Link 
      href={`/prompt/${prompt._id}`}
      className={`block group ${className}`}
    >
      <div className="h-full p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                     rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200
                     group-hover:border-blue-300 dark:group-hover:border-blue-600">
        
        {/* Header with complexity badge */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 
                          group-hover:text-blue-600 dark:group-hover:text-blue-400 
                          transition-colors duration-200 line-clamp-2">
              {prompt.title}
            </h3>
          </div>
          <span className={`ml-3 px-2 py-1 text-xs font-medium rounded-full ${complexityColors[prompt.complexity]}`}>
            {complexityLabels[prompt.complexity]}
          </span>
        </div>

        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 leading-relaxed">
          {prompt.description}
        </p>

        {/* Category breadcrumb */}
        <div className="mb-3">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {prompt.category} → {prompt.subcategory}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
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

        {/* Hover indicator */}
        <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400 
                       group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          <span>View prompt</span>
          <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}