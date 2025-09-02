"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

interface OutputViewerProps {
  content: string;
  title?: string;
  metadata?: {
    model?: string;
    tokens?: number;
    complexity?: string;
    duration?: number;
  };
  className?: string;
}

export function OutputViewer({ content, title = "Generated Content", metadata, className = "" }: OutputViewerProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy content:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {metadata && (
            <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
              {metadata.model && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {metadata.model}
                </span>
              )}
              {metadata.tokens && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                  </svg>
                  {metadata.tokens.toLocaleString()} tokens
                </span>
              )}
              {metadata.duration && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {(metadata.duration / 1000).toFixed(1)}s
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
          {/* View mode toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setViewMode('rendered')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                viewMode === 'rendered'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Rendered
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                viewMode === 'raw'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Raw
            </button>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`flex items-center px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
              copied
                ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="flex items-center px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-700
                      text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600
                      transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'rendered' ? (
          <div className="prose prose-gray max-w-none dark:prose-invert 
                         prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                         prose-p:leading-relaxed prose-li:leading-relaxed
                         prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                         prose-pre:bg-gray-50 dark:prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700
                         prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/20
                         prose-table:text-sm prose-th:bg-gray-50 dark:prose-th:bg-gray-800
                         prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                // Custom components for better styling
                h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">{children}</h1>,
                h2: ({children}) => <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-6">{children}</h2>,
                h3: ({children}) => <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 mt-4">{children}</h3>,
                p: ({children}) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">{children}</p>,
                ul: ({children}) => <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">{children}</ul>,
                ol: ({children}) => <ol className="list-decimal list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">{children}</ol>,
                li: ({children}) => <li className="leading-relaxed">{children}</li>,
                blockquote: ({children}) => (
                  <blockquote className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 pl-4 py-2 mb-4 italic text-gray-700 dark:text-gray-300">
                    {children}
                  </blockquote>
                ),
                code: ({inline, children}) => inline ? (
                  <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                    {children}
                  </code>
                ) : (
                  <code className="block bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700 text-sm font-mono overflow-x-auto">
                    {children}
                  </code>
                )
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <pre className="p-4 text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap overflow-x-auto">
              {content}
            </pre>
          </div>
        )}
      </div>

      {/* Footer with additional actions */}
      <div className="px-4 sm:px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{content.length.toLocaleString()} characters</span>
            <span>~{Math.ceil(content.length / 4).toLocaleString()} tokens</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 
                             transition-colors duration-200 text-sm underline">
              Generate Variation
            </button>
            <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 
                             transition-colors duration-200 text-sm underline">
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}