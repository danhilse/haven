"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { PromptBreadcrumb } from "../../../components/Breadcrumb";
import { PromptExecutor } from "../../../components/PromptExecutor";

interface PromptPageProps {
  params: Promise<{ id: string }>;
}

export default function PromptPage({ params }: PromptPageProps) {
  const resolvedParams = use(params);
  const [showDetails, setShowDetails] = useState(false);
  const prompt = useQuery(api.prompts.getPromptById, {
    promptId: resolvedParams.id as Id<"prompts">
  });

  if (prompt === undefined) {
    return <PromptPageSkeleton />;
  }

  if (prompt === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Prompt not found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The prompt you&apos;re looking for could not be found.
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
      {/* Minimal Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <PromptBreadcrumb
                categoryName={prompt.category}
                categorySlug={prompt.category.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}
                subcategoryName={prompt.subcategory}
                promptTitle={prompt.title}
              />
            </div>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <svg 
                className={`w-4 h-4 mr-1 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
              {showDetails ? 'Hide' : 'Show'} details
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Main Title - Concise */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {prompt.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {prompt.description}
            </p>
          </div>

          {/* Collapsible Details Section */}
          {showDetails && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Prompt Template */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Prompt Template
                  </h2>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                      {prompt.content}
                    </pre>
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-6">
                  {/* Tags */}
                  {prompt.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {prompt.tags.map((tag, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 
                                      text-gray-700 dark:text-gray-300 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Details
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Category:</dt>
                        <dd className="text-gray-900 dark:text-gray-100">{prompt.category}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Subcategory:</dt>
                        <dd className="text-gray-900 dark:text-gray-100">{prompt.subcategory}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium text-gray-500 dark:text-gray-400">Created:</dt>
                        <dd className="text-gray-900 dark:text-gray-100">
                          {new Date(prompt.createdAt).toLocaleDateString()}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  {/* Related Links */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      Related
                    </h3>
                    <div className="space-y-2 text-sm">
                      <a 
                        href={`/category/${prompt.category.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                        className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        Browse more in {prompt.category} →
                      </a>
                      <a 
                        href={`/search?q=${encodeURIComponent(prompt.tags[0] || prompt.category)}`}
                        className="block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        Find similar prompts →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Focus: Prompt Executor - Auto-expanded */}
          <PromptExecutor 
            promptId={resolvedParams.id as Id<"prompts">}
            prompt={{
              title: prompt.title,
              content: prompt.content
            }}
            autoExpand={true}
          />
        </div>
      </main>
    </div>
  );
}

function PromptPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse space-y-4">
            <div className="flex space-x-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
            </div>
            <div className="flex justify-between">
              <div className="flex-1">
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
                <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-24"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-4"></div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-4/6"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mb-3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}