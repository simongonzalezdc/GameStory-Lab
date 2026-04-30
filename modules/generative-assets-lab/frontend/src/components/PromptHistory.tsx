import { useState, useEffect } from 'react';
import { History, Star, StarOff, Trash2, Clock } from 'lucide-react';

interface SavedPrompt {
  id: string;
  prompt: string;
  timestamp: number;
  favorite: boolean;
  usageCount: number;
}

interface PromptHistoryProps {
  onSelectPrompt: (prompt: string) => void;
}

const MAX_HISTORY = 50;
const STORAGE_KEY = 'prompt-history';

export function PromptHistory({ onSelectPrompt }: PromptHistoryProps) {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setPrompts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load prompt history:', e);
      }
    }
  };

  const savePrompts = (newPrompts: SavedPrompt[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrompts));
    setPrompts(newPrompts);
  };

  const addPromptToHistory = (prompt: string) => {
    if (!prompt.trim()) return;

    const existing = prompts.find((p) => p.prompt === prompt);
    if (existing) {
      // Update usage count and timestamp
      const updated = prompts.map((p) =>
        p.id === existing.id
          ? { ...p, usageCount: p.usageCount + 1, timestamp: Date.now() }
          : p
      );
      savePrompts(updated);
    } else {
      // Add new prompt
      const newPrompt: SavedPrompt = {
        id: Date.now().toString(),
        prompt,
        timestamp: Date.now(),
        favorite: false,
        usageCount: 1,
      };
      const updated = [newPrompt, ...prompts].slice(0, MAX_HISTORY);
      savePrompts(updated);
    }
  };

  const toggleFavorite = (id: string) => {
    const updated = prompts.map((p) =>
      p.id === id ? { ...p, favorite: !p.favorite } : p
    );
    savePrompts(updated);
  };

  const deletePrompt = (id: string) => {
    const updated = prompts.filter((p) => p.id !== id);
    savePrompts(updated);
  };

  const clearAll = () => {
    if (confirm('Clear all prompt history?')) {
      savePrompts([]);
    }
  };

  const filteredPrompts = prompts.filter((p) =>
    filter === 'favorites' ? p.favorite : true
  );

  const sortedPrompts = [...filteredPrompts].sort((a, b) => {
    // Favorites first, then by timestamp
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return b.timestamp - a.timestamp;
  });

  // Expose addPromptToHistory so parent can call it
  useEffect(() => {
    (window as any).addPromptToHistory = addPromptToHistory;
  }, [prompts]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowHistory(!showHistory)}
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
        title="Prompt History"
      >
        <History size={16} />
        History ({prompts.length})
      </button>

      {showHistory && (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <History size={18} />
                Prompt History
              </h3>
              <button
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-3 py-1.5 rounded text-sm ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('favorites')}
                className={`flex-1 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-1 ${
                  filter === 'favorites'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Star size={14} />
                Favorites
              </button>
            </div>
          </div>

          {/* Prompts List */}
          <div className="flex-1 overflow-y-auto p-2">
            {sortedPrompts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <History className="mx-auto mb-2 text-gray-400" size={32} />
                <p className="text-sm">
                  {filter === 'favorites'
                    ? 'No favorite prompts yet'
                    : 'No prompt history yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {sortedPrompts.map((savedPrompt) => (
                  <div
                    key={savedPrompt.id}
                    className="group bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-3 cursor-pointer transition"
                    onClick={() => {
                      onSelectPrompt(savedPrompt.prompt);
                      setShowHistory(false);
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-gray-900 dark:text-white line-clamp-2 flex-1">
                        {savedPrompt.prompt}
                      </p>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(savedPrompt.id);
                          }}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                          title={savedPrompt.favorite ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          {savedPrompt.favorite ? (
                            <Star size={14} className="text-yellow-500" fill="currentColor" />
                          ) : (
                            <StarOff size={14} className="text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePrompt(savedPrompt.id);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          title="Delete"
                        >
                          <Trash2 size={14} className="text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(savedPrompt.timestamp).toLocaleDateString()}
                      </span>
                      <span>Used {savedPrompt.usageCount}x</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {prompts.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={clearAll}
                className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 w-full text-center"
              >
                Clear All History
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
