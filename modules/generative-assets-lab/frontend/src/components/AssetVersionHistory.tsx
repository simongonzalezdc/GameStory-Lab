import { useState, useEffect } from 'react';
import { Loader2, GitBranch, MessageSquare } from 'lucide-react';
import { apiClient } from '../services/api';
import type { Asset } from '../types/asset';

interface AssetVersionHistoryProps {
  assetId: string;
  currentVersion?: number;
  onVersionSelect: (asset: Asset) => void;
}

export function AssetVersionHistory({ assetId, currentVersion, onVersionSelect }: AssetVersionHistoryProps) {
  const [versions, setVersions] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVersions();
  }, [assetId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError(null);
      const versionList = await apiClient.getAssetVersions(assetId);
      setVersions(versionList);
    } catch (err: any) {
      console.error('Failed to load versions:', err);
      setError('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        No version history available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-4">
        <GitBranch className="h-4 w-4" />
        Version History ({versions.length})
      </div>

      {/* Version Timeline */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {versions.map((version, index) => {
          const isCurrentVersion = currentVersion === version.version_number;
          const isLatest = index === versions.length - 1;

          return (
            <div
              key={version.id}
              className={`relative group cursor-pointer transition-all ${
                isCurrentVersion
                  ? 'ring-2 ring-purple-500 bg-purple-50'
                  : 'hover:bg-gray-50 border border-gray-200'
              } rounded-lg p-3`}
              onClick={() => onVersionSelect(version)}
            >
              {/* Connection Line */}
              {index < versions.length - 1 && (
                <div className="absolute left-14 top-full h-2 w-0.5 bg-gray-300" />
              )}

              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="relative flex-shrink-0">
                  <img
                    src={version.file_url}
                    alt={`Version ${version.version_number}`}
                    className="w-16 h-16 object-contain bg-white border border-gray-200 rounded"
                  />
                  {isLatest && (
                    <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                      Latest
                    </div>
                  )}
                </div>

                {/* Version Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-gray-900">
                      Version {version.version_number}
                    </span>
                    {isCurrentVersion && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Refinement Instruction */}
                  {version.refinement_instruction ? (
                    <div className="flex items-start gap-1 mb-1">
                      <MessageSquare className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-600 italic">
                        "{version.refinement_instruction}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mb-1">Original generation</p>
                  )}

                  {/* Prompt */}
                  <p className="text-xs text-gray-400 truncate" title={version.generation_prompt || ''}>
                    {version.generation_prompt}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{version.width} × {version.height}</span>
                    <span>{new Date(version.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Hover Action */}
              {!isCurrentVersion && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700">
                    View
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
        {versions.length > 1 ? (
          <>
            This asset has been refined {versions.length - 1} time{versions.length - 1 !== 1 ? 's' : ''}.
            Click any version to view or continue refining from that point.
          </>
        ) : (
          <>
            This is the original asset. Use the refine button to create variations.
          </>
        )}
      </div>
    </div>
  );
}
