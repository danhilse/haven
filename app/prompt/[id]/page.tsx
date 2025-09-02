"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface PromptPageProps {
  params: { id: string };
}

export default function PromptPage({ params }: PromptPageProps) {
  const prompt = useQuery(api.prompts.getPromptById, {
    promptId: params.id as Id<"prompts">
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
            The prompt you're looking for could not be found.
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

  const complexityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <a href="/" className="hover:text-gray-700 dark:hover:text-gray-200">
              Home
            </a>
            <span>→</span>
            <a 
              href={`/category/${prompt.category.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
              className="hover:text-gray-700 dark:hover:text-gray-200"
            >
              {prompt.category}
            </a>
            <span>→</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {prompt.title}
            </span>
          </nav>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {prompt.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {prompt.description}
              </p>
            </div>
            
            <div className="flex flex-col items-end space-y-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${complexityColors[prompt.complexity]}`}>
                {prompt.complexity.charAt(0).toUpperCase() + prompt.complexity.slice(1)} Complexity
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {prompt.category} → {prompt.subcategory}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Prompt content */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Prompt Template
              </h2>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border">
                <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
                  {prompt.content}
                </pre>
              </div>
            </div>

            {/* Execute prompt button */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Ready to use this prompt?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Execute this prompt with your organization's context to generate customized content.
              </p>
              <button
                onClick={() => {
                  // For now, just show an alert - this will be connected to the execution system later
                  alert("Prompt execution will be available in the next phase!");
                }}
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 
                          text-white font-medium rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Execute Prompt
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            {prompt.tags.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Details
              </h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Category</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">{prompt.category}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Subcategory</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">{prompt.subcategory}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Complexity</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">
                    {prompt.complexity.charAt(0).toUpperCase() + prompt.complexity.slice(1)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</dt>
                  <dd className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(prompt.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Related actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Related
              </h3>
              <div className="space-y-2">
                <a 
                  href={`/category/${prompt.category.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')}`}
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Browse more in {prompt.category}
                </a>
                <a 
                  href={`/search?q=${encodeURIComponent(prompt.tags[0] || prompt.category)}`}
                  className="block text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                  Find similar prompts
                </a>
              </div>
            </div>
          </div>
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