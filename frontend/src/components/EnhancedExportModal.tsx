import { useState, useEffect } from 'react';
import { X, Download, Save, Folder, Eye, FileImage } from 'lucide-react';
import type { Asset } from '../types/asset';

interface ExportPreset {
  id: string;
  name: string;
  format: string;
  targetEngine: string;
  resolutionMultiplier: number;
  trimTransparency: boolean;
  padding: number;
  sheetSize: number;
}

interface EnhancedExportModalProps {
  selectedAssets: Asset[];
  onClose: () => void;
  onExport: (settings: ExportSettings) => Promise<void>;
}

export interface ExportSettings {
  format: string;
  targetEngine: string;
  resolutionMultiplier: number;
  trimTransparency: boolean;
  padding: number;
  sheetSize: number;
}

const FORMATS = [
  { id: 'sprite-sheet-json', name: 'Sprite Sheet (JSON)', description: 'TexturePacker format with JSON descriptor' },
  { id: 'sprite-sheet-xml', name: 'Sprite Sheet (XML)', description: 'Cocos2d format with XML descriptor' },
  { id: 'individual-png', name: 'Individual PNGs', description: 'Separate PNG files in ZIP' },
  { id: 'unity-sprite-sheet', name: 'Unity Sprite Sheet', description: 'Unity-compatible import format' },
  { id: 'godot-atlas', name: 'Godot Atlas', description: 'Godot AtlasTexture format' },
  { id: 'phaser-atlas', name: 'Phaser Atlas', description: 'Phaser 3 texture atlas' },
  { id: 'aseprite-json', name: 'Aseprite JSON', description: 'Aseprite-compatible sprite sheet' },
];

const ENGINES = [
  { id: 'generic', name: 'Generic' },
  { id: 'unity', name: 'Unity' },
  { id: 'godot', name: 'Godot' },
  { id: 'unreal', name: 'Unreal Engine' },
  { id: 'phaser', name: 'Phaser' },
  { id: 'aseprite', name: 'Aseprite' },
];

const SHEET_SIZES = [512, 1024, 2048, 4096];
const RESOLUTION_MULTIPLIERS = [1, 2, 3, 4];
const PADDING_OPTIONS = [0, 1, 2, 4, 8, 16];

