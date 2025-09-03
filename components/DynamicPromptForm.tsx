"use client";

import { MultiStepPromptForm } from "./MultiStepPromptForm";

interface DynamicPromptFormProps {
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

export function DynamicPromptForm(props: DynamicPromptFormProps) {
  // Use the new MultiStepPromptForm for all prompt forms
  return <MultiStepPromptForm {...props} />;
}