interface ComplexityChangeModalProps {
  isOpen: boolean;
  currentComplexity: "low" | "medium" | "high";
  newComplexity: "low" | "medium" | "high";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ComplexityChangeModal({
  isOpen,
  currentComplexity,
  newComplexity,
  onConfirm,
  onCancel
}: ComplexityChangeModalProps) {
  const complexityLabels = {
    low: "Simple",
    medium: "Balanced", 
    high: "Detailed"
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Change Output Style?
          </h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You're about to change from <span className="font-semibold text-gray-900 dark:text-gray-100">{complexityLabels[currentComplexity]}</span> to <span className="font-semibold text-gray-900 dark:text-gray-100">{complexityLabels[newComplexity]}</span> output style.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              <span className="font-medium">⚠️ This will reset your progress.</span> You'll need to fill out the form again from the beginning, as different complexity levels may require different information.
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            Keep Current Style
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Change & Reset
          </button>
        </div>
      </div>
    </div>
  );
}