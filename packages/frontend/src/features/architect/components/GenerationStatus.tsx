/**
 * Generation Status Component
 * Progress bar or status indicators for document generation
 */

interface GenerationStatusProps {
  isGenerating: boolean;
  generationMessage: string;
}

export function GenerationStatus({
  isGenerating,
  generationMessage,
}: GenerationStatusProps) {
  if (!isGenerating) {
    return null;
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 text-center">
      <div className="text-tertiary">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mx-auto mb-4"></div>
        <p className="text-sm font-medium">Generating Documentation</p>
        <p className="text-xs mt-1 text-tertiary">{generationMessage}</p>
        <p className="text-xs mt-2 text-tertiary">This may take 30-60 seconds...</p>
      </div>
    </div>
  );
}

