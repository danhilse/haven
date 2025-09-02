"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SearchBox } from "../../components/SearchBox";
import { PromptCard } from "../../components/PromptCard";
import { FilterSidebar } from "../../components/FilterSidebar";
import { SearchBreadcrumb } from "../../components/Breadcrumb";

export default function SearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Suspense fallback={
            <div className="animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
            </div>
          }>
            <SearchHeaderContent />
          </Suspense>
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

function SearchHeaderContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  return (
    <div className="space-y-3">
      <SearchBreadcrumb query={query} />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Search Results
      </h1>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<{
    category?: string;
    tags?: string[];
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

  const handleFilterChange = (filterType: string, value: string | string[]) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: (typeof value === 'string' && value === '') || (Array.isArray(value) && value.length === 0) 
        ? undefined 
        : value
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Filter Sidebar */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <FilterSidebar
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          categories={categories || []}
          availableTags={[]} // TODO: Get from backend
          className="sticky top-24"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Search Box */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <SearchBox
            initialValue={query}
            onSearch={handleSearch}
            placeholder="Search for nonprofit prompt templates..."
            showLiveSearch={true}
            debounceMs={400}
          />
        </div>

        {/* Results */}
        <div>
          {query ? (
            <SearchResults results={searchResults} query={query} />
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-medium mb-3">Enter a search query</h3>
                <p className="text-sm max-w-md mx-auto">
                  Search for nonprofit prompt templates by title, description, or keywords. 
                  Use the filters on the left to narrow down your results.
                </p>
              </div>
            </div>
          )}
        </div>
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