import { useState } from "react";

interface Variable {
  name: string;
  questionPrompt: string;
  description: string;
  inputType: string;
  examples?: string[];
  isRequired: boolean;
  selectOptions?: string[];
}

interface VariableStepProps {
  variables: Variable[];
  values: Record<string, string>;
  onValueChange: (name: string, value: string) => void;
  groupTitle?: string;
}

export function VariableStep({ variables, values, onValueChange, groupTitle }: VariableStepProps) {
  const [showTooltips, setShowTooltips] = useState<Record<string, boolean>>({});
  
  const getRandomExample = (examples?: string[]) => {
    if (!examples || examples.length === 0) return "";
    return examples[Math.floor(Math.random() * examples.length)];
  };

  const toggleTooltip = (varName: string) => {
    setShowTooltips(prev => ({
      ...prev,
      [varName]: !prev[varName]
    }));
  };

  const renderInput = (variable: Variable) => {
    const value = values[variable.name] || "";
    const placeholder = getRandomExample(variable.examples);
    const baseClasses = "w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg";

    switch (variable.inputType) {
      case 'long_text':
        return (
          <textarea
            value={value}
            onChange={(e) => onValueChange(variable.name, e.target.value)}
            placeholder={placeholder || `Enter your ${variable.questionPrompt?.toLowerCase()}`}
            rows={4}
            className={baseClasses}
          />
        );

      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onValueChange(variable.name, e.target.value)}
            className={baseClasses}
          >
            <option value="">Select an option...</option>
            {variable.selectOptions?.map((option: string) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'email':
        return (
          <input
            type="email"
            value={value}
            onChange={(e) => onValueChange(variable.name, e.target.value)}
            placeholder={placeholder || 'your@organization.org'}
            className={baseClasses}
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            value={value}
            onChange={(e) => onValueChange(variable.name, e.target.value)}
            placeholder={placeholder || '(555) 123-4567'}
            className={baseClasses}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => onValueChange(variable.name, e.target.value)}
            className={baseClasses}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onValueChange(variable.name, e.target.value)}
            placeholder={placeholder || 'Enter a number'}
            className={baseClasses}
          />
        );

      case 'currency':
        return (
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">$</span>
            <input
              type="number"
              value={value}
              onChange={(e) => onValueChange(variable.name, e.target.value)}
              placeholder={placeholder || '0.00'}
              className={`${baseClasses} pl-12`}
              step="0.01"
            />
          </div>
        );

      case 'document':
        return (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Upload your document
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                {variable.description}
              </p>
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  onValueChange(variable.name, file ? file.name : '');
                }}
                className="hidden"
                id={`file-${variable.name}`}
              />
              <label
                htmlFor={`file-${variable.name}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
              >
                Choose File
              </label>
              {value && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                  Selected: {value}
                </p>
              )}
            </div>
          </div>
        );

      case 'short_text':
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onValueChange(variable.name, e.target.value)}
            placeholder={placeholder || `Enter your ${variable.questionPrompt?.toLowerCase()}`}
            className={baseClasses}
          />
        );
    }
  };

  if (variables.length === 0) return null;

  // Single variable step
  if (variables.length === 1) {
    const variable = variables[0];
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {variable.questionPrompt}
            </h2>
            {variable.description && (
              <div className="relative ml-3">
                <button
                  onClick={() => toggleTooltip(variable.name)}
                  className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                
                {showTooltips[variable.name] && (
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10 w-80 p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg">
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                    {variable.description}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {variable.isRequired && (
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This information is required to continue
            </p>
          )}
        </div>

        <div className="mb-6">
          {renderInput(variable)}
        </div>

        {variable.examples && variable.examples.length > 1 && (
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Other examples:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {variable.examples.slice(1).map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => onValueChange(variable.name, example)}
                  className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Multiple variables step (grouped)
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {groupTitle || "Additional Information"}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please fill in the following details
        </p>
      </div>

      <div className="grid gap-8">
        {variables.map((variable) => (
          <div key={variable.name} className="space-y-4">
            <div className="flex items-center">
              <label className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {variable.questionPrompt}
                {variable.isRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {variable.description && (
                <div className="relative ml-3">
                  <button
                    onClick={() => toggleTooltip(variable.name)}
                    className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  
                  {showTooltips[variable.name] && (
                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10 w-80 p-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm rounded-lg shadow-lg">
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
                      {variable.description}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {renderInput(variable)}
            
            {variable.examples && variable.examples.length > 1 && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Examples:
                </p>
                <div className="flex flex-wrap gap-2">
                  {variable.examples.slice(1).map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => onValueChange(variable.name, example)}
                      className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}