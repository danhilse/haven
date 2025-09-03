interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Step {currentStep} of {totalSteps}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          {Math.round((currentStep / totalSteps) * 100)}% complete
        </div>
      </div>
      
      <div className="flex items-center justify-center">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;
          
          return (
            <div key={index} className="flex items-center">
              {/* Step Circle */}
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                  ${isCompleted 
                    ? 'bg-green-500 text-white' 
                    : isCurrent 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  stepNumber
                )}
              </div>
              
              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div
                  className={`
                    w-12 h-px mx-3
                    ${isCompleted || (isCurrent && index + 1 < currentStep)
                      ? 'bg-green-500' 
                      : 'bg-gray-200 dark:bg-gray-700'
                    }
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}