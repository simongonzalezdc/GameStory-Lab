import { useState } from 'react';
import { Compass, Navigation } from 'lucide-react';

interface MultiAngleSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSettingsChange: (settings: MultiAngleSettings) => void;
}

export interface MultiAngleSettings {
  enabled: boolean;
  angleCount: 4 | 8;
  includeAngles: string[];
  generationType: 'sequential' | 'batch';
}

const ANGLE_PRESETS = [
  {
    count: 4 as const,
    name: '4 Directions',
    angles: ['front', 'back', 'left', 'right'],
    description: 'Basic cardinal directions',
  },
  {
    count: 8 as const,
    name: '8 Directions',
    angles: ['front', 'back', 'left', 'right', 'front-left', 'front-right', 'back-left', 'back-right'],
    description: 'Full 8-way movement',
  },
];

const ANGLE_LABELS: { [key: string]: string } = {
  front: '↓ Front',
  back: '↑ Back',
  left: '← Left',
  right: '→ Right',
  'front-left': '↙ Front-Left',
  'front-right': '↘ Front-Right',
  'back-left': '↖ Back-Left',
  'back-right': '↗ Back-Right',
};

export function MultiAngleSettings({ enabled, onToggle, onSettingsChange }: MultiAngleSettingsProps) {
  const [angleCount, setAngleCount] = useState<4 | 8>(4);
  const [includeAngles, setIncludeAngles] = useState<string[]>(['front', 'back', 'left', 'right']);
  const [generationType, setGenerationType] = useState<'sequential' | 'batch'>('batch');

  const currentPreset = ANGLE_PRESETS.find((p) => p.count === angleCount)!;

  const handleChange = (newSettings: Partial<MultiAngleSettings>) => {
    const settings: MultiAngleSettings = {
      enabled,
      angleCount,
      includeAngles,
      generationType,
      ...newSettings,
    };

    if (newSettings.angleCount !== undefined) {
      setAngleCount(newSettings.angleCount);
      // Auto-select all angles when changing count
      const preset = ANGLE_PRESETS.find((p) => p.count === newSettings.angleCount)!;
      setIncludeAngles(preset.angles);
      settings.includeAngles = preset.angles;
    }
    if (newSettings.includeAngles !== undefined) setIncludeAngles(newSettings.includeAngles);
    if (newSettings.generationType !== undefined) setGenerationType(newSettings.generationType);

    onSettingsChange(settings);
  };

  const toggleAngle = (angle: string) => {
    const newAngles = includeAngles.includes(angle)
      ? includeAngles.filter((a) => a !== angle)
      : [...includeAngles, angle];

    // Prevent deselecting all angles
    if (newAngles.length > 0) {
      handleChange({ includeAngles: newAngles });
    }
  };

  return (
    <div className="space-y-4 border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Compass className="text-blue-600 dark:text-blue-400" size={20} />
          <span className="font-semibold text-gray-900 dark:text-white">Multi-Angle Generation</span>
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
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Direction Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Navigation className="inline w-4 h-4 mr-1" />
              Direction Count
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ANGLE_PRESETS.map((preset) => (
                <button
                  key={preset.count}
                  onClick={() => handleChange({ angleCount: preset.count })}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    angleCount === preset.count
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                  }`}
                >
                  <div>{preset.name}</div>
                  <div className="text-xs opacity-75">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Angle Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Angles ({includeAngles.length}/{currentPreset.angles.length})
            </label>
            <div className="grid grid-cols-2 gap-2">
              {currentPreset.angles.map((angle) => {
                const isSelected = includeAngles.includes(angle);
                return (
                  <button
                    key={angle}
                    onClick={() => toggleAngle(angle)}
                    className={`px-3 py-2 rounded text-sm font-medium transition ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }`}
                  >
                    {ANGLE_LABELS[angle]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Generation Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleChange({ generationType: 'batch' })}
                className={`px-3 py-2 rounded text-sm font-medium transition ${
                  generationType === 'batch'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <div>Batch (Faster)</div>
                <div className="text-xs opacity-75">All at once</div>
              </button>
              <button
                onClick={() => handleChange({ generationType: 'sequential' })}
                className={`px-3 py-2 rounded text-sm font-medium transition ${
                  generationType === 'sequential'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-400'
                }`}
              >
                <div>Sequential</div>
                <div className="text-xs opacity-75">One by one</div>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded p-3 text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Multi-Angle Mode Active:</p>
            <ul className="space-y-1 text-xs">
              <li>• Generates {includeAngles.length} directional views of your sprite</li>
              <li>• Perfect for top-down RPG characters and objects</li>
              <li>• Each angle is saved as a separate asset</li>
              <li>• {generationType === 'batch' ? 'Batch mode generates all angles simultaneously' : 'Sequential mode generates angles one at a time'}</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
