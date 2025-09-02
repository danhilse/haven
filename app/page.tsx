"use client";

import { SearchBox } from "../components/SearchBox";
import { CategoryGrid } from "../components/CategoryGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Nonprofit Prompt Library
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              AI-Powered Prompts for Nonprofits
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Access hundreds of curated prompt templates designed specifically for nonprofit organizations. 
              Search by topic or browse by category to find the perfect prompts for your needs.
            </p>
            
            {/* Main Search */}
            <div className="mb-8">
              <SearchBox
                placeholder="Search nonprofit prompt templates..."
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/search"
                className="inline-flex items-center justify-center px-8 py-3 
                          bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                          transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search Prompts
              </a>
              <a
                href="#categories"
                className="inline-flex items-center justify-center px-8 py-3 
                          bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                          text-gray-900 dark:text-gray-100 font-medium rounded-lg
                          transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Browse Categories
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Browse by Category
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore our organized collection of prompt templates, each designed to help nonprofits 
              with specific tasks and communications.
            </p>
          </div>
          <CategoryGrid />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Nonprofit Prompt Library - Empowering organizations with AI-powered templates</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

