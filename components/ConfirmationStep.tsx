interface Variable {
  name: string;
  questionPrompt: string;
  description: string;
  inputType: string;
  isRequired: boolean;
  category?: string;
  grouping?: string;
}

interface ConfirmationStepProps {
  promptTitle: string;
  promptDescription?: string;
  outputDescription?: string;
  variables: Variable[];
  globalVariables: Variable[];
  values: Record<string, string>;
  globalValues: Record<string, string>;
  complexity: "low" | "medium" | "high";
  onEdit: (stepIndex: number) => void;
  onExecute: () => void;
  isExecuting: boolean;
}

export function ConfirmationStep({
  promptTitle,
  promptDescription,
  outputDescription,
  variables,
  globalVariables,
  values,
  globalValues,
  complexity,
  onEdit,
  onExecute,
  isExecuting
}: ConfirmationStepProps) {
  const complexityLabels = {
    low: { label: "Simple", tokens: "~500 tokens" },
    medium: { label: "Balanced", tokens: "~1,000 tokens" },
    high: { label: "Detailed", tokens: "~2,000 tokens" }
  };

  const formatValue = (value: string, inputType: string) => {
    if (!value) return "Not provided";
    
    switch (inputType) {
      case 'currency':
        const num = parseFloat(value);
        return isNaN(num) ? value : `$${num.toLocaleString()}`;
      case 'document':
        return value || "No file selected";
      case 'long_text':
        return value.length > 100 ? `${value.substring(0, 100)}...` : value;
      default:
        return value;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Review & Confirm
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please review your information before generating your content
        </p>
      </div>

      {/* Output Preview */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
        <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
          What You'll Receive
        </h3>
        <p className="text-blue-800 dark:text-blue-200 mb-4">
          {outputDescription || `A customized ${promptTitle.toLowerCase()} tailored to your organization`}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-blue-700 dark:text-blue-300">
            Complexity: {complexityLabels[complexity].label}
          </span>
          <span className="text-blue-700 dark:text-blue-300">
            Expected length: {complexityLabels[complexity].tokens}
          </span>
        </div>
      </div>

      {/* Global Variables Review */}
      {globalVariables.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Organization Information
              </h3>
              <button
                onClick={() => onEdit(0)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                Edit
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {globalVariables.map((variable) => (
              <div key={variable.name} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {variable.questionPrompt}
                  </p>
                </div>
                <div className="flex-1 ml-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatValue(globalValues[variable.name] || "", variable.inputType)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt-Specific Variables Review */}
      {variables.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Specific Details
              </h3>
              <button
                onClick={() => onEdit(1)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                Edit
              </button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            {variables.map((variable) => (
              <div key={variable.name} className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {variable.questionPrompt}
                  </p>
                </div>
                <div className="flex-1 ml-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    {formatValue(values[variable.name] || "", variable.inputType)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Required Fields Check */}
      <div className="mb-8">
        {(() => {
          const missingRequired = [
            ...globalVariables.filter(v => v.isRequired && !globalValues[v.name]?.trim()),
            ...variables.filter(v => v.isRequired && !values[v.name]?.trim())
          ];
          
          if (missingRequired.length > 0) {
            return (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                      Required fields missing
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Please fill in: {missingRequired.map(v => v.questionPrompt).join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
          
          return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                    All required information provided
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Ready to generate your customized content
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Execute Button */}
      <button
        onClick={onExecute}
        disabled={isExecuting || (() => {
          const missingRequired = [
            ...globalVariables.filter(v => v.isRequired && !globalValues[v.name]?.trim()),
            ...variables.filter(v => v.isRequired && !values[v.name]?.trim())
          ];
          return missingRequired.length > 0;
        })()}
        className="w-full flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 
                  disabled:bg-gray-400 disabled:cursor-not-allowed
                  text-white font-semibold text-lg rounded-lg transition-colors duration-200"
      >
        {isExecuting ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
            Generating Your Content...
          </>
        ) : (
          <>
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Content
          </>
        )}
      </button>
    </div>
  );
}