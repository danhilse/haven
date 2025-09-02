"use client";

import { useState } from "react";

interface FilterSidebarProps {
  filters: {
    category?: string;
    tags?: string[];
  };
  onFilterChange: (filterType: string, value: string | string[]) => void;
  onClearFilters: () => void;
  categories?: Array<{ category: string; count: number; subcategories: string[] }>;
  availableTags?: string[];
  className?: string;
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onClearFilters,
  categories = [],
  availableTags = [],
  className = ""
}: FilterSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const hasActiveFilters = filters.category || (filters.tags && filters.tags.length > 0);

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    onFilterChange('tags', newTags);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Clear all
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filter Content */}
      <div className={`space-y-6 p-4 ${isCollapsed ? 'hidden lg:block' : ''}`}>
        
        {/* Category Filter */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.category} value={cat.category}>
                {cat.category} ({cat.count})
              </option>
            ))}
          </select>
          
          {/* Show subcategories when category is selected */}
          {filters.category && (
            <div className="ml-4 space-y-1">
              {categories
                .find(c => c.category === filters.category)?.subcategories
                .map(subcategory => (
                  <label key={subcategory} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-gray-600 text-blue-600 
                                focus:ring-blue-500 dark:bg-gray-700"
                    />
                    <span className="text-gray-600 dark:text-gray-400">{subcategory}</span>
                  </label>
                ))
              }
            </div>
          )}
        </div>


        {/* Tags Filter */}
        {availableTags.length > 0 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tags
            </label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {availableTags.slice(0, 20).map(tag => (
                <label key={tag} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.tags?.includes(tag) || false}
                    onChange={() => handleTagToggle(tag)}
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 
                              focus:ring-blue-500 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{tag}</span>
                </label>
              ))}
            </div>
            {filters.tags && filters.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 
                              text-blue-800 dark:text-blue-200 rounded-md"
                  >
                    {tag}
                    <button
                      onClick={() => handleTagToggle(tag)}
                      className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Active filters:
            </div>
            <div className="space-y-1 text-sm">
              {filters.category && (
                <div className="flex items-center justify-between">
                  <span>Category: <strong>{filters.category}</strong></span>
                  <button
                    onClick={() => onFilterChange('category', '')}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              )}
              {filters.tags && filters.tags.length > 0 && (
                <div className="flex items-center justify-between">
                  <span>Tags: <strong>{filters.tags.length}</strong></span>
                  <button
                    onClick={() => onFilterChange('tags', [])}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}