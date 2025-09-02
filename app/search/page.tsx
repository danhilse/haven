"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SearchBox } from "../../components/SearchBox";
import { PromptCard } from "../../components/PromptCard";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Search Results
            </h1>
            <a 
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 
                        text-sm font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<SearchPageSkeleton />}>
          <SearchContent />
        </Suspense>
      </main>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<{
    category?: string;
    complexity?: string;
  }>({});

  // Search prompts with current query and filters
  const searchResults = useQuery(
    api.prompts.searchPrompts,
    query ? {
      query,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      limit: 50
    } : "skip"
  );

  // Get categories for filter dropdown
  const categories = useQuery(api.prompts.getCategories);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set('q', newQuery);
    window.history.replaceState({}, '', url);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value === '' ? undefined : value
    }));
  };

  return (
    <div className="space-y-8">
      {/* Search section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <SearchBox
          initialValue={query}
          onSearch={handleSearch}
          placeholder="Search for nonprofit prompt templates..."
          className="mb-4"
        />
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Category:
            </label>
            <select
              id="category-filter"
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories?.map(cat => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.count})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label htmlFor="complexity-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Complexity:
            </label>
            <select
              id="complexity-filter"
              value={filters.complexity || ''}
              onChange={(e) => handleFilterChange('complexity', e.target.value)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-3 py-1
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {(filters.category || filters.complexity) && (
            <button
              onClick={() => setFilters({})}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div>
        {query ? (
          <SearchResults results={searchResults} query={query} />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-lg font-medium mb-2">Enter a search query</h3>
              <p className="text-sm">Search for nonprofit prompt templates by title, description, or keywords.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResults({ results, query }: { 
  results: any[] | undefined;
  query: string;
}) {
  if (results === undefined) {
    return <SearchResultsSkeleton />;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {results.length > 0 
            ? `Found ${results.length} result${results.length === 1 ? '' : 's'} for "${query}"`
            : `No results found for "${query}"`
          }
        </h2>
        {results.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Try adjusting your search terms or clearing the filters.
          </p>
        )}
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((prompt) => (
            <PromptCard key={prompt._id} prompt={prompt} />
          ))}
        </div>
      )}
    </div>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-600 rounded mb-4"></div>
          <div className="flex space-x-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
          </div>
        </div>
      </div>
      <SearchResultsSkeleton />
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-64 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
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