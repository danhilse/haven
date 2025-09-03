interface ComplexityStepProps {
  complexity: "low" | "medium" | "high";
  onComplexityChange: (complexity: "low" | "medium" | "high") => void;
  isEditing?: boolean;
  onComplexityModalOpen?: (complexity: "low" | "medium" | "high") => void;
}

export function ComplexityStep({ complexity, onComplexityChange, isEditing = false, onComplexityModalOpen }: ComplexityStepProps) {
  const complexityOptions = {
    low: { 
      label: "Simple", 
      description: "Quick, straightforward output", 
      tokens: "~500 tokens",
      details: "Perfect for basic communications, quick announcements, or simple requests"
    },
    medium: { 
      label: "Balanced", 
      description: "Comprehensive yet concise", 
      tokens: "~1,000 tokens",
      details: "Great balance of detail and readability for most professional communications"
    },
    high: { 
      label: "Detailed", 
      description: "Thorough, in-depth analysis", 
      tokens: "~2,000 tokens",
      details: "Comprehensive content with extensive detail, examples, and thorough explanations"
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Choose Your Output Style
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Select how detailed you'd like your generated content to be
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(Object.keys(complexityOptions) as Array<keyof typeof complexityOptions>).map((key) => (
          <button
            key={key}
            onClick={() => {
              if (isEditing && onComplexityModalOpen && key !== complexity) {
                onComplexityModalOpen(key);
              } else {
                onComplexityChange(key);
              }
            }}
            className={`p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg ${
              complexity === key
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
            }`}
          >
            {/* Selected indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                complexity === key
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-500'
              }`}>
                {complexity === key && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>
              <span className={`text-sm font-medium ${
                complexity === key 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {complexityOptions[key].tokens}
              </span>
            </div>

            <div className="mb-4">
              <h3 className={`text-xl font-bold mb-2 ${
                complexity === key 
                  ? 'text-blue-900 dark:text-blue-100' 
                  : 'text-gray-900 dark:text-gray-100'
              }`}>
                {complexityOptions[key].label}
              </h3>
              <p className={`text-base font-medium mb-3 ${
                complexity === key 
                  ? 'text-blue-800 dark:text-blue-200' 
                  : 'text-gray-700 dark:text-gray-300'
              }`}>
                {complexityOptions[key].description}
              </p>
              <p className={`text-sm ${
                complexity === key 
                  ? 'text-blue-700 dark:text-blue-300' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {complexityOptions[key].details}
              </p>
            </div>

            {/* Visual indicator */}
            <div className="flex space-x-1">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-full ${
                    i < (key === 'low' ? 1 : key === 'medium' ? 2 : 3)
                      ? complexity === key
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          You can always adjust this later if needed. Most users find the "Balanced" option works well for their needs.
        </div>
      </div>
    </div>
  );
}