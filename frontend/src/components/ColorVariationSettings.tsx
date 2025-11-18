import { useState } from 'react';
import { Palette, Sparkles } from 'lucide-react';

interface ColorVariationSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSettingsChange: (settings: ColorVariationSettings) => void;
}

export interface ColorVariationSettings {
  enabled: boolean;
  variationCount: number;
  colorSchemes: string[];
  baseColor: string;
}

const COLOR_SCHEMES = [
  { id: 'red', name: 'Red Variant', colors: 'red, crimson, scarlet tones' },
  { id: 'blue', name: 'Blue Variant', colors: 'blue, azure, cobalt tones' },
  { id: 'green', name: 'Green Variant', colors: 'green, emerald, jade tones' },
  { id: 'purple', name: 'Purple Variant', colors: 'purple, violet, amethyst tones' },
  { id: 'yellow', name: 'Yellow Variant', colors: 'yellow, gold, amber tones' },
  { id: 'orange', name: 'Orange Variant', colors: 'orange, tangerine, sunset tones' },
  { id: 'pink', name: 'Pink Variant', colors: 'pink, magenta, rose tones' },
  { id: 'teal', name: 'Teal Variant', colors: 'teal, cyan, aqua tones' },
  { id: 'brown', name: 'Brown Variant', colors: 'brown, tan, earth tones' },
  { id: 'gray', name: 'Gray Variant', colors: 'gray, silver, monochrome tones' },
  { id: 'black', name: 'Dark Variant', colors: 'black, dark, shadow tones' },
  { id: 'white', name: 'Light Variant', colors: 'white, light, bright tones' },
];

const BASE_COLORS = [
  { id: 'original', name: 'Original Colors', description: 'Keep base color scheme' },
  { id: 'neutral', name: 'Neutral Base', description: 'Start with neutral palette' },
  { id: 'vibrant', name: 'Vibrant Base', description: 'Enhance color saturation' },
  { id: 'muted', name: 'Muted Base', description: 'Reduce color saturation' },
];

export function ColorVariationSettings({ enabled, onToggle, onSettingsChange }: ColorVariationSettingsProps) {
  const [variationCount, setVariationCount] = useState(3);
  const [colorSchemes, setColorSchemes] = useState<string[]>(['red', 'blue', 'green']);
  const [baseColor, setBaseColor] = useState('original');

  const handleChange = (newSettings: Partial<ColorVariationSettings>) => {
    const settings: ColorVariationSettings = {
      enabled,
      variationCount,
      colorSchemes,
      baseColor,
      ...newSettings,
    };

    if (newSettings.variationCount !== undefined) setVariationCount(newSettings.variationCount);
    if (newSettings.colorSchemes !== undefined) setColorSchemes(newSettings.colorSchemes);
    if (newSettings.baseColor !== undefined) setBaseColor(newSettings.baseColor);

    onSettingsChange(settings);
  };

  const toggleColorScheme = (schemeId: string) => {
    const newSchemes = colorSchemes.includes(schemeId)
      ? colorSchemes.filter((s) => s !== schemeId)
      : [...colorSchemes, schemeId];

    // Prevent deselecting all schemes
    if (newSchemes.length > 0 && newSchemes.length <= 12) {
      handleChange({
        colorSchemes: newSchemes,
        variationCount: newSchemes.length,
      });
    }
  };

  return (
    <div className="space-y-4 border border-orange-200 dark:border-orange-800 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/20">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="text-orange-600 dark:text-orange-400" size={20} />
          <span className="font-semibold text-gray-900 dark:text-white">Color Variation Mode</span>
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
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Base Color Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Sparkles className="inline w-4 h-4 mr-1" />
              Base Color Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BASE_COLORS.map((base) => (
                <button
                  key={base.id}
                  onClick={() => handleChange({ baseColor: base.id })}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    baseColor === base.id
                      ? 'bg-orange-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-orange-400'
                  }`}
                >
                  <div>{base.name}</div>
                  <div className="text-xs opacity-75">{base.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Scheme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Color Variations ({colorSchemes.length} selected)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              {COLOR_SCHEMES.map((scheme) => {
                const isSelected = colorSchemes.includes(scheme.id);
                return (
                  <button
                    key={scheme.id}
                    onClick={() => toggleColorScheme(scheme.id)}
                    className={`px-3 py-2 rounded text-sm font-medium transition ${
                      isSelected
                        ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-orange-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getColorClass(scheme.id)}`}></div>
                      <span>{scheme.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variation Count Display */}
          <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded p-3">
            <p className="text-sm font-medium text-orange-900 dark:text-orange-300">
              Will generate {colorSchemes.length} color variation{colorSchemes.length !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-1">
              Selected: {colorSchemes.map((id) => COLOR_SCHEMES.find((s) => s.id === id)?.name).join(', ')}
            </p>
          </div>

          {/* Info */}
          <div className="bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded p-3 text-sm text-orange-800 dark:text-orange-300">
            <p className="font-medium mb-1">Color Variation Mode Active:</p>
            <ul className="space-y-1 text-xs">
              <li>• Creates {colorSchemes.length} versions with different color palettes</li>
              <li>• Perfect for enemy variations, character customization, or sprite families</li>
              <li>• Each variation maintains the same pose and style</li>
              <li>• Works great with Pixel Art Mode for retro color swaps</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

// Helper function to get Tailwind color class for color dot
function getColorClass(colorId: string): string {
  const colorMap: { [key: string]: string } = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    pink: 'bg-pink-500',
    teal: 'bg-teal-500',
    brown: 'bg-amber-700',
    gray: 'bg-gray-500',
    black: 'bg-gray-900',
    white: 'bg-gray-100 border border-gray-300',
  };
  return colorMap[colorId] || 'bg-gray-400';
}
