/**
 * AI Project Architect Page
 * Chat-only interface for generating comprehensive project documentation
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProjectAssistantPanel } from '../components/ProjectAssistantPanel';

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

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function ProjectArchitectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [documentationGenerated, setDocumentationGenerated] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocsData | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; content: string } | null>(null);

  // Check if documentation exists and load it
  const checkDocumentation = async () => {
    if (!projectId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/architect/documentation/${projectId}`);
      if (response.status === 404) {
        // Documentation doesn't exist yet - this is expected and not an error
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
        }
      } else {
        // Other error status codes
        console.warn('Failed to check documentation:', response.status, response.statusText);
      }
    } catch (err) {
      // Network or other errors
      console.warn('Error checking documentation:', err);
    }
  };

  // Check for existing documentation on mount
  useEffect(() => {
    checkDocumentation();
  }, [projectId]);

  // Preview a document
  const previewDocument = async (documentName: string) => {
    if (!projectId) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/architect/document/${projectId}/${documentName}`);
      if (!response.ok) {
        throw new Error('Failed to load document');
      }
      const content = await response.text();
      setPreviewDoc({ name: documentName, content });
    } catch (err) {
      console.error('Failed to load document:', err);
    }
  };

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
    <div className="flex flex-col h-full overflow-hidden bg-surface w-full max-w-none">
      {/* Compact Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-subtle bg-surface-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="text-accent hover:text-brand-primary-hover transition text-sm font-medium"
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

      {/* Main Content - Chat Only */}
      <div className="flex-1 min-h-0 overflow-hidden">
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

      {/* Document Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="surface-card rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-subtle flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-bold text-primary">
                {previewDoc.name.replace(/-/g, ' ').replace('.md', '')}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadDocument(previewDoc.name)}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-brand-primary-hover transition text-sm font-medium"
                >
                  📥 Download
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 surface-elevated text-secondary rounded-lg hover:border-accent transition text-sm font-medium"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-900">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-900 dark:text-slate-100 m-0">
                {previewDoc.content}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Documentation List Modal - Show when docs are generated */}
      {documentationGenerated && generatedDocs && !previewDoc && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setDocumentationGenerated(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                📄 Generated Documents ({generatedDocs.documentCount})
              </h2>
          <button
                onClick={() => setDocumentationGenerated(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
          </button>
        </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
              {generatedDocs.documents.map((doc: any) => (
                <div
                  key={doc.name}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600"
                >
                  <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        {doc.name.replace(/-/g, ' ').replace('.md', '')}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                      {(doc.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => previewDocument(doc.name)}
                        className="px-3 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition text-sm font-medium"
                      >
                        👁️ Preview
                      </button>
                  <button
                    onClick={() => downloadDocument(doc.name)}
                        className="btn btn-secondary text-sm font-medium"
                      >
                        📥 Download
                  </button>
                    </div>
                </div>
              ))}
            </div>
              <div className="mt-6 text-center">
              <button
                onClick={downloadAllDocuments}
                  className="px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-slate-600 transition font-medium"
                >
                  📦 Download All (.zip)
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
  </div>
  );
}
