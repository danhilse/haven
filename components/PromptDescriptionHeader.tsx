interface PromptDescriptionHeaderProps {
  title: string;
  description?: string;
  outputDescription?: string;
  complexity?: "low" | "medium" | "high";
  showComplexity?: boolean;
  onComplexityClick?: () => void;
}

export function PromptDescriptionHeader({
  title,
  description,
  outputDescription,
  complexity,
  showComplexity = false,
  onComplexityClick
}: PromptDescriptionHeaderProps) {
  const complexityLabels = {
    low: { label: "Simple", color: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" },
    medium: { label: "Balanced", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" },
    high: { label: "Detailed", color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-6 sticky top-0 z-10 shadow-sm">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {title}
            </h1>
            {description && (
              <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
                {description}
              </p>
            )}
          </div>
          
          {showComplexity && complexity && (
            <div className="ml-6 flex-shrink-0">
              <button
                onClick={onComplexityClick}
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105 hover:shadow-md ${complexityLabels[complexity].color} ${onComplexityClick ? 'cursor-pointer' : ''}`}
                title="Click to change output style"
              >
                {complexityLabels[complexity].label}
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {outputDescription && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  What you'll get:
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {outputDescription}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}