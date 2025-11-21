/**
 * Document List Component
 * Sidebar list of generated documents with status icons
 */

interface Document {
  name: string;
  generatedAt: string;
  size: number;
  status?: 'generating' | 'completed' | 'failed';
  error?: string;
}

interface DocumentListProps {
  documents: Document[];
  selectedIndex: number | null;
  onDocumentSelect: (index: number, documentName: string) => void;
  onDownloadAll: () => void;
}

export function DocumentList({
  documents,
  selectedIndex,
  onDocumentSelect,
  onDownloadAll,
}: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="text-tertiary">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-sm">No documents yet</p>
          <p className="text-xs mt-1 text-tertiary">Documents will appear here once generated</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Document List Header */}
      <div className="px-4 py-3 border-b border-subtle flex items-center justify-between flex-shrink-0">
        <h2 className="text-base font-bold text-primary">
          📄 Documents ({documents.length})
        </h2>
        <button
          onClick={onDownloadAll}
          className="btn btn-primary px-3 py-1.5 text-xs font-medium"
          title="Download all documents"
        >
          📦 All
        </button>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {documents.map((doc, index) => {
            const docName = doc.name;
            const displayName = docName.replace(/-/g, ' ').replace('.md', '');
            const isSelected = selectedIndex === index;
            const status = doc.status || 'completed';

            return (
              <button
                key={docName}
                onClick={() => {
                  if (status === 'completed') {
                    onDocumentSelect(index, docName);
                  }
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                  status !== 'completed'
                    ? 'opacity-60 cursor-not-allowed'
                    : isSelected
                      ? 'bg-brand-500/20 border border-brand-500/40 text-primary'
                      : 'hover:bg-surface-elevated text-secondary hover:text-primary'
                }`}
                disabled={status !== 'completed'}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium truncate flex-1">{displayName}</div>
                  <div className="flex items-center gap-1 ml-2">
                    {status === 'generating' && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b border-brand-500"></div>
                    )}
                    {status === 'failed' && (
                      <span className="text-red-500 text-xs">⚠️</span>
                    )}
                    {status === 'completed' && (
                      <span className="text-green-500 text-xs">✓</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-tertiary mt-0.5 flex items-center justify-between">
                  <span>
                    {status === 'generating' ? 'Generating...' :
                     status === 'failed' ? 'Failed' :
                     `${(doc.size / 1024).toFixed(1)} KB`}
                  </span>
                  {doc.error && (
                    <span className="text-red-400 text-xs truncate ml-2" title={doc.error}>
                      {doc.error}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

