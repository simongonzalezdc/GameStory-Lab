/**
 * AI Project Architect Page
 * Controller component for generating comprehensive project documentation
 */

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ProjectAssistantPanel } from '../components/ProjectAssistantPanel';
import { ArchitectHeader } from '../features/architect/components/ArchitectHeader';
import { DocumentList } from '../features/architect/components/DocumentList';
import { DocumentPreview } from '../features/architect/components/DocumentPreview';
import { GenerationStatus } from '../features/architect/components/GenerationStatus';

interface GeneratedDocsData {
  projectId: string;
  sessionId: string;
  documentCount: number;
  documents: Array<{
    name: string;
    generatedAt: string;
    size: number;
    status?: 'generating' | 'completed' | 'failed';
    error?: string;
  }>;
  generatedAt: string;
  generationStatus?: 'idle' | 'generating' | 'completed' | 'failed';
  generationStartedAt?: string;
  generationCompletedAt?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

export function ProjectArchitectPage() {
  const { projectId } = useParams<{ projectId: string }>();

  const [documentationGenerated, setDocumentationGenerated] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocsData | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{ name: string; content: string } | null>(null);
  const [selectedDocIndex, setSelectedDocIndex] = useState<number | null>(null);
  const [documentsContent, setDocumentsContent] = useState<Map<string, string>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState<string>('');

  // Track which projectIds have already been checked to prevent duplicate calls in Strict Mode
  const checkedProjects = useRef<Set<string>>(new Set());
  const missingDocsLogged = useRef<Set<string>>(new Set());
  const previousProjectId = useRef<string | undefined>(undefined);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);

