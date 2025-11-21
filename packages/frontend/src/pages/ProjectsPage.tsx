/**
 * Projects Dashboard - Bento Grid Layout
 * Utilitarian density-focused dashboard with Quick Actions, Recent Spotlight, and Project List
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, FileText, Download, Search, ArrowUpDown, FolderKanban } from 'lucide-react';
import { projectsAPI } from '../services/api';
import { useDebounce } from '../hooks';
import { motion } from 'framer-motion';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectRow } from '../components/ProjectRow';

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

// Get genre color for project icon
const getGenreColor = (genre?: string): string => {
  if (!genre) return 'var(--jewel-garnet)';
  const normalized = genre.toLowerCase();
  
  // Action/Combat - Garnet
  if (normalized.includes('action') || normalized.includes('fps') || normalized.includes('fighting')) {
    return 'var(--jewel-garnet)';
  }
  // Adventure/Heroic - Topaz
  if (normalized.includes('adventure') || normalized.includes('rpg') || normalized.includes('platformer')) {
    return 'var(--jewel-topaz)';
  }
  // Puzzle/Tactical - Amethyst
  if (normalized.includes('puzzle') || normalized.includes('strategy') || normalized.includes('tactical')) {
    return 'var(--jewel-amethyst)';
  }
  // Creative/Building - Turquoise
  if (normalized.includes('simulation') || normalized.includes('building') || normalized.includes('creative')) {
    return 'var(--jewel-turquoise)';
  }
  // Sports/Outdoor - Emerald
  if (normalized.includes('sports') || normalized.includes('outdoor')) {
    return 'var(--jewel-emerald)';
  }
  // Survival/Horror - Fire Opal
  if (normalized.includes('survival') || normalized.includes('horror') || normalized.includes('roguelike')) {
    return 'var(--jewel-fireopal)';
  }
  // Default - Garnet
  return 'var(--jewel-garnet)';
};

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectGenre, setNewProjectGenre] = useState('');
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleImportProjects = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImporting(true);
      const text = await file.text();
      const parsed = JSON.parse(text);
      const entries = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.projects)
        ? parsed.projects
        : parsed?.project
        ? [parsed.project]
        : [parsed];

      const normalizedEntries = entries
        .map((entry: any) => ({
          name: typeof entry?.name === 'string' ? entry.name.trim() : '',
          genre: typeof entry?.genre === 'string' ? entry.genre : undefined,
        }))
        .filter((entry) => entry.name.length > 0);

      if (!normalizedEntries.length) {
        throw new Error('No valid project data found in file.');
      }

      for (const entry of normalizedEntries) {
        await projectsAPI.create({
          name: entry.name,
          genre: entry.genre,
        });
      }

      await loadProjects();
      alert(`Imported ${normalizedEntries.length} project${normalizedEntries.length > 1 ? 's' : ''}.`);
    } catch (err) {
      console.error('Failed to import projects', err);
      alert(err instanceof Error ? err.message : 'Failed to import projects');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

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

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [projects]);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Shimmering skeleton hero section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-8 glass-card p-8 lg:p-12 min-h-[400px]">
            <div className="skeleton-shimmer h-12 w-3/4 mb-4" />
            <div className="skeleton-shimmer h-6 w-full mb-2" />
            <div className="skeleton-shimmer h-6 w-5/6 mb-6" />
            <div className="flex gap-3">
              <div className="skeleton-shimmer h-10 w-32" />
              <div className="skeleton-shimmer h-10 w-32" />
            </div>
          </div>
          <div className="lg:col-span-2 glass-card p-6">
            <div className="skeleton-shimmer h-20 w-full mb-4" />
            <div className="skeleton-shimmer h-20 w-full" />
          </div>
          <div className="lg:col-span-2 glass-card p-6">
            <div className="skeleton-shimmer h-6 w-24 mb-4" />
            <div className="skeleton-shimmer h-16 w-full mb-2" />
            <div className="skeleton-shimmer h-16 w-full mb-2" />
            <div className="skeleton-shimmer h-16 w-full" />
          </div>
        </section>
        
        {/* Shimmering skeleton project cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-6">
              <div className="skeleton-shimmer h-6 w-24 mb-4" />
              <div className="skeleton-shimmer h-8 w-3/4 mb-2" />
              <div className="skeleton-shimmer h-4 w-full mb-4" />
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="skeleton-shimmer h-16 w-full" />
                <div className="skeleton-shimmer h-16 w-full" />
              </div>
              <div className="skeleton-shimmer h-2 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportProjects}
      />
      {/* Quick Actions Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-primary">Projects</h1>
          <span className="text-sm text-tertiary">({projects.length})</span>
            </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
            type="button"
                onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 text-xs font-medium bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-primary-hover)] transition h-8 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={creating}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{creating ? 'Creating...' : 'New Project'}</span>
          </button>
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border-subtle)] rounded-lg text-secondary hover:text-primary hover:border-[var(--brand-primary)]/40 transition h-8 flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Download className={`w-3.5 h-3.5 ${importing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{importing ? 'Importing…' : 'Import'}</span>
            <span className="sm:hidden">Import</span>
              </button>
              <Link
                to="/templates"
            className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border-subtle)] rounded-lg text-secondary hover:text-primary hover:border-[var(--brand-primary)]/40 transition h-8 flex items-center gap-1.5"
              >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Templates</span>
              </Link>
            </div>
          </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-[var(--color-error)] bg-[var(--color-error)]/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <div className="text-sm text-[var(--color-error)]">{error}</div>
          </div>
        </div>
      )}

      {/* Bento Grid: Recent Spotlight + Project List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Recent Spotlight - Top 3 Projects as "Open Notebooks" */}
        {recentProjects.length > 0 && (
          <section className="lg:col-span-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">Recent</h2>
            </div>
            <div className="space-y-2">
              {recentProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                >
                  <ProjectCard
                    id={project.id}
                    name={project.name}
                    genre={project.genre}
                    updatedLabel={formatDistanceToNow(project.updatedAt)}
                    versionsCount={project._count?.versions ?? 0}
                    accentColor={getGenreColor(project.genre)}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Project List - High-density table */}
        <section className={recentProjects.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {/* Search and Sort */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] text-primary placeholder:text-tertiary focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]/30 transition h-8"
            />
          </div>
              <button
              onClick={() => {
                const modes: SortMode[] = ['recent', 'alphabetical', 'versions'];
                const currentIndex = modes.indexOf(sortMode);
                setSortMode(modes[(currentIndex + 1) % modes.length]);
              }}
              className="px-3 py-2 text-xs font-medium border border-[var(--color-border-subtle)] rounded-lg text-secondary hover:text-primary hover:border-[var(--brand-primary)]/40 transition h-8 flex items-center gap-1.5"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {sortMode === 'recent' ? 'Recent' : sortMode === 'alphabetical' ? 'A-Z' : 'Versions'}
              </span>
            </button>
        </div>

          {/* Projects Table */}
          <div className="border border-[var(--color-border-subtle)] rounded-lg overflow-hidden bg-[var(--color-surface-card)]">
          {filteredProjects.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-tertiary mb-4">
                  {/* Messy desk/lab ASCII illustration */}
                  <pre className="text-xs font-mono opacity-50 whitespace-pre">
{`    ╔═══════════════════════════╗
    ║   📚  📝  📄  📋  📑   ║
    ║   ┌─────────────┐        ║
    ║   │   🎮  🎯    │        ║
    ║   │   📊  📈    │        ║
    ║   └─────────────┘        ║
    ║   ╱╲  ╱╲  ╱╲  ╱╲        ║
    ╚═══════════════════════╝`}
                  </pre>
                </div>
                <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-50 text-tertiary" />
                <p className="text-sm font-medium text-primary mb-1">No projects found</p>
                <p className="text-xs text-secondary mb-4">
                {searchQuery 
                    ? `No projects match "${searchQuery}"`
                    : 'Get started by creating your first project'}
              </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-3 py-1.5 text-xs font-medium bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-primary-hover)] transition h-8"
                  >
                    <Plus className="w-3.5 h-3.5 inline mr-1.5" />
                    Create Project
                  </button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-[var(--color-surface-elevated)] border-b border-[var(--color-border-subtle)]">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                      Project
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                      Genre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                      Versions
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-secondary uppercase tracking-wider">
                      Last Edited
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-secondary uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project, index) => (
                    <ProjectRow
                      key={project.id}
                      id={project.id}
                      name={project.name}
                      genre={project.genre}
                      versionsCount={project._count?.versions ?? 0}
                      updatedLabel={formatDistanceToNow(project.updatedAt)}
                      accentColor={getGenreColor(project.genre)}
                      onDelete={() => handleDeleteProject(project.id, project.name)}
                      delay={index * 0.02}
                    />
                ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
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
          <div className="w-full max-w-md rounded-lg bg-[var(--color-surface-card)] shadow-xl border border-[var(--color-border-subtle)]">
            <div className="p-6">
              <h2 className="text-lg font-bold text-primary mb-2">Create New Project</h2>
              <p className="text-sm text-secondary mb-6">
                Set the intention for collaborators. What promise are you testing?
              </p>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label htmlFor="project-name" className="block text-xs font-semibold text-primary mb-1.5">
                    Project Title <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <input
                    id="project-name"
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-primary placeholder:text-tertiary focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]/30 transition h-9"
                    placeholder="e.g., Tidal Cities Co-op"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label htmlFor="project-genre" className="block text-xs font-semibold text-primary mb-1.5">
                    Genre or Mood
                  </label>
                  <input
                    id="project-genre"
                    type="text"
                    value={newProjectGenre}
                    onChange={(e) => setNewProjectGenre(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-primary placeholder:text-tertiary focus:border-[var(--brand-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]/30 transition h-9"
                    placeholder="e.g., Immersive sim, cozy RPG..."
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewProjectName('');
                      setNewProjectGenre('');
                    }}
                    className="flex-1 px-3 py-2 text-xs font-medium border border-[var(--color-border-subtle)] rounded-lg text-secondary hover:text-primary hover:border-[var(--brand-primary)]/40 transition h-9"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-3 py-2 text-xs font-medium bg-[var(--brand-primary)] text-white rounded-lg hover:bg-[var(--brand-primary-hover)] transition h-9 disabled:opacity-50"
                    disabled={creating || !newProjectName.trim()}
                  >
                    {creating ? 'Creating...' : 'Create'}
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
