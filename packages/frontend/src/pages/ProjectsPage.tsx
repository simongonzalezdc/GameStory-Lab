/**
 * Projects Page
 * List and manage game concept projects
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../services/api';

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
    const normalized = searchQuery.trim().toLowerCase();
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
  }, [projects, searchQuery, sortMode]);

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
      {/* Hero Section */}
      <section className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-8 lg:p-12">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4 tracking-tight">
            Project Control Room
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-2xl">
            Curate player-centered concepts with confidence. See the health of every experiment at a glance, 
            revive stalled ideas, and open the right workspace only when the next decision is crystal clear.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              <span className="text-lg">+</span>
              <span>Create New Project</span>
            </button>
            <Link
              to="/templates"
              className="btn btn-secondary"
            >
              <span>🎨</span>
              <span>Browse Templates</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-6">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Projects
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{stats.projectCount}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">active initiatives</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-6">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Versions
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{stats.totalVersions}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">documented beats</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-6">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Last Touch
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">{stats.lastTouched}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">across the lab</div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-6">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Avg Depth
            </div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">{stats.averageVersions}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">versions per project</div>
          </div>
        </div>
      </section>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-medium text-red-900 dark:text-red-200">Error</div>
              <div className="text-sm text-red-700 dark:text-red-300 mt-0.5">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <section className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, theme, or genre..."
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20 transition-colors"
            />
          </div>

          {/* Sort Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 mr-2">Sort:</span>
            <button
              onClick={() => setSortMode('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortMode === 'recent'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Most Recent
            </button>
            <button
              onClick={() => setSortMode('alphabetical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortMode === 'alphabetical'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              A → Z
            </button>
            <button
              onClick={() => setSortMode('versions')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                sortMode === 'versions'
                  ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Depth
            </button>
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
            <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center">
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
                  <div
                    key={project.id}
                    className="group rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Card Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {project.genre && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {project.genre}
                              </span>
                            )}
                            {!project.genre && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                No genre
                              </span>
                            )}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 truncate">
                            {project.name}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Updated {formatDistanceToNow(project.updatedAt)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteProject(project.id, project.name)}
                          className="flex-shrink-0 p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Versions
                          </div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{versions}</div>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-700/50 p-3">
                          <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                            Created
                          </div>
                          <div className="text-base font-semibold text-slate-900 dark:text-slate-100">{formatDate(project.createdAt)}</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Exploration Depth</span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">{versionDepth}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${versionDepth}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-700/30 flex gap-3">
                      <Link
                        to={`/projects/${project.id}`}
                        className="flex-1 btn btn-primary text-center"
                      >
                        Open Project
                      </Link>
                      <Link
                        to="/templates"
                        className="btn btn-secondary"
                      >
                        Inspire
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Recent Activity */}
          <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm p-6">
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
                  <li key={activity.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{activity.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDistanceToNow(activity.updatedAt)} · {activity._count?.versions ?? 0} versions
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Studio Principles */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800 shadow-sm p-6">
            <h2 className="text-lg font-bold text-emerald-900 dark:text-emerald-200 mb-4">Studio Principles</h2>
            <ul className="space-y-3 text-sm text-emerald-800 dark:text-emerald-200">
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Begin with the player's desired feeling</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Prototype narrative beats before polish</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Test pacing with micro-scenarios weekly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>Archive learnings at every milestone</span>
              </li>
            </ul>
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
    </div>
  );
}
