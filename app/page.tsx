"use client";

import { useState, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SemanticSearchBox } from "../components/SemanticSearchBox";
import {
  StaticCategoryGrid,
  StaticCategoryGridRef,
} from "../components/StaticCategoryGrid";
import { PromptCard } from "../components/PromptCard";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);
  const categoryGridRef = useRef<StaticCategoryGridRef>(null);
  // Semantic search action
  const semanticSearch = useAction(api.prompts.semanticSearch);

  // Regular search query
  const regularSearchResults = useQuery(
    api.prompts.searchPrompts,
    searchQuery &&
      searchQuery.trim().length > 0 &&
      searchQuery.trim().length <= 10
      ? {
          query: searchQuery.trim(),
          limit: 20,
        }
      : "skip",
  );

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setSearchQuery("");
      setShowAllResults(false);
      return;
    }

    setSearchQuery(query);
    setIsSearching(true);
    setShowAllResults(false);

    // Reset category grid to subcategories view when search is performed
    categoryGridRef.current?.resetToSubcategories();

    try {
      if (query.trim().length > 10) {
        // Use semantic search for longer queries
        const results = await semanticSearch({
          query: query.trim(),
          limit: 20,
        });
        setSearchResults(results);
      } else {
        // Use regular search for shorter queries - results will come from useQuery
        setSearchResults({ results: regularSearchResults || [], topPicks: [] });
      }
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults({ results: [] });
    } finally {
      setIsSearching(false);
    }
  };

  // Update search results when regular search results change
  if (
    searchQuery &&
    searchQuery.trim().length <= 10 &&
    regularSearchResults &&
    !isSearching
  ) {
    if (!searchResults || searchResults.results !== regularSearchResults) {
      setSearchResults({ results: regularSearchResults, topPicks: [] });
    }
  }

  const allResults: any[] = searchResults?.results || [];
  const highlightedResults: any[] = searchResults?.topPicks || [];
  const hasTopPicks = highlightedResults.length > 0;
  const topPickIds = new Set(highlightedResults.map((pick: any) => String(pick._id)));
  const secondaryResults = hasTopPicks
    ? allResults.filter((prompt: any) => !topPickIds.has(String(prompt._id)))
    : allResults;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section - Adaptive Height */}
      <section
        className={`${!searchResults ? "min-h-screen flex items-center justify-center" : "py-16"} bg-white dark:bg-gray-800 transition-all duration-300`}
      >
        <div className="text-center max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Get help with any nonprofit task.
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Stop staring at blank pages. Start with templates that actually
            understand nonprofit work.
          </p>

          {/* Main Semantic Search */}
          <div className="mb-8">
            <SemanticSearchBox
              placeholder="What are you working on?"
              className="max-w-2xl mx-auto"
              onSearch={handleSearch}
              showLiveSearch={false}
              isSearching={isSearching}
            />
          </div>
        </div>
      </section>

      {/* Search Results Section */}
      {searchResults && (
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {isSearching
                    ? "Searching..."
                    : allResults.length > 0
                      ? `Found ${allResults.length} result${allResults.length === 1 ? "" : "s"}`
                      : "No results found"}
                </h2>
                <button
                  onClick={() => {
                    setSearchResults(null);
                    setSearchQuery("");
                    setShowAllResults(false);
                  }}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Clear search
                </button>
              </div>

              {searchResults.parsedQuery && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    <strong>Understanding:</strong>{" "}
                    {searchResults.parsedQuery.context}
                  </p>
                  {searchResults.parsedQuery.category && (
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      Category: {searchResults.parsedQuery.category} • Intent:{" "}
                      {searchResults.parsedQuery.intentType}
                    </p>
                  )}
                </div>
              )}
            </div>

            {isSearching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : allResults.length > 0 ? (
              <div className="space-y-8">
                {hasTopPicks && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      Recommended for this request
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {highlightedResults.map((pick: any) => (
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
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowAllResults((value) => !value)}
                      className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      {showAllResults
                        ? "Hide additional matches"
                        : `View all ${secondaryResults.length} matches`}
                      <svg
                        className={`ml-2 h-4 w-4 transition-transform ${showAllResults ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}

                {(!hasTopPicks || (showAllResults && secondaryResults.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(hasTopPicks ? secondaryResults : allResults).map((prompt: any) => (
                      <PromptCard key={prompt._id} prompt={prompt} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg
                    className="mx-auto h-16 w-16 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <h3 className="text-xl font-medium mb-3">No results found</h3>
                  <p className="text-sm max-w-md mx-auto mb-4">
                    Try describing what you need differently or be more specific
                    about your situation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Categories Section - Always visible as footer */}
      <section id="categories" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaticCategoryGrid ref={categoryGridRef} />
        </div>
      </section>
    </div>
  );
}
