/**
 * Concept Editor Page
 * Edit and refine game concepts with real-time validation
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, validationAPI, exportAPI, refinementAPI, generateAPI } from '../services/api';

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
  const [generating, setGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [generateType, setGenerateType] = useState<'mechanics' | 'lore' | 'both'>('both');
  const [generationStep, setGenerationStep] = useState<string>('');
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
        // Concepts are ordered by version DESC, so first one is the latest
        const latestConcept = response.concepts[0];
        console.log('[LoadProject] Setting current concept:', {
          id: latestConcept.id,
          version: latestConcept.version,
          hasMechanics: !!latestConcept.mechanics && Object.keys(latestConcept.mechanics).length > 0,
          hasLore: !!latestConcept.lore && Object.keys(latestConcept.lore).length > 0,
        });
        setCurrentConcept(latestConcept);
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
      // API returns 'overallScore', not 'consistencyScore'
      setConsistencyScore(response.overallScore || response.consistencyScore || 0);
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
        <div className="text-gray-500 dark:text-gray-400">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-8 text-center">
        <h3 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">Error Loading Project</h3>
        <p className="text-red-600 dark:text-red-300 mb-4">{error || 'Project not found'}</p>
        <button
          onClick={() => navigate('/projects')}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
        >
          ← Back to Projects
        </button>
      </div>
    );
  }

  const handleGenerateConcept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;

    try {
      setGenerating(true);
      setError(null);
      setGenerationStep('');

      let mechanicsResult: any = null;

      // Generate mechanics first (if needed)
      if (generateType === 'both' || generateType === 'mechanics') {
        setGenerationStep('Generating game mechanics...');
        console.log('[Generate] Starting mechanics generation');
        
        try {
          mechanicsResult = await generateAPI.generate({
            projectId,
            taskType: 'mechanics',
            context: {
              genre: project?.genre,
              userPrompt: generatePrompt || undefined,
            },
          });
          console.log('[Generate] Mechanics generated:', mechanicsResult);
        } catch (err) {
          console.error('[Generate] Mechanics generation failed:', err);
          throw new Error(`Failed to generate mechanics: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Generate lore (use mechanics if available for better alignment)
      if (generateType === 'both' || generateType === 'lore') {
        setGenerationStep(generateType === 'both' ? 'Generating lore and story...' : 'Generating lore...');
        console.log('[Generate] Starting lore generation');
        
        try {
          // If generating lore only and we have an existing concept, pass its mechanics
          const existingMechanics = mechanicsResult 
            ? mechanicsResult.content.mechanics 
            : (currentConcept?.mechanics && Object.keys(currentConcept.mechanics).length > 0 
                ? currentConcept.mechanics 
                : undefined);
          
          await generateAPI.generate({
            projectId,
            taskType: 'lore',
            context: {
              genre: project?.genre,
              userPrompt: generatePrompt || undefined,
              existingContent: existingMechanics ? { mechanics: existingMechanics } : undefined,
            },
          });
          console.log('[Generate] Lore generated');
        } catch (err) {
          console.error('[Generate] Lore generation failed:', err);
          throw new Error(`Failed to generate lore: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      setGenerationStep('Loading concept...');
      // Reload project to get the new/updated concept
      await loadProject();
      
      // If we generated lore, switch to the lore tab to show it
      if (generateType === 'lore' || generateType === 'both') {
        setActiveTab('lore');
      }
      
      setShowGenerateModal(false);
      setGeneratePrompt('');
      setGenerationStep('');
    } catch (err) {
      console.error('[Generate] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate concept';
      setError(errorMessage);
      setGenerationStep('');
    } finally {
      setGenerating(false);
    }
  };

  if (!currentConcept) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2 inline-flex items-center gap-1"
          >
            ← Back to Projects
          </button>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{project.name}</h2>
          {project.genre && (
            <p className="text-slate-600 dark:text-slate-300 mt-1">Genre: {project.genre}</p>
          )}
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Concepts Yet</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-2 max-w-2xl mx-auto">
            <strong>Concepts</strong> are versioned game designs that combine <strong>mechanics</strong> (how the game plays) 
            and <strong>lore</strong> (the story and world). Each concept can be refined and validated for consistency.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Start by generating your first concept with AI, or create one from a template.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="btn btn-primary"
            >
              <span>✨</span>
              <span>Generate Concept with AI</span>
            </button>
            <button
              onClick={() => navigate('/templates')}
              className="btn btn-secondary"
            >
              <span>🎨</span>
              <span>Start from Template</span>
            </button>
          </div>
        </div>

        {/* Generate Modal */}
        {renderGenerateModal()}
      </div>
    );
  }

  // Render Generate Modal component (reusable)
  const renderGenerateModal = () => (
    showGenerateModal && (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setShowGenerateModal(false);
          }
        }}
      >
        <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {currentConcept ? 'Generate Content' : 'Generate Your First Concept'}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              AI will create game mechanics and lore based on your project's genre and your description.
            </p>
            
            <form onSubmit={handleGenerateConcept} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  What would you like to generate?
                </label>
                <div className="flex gap-3">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="generateType"
                      value="both"
                      checked={generateType === 'both'}
                      onChange={(e) => setGenerateType(e.target.value as 'both')}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 transition ${
                      generateType === 'both' 
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}>
                      <div className="font-medium text-slate-900 dark:text-slate-100">Both</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">Mechanics + Lore</div>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="generateType"
                      value="mechanics"
                      checked={generateType === 'mechanics'}
                      onChange={(e) => setGenerateType(e.target.value as 'mechanics')}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 transition ${
                      generateType === 'mechanics' 
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}>
                      <div className="font-medium text-slate-900 dark:text-slate-100">Mechanics</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">Gameplay only</div>
                    </div>
                  </label>
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="radio"
                      name="generateType"
                      value="lore"
                      checked={generateType === 'lore'}
                      onChange={(e) => setGenerateType(e.target.value as 'lore')}
                      className="sr-only"
                    />
                    <div className={`p-4 rounded-lg border-2 transition ${
                      generateType === 'lore' 
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30' 
                        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}>
                      <div className="font-medium text-slate-900 dark:text-slate-100">Lore</div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">Story only</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="generate-prompt" className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Describe your game idea (optional)
                </label>
                <textarea
                  id="generate-prompt"
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  className="input min-h-[100px] resize-y"
                  placeholder="e.g., A cozy farming sim with city-building elements where players manage resources and relationships..."
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Leave empty to generate based on genre, or describe your vision for more tailored results.
                </p>
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
                  <strong>Error:</strong> {error}
                  <div className="mt-2 text-xs">
                    Check the browser console (F12) for more details.
                  </div>
                </div>
              )}

              {generating && generationStep && (
                <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-600/30 border-t-blue-600 dark:border-blue-400/30 dark:border-t-blue-400 rounded-full animate-spin" />
                    <span><strong>Status:</strong> {generationStep}</span>
                  </div>
                  <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                    This may take 30-120 seconds depending on the AI model. Check the browser console (F12) for detailed logs.
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setGeneratePrompt('');
                    setError(null);
                    setGenerationStep('');
                  }}
                  className="flex-1 btn btn-secondary"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn btn-primary"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{generationStep || 'Generating...'}</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Generate Concept</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-2"
          >
            ← Back to Projects
          </button>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h2>
          <div className="flex items-center gap-4 mt-1">
            {concepts.length > 1 && (
              <select
                value={currentConcept?.id || ''}
                onChange={(e) => {
                  const selected = concepts.find(c => c.id === e.target.value);
                  if (selected) {
                    setCurrentConcept(selected);
                  }
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    Version {c.version} {c.version === concepts[0].version ? '(Latest)' : ''}
                    {c.mechanics && Object.keys(c.mechanics).length > 0 && c.lore && Object.keys(c.lore).length > 0 
                      ? ' ✓ Complete' 
                      : c.mechanics && Object.keys(c.mechanics).length > 0 
                        ? ' (Mechanics only)' 
                        : c.lore && Object.keys(c.lore).length > 0 
                          ? ' (Lore only)' 
                          : ' (Empty)'}
                  </option>
                ))}
              </select>
            )}
            <p className="text-gray-600 dark:text-gray-300">
              {concepts.length === 1 
                ? `Version ${currentConcept.version}` 
                : `Version ${currentConcept.version} of ${concepts.length} total`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {concepts.length > 1 && (
            <div className="relative group">
              <button
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition font-medium flex items-center gap-2"
              >
                <span>📋</span>
                <span>Concepts ({concepts.length})</span>
              </button>
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-20 max-h-96 overflow-y-auto">
                <div className="p-2">
                  <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">
                    All Versions
                  </div>
                  {concepts.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCurrentConcept(c)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                        currentConcept?.id === c.id
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                          : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Version {c.version}</span>
                        {c.version === concepts[0].version && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {c.mechanics && Object.keys(c.mechanics).length > 0 && c.lore && Object.keys(c.lore).length > 0 
                          ? '✓ Complete' 
                          : c.mechanics && Object.keys(c.mechanics).length > 0 
                            ? 'Mechanics only' 
                            : c.lore && Object.keys(c.lore).length > 0 
                              ? 'Lore only' 
                              : 'Empty'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => handleExport('gdd')}
            disabled={exporting}
            className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition font-medium disabled:opacity-50"
          >
            📄 Export
          </button>
          <div className="relative group">
            <button
              disabled={refining}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-medium disabled:opacity-50"
            >
              ✨ Refine
            </button>
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10">
              <button
                onClick={() => handleRefine('deepen-mechanics')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-gray-900 dark:text-gray-100"
              >
                Deepen Mechanics
              </button>
              <button
                onClick={() => handleRefine('enrich-lore')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-gray-900 dark:text-gray-100"
              >
                Enrich Lore
              </button>
              <button
                onClick={() => handleRefine('improve-consistency')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-gray-900 dark:text-gray-100"
              >
                Improve Consistency
              </button>
              <button
                onClick={() => handleRefine('enhance-genre-fit')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-sm text-gray-900 dark:text-gray-100"
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
          consistencyScore >= 80 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          consistencyScore >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
          'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900 dark:text-gray-100">Consistency Score:</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{Math.round(consistencyScore)}%</span>
          </div>
          <div className="mt-2 bg-white dark:bg-slate-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                consistencyScore >= 80 ? 'bg-green-600 dark:bg-green-500' :
                consistencyScore >= 60 ? 'bg-yellow-600 dark:bg-yellow-500' :
                'bg-red-600 dark:bg-red-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, consistencyScore))}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-4">
          {(['mechanics', 'lore', 'validation'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === tab
                  ? 'border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'validation' && validationIssues.length > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs">
                  {validationIssues.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'mechanics' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Game Mechanics</h3>
            <pre className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-900 dark:text-gray-100">
              {JSON.stringify(currentConcept.mechanics, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'lore' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Game Lore</h3>
            {!currentConcept.lore || Object.keys(currentConcept.lore).length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center">
                <div className="text-4xl mb-2">📖</div>
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">No Lore Generated</h4>
                <p className="text-yellow-600 dark:text-yellow-300 mb-4">
                  This concept doesn't have any lore yet. Generate lore using the "Generate Concept" button or refine the concept.
                </p>
                <button
                  onClick={() => {
                    setShowGenerateModal(true);
                    setGenerateType('lore');
                  }}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
                >
                  ✨ Generate Lore
                </button>
              </div>
            ) : (
              <pre className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm text-gray-900 dark:text-gray-100">
                {JSON.stringify(currentConcept.lore, null, 2)}
              </pre>
            )}
          </div>
        )}

        {activeTab === 'validation' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Validation Results</h3>
              <button
                onClick={runValidation}
                disabled={validating}
                className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition text-sm disabled:opacity-50"
              >
                {validating ? 'Validating...' : '🔄 Re-validate'}
              </button>
            </div>

            {validationIssues.length === 0 ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
                <div className="text-4xl mb-2">✅</div>
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">All Clear!</h4>
                <p className="text-green-600 dark:text-green-300">No validation issues found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {validationIssues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      issue.severity === 'error'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : issue.severity === 'warning'
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              issue.severity === 'error'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                : issue.severity === 'warning'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                            }`}
                          >
                            {issue.severity.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">{issue.category}</span>
                        </div>
                        <p className="text-gray-900 dark:text-gray-100">{issue.message}</p>
                        {issue.field && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Field: {issue.field}</p>
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

      {/* Generate Modal - also available when concept exists */}
      {renderGenerateModal()}
    </div>
  );
}