  // Start polling for generation status
  const startPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    pollingInterval.current = setInterval(async () => {
      await checkDocumentation({ force: true });
      // Note: Status check happens inside checkDocumentation after state update
    }, 3000); // Poll every 3 seconds
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  // Check if documentation exists and load it
  const checkDocumentation = async (options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    if (!projectId) return;

    // Skip if already checked and not forcing (prevents duplicate calls in Strict Mode)
    if (!force && checkedProjects.current.has(projectId)) {
      return;
    }

    // Mark as checked before making the request
    if (!force) {
      checkedProjects.current.add(projectId);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/architect/documentation/${projectId}`, {
        // Suppress console errors for expected 404s
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (response.status === 404) {
        // Documentation doesn't exist yet - this is expected and not an error
        // Log only once per projectId to aid debugging
        if (!missingDocsLogged.current.has(projectId)) {
          console.debug(`[Architect] No documentation found for project ${projectId}`);
          missingDocsLogged.current.add(projectId);
        }
        setDocumentationGenerated(false);
        setGeneratedDocs(null);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const docs = data.data;
          const generationStatus = docs.generationStatus || 'completed';

          setGeneratedDocs({
            projectId: docs.projectId,
            sessionId: docs.sessionId,
            documentCount: docs.documents.length,
            documents: docs.documents.map((doc: any) => ({
              name: doc.templateName || doc.name,
              generatedAt: doc.generatedAt || new Date().toISOString(),
              size: doc.size || doc.content?.length || 0,
              status: doc.status || 'completed',
              error: doc.error,
            })),
            generatedAt: docs.generatedAt || new Date().toISOString(),
            generationStatus,
            generationStartedAt: docs.generationStartedAt,
            generationCompletedAt: docs.generationCompletedAt,
          });

          // Handle generation status
          // Check if all documents are completed/failed - stop polling if so
          const allCompleted = docs.documents.every(
            (doc: any) => doc.status === 'completed' || doc.status === 'failed'
          );

          if (generationStatus === 'generating' && !allCompleted) {
            // Still generating - continue polling
            setIsGenerating(true);
            setGenerationMessage('AI is generating your documentation...');
            setDocumentationGenerated(false);
            startPolling();
          } else {
            // All done (either status says completed or all docs are done)
            setIsGenerating(false);
            setGenerationMessage('');
            setDocumentationGenerated(true);
            stopPolling();

            // Load first document by default if completed
            if (docs.documents.length > 0 && (generationStatus === 'completed' || allCompleted)) {
              const firstCompletedDoc = docs.documents.find(
                (doc: any) => doc.status === 'completed'
              );
              if (firstCompletedDoc) {
                loadDocumentContent(firstCompletedDoc.templateName || firstCompletedDoc.name);
                setSelectedDocIndex(docs.documents.indexOf(firstCompletedDoc));
              }
            }
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
    // Only clear refs when projectId actually changes (not on Strict Mode re-runs)
    if (previousProjectId.current !== projectId) {
      checkedProjects.current.clear();
      missingDocsLogged.current.clear();
      previousProjectId.current = projectId;
      // Stop any existing polling
      stopPolling();
      setIsGenerating(false);
      setGenerationMessage('');
    }

    // Call without force flag - second Strict Mode invocation will be skipped
    // because the projectId hasn't changed, so checkedProjects still contains it
    checkDocumentation();

    // Cleanup polling on unmount
    return () => {
      stopPolling();
    };
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

  // Handlers for child components
  const handleDocumentSelect = async (index: number, documentName: string) => {
    setSelectedDocIndex(index);
    const content = documentsContent.get(documentName);
    if (content) {
      setPreviewDoc({ name: documentName, content });
    } else {
      setPreviewDoc({ name: documentName, content: '' });
      await loadDocumentContent(documentName);
    }
  };

  const handleDownloadDocument = () => {
    if (previewDoc) {
      downloadDocument(previewDoc.name);
    }
  };

  const handleClosePreview = () => {
    setPreviewDoc(null);
    setSelectedDocIndex(null);
  };

  const previewContent = previewDoc ? documentsContent.get(previewDoc.name) || null : null;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-surface w-full max-w-none">
      {/* Header */}
      <ArchitectHeader
        projectId={projectId || ''}
        isGenerating={isGenerating}
        generationMessage={generationMessage}
        documentCount={generatedDocs?.documentCount}
        documentationGenerated={documentationGenerated}
      />

      {/* Main Content - Split Layout 50/50 */}
      <div className="flex-1 min-h-0 overflow-hidden flex">
        {/* Left Side - Chat Panel */}
        <div className="flex-1 min-w-0 min-h-0 overflow-hidden border-r border-subtle flex flex-col">
          {projectId && (
            <ProjectAssistantPanel 
              projectId={projectId} 
              type="architect" 
              onProposalAccepted={async () => {
                // Force refresh documentation after proposal is accepted
                checkedProjects.current.delete(projectId);
                missingDocsLogged.current.delete(projectId);
                await checkDocumentation({ force: true });
              }}
            />
          )}
        </div>

        {/* Right Side - Document Preview Panel */}
        <div className="flex-1 min-w-0 flex flex-col bg-surface-card border-l border-subtle">
          {isGenerating && (!generatedDocs || generatedDocs.documents.length === 0) ? (
            <GenerationStatus
              isGenerating={isGenerating}
              generationMessage={generationMessage}
            />
          ) : generatedDocs && generatedDocs.documents.length > 0 ? (
            <>
              <DocumentList
                documents={generatedDocs.documents.map((doc: any) => ({
                  name: doc.templateName || doc.name,
                  generatedAt: doc.generatedAt || new Date().toISOString(),
                  size: doc.size || doc.content?.length || 0,
                  status: doc.status || 'completed',
                  error: doc.error,
                }))}
                selectedIndex={selectedDocIndex}
                onDocumentSelect={handleDocumentSelect}
                onDownloadAll={downloadAllDocuments}
              />
              <DocumentPreview
                documentName={previewDoc?.name || ''}
                content={previewContent}
                onDownload={handleDownloadDocument}
                onClose={handleClosePreview}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div className="text-tertiary">
                <div className="text-4xl mb-2">📄</div>
                <p className="text-sm">No documents yet</p>
                <p className="text-xs mt-1 text-tertiary">Documents will appear here once generated</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
