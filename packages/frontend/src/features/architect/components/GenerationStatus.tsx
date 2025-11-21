/**
 * Generation Status Component
 * Progress bar or status indicators for document generation
 */

import { JewelSpinner } from '../../../components/JewelSpinner';

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
        <JewelSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-sm font-medium">Generating Documentation</p>
        <p className="text-xs mt-1 text-tertiary">{generationMessage}</p>
        <p className="text-xs mt-2 text-tertiary">This may take 30-60 seconds...</p>
      </div>
    </div>
  );
}

