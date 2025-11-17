import { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '../services/api';
import type { Asset } from '../types/asset';

interface AssetLibraryProps {
  refreshTrigger?: number;
}

export function AssetLibrary({ refreshTrigger }: AssetLibraryProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAssets();
  }, [refreshTrigger]);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.listAssets({ limit: 50 });
      setAssets(response.assets);
    } catch (err: any) {
      setError(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      await apiClient.deleteAsset(assetId);
      setAssets(assets.filter((a) => a.id !== assetId));
    } catch (err: any) {
      alert('Failed to delete asset: ' + err.message);
    }
  };

  const handleDownload = (asset: Asset) => {
    const link = document.createElement('a');
    link.href = asset.file_url;
    link.download = asset.file_name;
    link.click();
  };

  const toggleAssetSelection = (assetId: string) => {
    const newSelection = new Set(selectedAssets);
    if (newSelection.has(assetId)) {
      newSelection.delete(assetId);
    } else {
      newSelection.add(assetId);
    }
    setSelectedAssets(newSelection);
  };

  const handleExport = async () => {
    if (selectedAssets.size === 0) {
      alert('Please select at least one asset to export');
      return;
    }

    try {
      const blob = await apiClient.exportAssets({
        asset_ids: Array.from(selectedAssets),
        format: 'sprite-sheet-json',
        target_engine: 'generic',
        resolution_multiplier: 1,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'game_assets_export.zip';
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Export failed: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-purple-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        Error: {error}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto text-gray-400 mb-4" size={48} />
        <p className="text-gray-600">No assets yet. Generate your first asset above!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Asset Library ({assets.length})</h2>
        {selectedAssets.size > 0 && (
          <button
            onClick={handleExport}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Download size={16} />
            Export Selected ({selectedAssets.size})
          </button>
        )}
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className={`bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden ${
              selectedAssets.has(asset.id) ? 'ring-2 ring-purple-500' : ''
            }`}
          >
            {/* Image */}
            <div
              className="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer"
              onClick={() => toggleAssetSelection(asset.id)}
            >
              <img
                src={asset.file_url}
                alt={asset.file_name}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
              />
            </div>

            {/* Info */}
            <div className="p-3 space-y-2">
              <p className="text-sm font-medium truncate" title={asset.file_name}>
                {asset.file_name}
              </p>
              <p className="text-xs text-gray-500">
                {asset.width}x{asset.height} • {asset.generation_model}
              </p>
              {asset.style_tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {asset.style_tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleDownload(asset)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-1"
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={() => handleDelete(asset.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded text-sm"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
