"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { GENERATION_STORAGE_KEY, PromptGenerationPayload } from "@/lib/types";
import { StepIndicator } from "./StepIndicator";
import { VariableStep } from "./VariableStep";
import { ConfirmationStep } from "./ConfirmationStep";
import { PromptDescriptionHeader } from "./PromptDescriptionHeader";
import { ComplexityStep } from "./ComplexityStep";
import { ComplexityChangeModal } from "./ComplexityChangeModal";

interface MultiStepPromptFormProps {
  promptId: Id<"prompts">;
  prompt: {
    title: string;
    content: string;
    description?: string;
    outputDescription?: string;
    variables?: string[];
  };
  className?: string;
  autoExpand?: boolean;
  externalComplexity?: "low" | "medium" | "high";
  onComplexityChange?: (complexity: "low" | "medium" | "high") => void;
}

interface Variable {
  name: string;
  questionPrompt: string;
  description: string;
  inputType: string;
  examples?: string[];
  isRequired: boolean;
  grouping?: string;
  sortOrder: number;
}

interface VariableValues {
  [key: string]: string;
}

interface VariableGroup {
  grouping: string;
  variables: Variable[];
  title: string;
}

export function MultiStepPromptForm({ 
  promptId, 
  prompt, 
  className = "", 
  autoExpand = false,
  externalComplexity,
  onComplexityChange
}: MultiStepPromptFormProps) {
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for complexity selection
  const [complexityChosen, setComplexityChosen] = useState(false);
  const [showComplexityModal, setShowComplexityModal] = useState(false);
  const [pendingComplexity, setPendingComplexity] = useState<"low" | "medium" | "high">("medium");
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  
  // Use external complexity if provided, otherwise use internal state
  const [internalComplexity, setInternalComplexity] = useState<"low" | "medium" | "high">(
    (prompt as any).complexity || "medium"
  );
  
  const selectedComplexity = externalComplexity || internalComplexity;
  const setSelectedComplexity = (complexity: "low" | "medium" | "high") => {
    if (onComplexityChange) {
      onComplexityChange(complexity);
    } else {
      setInternalComplexity(complexity);
    }
    setComplexityChosen(true);
  };

  const [variableValues, setVariableValues] = useState<VariableValues>({});
  const [globalVariableValues, setGlobalVariableValues] = useState<VariableValues>({});

  // Get the prompt variant for the selected complexity
  const currentPromptVariant = useQuery(api.prompts.getPromptVariantsByTitle, {
    title: prompt.title,
    complexity: selectedComplexity
  });
  
  // Use the current variant if available, otherwise fall back to the original prompt
  const activePrompt = currentPromptVariant || prompt;
  
  // Get prompt-specific variable metadata
  const promptVariables = useQuery(
    api.variables.getVariablesByPromptId, 
    activePrompt._id ? { promptId: activePrompt._id } : "skip"
  );
  
  // Get global variable metadata
  const globalVariables = useQuery(api.globalVariables.getGlobalVariables, {});

  // Initialize variable values
  useEffect(() => {
    if (promptVariables && promptVariables.length > 0) {
      const initialValues: VariableValues = {};
      promptVariables.forEach(variable => {
        initialValues[variable.name] = "";
      });
      setVariableValues(initialValues);
    } else {
      setVariableValues({});
    }
  }, [promptVariables]);
  
  useEffect(() => {
    if (globalVariables && globalVariables.length > 0) {
      const initialValues: VariableValues = {};
      globalVariables.forEach(variable => {
        initialValues[variable.name] = variable.defaultValue || "";
      });
      setGlobalVariableValues(initialValues);
    }
  }, [globalVariables]);

  // Group variables by grouping field
  const variableGroups = useMemo(() => {
    if (!promptVariables || promptVariables.length === 0) return [];
    
    const sorted = [...promptVariables].sort((a, b) => a.sortOrder - b.sortOrder);
    const groups: VariableGroup[] = [];
    
    // Group by grouping field
    const groupMap: { [key: string]: Variable[] } = {};
    
    sorted.forEach(variable => {
      const groupKey = variable.grouping || 'ungrouped';
      if (!groupMap[groupKey]) {
        groupMap[groupKey] = [];
      }
      groupMap[groupKey].push(variable);
    });
    
    // Convert to VariableGroup array
    Object.entries(groupMap).forEach(([grouping, variables]) => {
      const title = grouping === 'ungrouped' 
        ? variables.length === 1 
          ? variables[0].questionPrompt
          : 'Additional Details'
        : grouping.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          
      groups.push({
        grouping,
        variables,
        title
      });
    });
    
    return groups;
  }, [promptVariables]);

  // Calculate steps - only after complexity is chosen
  const steps = useMemo(() => {
    if (!complexityChosen) return [];
    
    const stepList = [];
    
    // Global variables step (if any)
    if (globalVariables && globalVariables.length > 0) {
      stepList.push({
        title: "Organization Info",
        type: "global"
      });
    }
    
    // Variable groups steps
    variableGroups.forEach(group => {
      stepList.push({
        title: group.title,
        type: "variables",
        group
      });
    });
    
    // Confirmation step
    stepList.push({
      title: "Review & Generate",
      type: "confirmation"
    });
    
    return stepList;
  }, [globalVariables, variableGroups, complexityChosen]);

  const totalSteps = steps.length;
  const stepLabels = steps.map(step => step.title);
  
  // Reset to step 1 when complexity is first chosen
  useEffect(() => {
    if (complexityChosen && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [complexityChosen, currentStep]);

  // Generate the final prompt with variable substitution
  const processedPrompt = useMemo(() => {
    let processed = activePrompt.content;
    
    // Replace prompt-specific variables
    Object.entries(variableValues).forEach(([varName, value]) => {
      const regex = new RegExp(`\\[${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
      processed = processed.replace(regex, value || `[${varName}]`);
    });
    
    // Replace global variables
    Object.entries(globalVariableValues).forEach(([varName, value]) => {
      const regex = new RegExp(`\\[${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\]`, 'g');
      processed = processed.replace(regex, value || `[${varName}]`);
    });
    
    return processed;
  }, [activePrompt.content, variableValues, globalVariableValues]);

  const handleVariableChange = (varName: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [varName]: value
    }));
  };
  
  const handleGlobalVariableChange = (varName: string, value: string) => {
    setGlobalVariableValues(prev => ({
      ...prev,
      [varName]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 1 && complexityChosen) {
      // Go back to complexity selection
      setCurrentStep(0);
      setComplexityChosen(false);
    }
  };

  const handleStepEdit = (stepIndex: number) => {
    setCurrentStep(stepIndex + 1);
  };
  
  const handleComplexityChange = (complexity: "low" | "medium" | "high") => {
    setSelectedComplexity(complexity);
    // Don't automatically advance - let user click next
  };
  
  const handleComplexityEdit = () => {
    // Go back to complexity selection and reset form state
    setCurrentStep(0);
    setComplexityChosen(false);
    setVariableValues({});
    setGlobalVariableValues({});
    setError(null);
  };
  
  const handleComplexityModalOpen = (newComplexity: "low" | "medium" | "high") => {
    if (newComplexity === selectedComplexity) return;
    setPendingComplexity(newComplexity);
    setShowComplexityModal(true);
  };
  
  const handleComplexityModalConfirm = () => {
    setSelectedComplexity(pendingComplexity);
    setShowComplexityModal(false);
    handleComplexityEdit();
  };
  
  const handleComplexityModalCancel = () => {
    setShowComplexityModal(false);
    setPendingComplexity(selectedComplexity);
  };

  const canProceed = () => {
    if (currentStep === 0) return true; // Always can proceed from complexity
    if (!complexityChosen || !steps[currentStep - 1]) return false;
    
    const currentStepData = steps[currentStep - 1];
    
    if (currentStepData.type === "global") {
      const missingRequired = globalVariables?.filter(v => 
        v.isRequired && !globalVariableValues[v.name]?.trim()
      ) || [];
      return missingRequired.length === 0;
    }
    
    if (currentStepData.type === "variables") {
      const missingRequired = currentStepData.group?.variables.filter(v => 
        v.isRequired && !variableValues[v.name]?.trim()
      ) || [];
      return missingRequired.length === 0;
    }
    
    return true;
  };

  const handleExecute = () => {
    setIsExecuting(true);
    setError(null);

    const promptIdentifier = currentPromptVariant?._id ?? promptId;

    const payload: PromptGenerationPayload = {
      promptId: promptIdentifier,
      basePromptId: promptId,
      title: activePrompt.title,
      outputDescription: activePrompt.outputDescription,
      complexity: selectedComplexity,
      situation: processedPrompt,
      orgProfile: {
        name: globalVariableValues['ORGANIZATION_NAME'] || '',
        mission: globalVariableValues['MISSION_STATEMENT'] || '',
        tone: 'professional',
        region: globalVariableValues['REGION'] || '',
        customFields: {},
      },
      variableValues,
      globalValues: globalVariableValues,
      submittedAt: Date.now(),
    };

    try {
      if (typeof window === "undefined") {
        throw new Error("Session storage is not available in this environment.");
      }

      sessionStorage.setItem(GENERATION_STORAGE_KEY, JSON.stringify(payload));
      router.push(`/prompt/${promptId}/generate`);
    } catch (err) {
      console.error("Failed to start generation flow:", err);
      setError("We couldn't start the generation. Please try again.");
      setIsExecuting(false);
    }
  };

  if (!isExpanded) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {activePrompt.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {activePrompt.description || "Generate customized content with your organization's context"}
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
    <div className={`bg-white dark:bg-gray-800 min-h-screen ${className}`}>
      {/* Fixed Header */}
      <PromptDescriptionHeader
        title={activePrompt.title}
        description={activePrompt.description}
        outputDescription={activePrompt.outputDescription}
        complexity={selectedComplexity}
        showComplexity={complexityChosen}
        onComplexityClick={handleComplexityEdit}
      />
      
      {/* Complexity Change Modal */}
      <ComplexityChangeModal
        isOpen={showComplexityModal}
        currentComplexity={selectedComplexity}
        newComplexity={pendingComplexity}
        onConfirm={handleComplexityModalConfirm}
        onCancel={handleComplexityModalCancel}
      />

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Show complexity selection first */}
        {currentStep === 0 && (
          <ComplexityStep
            complexity={selectedComplexity}
            onComplexityChange={handleComplexityChange}
          />
        )}
        
        {/* Show step indicator and content only after complexity is chosen */}
        {complexityChosen && currentStep > 0 && (
          <>
            {/* Step Indicator */}
            <StepIndicator
              currentStep={currentStep}
              totalSteps={totalSteps}
              stepLabels={stepLabels}
            />

            {/* Step Content */}
            <div className="min-h-96">
              {steps[currentStep - 1]?.type === "global" && globalVariables && (
                <VariableStep
                  variables={globalVariables}
                  values={globalVariableValues}
                  onValueChange={handleGlobalVariableChange}
                  groupTitle="Organization Information"
                />
              )}

              {steps[currentStep - 1]?.type === "variables" && steps[currentStep - 1]?.group && (
                <VariableStep
                  variables={steps[currentStep - 1].group.variables}
                  values={variableValues}
                  onValueChange={handleVariableChange}
                  groupTitle={steps[currentStep - 1].group.title}
                />
              )}

              {steps[currentStep - 1]?.type === "confirmation" && (
                <ConfirmationStep
                  promptTitle={activePrompt.title}
                  promptDescription={activePrompt.description}
                  outputDescription={activePrompt.outputDescription}
                  variables={promptVariables || []}
                  globalVariables={globalVariables || []}
                  values={variableValues}
                  globalValues={globalVariableValues}
                  complexity={selectedComplexity}
                  onEdit={handleStepEdit}
                  onExecute={handleExecute}
                  isExecuting={isExecuting}
                />
              )}
            </div>
          </>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-red-800 dark:text-red-200">{error}</div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
          {currentStep === 0 ? (
            // Complexity selection navigation
            <>
              <div></div> {/* Spacer */}
              <button
                onClick={() => {
                  setComplexityChosen(true);
                  setCurrentStep(1);
                }}
                className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 
                          text-white font-medium rounded-lg transition-colors duration-200"
              >
                Continue
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : complexityChosen && currentStep > 0 && steps[currentStep - 1]?.type !== "confirmation" ? (
            // Variable step navigation
            <>
              <button
                onClick={handlePrevious}
                className="flex items-center px-6 py-3 text-gray-600 dark:text-gray-400 
                          hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                {currentStep === 1 ? 'Change Style' : 'Previous'}
              </button>

              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 
                          disabled:bg-gray-400 disabled:cursor-not-allowed
                          text-white font-medium rounded-lg transition-colors duration-200"
              >
                Next
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : (
            <div></div> // No navigation for confirmation step
          )}
        </div>
      </div>
    </div>
  );
}
