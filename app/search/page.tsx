"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SearchBox } from "../../components/SearchBox";
import { SemanticSearchBox } from "../../components/SemanticSearchBox";
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
  const isSemanticSearch = searchParams.get('semantic') === 'true';
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<{
    category?: string;
    tags?: string[];
  }>({});
  const [semanticResults, setSemanticResults] = useState<any>(null);
  const [isLoadingSemantic, setIsLoadingSemantic] = useState(false);

  // Semantic search action
  const semanticSearch = useAction(api.prompts.semanticSearch);

  // Trigger search on initial page load if there's a query in URL
  useEffect(() => {
    console.log('Initial load effect - initialQuery:', initialQuery);
    console.log('Initial load effect - isSemanticSearch:', isSemanticSearch);
    
    if (initialQuery && initialQuery.trim().length > 0) {
      console.log('Setting query to:', initialQuery);
      setQuery(initialQuery);
      
      // Trigger search immediately if conditions are met
      if (isSemanticSearch && initialQuery.trim().length > 10) {
        console.log('Triggering initial semantic search');
        setIsLoadingSemantic(true);
        semanticSearch({
          query: initialQuery.trim(),
          limit: 20,
        }).then(results => {
          console.log('Initial semantic search results:', results);
          setSemanticResults(results);
          setIsLoadingSemantic(false);
        }).catch(error => {
          console.error('Initial semantic search failed:', error);
          setIsLoadingSemantic(false);
        });
      } else {
        console.log('Not triggering semantic search - conditions not met');
      }
    } else {
      console.log('No initial query found');
    }
  }, [initialQuery, isSemanticSearch, semanticSearch]);

  // Use the current query state OR initial query if state is empty
  const currentQuery = query || initialQuery;
  
  // Regular keyword search results - run if not semantic OR if semantic but query too short
  const shouldRunRegularSearch = currentQuery && currentQuery.trim().length > 0 && 
    (!isSemanticSearch || (isSemanticSearch && currentQuery.trim().length <= 10));
    
  const keywordSearchResults = useQuery(
    api.prompts.searchPrompts,
    shouldRunRegularSearch ? {
      query: currentQuery.trim(),
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      limit: 50
    } : "skip"
  );

  // Handle semantic search
  useEffect(() => {
    if (isSemanticSearch && query && query.trim().length > 10) {
      setIsLoadingSemantic(true);
      semanticSearch({
        query: query.trim(),
        limit: 20,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      }).then(results => {
        setSemanticResults(results);
        setIsLoadingSemantic(false);
      }).catch(error => {
        console.error('Semantic search failed:', error);
        setIsLoadingSemantic(false);
      });
    } else if (!isSemanticSearch) {
      setSemanticResults(null);
    }
  }, [query, isSemanticSearch, filters, semanticSearch]);

  // Determine which results to show
  const searchResults = (isSemanticSearch && currentQuery.trim().length > 10) ? 
    (isLoadingSemantic ? undefined : semanticResults?.results) : 
    keywordSearchResults;

  // Get categories for filter dropdown
  const categories = useQuery(api.prompts.getCategories);

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
    // Update URL without navigation - preserve semantic parameter
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
          {isSemanticSearch ? (
            <SemanticSearchBox
              initialValue={currentQuery}
              onSearch={handleSearch}
              placeholder="Describe what you're looking for..."
              showLiveSearch={true}
              debounceMs={600}
            />
          ) : (
            <SearchBox
              initialValue={currentQuery}
              onSearch={handleSearch}
              placeholder="Search for ready-made guidance..."
              showLiveSearch={true}
              debounceMs={400}
            />
          )}
        </div>

        {/* Results */}
        <div>
          {currentQuery ? (
            <SearchResults 
              results={searchResults} 
              query={currentQuery} 
              isSemanticSearch={isSemanticSearch && currentQuery.trim().length > 10}
              parsedQuery={semanticResults?.parsedQuery}
              topPicks={semanticResults?.topPicks}
            />
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-500 dark:text-gray-400">
                <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-xl font-medium mb-3">Enter a search query</h3>
                <p className="text-sm max-w-md mx-auto">
                  Search for ready-made guidance by title, description, or keywords. 
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

function SearchResults({ results, query, isSemanticSearch, parsedQuery, topPicks }: { 
  results: any[] | undefined;
  query: string;
  isSemanticSearch?: boolean;
  parsedQuery?: any;
  topPicks?: any[];
}) {
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    setShowAll(false);
  }, [query, isSemanticSearch]);

  if (results === undefined) {
    return <SearchResultsSkeleton />;
  }

  const hasTopPicks = Boolean(isSemanticSearch && topPicks && topPicks.length > 0);
  const topPickIds = new Set((topPicks || []).map((pick) => String(pick._id)));
  const secondaryResults = hasTopPicks
    ? results.filter((prompt) => !topPickIds.has(String(prompt._id)))
    : results;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {results.length > 0 
              ? `Found ${results.length} result${results.length === 1 ? '' : 's'}`
              : `No results found`
            }
          </h2>
          {isSemanticSearch && (
            <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Smart guidance finder
            </div>
          )}
        </div>

        {parsedQuery && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>Understanding:</strong> {parsedQuery.context}
            </p>
            {parsedQuery.category && (
              <p className="text-xs text-blue-600 dark:text-blue-300">
                Category: {parsedQuery.category} • Intent: {parsedQuery.intentType}
              </p>
            )}
          </div>
        )}

        {results.length === 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {isSemanticSearch 
              ? "Try describing your needs differently or use more specific details about your situation."
              : "Try adjusting your search terms or clearing the filters."
            }
          </p>
        )}
      </div>

      {hasTopPicks && (
        <div className="space-y-4 mb-8">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            Recommended for this request
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(topPicks || []).map((pick) => (
              <div key={pick._id} className="space-y-3">
                <div className="flex items-baseline justify-between text-sm text-blue-600 dark:text-blue-400">
                  <span className="font-medium">Top choice #{pick.rank}</span>
                  {pick.confidence && (
                    <span className="uppercase tracking-wide text-xs text-blue-500 dark:text-blue-300">
                      {pick.confidence} confidence
                    </span>
                  )}
                </div>
                <PromptCard 
                  prompt={pick} 
                  className="border-2 border-blue-200/70 dark:border-blue-800"
                />
                {pick.reason && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Why it helps: {pick.reason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {hasTopPicks && secondaryResults.length > 0 && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            {showAll ? 'Hide additional matches' : `View all ${secondaryResults.length} matches`}
            <svg
              className={`ml-2 h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      )}

      {(!hasTopPicks || (showAll && secondaryResults.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(hasTopPicks ? secondaryResults : results).map((prompt) => (
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
