import { useState, useEffect } from 'react';
import { X, Package, Download, Calendar, Tag } from 'lucide-react';
import { AssetPack } from '../types/asset_pack';
import { Asset } from '../types/asset';

interface AssetPackDetailsModalProps {
  pack: AssetPack;
  onClose: () => void;
  onUpdate: () => void;
}

export function AssetPackDetailsModal({ pack, onClose }: AssetPackDetailsModalProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackAssets();
  }, [pack.id]);

  const fetchPackAssets = async () => {
    setLoading(true);
    try {
      // Fetch all assets and filter by pack's asset_ids
      const response = await fetch('http://localhost:8000/api/assets?limit=1000');
      if (!response.ok) throw new Error('Failed to fetch assets');
      const data = await response.json();

      const packAssets = (data.assets || []).filter((asset: Asset) =>
        pack.asset_ids.includes(asset.id)
      );
      setAssets(packAssets);
    } catch (error) {
      console.error('Error fetching pack assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPack = async () => {
    if (assets.length === 0) {
      alert('No assets in this pack to download');
      return;
    }

    // For now, download assets individually
    // In production, you'd create a ZIP file on the backend
    for (const asset of assets) {
      const link = document.createElement('a');
      link.href = `http://localhost:8000${asset.file_url}`;
      link.download = asset.file_name;
      link.click();

      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Package className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={24} />
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                {pack.name}
              </h2>
              {pack.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {pack.description}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition flex-shrink-0 ml-4"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Pack Info */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>Created {formatDate(pack.created_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Package size={16} />
              <span>{pack.asset_count} assets</span>
            </div>
            {pack.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag size={16} />
                <span>{pack.tags.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Assets Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">Loading assets...</p>
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No assets found in this pack.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition"
                >
                  <img
                    src={`http://localhost:8000${asset.file_url}`}
                    alt={asset.file_name}
                    className="w-full h-full object-cover"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center p-2">
                    <p className="text-white text-xs font-medium text-center mb-2 truncate w-full">
                      {asset.file_name}
                    </p>
                    <p className="text-white/80 text-xs">
                      {asset.width} × {asset.height}
                    </p>
                    {asset.style_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 justify-center">
                        {asset.style_tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-600/80 text-white px-2 py-0.5 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Pack ID: {pack.id.slice(0, 8)}...
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPack}
              disabled={assets.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Download size={18} />
              Download All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
