"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SemanticSearchBoxProps {
  placeholder?: string;
  initialValue?: string;
  className?: string;
  onSearch?: (query: string) => void;
  debounceMs?: number;
  showLiveSearch?: boolean;
  isSearching?: boolean;
}

export function SemanticSearchBox({ 
  placeholder = "Describe what you're looking for...", 
  initialValue = "",
  className = "",
  onSearch,
  debounceMs = 500,
  showLiveSearch = true,
  isSearching = false
}: SemanticSearchBoxProps) {
  const [query, setQuery] = useState(initialValue);
  const [internalSearching, setInternalSearching] = useState(false);
  const router = useRouter();

  // Use external isSearching prop if provided, otherwise use internal state
  const showSearching = isSearching || internalSearching;

  const handleSearch = useCallback((searchQuery: string) => {
    setInternalSearching(false);
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      // Navigate to search page with semantic query parameter
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&semantic=true`);
    }
  }, [onSearch, router]);

  // Debounced search effect for live search
  useEffect(() => {
    if (!showLiveSearch || !onSearch) return;
    
    if (query.trim().length === 0) {
      handleSearch('');
      return;
    }

    if (query.trim().length < 10) {
      return; // Don't search for very short semantic queries
    }

    setInternalSearching(true);
    const timeoutId = setTimeout(() => {
      handleSearch(query.trim());
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
      setInternalSearching(false);
    };
  }, [query, debounceMs, handleSearch, showLiveSearch, onSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault();
      handleSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={3}
          className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400 resize-none"
        />
        <button
          type="submit"
          disabled={!query.trim() || showSearching}
          className="absolute right-2 bottom-2 
                     p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600
                     transition-colors"
        >
          {showSearching ? (
            <div className="w-5 h-5">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500 dark:border-gray-400"></div>
            </div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </div>
      
      <div className="mt-2 text-center">
        <a 
          href="#categories" 
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline underline-offset-2"
        >
          browse library
        </a>
      </div>
    </form>
  );
}