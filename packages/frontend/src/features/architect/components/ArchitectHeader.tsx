/**
 * Architect Header Component
 * Top bar with navigation and generation status
 */

import { useNavigate } from 'react-router-dom';

interface ArchitectHeaderProps {
  projectId: string;
  isGenerating: boolean;
  generationMessage: string;
  documentCount?: number;
  documentationGenerated: boolean;
}

export function ArchitectHeader({
  projectId,
  isGenerating,
  generationMessage,
  documentCount,
  documentationGenerated,
}: ArchitectHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex-shrink-0 px-4 py-3 border-b border-subtle bg-surface-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="text-brand-500 hover:text-brand-400 transition text-sm font-medium"
          >
            ← Back to Project
          </button>
          <div className="h-4 w-px bg-border-subtle" />
          <h1 className="text-lg font-bold text-primary">
            🏗️ AI Project Architect
          </h1>
        </div>
        {(documentationGenerated || isGenerating) && (
          <div className="flex items-center gap-2">
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-500"></div>
                <span className="text-sm text-secondary">
                  {generationMessage}
                </span>
              </>
            ) : (
              <span className="text-sm text-secondary">
                {documentCount} documents ready
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

