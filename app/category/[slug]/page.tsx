"use client";

import { useState, useMemo, use } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { PromptCard } from "../../../components/PromptCard";
import { SearchBox } from "../../../components/SearchBox";
import { CategoryBreadcrumb } from "../../../components/Breadcrumb";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Convert slug back to category name (reverse of the slug creation logic)
  const categoryName = useMemo(() => {
    return resolvedParams.slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, [resolvedParams.slug]);

  // Get all categories to find the correct category and its subcategories
  const categories = useQuery(api.prompts.getCategories);
  const currentCategory = categories?.find(cat => 
    cat.category.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === resolvedParams.slug
  );

  // Get prompts for this category
  const prompts = useQuery(
    api.prompts.getPromptsByCategory, 
    currentCategory ? {
      category: currentCategory.category,
      subcategory: selectedSubcategory || undefined,
      limit: 100
    } : "skip"
  );

  // Filter prompts by search query if provided
  const filteredPrompts = useMemo(() => {
    if (!prompts || !searchQuery.trim()) return prompts;
    
    const query = searchQuery.toLowerCase();
    return prompts.filter(prompt => 
      prompt.title.toLowerCase().includes(query) ||
      prompt.description.toLowerCase().includes(query) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [prompts, searchQuery]);

  if (!currentCategory) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Category not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The category "{categoryName}" could not be found.
          </p>
          <a 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 
                      text-white rounded-md font-medium transition-colors duration-200"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <CategoryBreadcrumb 
              categoryName={currentCategory.category}
              categorySlug={resolvedParams.slug}
            />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {currentCategory.category}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentCategory.count} prompt{currentCategory.count === 1 ? '' : 's'} across {currentCategory.subcategories.length} subcategor{currentCategory.subcategories.length === 1 ? 'y' : 'ies'}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Search and Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* Search within category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search within {currentCategory.category}
                </label>
                <SearchBox
                  placeholder={`Search ${currentCategory.category.toLowerCase()} prompts...`}
                  onSearch={setSearchQuery}
                  className="max-w-md"
                />
              </div>

              {/* Subcategory filter */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subcategories:
                </span>
                <button
                  onClick={() => setSelectedSubcategory('')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedSubcategory === '' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                  }`}
                >
                  All ({currentCategory.count})
                </button>
                {currentCategory.subcategories.map((subcategory) => {
                  const subcategoryCount = prompts?.filter(p => p.subcategory === subcategory).length || 0;
                  return (
                    <button
                      key={subcategory}
                      onClick={() => setSelectedSubcategory(subcategory)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
                        selectedSubcategory === subcategory
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {subcategory} ({subcategoryCount})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results */}
          <div>
            {filteredPrompts === undefined ? (
              <PromptGridSkeleton />
            ) : (
              <PromptGrid 
                prompts={filteredPrompts} 
                categoryName={currentCategory.category}
                subcategoryName={selectedSubcategory}
                searchQuery={searchQuery}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

interface PromptGridProps {
  prompts: any[];
  categoryName: string;
  subcategoryName?: string;
  searchQuery?: string;
}

function PromptGrid({ prompts, categoryName, subcategoryName, searchQuery }: PromptGridProps) {
  if (prompts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">No prompts found</h3>
          <p className="text-sm">
            {searchQuery 
              ? `No prompts match "${searchQuery}" in ${subcategoryName ? `${subcategoryName} → ${categoryName}` : categoryName}`
              : `No prompts available in ${subcategoryName ? `${subcategoryName} → ${categoryName}` : categoryName}`
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {searchQuery 
            ? `${prompts.length} result${prompts.length === 1 ? '' : 's'} for "${searchQuery}"`
            : subcategoryName 
              ? `${prompts.length} prompt${prompts.length === 1 ? '' : 's'} in ${subcategoryName}`
              : `${prompts.length} prompt${prompts.length === 1 ? '' : 's'} in ${categoryName}`
          }
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {prompts.map((prompt) => (
          <PromptCard key={prompt._id} prompt={prompt} />
        ))}
      </div>
    </div>
  );
}

function PromptGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-64"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-4/6"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}