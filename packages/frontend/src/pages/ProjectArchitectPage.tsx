/**
 * AI Project Architect Page
 * Guides users through interview and generates comprehensive documentation
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  phase: string;
  category: string;
  question: string;
  helpText?: string;
  options?: string[];
  required: boolean;
}

interface InterviewProgress {
  sessionId: string;
  currentPhase: string;
  completionPercentage: number;
  phaseComplete: boolean;
  interviewComplete: boolean;
}

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

  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [progress, setProgress] = useState<InterviewProgress | null>(null);
  const [documentationGenerated, setDocumentationGenerated] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Start interview session
  const startInterview = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/architect/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.data.sessionId);
        setCurrentQuestion(data.data.firstQuestion);
        setProgress({
          sessionId: data.data.sessionId,
          currentPhase: data.data.currentPhase,
          completionPercentage: 0,
          phaseComplete: false,
          interviewComplete: false,
        });
      } else {
        setError('Failed to start interview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Submit answer
  const submitAnswer = async () => {
    if (!sessionId || !currentQuestion || !currentAnswer.trim()) {
      setError('Please provide an answer');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/architect/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          answer: currentAnswer,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const result = data.data;

        setProgress({
          sessionId: result.sessionId,
          currentPhase: result.currentPhase || progress?.currentPhase || 'quick-discovery',
          completionPercentage: result.completionPercentage,
          phaseComplete: result.phaseComplete,
          interviewComplete: result.interviewComplete,
        });

        if (result.interviewComplete) {
          // Interview complete, ready to generate docs
          setCurrentQuestion(null);
          setCurrentAnswer('');
        } else if (result.nextQuestion) {
          setCurrentQuestion(result.nextQuestion);
          setCurrentAnswer('');
        }
      } else {
        setError('Failed to submit answer');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Generate documentation
  const generateDocumentation = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/architect/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, sessionId }),
      });

      const data = await response.json();

      if (data.success) {
        setDocumentationGenerated(true);
        setGeneratedDocs(data.data);
      } else {
        setError('Failed to generate documentation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Download a document
  const downloadDocument = async (documentName: string) => {
    if (!projectId) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/architect/document/${projectId}/${documentName}`
      );

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
      setError(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  return (
    <div className="project-architect-page" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate(`/projects/${projectId}`)}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            padding: '0.5rem 0',
          }}
        >
          ← Back to Project
        </button>
      </div>

      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        🏗️ AI Project Architect
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Transform your game concept into complete, AI-agent-ready project documentation
      </p>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '1rem',
            color: '#dc2626',
          }}
        >
          {error}
        </div>
      )}

      {!sessionId && !documentationGenerated && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <p style={{ fontSize: '1.125rem', marginBottom: '2rem' }}>
            Ready to create comprehensive documentation for your game?
          </p>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            This will guide you through a 10-25 question interview and generate 4-6 professional documents.
          </p>
          <button
            onClick={startInterview}
            disabled={loading}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Starting...' : 'Start Interview'}
          </button>
        </div>
      )}

      {sessionId && progress && !progress.interviewComplete && currentQuestion && (
        <div>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                Phase: {progress.currentPhase.replace(/-/g, ' ').toUpperCase()}
              </span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {progress.completionPercentage}% complete
              </span>
            </div>
            <div style={{ height: '0.5rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  backgroundColor: '#3b82f6',
                  width: `${progress.completionPercentage}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ marginBottom: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              {currentQuestion.category.replace(/-/g, ' ').toUpperCase()}
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              {currentQuestion.question}
            </h3>
            {currentQuestion.helpText && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                💡 {currentQuestion.helpText}
              </p>
            )}

            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              <select
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                }}
              >
                <option value="">-- Select an option --</option>
                {currentQuestion.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                }}
              />
            )}
          </div>

          <button
            onClick={submitAnswer}
            disabled={loading || !currentAnswer.trim()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: loading || !currentAnswer.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !currentAnswer.trim() ? 0.5 : 1,
            }}
          >
            {loading ? 'Submitting...' : 'Next'}
          </button>
        </div>
      )}

      {sessionId && progress?.interviewComplete && !documentationGenerated && (
        <div style={{ textAlign: 'center', padding: '3rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Interview Complete!</h2>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            You've answered all the questions. Ready to generate your documentation?
          </p>
          <button
            onClick={generateDocumentation}
            disabled={loading}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              fontSize: '1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Generating...' : 'Generate Documentation'}
          </button>
        </div>
      )}

      {documentationGenerated && generatedDocs && (
        <div>
          <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>✅</div>
          <h2 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '1rem' }}>
            Documentation Generated!
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>
            Generated {generatedDocs.documentCount} documents for your project
          </p>

          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>📄 Available Documents</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {generatedDocs.documents.map((doc: any) => (
                <div
                  key={doc.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '0.375rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{doc.name.replace(/-/g, ' ')}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                      {(doc.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    onClick={() => downloadDocument(doc.name)}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Back to Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
