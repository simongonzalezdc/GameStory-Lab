import { useState, useEffect, useMemo } from 'react';
import { Image as ImageIcon, Download, Trash2, Loader2, Search, Filter, Star, StarOff, FolderOpen, Wand2, GitBranch, Copy } from 'lucide-react';
import { apiClient } from '../services/api';
import type { Asset } from '../types/asset';
import { ChatInterface } from './ChatInterface';
import { AssetVersionHistory } from './AssetVersionHistory';
import { EnhancedExportModal, ExportSettings } from './EnhancedExportModal';
import { SkeletonGrid } from './SkeletonLoader';

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

  // Phase 2: Refinement & Versioning
  const [refineAsset, setRefineAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);

  // Enhanced Export Modal
  const [showExportModal, setShowExportModal] = useState(false);

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

  const handleDuplicate = async (assetId: string) => {
    try {
      const duplicate = await apiClient.duplicateAsset(assetId);
      setAssets([duplicate, ...assets]);
      alert('✓ Asset duplicated successfully!');
    } catch (err: any) {
      alert('Failed to duplicate asset: ' + err.message);
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

  const handleExportClick = () => {
    if (selectedAssets.size === 0) {
      alert('Please select at least one asset to export');
      return;
    }
    setShowExportModal(true);
  };

  const handleExport = async (settings: ExportSettings) => {
    try {
      const blob = await apiClient.exportAssets({
        asset_ids: Array.from(selectedAssets),
        format: settings.format,
        target_engine: settings.targetEngine,
        resolution_multiplier: settings.resolutionMultiplier,
        settings: {
          trimTransparency: settings.trimTransparency,
          padding: settings.padding,
          sheetSize: settings.sheetSize,
        },
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `game_assets_export_${Date.now()}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      // Clear selection after successful export
      setSelectedAssets(new Set());
    } catch (err: any) {
      throw err; // Let modal handle the error
    }
  };

  // Phase 2: Refinement handlers
  const handleRefinementComplete = (newAsset: Asset) => {
    // Add the new asset to the library
    setAssets([newAsset, ...assets]);
    // Close the chat interface
    setRefineAsset(null);
    // Optionally show the new asset in detail view
    setDetailAsset(newAsset);
  };

  const handleVersionSelect = (asset: Asset) => {
    // Update the detail view to show selected version
    setDetailAsset(asset);
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
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Asset Library</h2>
        <SkeletonGrid count={6} />
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
              onClick={handleExportClick}
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
                  <div className="flex flex-col gap-2 pt-2">
                    {/* Primary Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRefineAsset(asset);
                        }}
                        className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-1"
                        title="Refine this asset with AI"
                      >
                        <Wand2 size={14} />
                        Refine
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDetailAsset(asset);
                        }}
                        className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-1"
                        title="View details and version history"
                      >
                        <GitBranch size={14} />
                        v{asset.version_number}
                      </button>
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(asset);
                        }}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm flex items-center justify-center gap-1"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(asset.id);
                        }}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded text-sm"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Phase 2: Refine Modal */}
      {refineAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ChatInterface
            asset={refineAsset}
            onRefinementComplete={handleRefinementComplete}
            onClose={() => setRefineAsset(null)}
          />
        </div>
      )}

      {/* Phase 2: Detail Modal with Version History */}
      {detailAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full my-8">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">Asset Details</h2>
                <button
                  onClick={() => setDetailAsset(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              {/* Content Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Asset Preview and Info */}
                <div className="space-y-4">
                  {/* Preview */}
                  <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center">
                    <img
                      src={detailAsset.file_url}
                      alt={detailAsset.file_name}
                      className="max-w-full max-h-96 object-contain"
                    />
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Filename:</span>
                      <span className="font-medium">{detailAsset.file_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dimensions:</span>
                      <span className="font-medium">{detailAsset.width} × {detailAsset.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">{detailAsset.generation_model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Version:</span>
                      <span className="font-medium">v{detailAsset.version_number}</span>
                    </div>
                    {detailAsset.project_name && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Project:</span>
                        <span className="font-medium">{detailAsset.project_name}</span>
                      </div>
                    )}
                    {detailAsset.generation_prompt && (
                      <div className="pt-2 border-t">
                        <span className="text-gray-600 block mb-1">Prompt:</span>
                        <p className="text-gray-900 text-sm">{detailAsset.generation_prompt}</p>
                      </div>
                    )}
                    {detailAsset.style_tags.length > 0 && (
                      <div className="pt-2">
                        <span className="text-gray-600 block mb-2">Tags:</span>
                        <div className="flex flex-wrap gap-2">
                          {detailAsset.style_tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => {
                        setDetailAsset(null);
                        setRefineAsset(detailAsset);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2"
                    >
                      <Wand2 size={16} />
                      Refine This Version
                    </button>
                    <button
                      onClick={() => handleDownload(detailAsset)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                </div>

                {/* Right: Version History */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <AssetVersionHistory
                    assetId={detailAsset.id}
                    currentVersion={detailAsset.version_number}
                    onVersionSelect={handleVersionSelect}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Export Modal */}
      {showExportModal && (
        <EnhancedExportModal
          selectedAssets={assets.filter((a) => selectedAssets.has(a.id))}
          onClose={() => setShowExportModal(false)}
          onExport={handleExport}
        />
      )}
    </div>
  );
}
