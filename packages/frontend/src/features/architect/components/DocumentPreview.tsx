/**
 * Document Preview Component
 * Main markdown viewer (memoized to prevent re-renders)
 */

import { useMemo } from 'react';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import { JewelSpinner } from '../../../components/JewelSpinner';

interface DocumentPreviewProps {
  documentName: string;
  content: string | null;
  onDownload: () => void;
  onClose: () => void;
}

export function DocumentPreview({
  documentName,
  content,
  onDownload,
  onClose,
}: DocumentPreviewProps) {
  // Memoize the rendered markdown to prevent re-renders when content hasn't changed
  const renderedContent = useMemo(() => {
    if (!content) return null;
    return <MarkdownRenderer content={content} />;
  }, [content]);

  const displayName = documentName.replace(/-/g, ' ').replace('.md', '');

  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center border-t border-subtle">
        <div className="text-tertiary">
          <div className="text-4xl mb-2">👁️</div>
          <p className="text-sm">Select a document to preview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col border-t border-subtle min-h-0">
      {/* Preview Header */}
      <div className="px-4 py-2 border-b border-subtle flex items-center justify-between flex-shrink-0 bg-surface-elevated">
        <h3 className="text-sm font-bold text-primary truncate flex-1">
          {displayName}
        </h3>
        <div className="flex gap-1 ml-2">
          <button
            onClick={onDownload}
            className="btn btn-primary px-2 py-1 text-xs"
            title="Download"
          >
            📥
          </button>
          <button
            onClick={onClose}
            className="btn btn-secondary px-2 py-1 text-xs"
            title="Close preview"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-surface">
        {content ? (
          <div className="prose prose-invert max-w-none">
            {renderedContent}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-tertiary">
            <div className="text-center">
              <JewelSpinner size="md" className="mx-auto mb-2" />
              <p className="text-sm">Loading document...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

