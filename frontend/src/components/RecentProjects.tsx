import { useState, useEffect } from 'react';
import { FolderOpen, Clock, X } from 'lucide-react';

interface RecentProject {
  name: string;
  lastAccessed: number;
  assetCount: number;
}

interface RecentProjectsProps {
  onSelectProject?: (projectName: string | null) => void;
  currentProject?: string | null;
}

const STORAGE_KEY = 'recent-projects';
const MAX_RECENT = 10;

export function RecentProjects({ onSelectProject, currentProject }: RecentProjectsProps) {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [showAll, setShowAll] = useState(false);

  // Expose function globally to record project access
  useEffect(() => {
    (window as any).recordProjectAccess = (projectName: string | null, assetCount: number = 0) => {
      if (!projectName) return;

      setRecentProjects(prev => {
        const existing = prev.find(p => p.name === projectName);
        let updated: RecentProject[];

        if (existing) {
          // Update existing project
          updated = prev.map(p =>
            p.name === projectName
              ? { ...p, lastAccessed: Date.now(), assetCount }
              : p
          );
        } else {
          // Add new project
          updated = [
            { name: projectName, lastAccessed: Date.now(), assetCount },
            ...prev
          ];
        }

        // Sort by last accessed and limit
        updated = updated
          .sort((a, b) => b.lastAccessed - a.lastAccessed)
          .slice(0, MAX_RECENT);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    };
  }, []);

  const handleSelectProject = (projectName: string) => {
    onSelectProject?.(projectName);
    (window as any).recordProjectAccess?.(projectName, 0);
  };

  const handleClearProject = (projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentProjects.filter(p => p.name !== projectName);
    setRecentProjects(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const handleClearAll = () => {
    setRecentProjects([]);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    onSelectProject?.(null);
  };

  const displayedProjects = showAll ? recentProjects : recentProjects.slice(0, 5);

  const formatLastAccessed = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (recentProjects.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen size={18} className="text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Projects</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No recent projects. Create assets with a project name to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderOpen size={18} className="text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Projects</h3>
        </div>
        <button
          onClick={handleClearAll}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
          title="Clear all"
        >
          Clear
        </button>
      </div>

      {/* Project List */}
      <div className="space-y-2">
        {displayedProjects.map((project) => (
          <button
            key={project.name}
            onClick={() => handleSelectProject(project.name)}
            className={`w-full text-left p-2 rounded-lg transition group ${
              currentProject === project.name
                ? 'bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                  {project.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <Clock size={10} />
                  <span>{formatLastAccessed(project.lastAccessed)}</span>
                  {project.assetCount > 0 && (
                    <>
                      <span>•</span>
                      <span>{project.assetCount} assets</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={(e) => handleClearProject(project.name, e)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                title="Remove"
              >
                <X size={12} className="text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
              </button>
            </div>
          </button>
        ))}
      </div>

      {/* Show More/Less */}
      {recentProjects.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-2 text-sm text-purple-600 dark:text-purple-400 hover:underline"
        >
          {showAll ? 'Show Less' : `Show ${recentProjects.length - 5} More`}
        </button>
      )}

      {/* View All Projects Link */}
      {currentProject && (
        <button
          onClick={() => onSelectProject?.(null)}
          className="w-full mt-2 text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
        >
          View All Projects
        </button>
      )}
    </div>
  );
}
