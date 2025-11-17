import { useState, useEffect, useMemo } from 'react';
import { Image as ImageIcon, Download, Trash2, Loader2, Search, Filter, Star, StarOff, FolderOpen } from 'lucide-react';
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
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStyleTag, setSelectedStyleTag] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  useEffect(() => {
    loadAssets();
  }, [refreshTrigger]);

  // Load favorites from localStorage
  useEffect(() => {
    const savedFavorites = localStorage.getItem('asset-favorites');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.listAssets({ limit: 200 });
      setAssets(response.assets);
    } catch (err: any) {
      setError(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = (assetId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(assetId)) {
      newFavorites.delete(assetId);
    } else {
      newFavorites.add(assetId);
    }
    setFavorites(newFavorites);
    localStorage.setItem('asset-favorites', JSON.stringify(Array.from(newFavorites)));
  };

  const handleDelete = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    try {
      await apiClient.deleteAsset(assetId);
      setAssets(assets.filter((a) => a.id !== assetId));
      // Remove from favorites if deleted
      if (favorites.has(assetId)) {
        toggleFavorite(assetId);
      }
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

  // Get unique projects and style tags
  const uniqueProjects = useMemo(() => {
    const projects = new Set<string>();
    assets.forEach((asset) => {
      if (asset.project_name) {
        projects.add(asset.project_name);
      }
    });
    return Array.from(projects).sort();
  }, [assets]);

  const uniqueStyleTags = useMemo(() => {
    const tags = new Set<string>();
    assets.forEach((asset) => {
      asset.style_tags.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [assets]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          asset.file_name.toLowerCase().includes(query) ||
          asset.generation_prompt?.toLowerCase().includes(query) ||
          asset.style_tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Project filter
      if (selectedProject && asset.project_name !== selectedProject) {
        return false;
      }

      // Style tag filter
      if (selectedStyleTag && !asset.style_tags.includes(selectedStyleTag)) {
        return false;
      }

      // Favorites filter
      if (showFavoritesOnly && !favorites.has(asset.id)) {
        return false;
      }

      return true;
    });
  }, [assets, searchQuery, selectedProject, selectedStyleTag, showFavoritesOnly, favorites]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProject('');
    setSelectedStyleTag('');
    setShowFavoritesOnly(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Asset Library ({filteredAssets.length})</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
              showFavoritesOnly
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Star size={16} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
            Favorites{showFavoritesOnly && ` (${favorites.size})`}
          </button>
          {selectedAssets.size > 0 && (
            <button
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Download size={16} />
              Export ({selectedAssets.size})
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter size={20} className="text-gray-600" />
          <h3 className="font-semibold text-gray-800">Filters</h3>
          {(searchQuery || selectedProject || selectedStyleTag) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-purple-600 hover:text-purple-700"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Project Filter */}
          <div className="relative">
            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 appearance-none"
            >
              <option value="">All Projects</option>
              {uniqueProjects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>

          {/* Style Tag Filter */}
          <div>
            <select
              value={selectedStyleTag}
              onChange={(e) => setSelectedStyleTag(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Styles</option>
              {uniqueStyleTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Filter className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No assets match your filters</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-purple-600 hover:text-purple-700 font-medium"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => {
            const isFavorite = favorites.has(asset.id);

            return (
              <div
                key={asset.id}
                className={`bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden ${
                  selectedAssets.has(asset.id) ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                {/* Image */}
                <div
                  className="aspect-square bg-gray-100 flex items-center justify-center cursor-pointer relative group"
                  onClick={() => toggleAssetSelection(asset.id)}
                >
                  <img
                    src={asset.file_url}
                    alt={asset.file_name}
                    className="max-w-full max-h-full object-contain"
                    loading="lazy"
                  />
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(asset.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFavorite ? (
                      <Star size={16} className="text-yellow-500" fill="currentColor" />
                    ) : (
                      <StarOff size={16} className="text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 space-y-2">
                  <p className="text-sm font-medium truncate" title={asset.file_name}>
                    {asset.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {asset.width}x{asset.height} • {asset.generation_model}
                  </p>
                  {asset.project_name && (
                    <p className="text-xs text-blue-600 truncate" title={asset.project_name}>
                      📁 {asset.project_name}
                    </p>
                  )}
                  {asset.style_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {asset.style_tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded cursor-pointer hover:bg-purple-200"
                          onClick={() => setSelectedStyleTag(tag)}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
