"use client";

import { SemanticSearchBox } from "../components/SemanticSearchBox";
import { StaticCategoryGrid } from "../components/StaticCategoryGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Haven
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Your quiet strategist
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Start stronger on every task—from donor letters to grant drafts—so you can focus on the mission, not the busywork.
            </p>
            
            {/* Main Semantic Search */}
            <div className="mb-8">
              <SemanticSearchBox
                placeholder="What do you need help with today?"
                className="max-w-2xl mx-auto"
              />
            </div>

            {/* Primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/search?semantic=true"
                className="inline-flex items-center justify-center px-8 py-3 
                          bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg
                          transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Find your next answer
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
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Explore the library
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
              Clarity on demand
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Your board has questions, donors need updates, a report is due. We give you the words, tuned to your mission, ready in moments.
            </p>
          </div>
          <StaticCategoryGrid />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Haven - The work is hard enough. Let us give you a head start.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

