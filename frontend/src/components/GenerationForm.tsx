import { useState } from 'react';
import { Loader2, Sparkles, Zap } from 'lucide-react';
import { apiClient } from '../services/api';
import type { GenerationRequest } from '../types/generation';
import type { Asset } from '../types/asset';
import { BatchGenerationModal } from './BatchGenerationModal';
import { ErrorMessage } from './ErrorMessage';
import { PixelArtSettings, type PixelArtSettings as PixelArtSettingsType } from './PixelArtSettings';
import { MultiAngleSettings, type MultiAngleSettings as MultiAngleSettingsType } from './MultiAngleSettings';
import { ColorVariationSettings, type ColorVariationSettings as ColorVariationSettingsType } from './ColorVariationSettings';
import { IsometricModeSettings, type IsometricModeSettings as IsometricModeSettingsType } from './IsometricModeSettings';

interface GenerationFormProps {
  onGenerated?: () => void;
}

export function GenerationForm({ onGenerated }: GenerationFormProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'openrouter' | 'google' | 'chatgpt'>('openrouter');
  const [dimensions, setDimensions] = useState({ width: 64, height: 64 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Pixel Art Mode
  const [pixelArtEnabled, setPixelArtEnabled] = useState(false);
  const [pixelArtSettings, setPixelArtSettings] = useState<PixelArtSettingsType>({
    enabled: false,
    palette: 'nes',
    ditherLevel: 0,
    pixelSize: 32,
  });

  // Multi-Angle Generation
  const [multiAngleEnabled, setMultiAngleEnabled] = useState(false);
  const [multiAngleSettings, setMultiAngleSettings] = useState<MultiAngleSettingsType>({
    enabled: false,
    angleCount: 4,
    includeAngles: ['front', 'back', 'left', 'right'],
    generationType: 'batch',
  });

  // Color Variation Mode
  const [colorVariationEnabled, setColorVariationEnabled] = useState(false);
  const [colorVariationSettings, setColorVariationSettings] = useState<ColorVariationSettingsType>({
    enabled: false,
    variationCount: 3,
    colorSchemes: ['red', 'blue', 'green'],
    baseColor: 'original',
  });

  // Isometric Mode
  const [isometricEnabled, setIsometricEnabled] = useState(false);
  const [isometricSettings, setIsometricSettings] = useState<IsometricModeSettingsType>({
    enabled: false,
    viewAngle: 'classic',
    gridAlignment: true,
    shadowStyle: 'soft',
    perspective: '2:1',
  });

  // Note: Ollama status check infrastructure kept for future text-based features
  // (prompt enhancement, chat assistance, etc.)
  // const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);

  const handleBatchComplete = (assets: Asset[]) => {
    setSuccess(`✓ Generated ${assets.length} assets successfully!`);
    onGenerated?.();
    // Clear after 3 seconds
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Multi-angle generation mode
      if (multiAngleEnabled && multiAngleSettings.includeAngles.length > 0) {
        const angleDescriptions: { [key: string]: string } = {
          front: 'viewed from the front, facing camera',
          back: 'viewed from behind, back facing camera',
          left: 'viewed from the left side, profile view',
          right: 'viewed from the right side, profile view',
          'front-left': 'viewed from the front-left diagonal angle',
          'front-right': 'viewed from the front-right diagonal angle',
          'back-left': 'viewed from the back-left diagonal angle',
          'back-right': 'viewed from the back-right diagonal angle',
        };

        const generatedCount = multiAngleSettings.includeAngles.length;
        let successCount = 0;

        for (const angle of multiAngleSettings.includeAngles) {
          let enhancedPrompt = `${prompt}, ${angleDescriptions[angle]}`;

          // Apply pixel art settings if enabled
          if (pixelArtEnabled) {
            const paletteDescriptions: { [key: string]: string } = {
              nes: 'classic 8-bit NES color palette',
              gameboy: 'monochrome Game Boy green palette',
              snes: 'vibrant SNES 16-bit palette',
              c64: 'retro Commodore 64 palette',
              cga: 'early CGA PC graphics palette',
              pico8: 'fantasy console PICO-8 palette',
            };

            const paletteDesc = paletteDescriptions[pixelArtSettings.palette] || 'retro pixel art palette';
            enhancedPrompt += `, pixel art style, ${paletteDesc}, ${pixelArtSettings.pixelSize}x${pixelArtSettings.pixelSize} resolution, sharp edges, no anti-aliasing, crisp pixels, retro gaming aesthetic`;

            if (pixelArtSettings.ditherLevel > 0) {
              enhancedPrompt += `, ${pixelArtSettings.ditherLevel}% dithering for texture`;
            }
          }

          // Apply isometric mode settings if enabled
          if (isometricEnabled) {
            const viewAngleDesc: { [key: string]: string } = {
              classic: 'isometric projection 30° angle, 2:1 ratio',
              dimetric: 'dimetric projection 26.565° angle',
              cabinet: 'cabinet projection 45° angle',
            };

            const shadowDesc: { [key: string]: string } = {
              soft: 'soft ambient occlusion shadows',
              hard: 'hard cast shadows',
              none: 'flat no-shadow lighting',
            };

            enhancedPrompt += `, ${viewAngleDesc[isometricSettings.viewAngle]}, ${shadowDesc[isometricSettings.shadowStyle]}`;

            if (isometricSettings.gridAlignment) {
              enhancedPrompt += `, grid-aligned tiles, ${isometricSettings.perspective} tile aspect ratio`;
            }
          }

          const request: GenerationRequest = {
            prompt: enhancedPrompt,
            model,
            dimensions,
          };

          try {
            const response = await apiClient.generateAsset(request);
            if (response.success) {
              successCount++;
            }
          } catch (angleErr) {
            console.error(`Failed to generate ${angle} angle:`, angleErr);
          }
        }

        if (successCount > 0) {
          setSuccess(`✓ Generated ${successCount}/${generatedCount} multi-angle sprites successfully!`);
          setPrompt('');
          onGenerated?.();
        } else {
          setError('Failed to generate any multi-angle sprites');
        }
      } else if (colorVariationEnabled && colorVariationSettings.colorSchemes.length > 0) {
        // Color variation generation mode
        const colorSchemeDescriptions: { [key: string]: string } = {
          red: 'red, crimson, scarlet color palette',
          blue: 'blue, azure, cobalt color palette',
          green: 'green, emerald, jade color palette',
          purple: 'purple, violet, amethyst color palette',
          yellow: 'yellow, gold, amber color palette',
          orange: 'orange, tangerine, sunset color palette',
          pink: 'pink, magenta, rose color palette',
          teal: 'teal, cyan, aqua color palette',
          brown: 'brown, tan, earth tone color palette',
          gray: 'gray, silver, monochrome color palette',
          black: 'black, dark, shadow color palette',
          white: 'white, light, bright color palette',
        };

        const baseColorDesc: { [key: string]: string } = {
          original: '',
          neutral: ', neutral base colors',
          vibrant: ', vibrant saturated colors',
          muted: ', muted desaturated colors',
        };

        const generatedCount = colorVariationSettings.colorSchemes.length;
        let successCount = 0;

        for (const colorScheme of colorVariationSettings.colorSchemes) {
          let enhancedPrompt = `${prompt}, ${colorSchemeDescriptions[colorScheme]}${baseColorDesc[colorVariationSettings.baseColor] || ''}`;

          // Apply pixel art settings if enabled
          if (pixelArtEnabled) {
            const paletteDescriptions: { [key: string]: string } = {
              nes: 'classic 8-bit NES color palette',
              gameboy: 'monochrome Game Boy green palette',
              snes: 'vibrant SNES 16-bit palette',
              c64: 'retro Commodore 64 palette',
              cga: 'early CGA PC graphics palette',
              pico8: 'fantasy console PICO-8 palette',
            };

            const paletteDesc = paletteDescriptions[pixelArtSettings.palette] || 'retro pixel art palette';
            enhancedPrompt += `, pixel art style, ${paletteDesc}, ${pixelArtSettings.pixelSize}x${pixelArtSettings.pixelSize} resolution, sharp edges, no anti-aliasing, crisp pixels, retro gaming aesthetic`;

            if (pixelArtSettings.ditherLevel > 0) {
              enhancedPrompt += `, ${pixelArtSettings.ditherLevel}% dithering for texture`;
            }
          }

          // Apply isometric mode settings if enabled
          if (isometricEnabled) {
            const viewAngleDesc: { [key: string]: string } = {
              classic: 'isometric projection 30° angle, 2:1 ratio',
              dimetric: 'dimetric projection 26.565° angle',
              cabinet: 'cabinet projection 45° angle',
            };

            const shadowDesc: { [key: string]: string } = {
              soft: 'soft ambient occlusion shadows',
              hard: 'hard cast shadows',
              none: 'flat no-shadow lighting',
            };

            enhancedPrompt += `, ${viewAngleDesc[isometricSettings.viewAngle]}, ${shadowDesc[isometricSettings.shadowStyle]}`;

            if (isometricSettings.gridAlignment) {
              enhancedPrompt += `, grid-aligned tiles, ${isometricSettings.perspective} tile aspect ratio`;
            }
          }

          const request: GenerationRequest = {
            prompt: enhancedPrompt,
            model,
            dimensions,
          };

          try {
            const response = await apiClient.generateAsset(request);
            if (response.success) {
              successCount++;
            }
          } catch (colorErr) {
            console.error(`Failed to generate ${colorScheme} variation:`, colorErr);
          }
        }

        if (successCount > 0) {
          setSuccess(`✓ Generated ${successCount}/${generatedCount} color variations successfully!`);
          setPrompt('');
          onGenerated?.();
        } else {
          setError('Failed to generate any color variations');
        }
      } else {
        // Single asset generation
        let enhancedPrompt = prompt;
        if (pixelArtEnabled) {
          const paletteDescriptions: { [key: string]: string } = {
            nes: 'classic 8-bit NES color palette',
            gameboy: 'monochrome Game Boy green palette',
            snes: 'vibrant SNES 16-bit palette',
            c64: 'retro Commodore 64 palette',
            cga: 'early CGA PC graphics palette',
            pico8: 'fantasy console PICO-8 palette',
          };

          const paletteDesc = paletteDescriptions[pixelArtSettings.palette] || 'retro pixel art palette';
          enhancedPrompt = `${prompt}, pixel art style, ${paletteDesc}, ${pixelArtSettings.pixelSize}x${pixelArtSettings.pixelSize} resolution, sharp edges, no anti-aliasing, crisp pixels, retro gaming aesthetic`;

          if (pixelArtSettings.ditherLevel > 0) {
            enhancedPrompt += `, ${pixelArtSettings.ditherLevel}% dithering for texture`;
          }
        }

        // Apply isometric mode settings if enabled
        if (isometricEnabled) {
          const viewAngleDesc: { [key: string]: string } = {
            classic: 'isometric projection 30° angle, 2:1 ratio',
            dimetric: 'dimetric projection 26.565° angle',
            cabinet: 'cabinet projection 45° angle',
          };

          const shadowDesc: { [key: string]: string } = {
            soft: 'soft ambient occlusion shadows',
            hard: 'hard cast shadows',
            none: 'flat no-shadow lighting',
          };

          if (pixelArtEnabled) {
            enhancedPrompt += `, ${viewAngleDesc[isometricSettings.viewAngle]}, ${shadowDesc[isometricSettings.shadowStyle]}`;
          } else {
            enhancedPrompt = `${prompt}, ${viewAngleDesc[isometricSettings.viewAngle]}, ${shadowDesc[isometricSettings.shadowStyle]}`;
          }

          if (isometricSettings.gridAlignment) {
            enhancedPrompt += `, grid-aligned tiles, ${isometricSettings.perspective} tile aspect ratio`;
          }
        }

        const request: GenerationRequest = {
          prompt: enhancedPrompt,
          model,
          dimensions,
        };

        const response = await apiClient.generateAsset(request);

        if (response.success) {
          setSuccess(`Asset generated successfully in ${response.generation_time_ms}ms!`);
          setPrompt('');
          onGenerated?.();
        } else {
          setError(response.error || 'Generation failed');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto transition-colors">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
        <Sparkles className="text-purple-500 dark:text-purple-400" />
        Generate Game Asset
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Describe your asset
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., pixel art fantasy sword with blue gems, 32x32, transparent background"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            rows={3}
            required
            minLength={10}
            maxLength={2000}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{prompt.length}/2000 characters</p>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            AI Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="openrouter">OpenRouter (Gemini 2.5 Flash) - Free</option>
            <option value="google">Google (Imagen 3) - Cloud</option>
            <option value="chatgpt">OpenAI (DALL-E 3) - Cloud</option>
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            💡 Tip: OpenRouter model is free with 20 requests/minute limit. Local models (Ollama) coming soon for text features.
          </p>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Width</label>
            <input
              type="number"
              value={dimensions.width}
              onChange={(e) => setDimensions({ ...dimensions, width: parseInt(e.target.value) })}
              min={16}
              max={2048}
              disabled={pixelArtEnabled}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Height</label>
            <input
              type="number"
              value={dimensions.height}
              onChange={(e) => setDimensions({ ...dimensions, height: parseInt(e.target.value) })}
              min={16}
              max={2048}
              disabled={pixelArtEnabled}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
            />
          </div>
        </div>

        {/* Pixel Art Settings */}
        <PixelArtSettings
          enabled={pixelArtEnabled}
          onToggle={(enabled) => {
            setPixelArtEnabled(enabled);
            if (enabled) {
              setDimensions({ width: pixelArtSettings.pixelSize, height: pixelArtSettings.pixelSize });
            }
          }}
          onSettingsChange={(settings) => {
            setPixelArtSettings(settings);
            if (settings.enabled) {
              setDimensions({ width: settings.pixelSize, height: settings.pixelSize });
            }
          }}
        />

        {/* Multi-Angle Settings */}
        <MultiAngleSettings
          enabled={multiAngleEnabled}
          onToggle={(enabled) => {
            setMultiAngleEnabled(enabled);
          }}
          onSettingsChange={(settings) => {
            setMultiAngleSettings(settings);
          }}
        />

        {/* Color Variation Settings */}
        <ColorVariationSettings
          enabled={colorVariationEnabled}
          onToggle={(enabled) => {
            setColorVariationEnabled(enabled);
          }}
          onSettingsChange={(settings) => {
            setColorVariationSettings(settings);
          }}
        />

        {/* Isometric Mode Settings */}
        <IsometricModeSettings
          enabled={isometricEnabled}
          onToggle={(enabled) => {
            setIsometricEnabled(enabled);
          }}
          onSettingsChange={(settings) => {
            setIsometricSettings(settings);
          }}
        />

        {/* Error/Success Messages */}
        {error && <ErrorMessage error={error} onRetry={handleRetry} />}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-300 rounded-lg p-3">
            {success}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate Asset
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            disabled={loading || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
            title="Generate multiple variations"
          >
            <Zap size={20} />
            Batch
          </button>
        </div>
      </form>

      {/* Batch Generation Modal */}
      {showBatchModal && (
        <BatchGenerationModal
          basePrompt={prompt}
          onClose={() => setShowBatchModal(false)}
          onComplete={handleBatchComplete}
        />
      )}
    </div>
  );
}
