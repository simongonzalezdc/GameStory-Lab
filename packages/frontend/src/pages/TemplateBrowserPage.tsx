/**
 * Template Browser Page
 * Browse and select genre templates, or blend multiple genres
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { templatesAPI } from '../services/api';

interface GenreInfo {
  id: string;
  name: string;
  description: string;
}

interface Template {
  id?: string;
  name?: string;
  description?: string;
  genre?: string;
  mechanics: {
    coreLoop: string;
    playerActions: string[];
    progression?: string;
    resources?: string[];
  };
  lore: {
    setting: {
      era?: string;
      location?: string;
      worldType?: string;
    };
    protagonist: {
      background?: string;
      motivation?: string;
      abilities?: string[];
    };
    conflict: {
      primary?: string;
      secondary?: string[];
    };
    themes: string[];
  };
  tags?: string[];
  difficulty?: string;
  targetAudience?: string;
}

export function TemplateBrowserPage() {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<GenreInfo[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [designOptions, setDesignOptions] = useState({
    tone: 'dark intrigue',
    camera: 'isometric',
    platform: 'PC',
    multiplayer: 'solo',
    sessionLength: '20-40m',
    complexity: 'medium',
    artDirection: 'stylized minimal HUD',
    monetization: 'premium',
    accessibility: 'comfort+color-safe',
  });

  // Genre mixing state
  const [mixMode, setMixMode] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState<Array<{ genre: string; weight: number }>>([]);
  const [isBlended, setIsBlended] = useState(false);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const response = await templatesAPI.list();
      setGenres(response.genres);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (genre: string) => {
    try {
      setLoadingTemplate(true);
      setSelectedGenre(genre);
      setIsBlended(false);
      const data = await templatesAPI.get(genre);
      setTemplate(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
      setTemplate(null);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const toggleGenreSelection = (genreId: string) => {
    setSelectedGenres(prev => {
      const exists = prev.find(g => g.genre === genreId);
      if (exists) {
        // Remove genre
        const filtered = prev.filter(g => g.genre !== genreId);
        // Redistribute weights equally
        return filtered.map(g => ({ ...g, weight: 1.0 / filtered.length }));
      } else {
        // Add genre with equal weight
        const newWeight = 1.0 / (prev.length + 1);
        return [...prev.map(g => ({ ...g, weight: newWeight })), { genre: genreId, weight: newWeight }];
      }
    });
  };

  const updateGenreWeight = (genreId: string, weight: number) => {
    setSelectedGenres(prev => prev.map(g => g.genre === genreId ? { ...g, weight } : g));
  };

  const normalizeWeights = () => {
    const total = selectedGenres.reduce((sum, g) => sum + g.weight, 0);
    if (total === 0) return;
    setSelectedGenres(prev => prev.map(g => ({ ...g, weight: g.weight / total })));
  };

  const blendGenres = async () => {
    if (selectedGenres.length === 0) {
      setError('Please select at least one genre to blend');
      return;
    }

    if (selectedGenres.length === 1) {
      // Just load the single genre
      loadTemplate(selectedGenres[0].genre);
      return;
    }

    try {
      setLoadingTemplate(true);
      normalizeWeights();
        const response = await templatesAPI.blend({ genres: selectedGenres, designOptions });
        setTemplate(response.template);
        setSelectedGenre(null);
        setIsBlended(true);
        setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to blend genres');
      setTemplate(null);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const toggleMixMode = () => {
    const newMixMode = !mixMode;
    setMixMode(newMixMode);
    setSelectedGenres([]);
    setTemplate(null);
    setSelectedGenre(null);
    setIsBlended(false);
    setError(null);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setCreating(true);

      if (isBlended) {
        // Create project from blended template
        const response = await templatesAPI.blendAndCreate({
          projectName: projectName.trim(),
          genres: selectedGenres,
          designOptions,
        });
        navigate(`/projects/${response.project.id}`);
      } else {
        // Create project from single genre template
        if (!selectedGenre) return;
        const response = await templatesAPI.createProject(selectedGenre, {
          projectName: projectName.trim(),
          designOptions,
        });
        navigate(`/projects/${response.project.id}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-500 dark:text-slate-400">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold text-slate-100">Genre Templates</h2>
          <p className="text-slate-300 mt-1">
            {mixMode
              ? 'Blend multiple genres to create custom hybrid templates'
              : 'Start with a professionally crafted template'}
          </p>
        </div>
        <button
          onClick={toggleMixMode}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            mixMode
              ? 'bg-purple-600 dark:bg-purple-500 text-white hover:bg-purple-700 dark:hover:bg-purple-600'
              : 'bg-gray-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600'
          }`}
        >
          {mixMode ? '✨ Mix Mode Active' : '🎨 Enable Mix Mode'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Genre Selection */}
        <div className="lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {mixMode ? 'Select Genres to Mix' : 'Select a Genre'}
            </h3>
            {mixMode && selectedGenres.length > 1 && (
              <button
                onClick={blendGenres}
                className="px-3 py-1.5 bg-purple-600 dark:bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition font-medium"
              >
                Blend {selectedGenres.length} Genres
              </button>
            )}
          </div>
          <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
            {genres.map((genre) => {
              const isSelected = mixMode
                ? selectedGenres.some(g => g.genre === genre.id)
                : selectedGenre === genre.id;
              const genreWeight = selectedGenres.find(g => g.genre === genre.id)?.weight || 0;

              return (
                <div key={genre.id} className="space-y-2">
                  <button
                    onClick={() => mixMode ? toggleGenreSelection(genre.id) : loadTemplate(genre.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition ${
                      isSelected
                        ? mixMode
                          ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{genre.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{genre.description}</p>
                      </div>
                      {mixMode && isSelected && (
                        <span className="ml-2 px-2 py-1 bg-purple-600 dark:bg-purple-500 text-white text-xs font-bold rounded-full whitespace-nowrap">
                          {Math.round(genreWeight * 100)}%
                        </span>
                      )}
                    </div>
                  </button>
                  {mixMode && isSelected && (
                    <div className="px-4 pb-1">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={Math.round(genreWeight * 100)}
                          onChange={(e) => updateGenreWeight(genre.id, parseInt(e.target.value) / 100)}
                          onMouseUp={normalizeWeights}
                          onTouchEnd={normalizeWeights}
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono w-10 text-right">
                          {Math.round(genreWeight * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Customization Controls */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl bg-surface-card border border-border-subtle p-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-3">Experience Tuning</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-300 space-y-1">
                <span>Tone / Mood</span>
                <select
                  className="w-full rounded-lg border border-border-subtle bg-surface-elevated text-slate-100 p-2"
                  value={designOptions.tone}
                  onChange={(e) => setDesignOptions((o) => ({ ...o, tone: e.target.value }))}
                >
                  <option value="dark intrigue">Dark intrigue</option>
                  <option value="hopeful adventure">Hopeful adventure</option>
                  <option value="cozy">Cozy</option>
                  <option value="high-tension">High tension</option>
                  <option value="whimsical">Whimsical</option>
                </select>
              </label>
              <label className="text-sm text-slate-300 space-y-1">
                <span>Session Length</span>
                <select
                  className="w-full rounded-lg border border-border-subtle bg-surface-elevated text-slate-100 p-2"
                  value={designOptions.sessionLength}
                  onChange={(e) => setDesignOptions((o) => ({ ...o, sessionLength: e.target.value }))}
                >
                  <option value="5-10m">5-10m runs</option>
                  <option value="20-40m">20-40m sessions</option>
                  <option value="60m+">60m+</option>
                </select>
              </label>
              <label className="text-sm text-slate-300 space-y-1">
                <span>Complexity</span>
                <select
                  className="w-full rounded-lg border border-border-subtle bg-surface-elevated text-slate-100 p-2"
                  value={designOptions.complexity}
                  onChange={(e) => setDesignOptions((o) => ({ ...o, complexity: e.target.value }))}
                >
                  <option value="low">Low / Accessible</option>
                  <option value="medium">Medium</option>
                  <option value="high">High / Hardcore</option>
                </select>
              </label>
              <label className="text-sm text-slate-300 space-y-1">
                <span>Monetization</span>
                <select
                  className="w-full rounded-lg border border-border-subtle bg-surface-elevated text-slate-100 p-2"
                  value={designOptions.monetization}
                  onChange={(e) => setDesignOptions((o) => ({ ...o, monetization: e.target.value }))}
                >
                  <option value="premium">Premium (no MTX)</option>
                  <option value="cosmetic-pass">Seasonal/cosmetic pass</option>
                  <option value="free-ipa">Free + IAP</option>
                  <option value="none">Non-commercial</option>
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-xl bg-surface-card border border-border-subtle p-4">
            <h3 className="text-lg font-semibold text-slate-100 mb-3">World & Delivery</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-300 space-y-1">
                <span>Camera / View</span>
                <select
                  className="w-full rounded-lg border border-border-subtle bg-surface-elevated text-slate-100 p-2"
                  value={designOptions.camera}
                  onChange={(e) => setDesignOptions((o) => ({ ...o, camera: e.target.value }))}
                >
                  <option value="isometric">Isometric</option>
                  <option value="side">Side-scrolling</option>
                  <option value="first">First-person</option>
                  <option value="third">Third-person</option>
                  <option value="top-down">Top-down</option>
                </select>
              </label>
              <label className="text-sm text-slate-300 space-y-1">
                <span>Platform Target</span>
                <select
                  className="w-full rounded-lg border border-border-subtle bg-surface-elevated text-slate-100 p-2"
                  value={designOptions.platform}
                  onChange={(e) => setDesignOptions((o) => ({ ...o, platform: e.target.value }))}
                >
                  <option value="PC">PC</option>
                  <option value="Console">Console</option>
                  <option value="Mobile">Mobile</option>
                  <option value="Web">Web</option>
                  <option value="VR">VR</option>
                </select>
              </label>
              <label className="text-sm text-slate-300 space-y-1">
                <span>Multiplayer</span>
                <select
                  className="w-full rounded-lg border border-border-subtle bg-surface-elevated text-slate-100 p-2"
                  value={designOptions.multiplayer}
                  onChange={(e) => setDesignOptions((o) => ({ ...o, multiplayer: e.target.value }))}
                >
                  <option value="solo">Solo</option>
                  <option value="co-op">Co-op</option>
                  <option value="pvp">PvP</option>
                  <option value="pvevp">PvEvP</option>
                </select>
              </label>
              <label className="text-sm text-slate-300 space-y-1">
                <span>Art Direction</span>
                <select
                  className="w-full rounded-lg border border-border-subtle bg-surface-elevated text-slate-100 p-2"
                  value={designOptions.artDirection}
                  onChange={(e) => setDesignOptions((o) => ({ ...o, artDirection: e.target.value }))}
                >
                  <option value="stylized minimal HUD">Stylized, minimal HUD</option>
                  <option value="bold neon UI">Bold neon UI</option>
                  <option value="painterly low-sat">Painterly, low saturation</option>
                  <option value="gritty realistic">Gritty realistic</option>
                  <option value="diegetic ui">Diegetic UI</option>
                </select>
              </label>
              <label className="text-sm text-slate-300 space-y-1">
                <span>Accessibility</span>
                <select
                  className="w-full rounded-lg border border-border-subtle bg-surface-elevated text-slate-100 p-2"
                  value={designOptions.accessibility}
                  onChange={(e) => setDesignOptions((o) => ({ ...o, accessibility: e.target.value }))}
                >
                  <option value="comfort+color-safe">Comfort + color-safe</option>
                  <option value="low-vision friendly">Low-vision friendly</option>
                  <option value="motion-light">Reduced motion</option>
                  <option value="controller friendly">Controller-friendly</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        {/* Template Preview */}
        <div className="lg:col-span-1">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Template Preview</h3>
          {loadingTemplate ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="animate-pulse">
                <div className="text-4xl mb-3">⚡</div>
                <p className="text-slate-500 dark:text-slate-400">
                  {mixMode && selectedGenres.length > 1 ? 'Blending genres...' : 'Loading template...'}
                </p>
              </div>
            </div>
          ) : template ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Template Header */}
              {template.name && (
                <div className="border-b dark:border-gray-700 pb-4">
                  {isBlended && (
                    <div className="inline-block px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded mb-2">
                      BLENDED TEMPLATE
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{template.name}</h3>
                  {template.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{template.description}</p>
                  )}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {template.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {(template.difficulty || template.targetAudience) && (
                    <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      {template.difficulty && (
                        <div><span className="font-semibold">Difficulty:</span> {template.difficulty}</div>
                      )}
                      {template.targetAudience && (
                        <div><span className="font-semibold">Target Audience:</span> {template.targetAudience}</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Mechanics */}
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Mechanics</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Core Loop:</span> {template.mechanics.coreLoop}
                  </p>
                  {template.mechanics.playerActions && template.mechanics.playerActions.length > 0 && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Player Actions:</span>
                      <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 ml-2 mt-1">
                        {template.mechanics.playerActions.slice(0, 4).map((action, i) => (
                          <li key={i}>{action}</li>
                        ))}
                        {template.mechanics.playerActions.length > 4 && (
                          <li className="text-purple-600 dark:text-purple-400">
                            + {template.mechanics.playerActions.length - 4} more actions
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Lore */}
              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Lore</h4>
                <div className="space-y-3 text-sm">
                  {template.lore.setting && (
                    <div className="text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Setting:</span>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                        {template.lore.setting.era && (
                          <li><span className="font-medium text-slate-700 dark:text-slate-300">Era:</span> {template.lore.setting.era}</li>
                        )}
                        {template.lore.setting.location && (
                          <li><span className="font-medium text-slate-700 dark:text-slate-300">Location:</span> {template.lore.setting.location}</li>
                        )}
                        {template.lore.setting.worldType && (
                          <li><span className="font-medium text-slate-700 dark:text-slate-300">World:</span> {template.lore.setting.worldType}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {template.lore.protagonist && (template.lore.protagonist.background || template.lore.protagonist.motivation) && (
                    <div className="text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Protagonist:</span>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                        {template.lore.protagonist.background && (
                          <li>{template.lore.protagonist.background}</li>
                        )}
                        {template.lore.protagonist.motivation && (
                          <li><span className="font-medium text-slate-700 dark:text-slate-300">Goal:</span> {template.lore.protagonist.motivation}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {template.lore.conflict?.primary && (
                    <div className="text-slate-700 dark:text-slate-300">
                      <span className="font-medium">Conflict:</span>
                      <p className="ml-2 mt-1 text-slate-600 dark:text-slate-400">{template.lore.conflict.primary}</p>
                    </div>
                  )}
                  {template.lore.themes && template.lore.themes.length > 0 && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Themes:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {template.lore.themes.map((theme, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => setShowCreateModal(true)}
                className={`w-full px-4 py-3 text-white rounded-lg transition font-medium ${
                  isBlended
                    ? 'bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600'
                    : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'
                }`}
              >
                {isBlended ? '✨ Create Project from Blended Template' : 'Create Project from Template'}
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="text-5xl mb-3">{mixMode ? '🎨' : '📋'}</div>
              <p className="text-slate-500 dark:text-slate-400 font-medium mb-1">
                {mixMode
                  ? 'Select 2+ genres and click "Blend"'
                  : 'Select a genre to see the template'}
              </p>
              {mixMode && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Examples: RPG + FPS = Action RPG<br/>
                  Platformer + Adventure = Metroidvania
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (selectedGenre || isBlended) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {isBlended
                ? `✨ Create Project from Blended Template`
                : `Create Project from ${genres.find((g) => g.id === selectedGenre)?.name} Template`}
            </h3>
            {isBlended && template?.name && (
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-4">
                {template.name}
              </p>
            )}
            <form onSubmit={handleCreateProject}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  placeholder="My Game Project"
                  required
                  autoFocus
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  The template will be customized and added to your new project
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setProjectName('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition font-medium"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium disabled:opacity-50 ${
                    isBlended
                      ? 'bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600'
                      : 'bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600'
                  }`}
                  disabled={creating || !projectName.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
