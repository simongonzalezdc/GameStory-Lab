import { useState } from 'react';
import { Layers } from 'lucide-react';

interface BackgroundLayersSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSettingsChange: (settings: BackgroundLayersSettings) => void;
}

export interface BackgroundLayersSettings {
  enabled: boolean;
  layerCount: number;
  layerTypes: ('sky' | 'far-background' | 'background' | 'midground' | 'foreground')[];
  depthEffect: 'subtle' | 'moderate' | 'dramatic';
  generateAsSet: boolean;
}

const LAYER_PRESETS = [
  {
    count: 3,
    name: '3 Layers',
    layers: ['background', 'midground', 'foreground'] as const,
    description: 'Basic parallax setup',
  },
  {
    count: 4,
    name: '4 Layers',
    layers: ['far-background', 'background', 'midground', 'foreground'] as const,
    description: 'Enhanced depth',
  },
  {
    count: 5,
    name: '5 Layers',
    layers: ['sky', 'far-background', 'background', 'midground', 'foreground'] as const,
    description: 'Full parallax',
  },
];

const DEPTH_EFFECTS = [
  { id: 'subtle' as const, name: 'Subtle', description: 'Minimal depth variation' },
  { id: 'moderate' as const, name: 'Moderate', description: 'Balanced depth' },
  { id: 'dramatic' as const, name: 'Dramatic', description: 'Strong depth effect' },
];

export function BackgroundLayersSettings({ enabled, onToggle, onSettingsChange }: BackgroundLayersSettingsProps) {
  const [layerCount, setLayerCount] = useState<number>(3);
  const [layerTypes, setLayerTypes] = useState<('sky' | 'far-background' | 'background' | 'midground' | 'foreground')[]>([
    'background',
    'midground',
    'foreground',
  ]);
  const [depthEffect, setDepthEffect] = useState<'subtle' | 'moderate' | 'dramatic'>('moderate');
  const [generateAsSet, setGenerateAsSet] = useState(true);

  const handleChange = (newSettings: Partial<BackgroundLayersSettings>) => {
    const settings: BackgroundLayersSettings = {
      enabled,
      layerCount,
      layerTypes,
      depthEffect,
      generateAsSet,
      ...newSettings,
    };

    if (newSettings.layerCount !== undefined) setLayerCount(newSettings.layerCount);
    if (newSettings.layerTypes !== undefined) setLayerTypes(newSettings.layerTypes);
    if (newSettings.depthEffect !== undefined) setDepthEffect(newSettings.depthEffect);
    if (newSettings.generateAsSet !== undefined) setGenerateAsSet(newSettings.generateAsSet);

    onSettingsChange(settings);
  };

  const selectPreset = (preset: typeof LAYER_PRESETS[0]) => {
    handleChange({
      layerCount: preset.count,
      layerTypes: [...preset.layers],
    });
  };

  return (
    <div className="space-y-4 border border-cyan-200 dark:border-cyan-800 rounded-lg p-4 bg-cyan-50 dark:bg-cyan-900/20">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="text-cyan-600 dark:text-cyan-400" size={20} />
          <span className="font-semibold text-gray-900 dark:text-white">Background Layers</span>
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
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-cyan-600"></div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Layer Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Layers className="inline w-4 h-4 mr-1" />
              Layer Count
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LAYER_PRESETS.map((preset) => (
                <button
                  key={preset.count}
                  onClick={() => selectPreset(preset)}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    layerCount === preset.count
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-cyan-400'
                  }`}
                >
                  <div>{preset.name}</div>
                  <div className="text-xs opacity-75">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Layer Types Display */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Layer Structure
            </label>
            <div className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-3 space-y-2">
              {layerTypes.map((layer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                  style={{ opacity: 1 - (index * 0.15) }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {layer.replace('-', ' ')}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {index === 0 ? 'Furthest' : index === layerTypes.length - 1 ? 'Closest' : 'Mid-depth'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Depth Effect */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Depth Effect Intensity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {DEPTH_EFFECTS.map((effect) => (
                <button
                  key={effect.id}
                  onClick={() => handleChange({ depthEffect: effect.id })}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    depthEffect === effect.id
                      ? 'bg-cyan-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-cyan-400'
                  }`}
                >
                  <div>{effect.name}</div>
                  <div className="text-xs opacity-75">{effect.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Generate as Set */}
          <div className="flex items-center justify-between bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-700 rounded p-3">
            <div>
              <p className="text-sm font-medium text-cyan-900 dark:text-cyan-300">Generate as Set</p>
              <p className="text-xs text-cyan-700 dark:text-cyan-400">Create all layers in one generation</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={generateAsSet}
                onChange={(e) => handleChange({ generateAsSet: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          {/* Info */}
          <div className="bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-300 dark:border-cyan-700 rounded p-3 text-sm text-cyan-800 dark:text-cyan-300">
            <p className="font-medium mb-1">Background Layers Active:</p>
            <ul className="space-y-1 text-xs">
              <li>• Generates {layerCount} parallax layers for depth</li>
              <li>• {depthEffect.charAt(0).toUpperCase() + depthEffect.slice(1)} depth variation</li>
              <li>• Each layer optimized for different scroll speeds</li>
              <li>• Perfect for platformers, side-scrollers, and adventure games</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
