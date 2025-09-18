"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useAction } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { OutputViewer } from "@/components/OutputViewer";
import { GENERATION_STORAGE_KEY, PromptGenerationPayload } from "@/lib/types";

interface PromptGeneratePageProps {
  params: Promise<{ id: string }>;
}

type GenerationStatus = "pending" | "executing" | "success" | "error";

export default function PromptGeneratePage({ params }: PromptGeneratePageProps) {
  const resolvedParams = use(params);
  const promptId = resolvedParams.id;
  const router = useRouter();
  const executePrompt = useAction(api.prompts.executePrompt);

  const [payload, setPayload] = useState<PromptGenerationPayload | null>(null);
  const [status, setStatus] = useState<GenerationStatus>("pending");
  const [error, setError] = useState<string | null>(null);
  const [generatedOutput, setGeneratedOutput] = useState<{
    content: string;
    metadata: {
      model?: string;
      tokens?: number;
      complexity?: string;
      duration: number;
    };
  } | null>(null);

  useEffect(() => {
    if (status !== "pending") return;
    if (typeof window === "undefined") return;

    const stored = sessionStorage.getItem(GENERATION_STORAGE_KEY);

    if (!stored) {
      setError(
        "We couldn't find the information needed to generate your document. Please return to the previous step and try again."
      );
      setStatus("error");
      return;
    }

    sessionStorage.removeItem(GENERATION_STORAGE_KEY);

    try {
      const parsed = JSON.parse(stored) as PromptGenerationPayload;

      if (parsed.basePromptId !== promptId) {
        console.warn("Prompt ID mismatch while generating content", {
          expected: promptId,
          received: parsed.basePromptId,
        });
      }

      setPayload(parsed);
      setStatus("executing");

      const startTime = performance.now();

      executePrompt({
        promptId: parsed.promptId,
        situation: parsed.situation,
        complexity: parsed.complexity,
        orgProfile: parsed.orgProfile,
      })
        .then((response) => {
          const duration = Math.max(1, Math.round(performance.now() - startTime));
          setGeneratedOutput({
            content: response.output,
            metadata: {
              model: response.metadata.model,
              tokens: response.metadata.tokens,
              complexity: response.metadata.complexity,
              duration,
            },
          });
          setStatus("success");
        })
        .catch((err) => {
          console.error("Prompt execution failed:", err);
          setError(
            err instanceof Error
              ? err.message
              : "We couldn't generate the document. Please try again."
          );
          setStatus("error");
        });
    } catch (err) {
      console.error("Failed to parse generation payload:", err);
      setError("We couldn't read the generation request. Please start over.");
      setStatus("error");
    }
  }, [executePrompt, promptId, status]);

  const heading = useMemo(() => {
    if (status === "success" && payload) {
      return payload.outputDescription || `Generated: ${payload.title}`;
    }
    if (payload) {
      return `Generating ${payload.title}`;
    }
    return "Preparing your document";
  }, [payload, status]);

  const subheading = useMemo(() => {
    if (!payload) return "We're getting everything ready.";

    if (status === "success") {
      return "Your tailored document is ready to review and share.";
    }

    const orgName = payload.orgProfile.name || "your organization";
    return `We're customizing this for ${orgName}. Hang tight—this just takes a moment.`;
  }, [payload, status]);

  const handleReturnToPrompt = () => {
    router.push(`/prompt/${promptId}`);
  };

  const handleStartNew = () => {
    router.push(`/prompt/${promptId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-blue-600 dark:text-blue-400 font-semibold mb-2">
                Content Generation
              </p>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{heading}</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">{subheading}</p>
            </div>
            <button
              onClick={handleReturnToPrompt}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              ← Back to prompt
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {status === "error" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || "We weren't able to complete this request. Please return to the previous step and try again."}
            </p>
            <button
              onClick={handleReturnToPrompt}
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {(status === "pending" || status === "executing") && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-10 text-center shadow-sm">
            <div className="mx-auto mb-8 h-14 w-14 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {payload?.outputDescription || "Crafting your content"}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              {payload
                ? `We're writing your ${payload.title.toLowerCase()} with the ${payload.complexity} level of detail you selected.`
                : "We're gathering the details needed to craft your content."}
            </p>
            {payload && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold">Complexity</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100 capitalize">{payload.complexity}</p>
                </div>
                <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold">Organization</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100">
                    {payload.orgProfile.name || "Not specified"}
                  </p>
                </div>
                <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
                  <p className="text-xs uppercase tracking-wide text-blue-700 dark:text-blue-300 font-semibold">Tone</p>
                  <p className="mt-1 text-base text-gray-900 dark:text-gray-100 capitalize">
                    {payload.orgProfile.tone || "Professional"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {status === "success" && generatedOutput && payload && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed in {(generatedOutput.metadata.duration / 1000).toFixed(1)}s</p>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {payload.outputDescription || `Generated ${payload.title}`}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-sm font-medium text-blue-700 dark:text-blue-200">
                  {payload.complexity.charAt(0).toUpperCase() + payload.complexity.slice(1)} detail
                </span>
                {payload.orgProfile.name && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {payload.orgProfile.name}
                  </span>
                )}
              </div>
            </div>

            <OutputViewer
              content={generatedOutput.content}
              title={payload.outputDescription || `Generated: ${payload.title}`}
              metadata={generatedOutput.metadata}
            />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <button
                onClick={handleStartNew}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Generate another version
              </button>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Back to top
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
