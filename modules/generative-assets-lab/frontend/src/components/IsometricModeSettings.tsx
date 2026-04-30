import { useState } from 'react';
import { Box } from 'lucide-react';

interface IsometricModeSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSettingsChange: (settings: IsometricModeSettings) => void;
}

export interface IsometricModeSettings {
  enabled: boolean;
  viewAngle: 'classic' | 'dimetric' | 'cabinet';
  gridAlignment: boolean;
  shadowStyle: 'soft' | 'hard' | 'none';
  perspective: '2:1' | '3:2' | '4:3';
}

const VIEW_ANGLES = [
  {
    id: 'classic' as const,
    name: 'Classic Isometric',
    angle: '30° (2:1)',
    description: 'Traditional isometric 30° angle',
  },
  {
    id: 'dimetric' as const,
    name: 'Dimetric',
    angle: '26.565°',
    description: 'Slightly shallower angle',
  },
  {
    id: 'cabinet' as const,
    name: 'Cabinet',
    angle: '45°',
    description: 'Steeper 45° perspective',
  },
];

const SHADOW_STYLES = [
  { id: 'soft' as const, name: 'Soft Shadow', description: 'Ambient occlusion' },
  { id: 'hard' as const, name: 'Hard Shadow', description: 'Sharp cast shadow' },
  { id: 'none' as const, name: 'No Shadow', description: 'Flat lighting' },
];

const PERSPECTIVES = [
  { id: '2:1' as const, name: '2:1', description: 'Standard ratio' },
  { id: '3:2' as const, name: '3:2', description: 'Wider tiles' },
  { id: '4:3' as const, name: '4:3', description: 'Square-ish tiles' },
];

export function IsometricModeSettings({ enabled, onToggle, onSettingsChange }: IsometricModeSettingsProps) {
  const [viewAngle, setViewAngle] = useState<'classic' | 'dimetric' | 'cabinet'>('classic');
  const [gridAlignment, setGridAlignment] = useState(true);
  const [shadowStyle, setShadowStyle] = useState<'soft' | 'hard' | 'none'>('soft');
  const [perspective, setPerspective] = useState<'2:1' | '3:2' | '4:3'>('2:1');

  const handleChange = (newSettings: Partial<IsometricModeSettings>) => {
    const settings: IsometricModeSettings = {
      enabled,
      viewAngle,
      gridAlignment,
      shadowStyle,
      perspective,
      ...newSettings,
    };

    if (newSettings.viewAngle !== undefined) setViewAngle(newSettings.viewAngle);
    if (newSettings.gridAlignment !== undefined) setGridAlignment(newSettings.gridAlignment);
    if (newSettings.shadowStyle !== undefined) setShadowStyle(newSettings.shadowStyle);
    if (newSettings.perspective !== undefined) setPerspective(newSettings.perspective);

    onSettingsChange(settings);
  };

  return (
    <div className="space-y-4 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 bg-indigo-50 dark:bg-indigo-900/20">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Box className="text-indigo-600 dark:text-indigo-400" size={20} />
          <span className="font-semibold text-gray-900 dark:text-white">2.5D Isometric Mode</span>
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
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {enabled && (
        <>
          {/* View Angle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Box className="inline w-4 h-4 mr-1" />
              Projection Angle
            </label>
            <div className="space-y-2">
              {VIEW_ANGLES.map((angle) => (
                <button
                  key={angle.id}
                  onClick={() => handleChange({ viewAngle: angle.id })}
                  className={`w-full px-3 py-2 rounded text-sm font-medium transition text-left ${
                    viewAngle === angle.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{angle.name}</div>
                      <div className="text-xs opacity-75">{angle.description}</div>
                    </div>
                    <div className="text-xs opacity-75">{angle.angle}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Perspective Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tile Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PERSPECTIVES.map((persp) => (
                <button
                  key={persp.id}
                  onClick={() => handleChange({ perspective: persp.id })}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    perspective === persp.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                  }`}
                >
                  <div>{persp.name}</div>
                  <div className="text-xs opacity-75">{persp.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Shadow Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Shadow Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SHADOW_STYLES.map((shadow) => (
                <button
                  key={shadow.id}
                  onClick={() => handleChange({ shadowStyle: shadow.id })}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    shadowStyle === shadow.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                  }`}
                >
                  <div>{shadow.name}</div>
                  <div className="text-xs opacity-75">{shadow.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Grid Alignment */}
          <div className="flex items-center justify-between bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded p-3">
            <div>
              <p className="text-sm font-medium text-indigo-900 dark:text-indigo-300">Grid-Aligned Tiles</p>
              <p className="text-xs text-indigo-700 dark:text-indigo-400">Snap to isometric grid</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={gridAlignment}
                onChange={(e) => handleChange({ gridAlignment: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Info */}
          <div className="bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-700 rounded p-3 text-sm text-indigo-800 dark:text-indigo-300">
            <p className="font-medium mb-1">Isometric Mode Active:</p>
            <ul className="space-y-1 text-xs">
              <li>• Generates sprites in {VIEW_ANGLES.find((a) => a.id === viewAngle)?.name.toLowerCase()} projection</li>
              <li>• {perspective} aspect ratio for {PERSPECTIVES.find((p) => p.id === perspective)?.description}</li>
              <li>• {SHADOW_STYLES.find((s) => s.id === shadowStyle)?.description} lighting</li>
              <li>• Perfect for strategy games, city builders, and tactical RPGs</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
