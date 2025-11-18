/**
 * Concept Editor Page
 * Edit and refine game concepts with real-time validation
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, validationAPI, exportAPI, refinementAPI } from '../services/api';

interface Project {
  id: string;
  name: string;
  genre?: string;
}

interface Concept {
  id: string;
  version: number;
  mechanics: any;
  lore: any;
  createdAt: string;
}

interface ValidationIssue {
  ruleId: string;
  category: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

export function ConceptEditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [currentConcept, setCurrentConcept] = useState<Concept | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [consistencyScore, setConsistencyScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'mechanics' | 'lore' | 'validation'>('mechanics');

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    if (currentConcept) {
      runValidation();
    }
  }, [currentConcept]);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const response = await projectsAPI.get(projectId);
      setProject(response.project);
      setConcepts(response.concepts || []);
      if (response.concepts && response.concepts.length > 0) {
        setCurrentConcept(response.concepts[response.concepts.length - 1]);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    if (!currentConcept) return;

    try {
      setValidating(true);
      const response = await validationAPI.validate({
        conceptId: currentConcept.id,
        mechanics: currentConcept.mechanics,
        lore: currentConcept.lore,
      });
      setValidationIssues(response.issues || []);
      setConsistencyScore(response.consistencyScore);
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setValidating(false);
    }
  };

  const handleExport = async (template: 'gdd' | 'pitch' | 'technical') => {
    if (!currentConcept) return;

    try {
      setExporting(true);
      const response = await exportAPI.export({
        conceptId: currentConcept.id,
        template,
      });

      // Download the markdown file
      const blob = new Blob([response.markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.name}-${template}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const handleRefine = async (focus: 'deepen-mechanics' | 'enrich-lore' | 'improve-consistency' | 'enhance-genre-fit') => {
    if (!currentConcept) return;

    try {
      setRefining(true);
      await refinementAPI.refine({
        conceptId: currentConcept.id,
        focus,
      });

      // Reload project to get the new version
      await loadProject();
      alert('Concept refined successfully! A new version has been created.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to refine concept');
    } finally {
      setRefining(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold text-red-800 mb-2">Error Loading Project</h3>
        <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  if (!currentConcept) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Concepts Yet</h3>
        <p className="text-gray-600 mb-4">This project doesn't have any concepts yet.</p>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-blue-600 hover:text-blue-700 mb-2"
          >
            ← Back to Projects
          </button>
          <h2 className="text-3xl font-bold text-gray-900">{project.name}</h2>
          <p className="text-gray-600 mt-1">
            Version {currentConcept.version} • {concepts.length} total version(s)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('gdd')}
            disabled={exporting}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50"
          >
            📄 Export
          </button>
          <div className="relative group">
            <button
              disabled={refining}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
            >
              ✨ Refine
            </button>
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10">
              <button
                onClick={() => handleRefine('deepen-mechanics')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Deepen Mechanics
              </button>
              <button
                onClick={() => handleRefine('enrich-lore')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Enrich Lore
              </button>
              <button
                onClick={() => handleRefine('improve-consistency')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Improve Consistency
              </button>
              <button
                onClick={() => handleRefine('enhance-genre-fit')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
              >
                Enhance Genre Fit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Consistency Score */}
      {consistencyScore !== null && (
        <div className={`mb-6 p-4 rounded-lg border ${
          consistencyScore >= 80 ? 'bg-green-50 border-green-200' :
          consistencyScore >= 60 ? 'bg-yellow-50 border-yellow-200' :
          'bg-red-50 border-red-200'
        }`}>
          <div className="flex justify-between items-center">
            <span className="font-medium">Consistency Score:</span>
            <span className="text-2xl font-bold">{consistencyScore}%</span>
          </div>
          <div className="mt-2 bg-white rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                consistencyScore >= 80 ? 'bg-green-600' :
                consistencyScore >= 60 ? 'bg-yellow-600' :
                'bg-red-600'
              }`}
              style={{ width: `${consistencyScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-4">
          {(['mechanics', 'lore', 'validation'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'validation' && validationIssues.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                  {validationIssues.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeTab === 'mechanics' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Game Mechanics</h3>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(currentConcept.mechanics, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'lore' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Game Lore</h3>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(currentConcept.lore, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Validation Results</h3>
              <button
                onClick={runValidation}
                disabled={validating}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
              >
                {validating ? 'Validating...' : '🔄 Re-validate'}
              </button>
            </div>

            {validationIssues.length === 0 ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <div className="text-4xl mb-2">✅</div>
                <h4 className="font-semibold text-green-800 mb-1">All Clear!</h4>
                <p className="text-green-600">No validation issues found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {validationIssues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      issue.severity === 'error'
                        ? 'bg-red-50 border-red-200'
                        : issue.severity === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              issue.severity === 'error'
                                ? 'bg-red-100 text-red-800'
                                : issue.severity === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600">{issue.category}</span>
                        </div>
                        <p className="text-gray-900">{issue.message}</p>
                        {issue.field && (
                          <p className="text-sm text-gray-500 mt-1">Field: {issue.field}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
