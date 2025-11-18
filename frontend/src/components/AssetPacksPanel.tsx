import { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { AssetPack } from '../types/asset_pack';
import { AssetPackModal } from './AssetPackModal';
import { AssetPackDetailsModal } from './AssetPackDetailsModal';
import { API_ENDPOINTS } from '../config/api';

export function AssetPacksPanel() {
  const [packs, setPacks] = useState<AssetPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<AssetPack | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingPack, setEditingPack] = useState<AssetPack | null>(null);

  const fetchPacks = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(API_ENDPOINTS.packs, { signal });
      if (!response.ok) throw new Error('Failed to fetch packs');
      const data = await response.json();
      setPacks(data.packs || []);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Ignore abort errors
      }
      console.error('Error fetching packs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchPacks(abortController.signal);
    return () => abortController.abort();
  }, [fetchPacks]);

  const handleDelete = async (packId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this asset pack?')) return;

    try {
      const response = await fetch(API_ENDPOINTS.packById(packId), {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete pack');
      await fetchPacks();
    } catch (error) {
      console.error('Error deleting pack:', error);
      alert('Failed to delete pack');
    }
  };

  const handleEdit = (pack: AssetPack, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPack(pack);
  };

  const handleViewDetails = (pack: AssetPack) => {
    setSelectedPack(pack);
    setShowDetailsModal(true);
  };

  const handlePackCreated = () => {
    setShowCreateModal(false);
    setEditingPack(null);
    fetchPacks();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Package size={18} className="text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Asset Packs</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Asset Packs</h3>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
            title="Create new pack"
          >
            <Plus size={16} className="text-blue-600 dark:text-blue-400" />
          </button>
        </div>

        {/* Pack List */}
        {packs.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No packs yet. Create your first asset pack!
          </p>
        ) : (
          <div className="space-y-2">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {pack.name}
                    </div>
                    {pack.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {pack.description}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{pack.asset_count} assets</span>
                      {pack.tags.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="truncate">{pack.tags.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleViewDetails(pack)}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                      title="View details"
                    >
                      <Eye size={12} className="text-blue-600 dark:text-blue-400" />
                    </button>
                    <button
                      onClick={(e) => handleEdit(pack, e)}
                      className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition"
                      title="Edit"
                    >
                      <Edit size={12} className="text-purple-600 dark:text-purple-400" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(pack.id, e)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                      title="Delete"
                    >
                      <Trash2 size={12} className="text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {(showCreateModal || editingPack) && (
        <AssetPackModal
          pack={editingPack}
          onClose={() => {
            setShowCreateModal(false);
            setEditingPack(null);
          }}
          onSaved={handlePackCreated}
        />
      )}

      {showDetailsModal && selectedPack && (
        <AssetPackDetailsModal
          pack={selectedPack}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPack(null);
          }}
          onUpdate={fetchPacks}
        />
      )}
    </>
  );
}
