/**
 * Concept Editor Page
 * Edit and refine game concepts with real-time validation
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, validationAPI, exportAPI, refinementAPI, generateAPI } from '../services/api';
import { ProjectAssistantPanel } from '../components/ProjectAssistantPanel';
import { MechanicsViewer } from '../components/MechanicsViewer';
import { LoreViewer } from '../components/LoreViewer';

interface Project {
  id: string;
  name: string;
  genre?: string;
}

interface Version {
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
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersion, setCurrentVersion] = useState<Version | null>(null);
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
  const [merging, setMerging] = useState(false);
  const [showRawJsonMechanics, setShowRawJsonMechanics] = useState(false);
  const [showRawJsonLore, setShowRawJsonLore] = useState(false);
  
  // Track last validated version to avoid duplicate validations
  const lastValidatedVersionId = useRef<string | null>(null);
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    // Only validate if version actually changed and we have content
    if (!currentVersion) return;
    
    // Skip if already validated this version
    if (currentVersion.id === lastValidatedVersionId.current) return;
    
    // Skip if version has no meaningful content to validate
    const hasContent = (currentVersion.mechanics && Object.keys(currentVersion.mechanics).length > 0) ||
                      (currentVersion.lore && Object.keys(currentVersion.lore).length > 0);
    if (!hasContent) return;
    
    // Clear any pending validation
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    // Capture the version ID to avoid closure issues
    const versionIdToValidate = currentVersion.id;
    
    // Debounce validation - shorter delay if no previous validation (e.g., after refinement)
    // This gives React time to finish all re-renders and prevents rate limiting
    const debounceDelay = lastValidatedVersionId.current === null ? 500 : 1000; // Faster if no previous validation
    validationTimeoutRef.current = setTimeout(() => {
      // Double-check version is still current and hasn't been validated
      if (currentVersion && currentVersion.id === versionIdToValidate && currentVersion.id !== lastValidatedVersionId.current) {
        runValidation();
      }
    }, debounceDelay);
    
    // Cleanup timeout on unmount or version change
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [currentVersion?.id]); // Only depend on version ID, not the whole object

  const loadProject = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      // Clear any pending validation
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
      // Reset validation tracking when loading new project data
      lastValidatedVersionId.current = null;
      
      const response = await projectsAPI.get(projectId);
      setProject(response.project);
      setVersions(response.versions || []);
      if (response.versions && response.versions.length > 0) {
        // Versions are ordered by version DESC, so first one is the latest
        const latestVersion = response.versions[0];
        console.log('[LoadProject] Setting current version:', {
          id: latestVersion.id,
          version: latestVersion.version,
          hasMechanics: !!latestVersion.mechanics && Object.keys(latestVersion.mechanics).length > 0,
          hasLore: !!latestVersion.lore && Object.keys(latestVersion.lore).length > 0,
        });
        setCurrentVersion(latestVersion);
        // Reset validation tracking when loading a new version
        lastValidatedVersionId.current = null;
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const runValidation = async () => {
    if (!currentVersion) return;
    
    // Skip if already validated this version
    if (lastValidatedVersionId.current === currentVersion.id) {
      return;
    }

    try {
      setValidating(true);
      const response = await validationAPI.validate({
        conceptId: currentVersion.id,
        mechanics: currentVersion.mechanics,
        lore: currentVersion.lore,
      });
      setValidationIssues(response.issues || []);
      
      // Handle both possible response formats: consistencyScore or overallScore
      const rawScore = response.consistencyScore || (response as any).overallScore || 0;
      const displayScore = Math.round(rawScore * 100);
      
      console.log('[Validation] Score updated:', {
        versionId: currentVersion.id,
        versionNumber: currentVersion.version,
        rawScore,
        displayScore,
        hasConsistencyScore: !!response.consistencyScore,
        hasOverallScore: !!(response as any).overallScore,
        issueCount: response.issues?.length || 0,
        errors: response.issues?.filter(i => i.severity === 'error').length || 0,
        warnings: response.issues?.filter(i => i.severity === 'warning').length || 0,
      });
      setConsistencyScore(displayScore);
      // Mark this version as validated
      lastValidatedVersionId.current = currentVersion.id;
    } catch (err) {
      // Handle rate limit errors gracefully
      if (err instanceof Error && err.message.includes('Too many requests')) {
        console.warn('Validation rate limited - will retry automatically');
        // Reset validation flag so it can retry later
        lastValidatedVersionId.current = null;
        // Don't show error to user for rate limits - it's temporary
      } else {
        console.error('Validation failed:', err);
      }
    } finally {
      setValidating(false);
    }
  };

  const handleExport = async (template: 'gdd' | 'pitch' | 'technical') => {
    if (!currentVersion) return;

    try {
      setExporting(true);
      const response = await exportAPI.export({
        conceptId: currentVersion.id,
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
    if (!currentVersion) return;

    try {
      setRefining(true);
      setError(null);
      // Clear validation score while refining
      setConsistencyScore(null);
      setValidationIssues([]);
      
      await refinementAPI.refine({
        conceptId: currentVersion.id,
        focus,
      });

      // Reload project to get the new version
      await loadProject();
      
      // Force validation immediately after refinement
      // Clear any pending validation timeout and reset tracking
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
        validationTimeoutRef.current = null;
      }
      // Reset validation tracking so the useEffect will trigger validation with shorter debounce
      lastValidatedVersionId.current = null;
      
      // The useEffect will automatically trigger validation when currentVersion.id changes
      // We've already reset lastValidatedVersionId.current = null, so it will validate
      // No need to manually trigger - let the useEffect handle it to avoid double validation
      
      alert('Version refined successfully! A new version has been created. Validating consistency...');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to refine version');
    } finally {
      setRefining(false);
    }
  };

  const handleMergeVersions = async () => {
    if (!projectId || versions.length < 2) {
      alert('You need at least 2 versions to merge');
      return;
    }

    if (!confirm(`Merge all ${versions.length} versions into a new version? This will combine mechanics and lore from all versions.`)) {
      return;
    }

    try {
      setMerging(true);
      setError(null);
      const response = await projectsAPI.merge(projectId);
      
      // Reload project to get the merged version
      // loadProject() will automatically set currentVersion to the latest (which is the merged one)
      await loadProject();
      
      alert(`Successfully merged ${response.mergedCount} versions into version ${response.version.version}!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to merge versions';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setMerging(false);
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
          // If generating lore only and we have an existing version, pass its mechanics
          const existingMechanics = mechanicsResult 
            ? mechanicsResult.content.mechanics 
            : (currentVersion?.mechanics && Object.keys(currentVersion.mechanics).length > 0 
                ? currentVersion.mechanics 
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

        setGenerationStep('Loading version...');
        // Reload project to get the new/updated version
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
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate version';
        setError(errorMessage);
        setGenerationStep('');
      } finally {
        setGenerating(false);
      }
    };

  // Render Generate Modal component (reusable) - defined before use
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
              {currentVersion ? 'Generate Content' : 'Generate Your First Version'}
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
                      <span>Generate Version</span>
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

  if (!currentVersion) {
    return (
      <div className="flex flex-col min-h-0">
        {/* Header */}
        <div className="flex justify-between items-center flex-shrink-0 mb-6">
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
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">No Versions Yet</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-2 max-w-2xl mx-auto">
            <strong>Versions</strong> are versioned game designs that combine <strong>mechanics</strong> (how the game plays) 
            and <strong>lore</strong> (the story and world). Each version can be refined and validated for consistency.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 max-w-2xl mx-auto">
            Start by generating your first version with AI, or create one from a template.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="btn btn-primary"
            >
              <span>✨</span>
              <span>Generate Version with AI</span>
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

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] w-full">
      {/* Compact Sticky Header Bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between gap-4 py-2.5">
          {/* Left: Project Info & Navigation */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => navigate('/projects')}
              className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
              title="Back to Projects"
            >
              ←
            </button>
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{project.name}</h2>
              {versions.length > 1 ? (
                <select
                  value={currentVersion?.id || ''}
                  onChange={(e) => {
                    const selected = versions.find(v => v.id === e.target.value);
                    if (selected) {
                      setCurrentVersion(selected);
                    }
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                >
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      v{v.version} {v.version === versions[0].version ? '(Latest)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">v{currentVersion.version}</span>
              )}
              {versions.length > 1 && (
                <div className="relative group flex-shrink-0">
                  <button
                    className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                    title={`${versions.length} versions`}
                  >
                    📋 {versions.length}
                  </button>
                  <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-20 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 py-1 mb-1">
                        All Versions
                      </div>
                      {versions.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setCurrentVersion(v)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                            currentVersion?.id === v.id
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
                              : 'hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Version {v.version}</span>
                            {v.version === versions[0].version && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                                Latest
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Actions & Status */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Consistency Score - Compact */}
            {consistencyScore !== null && (
              <div className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 ${
                consistencyScore >= 80 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
                consistencyScore >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <span className={`text-sm font-bold ${
                  consistencyScore >= 80 ? 'text-green-700 dark:text-green-300' :
                  consistencyScore >= 60 ? 'text-yellow-700 dark:text-yellow-300' :
                  'text-red-700 dark:text-red-300'
                }`}>
                  {consistencyScore}%
                </span>
                <div className="w-16 bg-white dark:bg-slate-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      consistencyScore >= 80 ? 'bg-green-600 dark:bg-green-500' :
                      consistencyScore >= 60 ? 'bg-yellow-600 dark:bg-yellow-500' :
                      'bg-red-600 dark:bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, consistencyScore))}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-1.5">
              {versions.length >= 2 && (
                <button
                  onClick={handleMergeVersions}
                  disabled={merging || loading}
                  className="px-2.5 py-1.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition text-xs font-medium disabled:opacity-50 flex items-center gap-1.5"
                  title={`Merge all ${versions.length} versions`}
                >
                  {merging ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Merging</span>
                    </>
                  ) : (
                    <>
                      <span>🔀</span>
                      <span>Merge</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={() => handleExport('gdd')}
                disabled={exporting}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition text-xs font-medium disabled:opacity-50"
                title="Export as GDD"
              >
                📄
              </button>
              <button
                onClick={() => navigate(`/projects/${projectId}/architect`)}
                className="px-2.5 py-1.5 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition text-xs font-medium"
                title="Open Project Architect"
              >
                🏗️
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Split Layout: 50% Assistant, 50% Validation/Results */}
      <div className="grid gap-4 lg:grid-cols-2 flex-1 min-h-0 overflow-hidden">
        {/* Floating Revalidate Button - always visible */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <button
            onClick={() => {
              // Reset validation flag to force re-validation
              lastValidatedVersionId.current = null;
              runValidation();
            }}
            disabled={validating}
            className="px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {validating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Validating...</span>
              </>
            ) : (
              <>
                <span>🔄</span>
                <span>Re-validate</span>
              </>
            )}
          </button>
        </div>

        {/* Left Column: Assistant (50%) */}
        <div className="flex flex-col min-h-0 overflow-hidden">
          {project?.id && (
            <ProjectAssistantPanel
              projectId={project.id}
              type="concept"
              onRefine={handleRefine}
              refining={refining}
              onProposalAccepted={async () => {
                // Reload project to show the new version created from proposal acceptance
                await loadProject();
                // Reset validation tracking to force re-validation of new version
                lastValidatedVersionId.current = null;
                // Force validation immediately after a short delay to ensure version is loaded
                setTimeout(() => {
                  if (currentVersion) {
                    runValidation();
                  }
                }, 1000);
              }}
            />
          )}
        </div>

        {/* Right Column: Validation/Results (50%) */}
        <div className="flex flex-col space-y-3 min-h-0 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 mb-3 flex-shrink-0">
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
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 flex-1 min-h-0 overflow-hidden flex flex-col">
            {activeTab === 'mechanics' && (
              <div className="flex flex-col h-full min-h-0 overflow-y-auto">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Game Mechanics</h3>
                  <button
                    onClick={() => setShowRawJsonMechanics(!showRawJsonMechanics)}
                    className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                  >
                    {showRawJsonMechanics ? '📄 View Formatted' : '🔧 View JSON'}
                  </button>
                </div>
                <div className="flex-1">
                  {showRawJsonMechanics ? (
                    <pre className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg overflow-auto text-sm text-gray-900 dark:text-gray-100 h-full">
                      {JSON.stringify(currentVersion.mechanics, null, 2)}
                    </pre>
                  ) : (
                    <MechanicsViewer mechanics={currentVersion.mechanics} />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'lore' && (
              <div className="flex flex-col h-full min-h-0 overflow-y-auto">
                {!currentVersion.lore || Object.keys(currentVersion.lore).length === 0 ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-8 text-center flex-shrink-0">
                    <div className="text-4xl mb-2">📖</div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">No Lore Generated</h4>
                    <p className="text-yellow-600 dark:text-yellow-300 mb-4">
                      This version doesn't have any lore yet. Generate lore using the "Generate Version" button or refine the version.
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
                  <>
                    <div className="flex items-center justify-between mb-6 flex-shrink-0">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Game Lore</h3>
                      <button
                        onClick={() => setShowRawJsonLore(!showRawJsonLore)}
                        className="text-xs px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                      >
                        {showRawJsonLore ? '📄 View Formatted' : '🔧 View JSON'}
                      </button>
                    </div>
                    <div className="flex-1">
                      {showRawJsonLore ? (
                        <pre className="bg-gray-50 dark:bg-slate-900 p-4 rounded-lg overflow-auto text-sm text-gray-900 dark:text-gray-100 h-full">
                          {JSON.stringify(currentVersion.lore, null, 2)}
                        </pre>
                      ) : (
                        <LoreViewer lore={currentVersion.lore} />
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'validation' && (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Validation Results</h3>
                  <button
                    onClick={async () => {
                      // Reset validation flag to force re-validation
                      lastValidatedVersionId.current = null;
                      // Ensure we're validating the current version
                      if (currentVersion) {
                        runValidation();
                      } else {
                        // If no current version, reload project first
                        await loadProject();
                        setTimeout(() => {
                          if (currentVersion) {
                            runValidation();
                          }
                        }, 500);
                      }
                    }}
                    disabled={validating}
                    className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2 shadow-sm"
                  >
                    {validating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Validating...</span>
                      </>
                    ) : (
                      <>
                        <span>🔄</span>
                        <span>Re-validate</span>
                      </>
                    )}
                  </button>
                </div>

                {validationIssues.length === 0 ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center flex-shrink-0">
                    <div className="text-4xl mb-2">✅</div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-1">All Clear!</h4>
                    <p className="text-green-600 dark:text-green-300">No validation issues found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-y-auto flex-1 min-h-0">
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
        </div>

        {/* Workflow Checklist */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex-shrink-0">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2 uppercase tracking-wide">
            Workflow Checklist
          </h4>
          <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-1 list-decimal list-inside">
            <li>Kick off or continue the Project Assistant chat.</li>
            <li>Accept suggested mechanics or lore updates to create versions.</li>
            <li>Resolve validation issues with the always-visible refine buttons.</li>
            <li>Graduate to Project Architect for full documentation.</li>
          </ol>
        </div>
      </div>

      {/* Generate Modal - also available when concept exists */}
      {renderGenerateModal()}
    </div>
  );
}
