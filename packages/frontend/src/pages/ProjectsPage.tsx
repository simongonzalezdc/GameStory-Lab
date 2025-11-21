/**
 * Projects Page
 * List and manage game concept projects
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { projectsAPI } from '../services/api';
import { useDebounce } from '../hooks';
import { ProjectAssistantPanel } from '../components/ProjectAssistantPanel';
import { SpotlightCard } from '../components/SpotlightCard';

interface Project {
  id: string;
  name: string;
  genre?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    versions: number;
  };
}

type SortMode = 'recent' | 'alphabetical' | 'versions';

const formatDistanceToNow = (date: string) => {
  const parsed = new Date(date).getTime();
  if (Number.isNaN(parsed)) return 'recently';
  const diffMinutes = Math.max(0, Math.floor((Date.now() - parsed) / 60000));
  if (diffMinutes < 1) return 'just now';
  const units = [
    { label: 'year', value: 60 * 24 * 365 },
    { label: 'month', value: 60 * 24 * 30 },
    { label: 'week', value: 60 * 24 * 7 },
    { label: 'day', value: 60 * 24 },
    { label: 'hour', value: 60 },
    { label: 'minute', value: 1 },
  ];

  for (const unit of units) {
    if (diffMinutes >= unit.value) {
      const amount = Math.floor(diffMinutes / unit.value);
      return `${amount} ${unit.label}${amount > 1 ? 's' : ''} ago`;
    }
  }

  return 'just now';
};

const formatDate = (date: string) => {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGenre, setNewProjectGenre] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showAssistant, setShowAssistant] = useState(() => {
    // Load visibility preference from localStorage
    return localStorage.getItem('assistantVisible') !== 'false';
  });
  const navigate = useNavigate();


  // Save assistant visibility preference
  useEffect(() => {
    localStorage.setItem('assistantVisible', showAssistant.toString());
  }, [showAssistant]);

  // Debounce search query to avoid excessive re-renders while typing
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.list();
      setProjects(response.projects);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      setCreating(true);
      await projectsAPI.create({
        name: newProjectName.trim(),
        genre: newProjectGenre || undefined,
      });
      setNewProjectName('');
      setNewProjectGenre('');
      setShowCreateModal(false);
      await loadProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    try {
      await projectsAPI.delete(id);
      await loadProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  const stats = useMemo(() => {
    const totalVersions = projects.reduce((sum, project) => sum + (project._count?.versions ?? 0), 0);
    const latestEdit = projects
      .map((project) => project.updatedAt)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

    return {
      totalVersions,
      projectCount: projects.length,
      lastTouched: latestEdit ? formatDistanceToNow(latestEdit) : '—',
      averageVersions: projects.length ? Math.round(totalVersions / projects.length) : 0,
    };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const normalized = debouncedSearchQuery.trim().toLowerCase();
    const filtered = normalized
      ? projects.filter((project) => {
          const haystack = `${project.name} ${project.genre ?? ''}`.toLowerCase();
          return haystack.includes(normalized);
        })
      : [...projects];

    switch (sortMode) {
      case 'alphabetical':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'versions':
        return filtered.sort(
          (a, b) => (b._count?.versions ?? 0) - (a._count?.versions ?? 0)
        );
      default:
        return filtered.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }
  }, [projects, debouncedSearchQuery, sortMode]);

  const recentActivity = useMemo(() => {
    return [...projects]
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 4);
  }, [projects]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mb-4" />
        <p className="text-lg font-medium text-slate-700 dark:text-slate-300">Loading your projects...</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Preparing your workspace</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Bento Grid Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Large Welcome Cell - spans 8 columns on large screens */}
        <div className="lg:col-span-8 glass-card p-8 lg:p-12 flex flex-col justify-center min-h-[400px] relative overflow-hidden">
          {/* CSS-only abstract jewel illustration */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-400 to-mint-500 rounded-full blur-3xl transform rotate-45" />
            <div className="absolute inset-4 bg-gradient-to-tr from-mint-500 via-brand-500 to-brand-600 rounded-full blur-2xl transform -rotate-45" />
            <div className="absolute inset-8 bg-gradient-to-bl from-brand-600 to-mint-400 rounded-full blur-xl" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-[700] text-slate-900 dark:text-white tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Create Game Design Documents with AI
              </h1>
              <p className="text-lg leading-7 text-slate-800 dark:text-slate-300 text-balance">
                Generate mechanics, write lore, validate consistency, export professional documentation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn btn-primary shadow-lg hover:shadow-xl"
              >
                <span className="text-lg">+</span>
                <span>Create New Project</span>
              </button>
              <Link
                to="/templates"
                className="btn btn-secondary"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-surface-muted text-brand-700">🎨</span>
                <span>Browse Templates</span>
              </Link>
              <button
                onClick={() => setShowAssistant(!showAssistant)}
                className={`btn transition-all duration-200 ${
                  showAssistant
                    ? 'btn-primary shadow-lg'
                    : 'btn-secondary'
                }`}
                title="Toggle AI Assistant"
              >
                <span className="text-lg">🤖</span>
                <span>AI Assistant</span>
                {showAssistant && <span className="text-xs ml-1">●</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cell - spans 2 columns */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="stat-card p-4">
              <div className="eyebrow mb-1">Projects</div>
              <div className="text-3xl font-bold text-primary">{stats.projectCount}</div>
              <p className="text-xs text-secondary">active</p>
            </div>
            <div className="stat-card p-4">
              <div className="eyebrow mb-1">Versions</div>
              <div className="text-3xl font-bold text-primary">{stats.totalVersions}</div>
              <p className="text-xs text-secondary">total</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Cell - spans 2 columns */}
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Activity</h3>
          {recentActivity.length === 0 ? (
            <div className="text-center py-4">
              <div className="text-2xl mb-2">📝</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">No recent edits</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.slice(0, 3).map((activity) => (
                <div key={activity.id} className="rounded border border-border-subtle p-2 hover:bg-surface-muted dark:hover:bg-surface-strong transition-colors">
                  <div className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{activity.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDistanceToNow(activity.updatedAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-error bg-error/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-medium text-error">Error</div>
              <div className="text-sm text-error mt-0.5">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <section className="surface-panel p-6 lg:p-7 shadow-md">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, theme, or genre..."
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-subtle bg-white dark:bg-surface-elevated text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-colors"
            />
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-secondary">Sort:</span>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm surface-elevated border border-subtle rounded-lg hover:border-accent transition"
              >
                <span>{sortMode === 'recent' ? 'Recent' : sortMode === 'alphabetical' ? 'A-Z' : 'Most Versions'}</span>
                <svg className="w-4 h-4 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            <span className="font-medium text-slate-900 dark:text-slate-100">{filteredProjects.length}</span> project{filteredProjects.length !== 1 ? 's' : ''} found
            {searchQuery && (
              <span className="ml-2">
                matching "<span className="font-medium">{searchQuery}</span>"
              </span>
            )}
          </p>
        </div>
      </section>

      {/* Projects Grid */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Main Content */}
        <div>
          {filteredProjects.length === 0 ? (
            <div className="rounded-xl bg-white dark:bg-surface-elevated border border-border-subtle dark:border-slate-700 shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">No projects found</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-md mx-auto">
                {searchQuery 
                  ? `No projects match "${searchQuery}". Try adjusting your search or filters.`
                  : 'Get started by creating your first project to begin exploring game concepts.'}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSortMode('recent');
                    }}
                    className="btn btn-secondary"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  <span>+</span>
                  <span>Create Project</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredProjects.map((project) => {
                const versions = project._count?.versions ?? 0;
                const versionDepth = Math.min(100, Math.round((versions / 8) * 100));

                return (
                  <SpotlightCard
                    key={project.id}
                    className="group hover:shadow-lg transition-all duration-200 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="p-6 border-b border-subtle bg-surface-card">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {project.genre && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-50 dark:bg-brand-900/25 text-brand-700 dark:text-brand-200 border border-brand-100 dark:border-brand-800">
                                {project.genre}
                              </span>
                            )}
                            {!project.genre && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium surface-elevated text-secondary">
                                No genre
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-primary mb-1 truncate">
                            {project.name}
                          </h3>
                          <p className="text-sm text-tertiary">
                            Updated {formatDistanceToNow(project.updatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="flex-shrink-0 p-2 rounded-lg text-tertiary hover:text-error transition-colors"
                          title="Delete project"
                          aria-label={`Delete ${project.name}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="rounded-lg bg-surface-muted p-3 border border-subtle">
                          <div className="text-xs font-medium text-tertiary uppercase tracking-wider mb-1">
                            Versions
                          </div>
                          <div className="text-2xl font-bold text-primary">{versions}</div>
                        </div>
                        <div className="rounded-lg bg-surface-muted p-3 border border-subtle">
                          <div className="text-xs font-medium text-tertiary uppercase tracking-wider mb-1">
                            Created
                          </div>
                          <div className="text-base font-semibold text-primary">{formatDate(project.createdAt)}</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Exploration Depth</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{versionDepth}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-muted dark:bg-surface-strong overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-mint-500 dark:from-brand-400 dark:to-mint-500 rounded-full transition-all duration-500"
                            style={{ width: `${versionDepth}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-6 bg-surface-muted dark:bg-surface-strong flex gap-3 border-t border-border-subtle">
                      <Link
                        to={`/projects/${project.id}`}
                        className="flex-1 btn btn-primary text-center"
                      >
                        Open Project
                      </Link>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Recent Activity */}
          <div className="surface-panel shadow-md p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📝</div>
                <p className="text-sm text-slate-500 dark:text-slate-400">No recent edits</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Nudge a project today</p>
              </div>
            ) : (
              <ol className="space-y-3">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="rounded-lg border border-border-subtle p-4 hover:bg-surface-muted dark:hover:bg-surface-strong transition-colors">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{activity.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(activity.updatedAt)} · {activity._count?.versions ?? 0} versions
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

        </aside>
      </div>


      {/* Create Project Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
            }
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Create New Project</h2>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                Set the intention for collaborators. What promise are you testing?
              </p>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label htmlFor="project-name" className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Project Title <span className="text-red-500 dark:text-red-400">*</span>
                  </label>
                  <input
                    id="project-name"
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="input"
                    placeholder="e.g., Tidal Cities Co-op"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="project-genre" className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Genre or Mood
                  </label>
                  <input
                    id="project-genre"
                    type="text"
                    value={newProjectGenre}
                    onChange={(e) => setNewProjectGenre(e.target.value)}
                    className="input"
                    placeholder="e.g., Immersive sim, cozy RPG, tactical rhythm..."
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Optional: Describe the genre, mood, or style of your game concept
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProjectName('');
                      setNewProjectGenre('');
                    }}
                    className="flex-1 btn btn-secondary"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn btn-primary"
                    disabled={creating || !newProjectName.trim()}
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>+</span>
                        <span>Create Project</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assistant Panel */}
      {showAssistant && (
        <div className="fixed right-4 top-20 bottom-28 w-96 z-40 bg-surface rounded-2xl shadow-2xl border border-border-subtle overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-border-subtle bg-surface-card">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">AI Assistant</h3>
                <button
                  onClick={() => setShowAssistant(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  title="Close assistant"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Assistant Content */}
            <div className="flex-1 min-h-0">
              <ProjectAssistantPanel
                projectId={undefined}
                type="concept"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