export function EnhancedExportModal({ selectedAssets, onClose, onExport }: EnhancedExportModalProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'sprite-sheet-json',
    targetEngine: 'generic',
    resolutionMultiplier: 1,
    trimTransparency: true,
    padding: 2,
    sheetSize: 2048,
  });

  const [presets, setPresets] = useState<ExportPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('export-presets');
    if (savedPresets) {
      setPresets(JSON.parse(savedPresets));
    }
  }, []);

  const handleSettingChange = (key: keyof ExportSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSelectedPreset(''); // Clear preset selection when manually changing settings
  };

  const handlePresetSelect = (presetId: string) => {
    if (!presetId) {
      setSelectedPreset('');
      return;
    }

    const preset = presets.find((p) => p.id === presetId);
    if (preset) {
      setSettings({
        format: preset.format,
        targetEngine: preset.targetEngine,
        resolutionMultiplier: preset.resolutionMultiplier,
        trimTransparency: preset.trimTransparency,
        padding: preset.padding,
        sheetSize: preset.sheetSize,
      });
      setSelectedPreset(presetId);
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const newPreset: ExportPreset = {
      id: Date.now().toString(),
      name: presetName,
      ...settings,
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    localStorage.setItem('export-presets', JSON.stringify(updatedPresets));
    setSelectedPreset(newPreset.id);
    setShowSavePreset(false);
    setPresetName('');
  };

  const handleDeletePreset = (presetId: string) => {
    if (!confirm('Delete this preset?')) return;

    const updatedPresets = presets.filter((p) => p.id !== presetId);
    setPresets(updatedPresets);
    localStorage.setItem('export-presets', JSON.stringify(updatedPresets));
    if (selectedPreset === presetId) {
      setSelectedPreset('');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport(settings);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const selectedFormat = FORMATS.find((f) => f.id === settings.format);
  const totalAssets = selectedAssets.length;

  // Calculate estimated sprite sheet dimensions
  const estimatedWidth = Math.ceil(Math.sqrt(totalAssets)) * 64 * settings.resolutionMultiplier;
  const estimatedHeight = Math.ceil(totalAssets / Math.ceil(Math.sqrt(totalAssets))) * 64 * settings.resolutionMultiplier;
  const fitsInSheet = estimatedWidth <= settings.sheetSize && estimatedHeight <= settings.sheetSize;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export Assets</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{totalAssets} asset{totalAssets !== 1 ? 's' : ''} selected</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={exporting}
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 transition-colors">
          {/* Presets Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                <Folder className="inline w-4 h-4 mr-2" />
                Export Presets
              </label>
              <button
                onClick={() => setShowSavePreset(!showSavePreset)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                <Save className="inline w-4 h-4 mr-1" />
                Save Current as Preset
              </button>
            </div>

            {showSavePreset && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Preset name (e.g., Unity 2x)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={handleSavePreset}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSavePreset(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}

            <select
              value={selectedPreset}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">-- Custom Settings --</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.format}, {preset.resolutionMultiplier}x, {preset.targetEngine})
                </option>
              ))}
            </select>

            {selectedPreset && (
              <button
                onClick={() => handleDeletePreset(selectedPreset)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Delete Selected Preset
              </button>
            )}
          </div>

          {/* Format Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              <FileImage className="inline w-4 h-4 mr-2" />
              Export Format
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => handleSettingChange('format', format.id)}
                  className={`text-left p-3 border-2 rounded-lg transition-all ${
                    settings.format === format.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{format.name}</div>
                  <div className="text-sm text-gray-500 mt-1">{format.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Engine */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Target Game Engine</label>
            <select
              value={settings.targetEngine}
              onChange={(e) => handleSettingChange('targetEngine', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {ENGINES.map((engine) => (
                <option key={engine.id} value={engine.id}>
                  {engine.name}
                </option>
              ))}
            </select>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Resolution Multiplier */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Resolution Multiplier
                <span className="text-gray-500 ml-2">({settings.resolutionMultiplier}x)</span>
              </label>
              <select
                value={settings.resolutionMultiplier}
                onChange={(e) => handleSettingChange('resolutionMultiplier', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {RESOLUTION_MULTIPLIERS.map((mult) => (
                  <option key={mult} value={mult}>
                    {mult}x ({mult === 1 ? 'Standard' : `@${mult}x for Retina`})
                  </option>
                ))}
              </select>
            </div>

            {/* Sheet Size */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Sprite Sheet Size
              </label>
              <select
                value={settings.sheetSize}
                onChange={(e) => handleSettingChange('sheetSize', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {SHEET_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}x{size}px
                  </option>
                ))}
              </select>
            </div>

            {/* Padding */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Sprite Padding
                <span className="text-gray-500 ml-2">({settings.padding}px)</span>
              </label>
              <select
                value={settings.padding}
                onChange={(e) => handleSettingChange('padding', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {PADDING_OPTIONS.map((padding) => (
                  <option key={padding} value={padding}>
                    {padding}px{padding === 0 ? ' (No padding)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Trim Transparency */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.trimTransparency}
                  onChange={(e) => handleSettingChange('trimTransparency', e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700">Trim Transparency</span>
              </label>
              <p className="text-xs text-gray-500">Remove empty space around sprites</p>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-medium text-gray-900">Export Summary</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Format: <span className="font-medium">{selectedFormat?.name}</span></p>
              <p>• Assets: <span className="font-medium">{totalAssets}</span></p>
              <p>• Estimated sheet size: <span className="font-medium">{estimatedWidth}x{estimatedHeight}px</span></p>
              <p className={fitsInSheet ? 'text-green-600' : 'text-red-600'}>
                • {fitsInSheet ? '✓ Fits in selected sheet size' : '⚠️ May not fit - increase sheet size'}
              </p>
              <p>• Resolution: <span className="font-medium">{settings.resolutionMultiplier}x</span></p>
              <p>• Padding: <span className="font-medium">{settings.padding}px</span></p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            disabled={exporting}
          >
            <Eye className="inline w-4 h-4 mr-2" />
            {showPreview ? 'Hide' : 'Show'} Preview
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={exporting}
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || !fitsInSheet}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export {totalAssets} Asset{totalAssets !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
