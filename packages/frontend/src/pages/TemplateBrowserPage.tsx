/**
 * Template Browser Page
 * Browse and select genre templates
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
  genre: string;
  mechanics: {
    coreLoop: string;
    playerActions: string[];
    progression: string;
    resources: string[];
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

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGenre || !projectName.trim()) return;

    try {
      setCreating(true);
      const response = await templatesAPI.createProject(selectedGenre, {
        projectName: projectName.trim(),
      });
      navigate(`/projects/${response.project.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Loading templates...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Genre Templates</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Start with a professionally crafted template</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Genre Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Select a Genre</h3>
          <div className="space-y-3">
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => loadTemplate(genre.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition ${
                  selectedGenre === genre.id
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{genre.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">{genre.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Template Preview */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Template Preview</h3>
          {loadingTemplate ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">Loading template...</p>
            </div>
          ) : template ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Mechanics</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Core Loop:</span> {template.mechanics.coreLoop}
                  </p>
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Player Actions:</span>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 ml-2">
                      {template.mechanics.playerActions.slice(0, 3).map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                      {template.mechanics.playerActions.length > 3 && (
                        <li>+ {template.mechanics.playerActions.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-t dark:border-gray-700 pt-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Lore</h4>
                <div className="space-y-2 text-sm">
                  {template.lore.setting && (
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Setting:</span>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        {template.lore.setting.era && (
                          <li><span className="font-medium">Era:</span> {template.lore.setting.era}</li>
                        )}
                        {template.lore.setting.location && (
                          <li><span className="font-medium">Location:</span> {template.lore.setting.location}</li>
                        )}
                        {template.lore.setting.worldType && (
                          <li><span className="font-medium">World Type:</span> {template.lore.setting.worldType}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {template.lore.protagonist && (
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Protagonist:</span>
                      <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                        {template.lore.protagonist.background && (
                          <li><span className="font-medium">Background:</span> {template.lore.protagonist.background}</li>
                        )}
                        {template.lore.protagonist.motivation && (
                          <li><span className="font-medium">Motivation:</span> {template.lore.protagonist.motivation}</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {template.lore.conflict && (
                    <div className="text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Conflict:</span>
                      {template.lore.conflict.primary && (
                        <p className="ml-2 mt-1">{template.lore.conflict.primary}</p>
                      )}
                      {template.lore.conflict.secondary && template.lore.conflict.secondary.length > 0 && (
                        <ul className="list-disc list-inside ml-2 mt-1">
                          {template.lore.conflict.secondary.slice(0, 3).map((conflict, i) => (
                            <li key={i}>{conflict}</li>
                          ))}
                          {template.lore.conflict.secondary.length > 3 && (
                            <li>+ {template.lore.conflict.secondary.length - 3} more</li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                  {template.lore.themes && template.lore.themes.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Themes:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {template.lore.themes.map((theme, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full text-xs"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-medium"
              >
                Create Project from Template
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-gray-500 dark:text-gray-400">Select a genre to see the template</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && selectedGenre && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Create Project from {genres.find((g) => g.id === selectedGenre)?.name} Template
            </h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                  placeholder="My Game Project"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition font-medium"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition font-medium disabled:opacity-50"
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
