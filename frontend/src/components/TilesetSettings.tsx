import { useState } from 'react';
import { Grid, Layers } from 'lucide-react';

interface TilesetSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSettingsChange: (settings: TilesetSettings) => void;
}

export interface TilesetSettings {
  enabled: boolean;
  tilesetType: 'basic' | 'full' | 'autotile';
  includePieces: string[];
  tileSize: 16 | 32 | 64;
  seamless: boolean;
}

const TILESET_TYPES = [
  {
    id: 'basic' as const,
    name: 'Basic Set',
    description: '9 tiles (center + 4 edges + 4 corners)',
    pieces: ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'],
  },
  {
    id: 'full' as const,
    name: 'Full Set',
    description: '16 tiles (basic + inner corners)',
    pieces: ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'inner-top-left', 'inner-top-right', 'inner-bottom-left', 'inner-bottom-right', 'horizontal', 'vertical', 'single'],
  },
  {
    id: 'autotile' as const,
    name: 'Auto-tile',
    description: '47 tiles (RPG Maker style)',
    pieces: ['autotile-full'],
  },
];

const TILE_SIZES = [
  { size: 16 as const, label: '16x16', description: 'Retro style' },
  { size: 32 as const, label: '32x32', description: 'Standard' },
  { size: 64 as const, label: '64x64', description: 'High detail' },
];

const PIECE_LABELS: { [key: string]: string } = {
  center: 'Center',
  top: 'Top Edge',
  bottom: 'Bottom Edge',
  left: 'Left Edge',
  right: 'Right Edge',
  'top-left': 'Top-Left Corner',
  'top-right': 'Top-Right Corner',
  'bottom-left': 'Bottom-Left Corner',
  'bottom-right': 'Bottom-Right Corner',
  'inner-top-left': 'Inner Top-Left',
  'inner-top-right': 'Inner Top-Right',
  'inner-bottom-left': 'Inner Bottom-Left',
  'inner-bottom-right': 'Inner Bottom-Right',
  horizontal: 'Horizontal Bridge',
  vertical: 'Vertical Bridge',
  single: 'Single Tile',
  'autotile-full': 'Full Autotile Set',
};

export function TilesetSettings({ enabled, onToggle, onSettingsChange }: TilesetSettingsProps) {
  const [tilesetType, setTilesetType] = useState<'basic' | 'full' | 'autotile'>('basic');
  const [includePieces, setIncludePieces] = useState<string[]>(TILESET_TYPES[0].pieces);
  const [tileSize, setTileSize] = useState<16 | 32 | 64>(32);
  const [seamless, setSeamless] = useState(true);

  const currentType = TILESET_TYPES.find((t) => t.id === tilesetType)!;

  const handleChange = (newSettings: Partial<TilesetSettings>) => {
    const settings: TilesetSettings = {
      enabled,
      tilesetType,
      includePieces,
      tileSize,
      seamless,
      ...newSettings,
    };

    if (newSettings.tilesetType !== undefined) {
      setTilesetType(newSettings.tilesetType);
      // Auto-select all pieces for the new type
      const typeData = TILESET_TYPES.find((t) => t.id === newSettings.tilesetType)!;
      setIncludePieces(typeData.pieces);
      settings.includePieces = typeData.pieces;
    }
    if (newSettings.includePieces !== undefined) setIncludePieces(newSettings.includePieces);
    if (newSettings.tileSize !== undefined) setTileSize(newSettings.tileSize);
    if (newSettings.seamless !== undefined) setSeamless(newSettings.seamless);

    onSettingsChange(settings);
  };

  const togglePiece = (piece: string) => {
    const newPieces = includePieces.includes(piece)
      ? includePieces.filter((p) => p !== piece)
      : [...includePieces, piece];

    // Prevent deselecting all pieces
    if (newPieces.length > 0) {
      handleChange({ includePieces: newPieces });
    }
  };

  return (
    <div className="space-y-4 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 bg-emerald-50 dark:bg-emerald-900/20">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid className="text-emerald-600 dark:text-emerald-400" size={20} />
          <span className="font-semibold text-gray-900 dark:text-white">Tileset Generation</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => {
              onToggle(e.target.checked);
              handleChange({ enabled: e.target.checked });
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Tileset Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Layers className="inline w-4 h-4 mr-1" />
              Tileset Type
            </label>
            <div className="space-y-2">
              {TILESET_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleChange({ tilesetType: type.id })}
                  className={`w-full px-3 py-2 rounded text-sm font-medium transition text-left ${
                    tilesetType === type.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{type.name}</div>
                      <div className="text-xs opacity-75">{type.description}</div>
                    </div>
                    <div className="text-xs opacity-75">{type.pieces.length} tiles</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Tile Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tile Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TILE_SIZES.map((ts) => (
                <button
                  key={ts.size}
                  onClick={() => handleChange({ tileSize: ts.size })}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    tileSize === ts.size
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                  }`}
                >
                  <div>{ts.label}</div>
                  <div className="text-xs opacity-75">{ts.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Seamless Toggle */}
          <div className="flex items-center justify-between bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded p-3">
            <div>
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">Seamless Tiles</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">Edges connect perfectly</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={seamless}
                onChange={(e) => handleChange({ seamless: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Piece Selection (only for basic/full, not autotile) */}
          {tilesetType !== 'autotile' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Tiles ({includePieces.length}/{currentType.pieces.length})
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                {currentType.pieces.map((piece) => {
                  const isSelected = includePieces.includes(piece);
                  return (
                    <button
                      key={piece}
                      onClick={() => togglePiece(piece)}
                      className={`px-3 py-2 rounded text-sm font-medium transition ${
                        isSelected
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-emerald-400'
                      }`}
                    >
                      {PIECE_LABELS[piece]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 rounded p-3 text-sm text-emerald-800 dark:text-emerald-300">
            <p className="font-medium mb-1">Tileset Mode Active:</p>
            <ul className="space-y-1 text-xs">
              <li>• Generates {includePieces.length} tile piece{includePieces.length !== 1 ? 's' : ''} ({tileSize}x{tileSize})</li>
              <li>• {currentType.name}: {currentType.description}</li>
              <li>• {seamless ? 'Seamless edges for tiling' : 'Individual standalone tiles'}</li>
              <li>• Perfect for platformers, RPGs, and tile-based games</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
