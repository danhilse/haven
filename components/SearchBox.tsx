"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface SearchBoxProps {
  placeholder?: string;
  initialValue?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export function SearchBox({ 
  placeholder = "Search prompts...", 
  initialValue = "",
  className = "",
  onSearch
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialValue);
  const router = useRouter();

  const handleSearch = (searchQuery: string) => {
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      // Navigate to search page with query parameter
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      handleSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim()) {
      handleSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 text-lg border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 
                     p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
      
      {query && (
        <div className="absolute top-full left-0 right-0 mt-1 text-sm text-gray-600 dark:text-gray-400">
          Press Enter to search for "{query}"
        </div>
      )}
    </form>
  );
}