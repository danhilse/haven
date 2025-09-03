"use client";

import { useState, useEffect, useMemo } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { OutputViewer } from "./OutputViewer";

interface DynamicPromptFormProps {
  promptId: Id<"prompts">;
  prompt: {
    title: string;
    content: string;
    variables?: string[];
  };
  className?: string;
  autoExpand?: boolean;
  externalComplexity?: "low" | "medium" | "high";
  onComplexityChange?: (complexity: "low" | "medium" | "high") => void;
}

interface OrgProfile {
  name: string;
  mission: string;
  tone: string;
  region: string;
  customFields?: Record<string, string>;
}

interface VariableValues {
  [key: string]: string;
}

export function DynamicPromptForm({ 
  promptId, 
  prompt, 
  className = "", 
  autoExpand = false,
  externalComplexity,
  onComplexityChange
}: DynamicPromptFormProps) {
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Use external complexity if provided, otherwise use internal state
  const [internalComplexity, setInternalComplexity] = useState<"low" | "medium" | "high">(
    (prompt as any).complexity || "medium"
  );
  
  const selectedComplexity = externalComplexity || internalComplexity;
  const setSelectedComplexity = onComplexityChange || setInternalComplexity;
  const [result, setResult] = useState<string | null>(null);
  const [resultMetadata, setResultMetadata] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [orgProfile, setOrgProfile] = useState<OrgProfile>({
    name: "",
    mission: "",
    tone: "professional",
    region: "",
  });

  const [variableValues, setVariableValues] = useState<VariableValues>({});

  const executePrompt = useAction(api.prompts.executePrompt);
  
  // Get the prompt variant for the selected complexity
  const currentPromptVariant = useQuery(api.prompts.getPromptVariantsByTitle, {
    title: prompt.title,
    complexity: selectedComplexity
  });
  
  // Use the current variant if available, otherwise fall back to the original prompt
  const activePrompt = currentPromptVariant || prompt;
  
  // Get variable metadata for the active prompt - only if we have variables
  const variableMetadata = useQuery(
    api.variables.getVariablesByPromptId, 
    activePrompt.variables && activePrompt.variables.length > 0
      ? { promptId: activePrompt._id || promptId }
      : "skip"
  );

  // Initialize variable values when active prompt changes
  useEffect(() => {
    if (activePrompt.variables && activePrompt.variables.length > 0) {
      const initialValues: VariableValues = {};
      activePrompt.variables.forEach(varName => {
        initialValues[varName] = "";
      });
      setVariableValues(initialValues);
    } else {
      setVariableValues({});
    }
  }, [activePrompt.variables, selectedComplexity]);

  // Generate the final prompt with variable substitution
  const processedPrompt = useMemo(() => {
    let processed = activePrompt.content;
    
    // Replace bracketed variables with values
    Object.entries(variableValues).forEach(([varName, value]) => {
      const regex = new RegExp(`\\[${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
      processed = processed.replace(regex, value || `[${varName}]`);
    });
    
    return processed;
  }, [activePrompt.content, variableValues]);

  // Estimate token count for input
  const inputTokens = useMemo(() => {
    const totalInput = `${processedPrompt} ${orgProfile.name} ${orgProfile.mission}`;
    return Math.ceil(totalInput.length / 4); // Rough estimation
  }, [processedPrompt, orgProfile]);

  const complexityLabels = {
    low: { label: "Simple", description: "Quick, straightforward output", tokens: "~500 tokens" },
    medium: { label: "Balanced", description: "Comprehensive yet concise", tokens: "~1,000 tokens" },
    high: { label: "Detailed", description: "Thorough, in-depth analysis", tokens: "~2,000 tokens" }
  };

  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  const handleExecute = async () => {
    // Check if all required variables are filled
    const missingVariables = activePrompt.variables?.filter(varName => 
      !variableValues[varName]?.trim()
    ) || [];

    if (missingVariables.length > 0) {
      setError(`Please fill in these required variables: ${missingVariables.join(', ')}`);
      return;
    }

    if (!orgProfile.name.trim() || !orgProfile.mission.trim()) {
      setError("Please fill in your organization profile.");
      return;
    }

    setIsExecuting(true);
    setError(null);
    setResult(null);

    try {
      const response = await executePrompt({
        promptId: activePrompt._id || promptId,
        situation: processedPrompt,
        complexity: selectedComplexity,
        orgProfile: {
          name: orgProfile.name.trim(),
          mission: orgProfile.mission.trim(),
          tone: orgProfile.tone,
          region: orgProfile.region.trim(),
          customFields: orgProfile.customFields
        }
      });

      setResult(response.output);
      setResultMetadata(response.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while executing the prompt.");
    } finally {
      setIsExecuting(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Get Started
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Generate customized content with your organization's context
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 
                      text-white font-medium rounded-lg transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Start Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      {!autoExpand && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Get Started
            </h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Complexity Selector - Top Setting */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Output Complexity
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(Object.keys(complexityLabels) as Array<keyof typeof complexityLabels>).map((complexity) => (
              <button
                key={complexity}
                onClick={() => setSelectedComplexity(complexity)}
                className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  selectedComplexity === complexity
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {complexityLabels[complexity].label}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {complexityLabels[complexity].description}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {complexityLabels[complexity].tokens}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Variables Section */}
        {activePrompt.variables && activePrompt.variables.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Template Variables
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePrompt.variables.map(varName => {
                const metadata = variableMetadata?.find(v => v.name === varName);
                return (
                  <div key={varName}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {varName.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} *
                    </label>
                    {metadata?.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {metadata.description}
                      </p>
                    )}
                    <input
                      type="text"
                      value={variableValues[varName] || ""}
                      onChange={(e) => handleVariableChange(varName, e.target.value)}
                      placeholder={metadata?.examples?.[0] || `Enter ${varName.toLowerCase()}`}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {metadata?.examples && metadata.examples.length > 1 && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Examples: {metadata.examples.slice(1).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}


        {/* Organization Profile */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Organization Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                value={orgProfile.name}
                onChange={(e) => setOrgProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your Organization Name"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Region/Location
              </label>
              <input
                type="text"
                value={orgProfile.region}
                onChange={(e) => setOrgProfile(prev => ({ ...prev, region: e.target.value }))}
                placeholder="City, State/Country"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mission Statement *
            </label>
            <textarea
              value={orgProfile.mission}
              onChange={(e) => setOrgProfile(prev => ({ ...prev, mission: e.target.value }))}
              placeholder="Describe your organization's mission and key activities..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Communication Tone
            </label>
            <select
              value={orgProfile.tone}
              onChange={(e) => setOrgProfile(prev => ({ ...prev, tone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                        bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly & Approachable</option>
              <option value="formal">Formal</option>
              <option value="conversational">Conversational</option>
              <option value="urgent">Urgent & Action-Oriented</option>
            </select>
          </div>
        </div>

        {/* Token Usage Estimate */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Estimated input tokens:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">~{inputTokens.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600 dark:text-gray-400">Expected output tokens:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {complexityLabels[selectedComplexity].tokens}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={handleExecute}
          disabled={isExecuting || !orgProfile.name.trim() || !orgProfile.mission.trim()}
          className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 
                    disabled:bg-gray-400 disabled:cursor-not-allowed
                    text-white font-medium rounded-lg transition-colors duration-200"
        >
          {isExecuting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                      d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Execute Prompt
            </>
          )}
        </button>

        {/* Result Display */}
        {result && (
          <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
            <OutputViewer
              content={result}
              title={`Generated: ${activePrompt.title} (${selectedComplexity})`}
              metadata={resultMetadata}
            />
          </div>
        )}
      </div>
    </div>
  );
}