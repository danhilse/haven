"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface CategoryGridProps {
  className?: string;
}

export function CategoryGrid({ className = "" }: CategoryGridProps) {
  const categories = useQuery(api.prompts.getCategories);

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
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {categories.map((category) => (
        <CategoryCard key={category.category} category={category} />
      ))}
    </div>
  );
}

interface CategoryCardProps {
  category: {
    category: string;
    subcategories: string[];
    count: number;
  };
}

function CategoryCard({ category }: CategoryCardProps) {
  // Create a URL-friendly slug from the category name
  const categorySlug = category.category.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

  return (
    <Link 
      href={`/category/${categorySlug}`}
      className="group block"
    >
      <div className="h-full p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
                     rounded-lg shadow-sm hover:shadow-md transition-all duration-200
                     group-hover:border-blue-300 dark:group-hover:border-blue-600 
                     group-hover:scale-[1.02]">
        
        {/* Category header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 
                        group-hover:text-blue-600 dark:group-hover:text-blue-400 
                        transition-colors duration-200">
            {category.category}
          </h3>
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700 
                          text-gray-600 dark:text-gray-300 rounded-full">
            {category.count}
          </span>
        </div>

        {/* Subcategories preview */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-2">
            {category.subcategories.slice(0, 3).map((subcategory, index) => (
              <span 
                key={index}
                className="px-2 py-1 text-xs bg-gray-50 dark:bg-gray-700 
                          text-gray-600 dark:text-gray-400 rounded border"
              >
                {subcategory}
              </span>
            ))}
            {category.subcategories.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                +{category.subcategories.length - 3} more
              </span>
            )}
          </div>
          
          {category.subcategories.length > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {category.subcategories.length} subcategor{category.subcategories.length === 1 ? 'y' : 'ies'}
            </p>
          )}
        </div>

        {/* Browse indicator */}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 
                       group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
          <span>Browse templates</span>
          <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-200" 
               fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
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