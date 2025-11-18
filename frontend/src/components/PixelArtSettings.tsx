import { useState } from 'react';
import { Grid3x3, Palette } from 'lucide-react';

interface PixelArtSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSettingsChange: (settings: PixelArtSettings) => void;
}

export interface PixelArtSettings {
  enabled: boolean;
  palette: string;
  ditherLevel: number;
  pixelSize: number;
}

const PALETTES = [
  { id: 'nes', name: 'NES (56 colors)', description: 'Classic 8-bit Nintendo palette' },
  { id: 'gameboy', name: 'Game Boy (4 colors)', description: 'Original Game Boy green' },
  { id: 'snes', name: 'SNES (256 colors)', description: 'Super Nintendo palette' },
  { id: 'c64', name: 'Commodore 64 (16 colors)', description: 'Retro computer palette' },
  { id: 'cga', name: 'CGA (16 colors)', description: 'Early PC graphics' },
  { id: 'pico8', name: 'PICO-8 (16 colors)', description: 'Fantasy console palette' },
];

const PIXEL_SIZES = [
  { size: 16, label: '16x16' },
  { size: 32, label: '32x32' },
  { size: 64, label: '64x64' },
  { size: 128, label: '128x128' },
];

export function PixelArtSettings({ enabled, onToggle, onSettingsChange }: PixelArtSettingsProps) {
  const [palette, setPalette] = useState('nes');
  const [ditherLevel, setDitherLevel] = useState(0);
  const [pixelSize, setPixelSize] = useState(32);

  const handleChange = (newSettings: Partial<PixelArtSettings>) => {
    const settings = {
      enabled,
      palette,
      ditherLevel,
      pixelSize,
      ...newSettings,
    };

    if (newSettings.palette !== undefined) setPalette(newSettings.palette);
    if (newSettings.ditherLevel !== undefined) setDitherLevel(newSettings.ditherLevel);
    if (newSettings.pixelSize !== undefined) setPixelSize(newSettings.pixelSize);

    onSettingsChange(settings);
  };

  return (
    <div className="space-y-4 border border-purple-200 dark:border-purple-800 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3x3 className="text-purple-600 dark:text-purple-400" size={20} />
          <span className="font-semibold text-gray-900 dark:text-white">Pixel Art Mode</span>
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
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Pixel Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Canvas Size
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PIXEL_SIZES.map((ps) => (
                <button
                  key={ps.size}
                  onClick={() => handleChange({ pixelSize: ps.size })}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    pixelSize === ps.size
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-purple-400'
                  }`}
                >
                  {ps.label}
                </button>
              ))}
            </div>
          </div>

          {/* Palette */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Palette className="inline w-4 h-4 mr-1" />
              Color Palette
            </label>
            <select
              value={palette}
              onChange={(e) => handleChange({ palette: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {PALETTES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.description}
                </option>
              ))}
            </select>
          </div>

          {/* Dithering */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dithering Level: {ditherLevel}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={ditherLevel}
              onChange={(e) => handleChange({ ditherLevel: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>Sharp</span>
              <span>Retro Look</span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded p-3 text-sm text-purple-800 dark:text-purple-300">
            <p className="font-medium mb-1">Pixel Art Mode Active:</p>
            <ul className="space-y-1 text-xs">
              <li>• Limited color palette for authentic retro look</li>
              <li>• Sharp edges with no anti-aliasing</li>
              <li>• Optimized for pixel-perfect scaling</li>
              <li>• Perfect for retro/indie games</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
