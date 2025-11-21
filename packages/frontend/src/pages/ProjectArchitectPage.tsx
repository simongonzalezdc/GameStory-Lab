/**
 * AI Project Architect Page
 * Chat-only interface for generating comprehensive project documentation
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectAssistantPanel } from '../components/ProjectAssistantPanel';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

interface GeneratedDocsData {
  projectId: string;
  sessionId: string;
  documentCount: number;
  documents: Array<{
    name: string;
    generatedAt: string;
    size: number;
  }>;
  generatedAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

export function ProjectArchitectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [documentationGenerated, setDocumentationGenerated] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocsData | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; content: string } | null>(null);
  const [selectedDocIndex, setSelectedDocIndex] = useState<number | null>(null);
  const [documentsContent, setDocumentsContent] = useState<Map<string, string>>(new Map());

  // Check if documentation exists and load it
  const checkDocumentation = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/architect/documentation/${projectId}`, {
        // Suppress console errors for expected 404s
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.status === 404) {
        // Documentation doesn't exist yet - this is expected and not an error
        // Silently handle this case without logging
        setDocumentationGenerated(false);
        setGeneratedDocs(null);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const docs = data.data;
          setGeneratedDocs({
            projectId: docs.projectId,
            sessionId: docs.sessionId,
            documentCount: docs.documents.length,
            documents: docs.documents.map((doc: any) => ({
              name: doc.templateName || doc.name,
              generatedAt: doc.generatedAt || new Date().toISOString(),
              size: doc.size || doc.content?.length || 0,
            })),
            generatedAt: docs.generatedAt || new Date().toISOString(),
          });
          setDocumentationGenerated(true);
          // Load first document by default
          if (docs.documents.length > 0) {
            loadDocumentContent(docs.documents[0].templateName || docs.documents[0].name);
            setSelectedDocIndex(0);
          }
        }
      } else {
        // Other error status codes (but not 404, which is handled above)
        console.warn('Failed to check documentation:', response.status, response.statusText);
      }
    } catch (err) {
      // Network or other errors - only log if it's not a 404 or abort
      if (err instanceof Error) {
        const isAbort = err.name === 'AbortError' || err.name === 'TimeoutError';
        const is404 = err.message.includes('404');
        if (!isAbort && !is404) {
          console.warn('Error checking documentation:', err);
        }
      }
    }
  };

  // Load document content
  const loadDocumentContent = async (documentName: string) => {
    if (documentsContent.has(documentName)) {
      return; // Already loaded
    }
    if (!projectId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/architect/document/${projectId}/${documentName}`);
      if (!response.ok) {
        throw new Error('Failed to load document');
      }
      const content = await response.text();
      setDocumentsContent(prev => new Map(prev).set(documentName, content));
    } catch (err) {
      console.error('Failed to load document:', err);
    }
  };

  // Check for existing documentation on mount
  useEffect(() => {
    checkDocumentation();
  }, [projectId]);

  // Update preview when document content loads
  useEffect(() => {
    if (previewDoc && documentsContent.has(previewDoc.name)) {
      const content = documentsContent.get(previewDoc.name);
      if (content && previewDoc.content !== content) {
        setPreviewDoc({ name: previewDoc.name, content });
      }
    }
  }, [documentsContent, previewDoc]);

  // Download a document
  const downloadDocument = async (documentName: string) => {
    if (!projectId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/architect/document/${projectId}/${documentName}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentName}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download document:', err);
    }
  };

  const downloadAllDocuments = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/architect/export/${projectId}`);
      if (!response.ok) {
        throw new Error('Failed to export documentation');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectId}-documents.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download archive:', err);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface w-full max-w-none">
      {/* Compact Header */}
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
          {documentationGenerated && generatedDocs && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-secondary">
                {generatedDocs.documentCount} documents ready
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content - Split Layout 50/50 */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        {/* Left Side - Chat Panel */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden border-r border-subtle flex flex-col">
          {projectId && (
            <ProjectAssistantPanel 
              projectId={projectId} 
              type="architect" 
              onProposalAccepted={async () => {
                // Reload documentation after proposal is accepted
                await checkDocumentation();
              }}
            />
          )}
        </div>

        {/* Right Side - Document Preview Panel (Always Visible) */}
        <div className="flex-1 min-w-0 flex flex-col bg-surface-card border-l border-subtle">
          {/* Document List Header */}
          <div className="px-4 py-3 border-b border-subtle flex items-center justify-between flex-shrink-0">
            <h2 className="text-base font-bold text-primary">
              📄 Documents {generatedDocs && generatedDocs.documents.length > 0 && `(${generatedDocs.documentCount})`}
            </h2>
            {generatedDocs && generatedDocs.documents.length > 0 && (
              <button
                onClick={downloadAllDocuments}
                className="btn btn-primary px-3 py-1.5 text-xs font-medium"
                title="Download all documents"
              >
                📦 All
              </button>
            )}
          </div>

          {/* Document List */}
          {generatedDocs && generatedDocs.documents.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              <div className="p-2 space-y-1">
                {generatedDocs.documents.map((doc: any, index: number) => {
                  const docName = doc.templateName || doc.name;
                  const displayName = docName.replace(/-/g, ' ').replace('.md', '');
                  const isSelected = selectedDocIndex === index;
                  
                  return (
                    <button
                      key={docName}
                      onClick={async () => {
                        setSelectedDocIndex(index);
                        const content = documentsContent.get(docName);
                        if (content) {
                          setPreviewDoc({ name: docName, content });
                        } else {
                          setPreviewDoc({ name: docName, content: '' });
                          await loadDocumentContent(docName);
                          // Content will be updated when documentsContent state updates
                        }
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                        isSelected
                          ? 'bg-brand-500/20 border border-brand-500/40 text-primary'
                          : 'hover:bg-surface-elevated text-secondary hover:text-primary'
                      }`}
                    >
                      <div className="font-medium truncate">{displayName}</div>
                      <div className="text-xs text-tertiary mt-0.5">
                        {(doc.size / 1024).toFixed(1)} KB
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div className="text-tertiary">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm">No documents yet</p>
                <p className="text-xs mt-1 text-tertiary">Documents will appear here once generated</p>
              </div>
            </div>
          )}

          {/* Document Preview */}
          {previewDoc ? (
            <div className="flex-1 flex flex-col border-t border-subtle min-h-0">
              {/* Preview Header */}
              <div className="px-4 py-2 border-b border-subtle flex items-center justify-between flex-shrink-0 bg-surface-elevated">
                <h3 className="text-sm font-bold text-primary truncate flex-1">
                  {previewDoc.name.replace(/-/g, ' ').replace('.md', '')}
                </h3>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => downloadDocument(previewDoc.name)}
                    className="btn btn-primary px-2 py-1 text-xs"
                    title="Download"
                  >
                    📥
                  </button>
                  <button
                    onClick={() => {
                      setPreviewDoc(null);
                      setSelectedDocIndex(null);
                    }}
                    className="btn btn-secondary px-2 py-1 text-xs"
                    title="Close preview"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-4 bg-surface">
                {documentsContent.has(previewDoc.name) ? (
                  <div className="prose prose-invert max-w-none">
                    <MarkdownRenderer content={documentsContent.get(previewDoc.name) || ''} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-tertiary">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-2"></div>
                      <p className="text-sm">Loading document...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center border-t border-subtle">
              <div className="text-tertiary">
                <div className="text-4xl mb-2">👁️</div>
                <p className="text-sm">Select a document to preview</p>
              </div>
            </div>
          )}
        </div>
      </div>

  </div>
  );
}
