import { useState } from 'react';
import { X, Plus, Tag, Trash2 } from 'lucide-react';
import type { Asset } from '../types/asset';
import { apiClient } from '../services/api';

interface BulkTaggingModalProps {
  selectedAssets: Asset[];
  onClose: () => void;
  onUpdate: () => void;
}

export function BulkTaggingModal({ selectedAssets, onClose, onUpdate }: BulkTaggingModalProps) {
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get common tags across all selected assets
  const getCommonTags = (): string[] => {
    if (selectedAssets.length === 0) return [];

    const tagSets = selectedAssets.map(asset => new Set(asset.style_tags || []));
    const firstSet = tagSets[0];

    return Array.from(firstSet).filter(tag =>
      tagSets.every(set => set.has(tag))
    );
  };

  // Get all tags (union) across selected assets
  const getAllTags = (): string[] => {
    const allTags = new Set<string>();
    selectedAssets.forEach(asset => {
      (asset.style_tags || []).forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  const commonTags = getCommonTags();
  const allTags = getAllTags();

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    const tag = newTag.trim();
    setLoading(true);
    setError(null);

    try {
      // Add tag to all selected assets
      const promises = selectedAssets.map(asset => {
        const existingTags = asset.style_tags || [];
        if (existingTags.includes(tag)) {
          return Promise.resolve(); // Already has this tag
        }

        return apiClient.updateAsset(asset.id, {
          style_tags: [...existingTags, tag]
        });
      });

      await Promise.all(promises);
      setNewTag('');
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to add tag');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    setLoading(true);
    setError(null);

    try {
      // Remove tag from all selected assets that have it
      const promises = selectedAssets.map(asset => {
        const existingTags = asset.style_tags || [];
        if (!existingTags.includes(tagToRemove)) {
          return Promise.resolve(); // Doesn't have this tag
        }

        return apiClient.updateAsset(asset.id, {
          style_tags: existingTags.filter(t => t !== tagToRemove)
        });
      });

      await Promise.all(promises);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to remove tag');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Tag className="text-purple-600 dark:text-purple-400" size={24} />
              Bulk Tagging
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            Editing tags for {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Add Tag Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add New Tag
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., pixel-art, fantasy, weapon"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                disabled={loading}
              />
              <button
                onClick={handleAddTag}
                disabled={!newTag.trim() || loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 transition"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
            )}
          </div>

          {/* Common Tags (present in ALL selected assets) */}
          {commonTags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Common Tags (in all selected assets)
              </h3>
              <div className="flex flex-wrap gap-2">
                {commonTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm border border-green-300 dark:border-green-700"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      disabled={loading}
                      className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition"
                      title="Remove from all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* All Tags (present in SOME selected assets) */}
          {allTags.length > 0 && allTags.length !== commonTags.length && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                All Tags (in some selected assets)
              </h3>
              <div className="flex flex-wrap gap-2">
                {allTags.filter(tag => !commonTags.includes(tag)).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm border border-gray-300 dark:border-gray-600"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      disabled={loading}
                      className="hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-0.5 transition"
                      title="Remove from all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {allTags.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Tag className="mx-auto mb-2" size={32} />
              <p>No tags yet. Add a tag above to get started!</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
