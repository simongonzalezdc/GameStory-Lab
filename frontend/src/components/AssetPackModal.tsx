import { useState, useEffect } from 'react';
import { X, Package, Tag } from 'lucide-react';
import { AssetPack, AssetPackCreate } from '../types/asset_pack';
import { Asset } from '../types/asset';

interface AssetPackModalProps {
  pack?: AssetPack | null;
  onClose: () => void;
  onSaved: () => void;
}

export function AssetPackModal({ pack, onClose, onSaved }: AssetPackModalProps) {
  const [name, setName] = useState(pack?.name || '');
  const [description, setDescription] = useState(pack?.description || '');
  const [tags, setTags] = useState(pack?.tags?.join(', ') || '');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>(pack?.asset_ids || []);
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/assets?limit=100');
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();
      setAvailableAssets(data.assets || []);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Pack name is required');
      return;
    }

    setSaving(true);
    try {
      const packData: AssetPackCreate = {
        name: name.trim(),
        description: description.trim() || undefined,
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        asset_ids: selectedAssetIds,
      };

      const url = pack
        ? `http://localhost:8000/api/packs/${pack.id}`
        : 'http://localhost:8000/api/packs';

      const method = pack ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save pack');
      }

      onSaved();
    } catch (error) {
      console.error('Error saving pack:', error);
      alert(`Failed to save pack: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const toggleAssetSelection = (assetId: string) => {
    setSelectedAssetIds(prev =>
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };

  const selectAll = () => {
    setSelectedAssetIds(availableAssets.map(a => a.id));
  };

  const clearSelection = () => {
    setSelectedAssetIds([]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="text-blue-600 dark:text-blue-400" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {pack ? 'Edit Asset Pack' : 'Create Asset Pack'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pack Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Medieval Knight Set"
              required
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              placeholder="Complete knight asset pack with armor variations"
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags (comma-separated)
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="medieval, character, knight"
              />
            </div>
          </div>

          {/* Asset Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Assets ({selectedAssetIds.length} selected)
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-gray-600 dark:text-gray-400 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading assets...</p>
            ) : availableAssets.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No assets available. Generate some assets first!
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                {availableAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => toggleAssetSelection(asset.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                      selectedAssetIds.includes(asset.id)
                        ? 'border-blue-600 dark:border-blue-400 ring-2 ring-blue-200 dark:ring-blue-900'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={`http://localhost:8000${asset.file_url}`}
                      alt={asset.file_name}
                      className="w-full h-full object-cover"
                    />
                    {selectedAssetIds.includes(asset.id) && (
                      <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          ✓
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Saving...' : pack ? 'Update Pack' : 'Create Pack'}
          </button>
        </div>
      </div>
    </div>
  );
}
