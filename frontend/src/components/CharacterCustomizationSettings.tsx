import { useState } from 'react';
import { User } from 'lucide-react';

interface CharacterCustomizationSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSettingsChange: (settings: CharacterCustomizationSettings) => void;
}

export interface CharacterCustomizationSettings {
  enabled: boolean;
  equipmentSlots: ('helmet' | 'chest' | 'legs' | 'weapon' | 'shield' | 'cape' | 'boots' | 'gloves')[];
  variationsPerSlot: number;
  maintainConsistency: boolean;
  generateBase: boolean;
}

const EQUIPMENT_SLOTS = [
  { id: 'helmet' as const, name: 'Helmet', description: 'Head armor variations' },
  { id: 'chest' as const, name: 'Chest Armor', description: 'Body armor variations' },
  { id: 'legs' as const, name: 'Leg Armor', description: 'Leg armor variations' },
  { id: 'weapon' as const, name: 'Weapon', description: 'Different weapons' },
  { id: 'shield' as const, name: 'Shield', description: 'Shield variations' },
  { id: 'cape' as const, name: 'Cape', description: 'Back accessories' },
  { id: 'boots' as const, name: 'Boots', description: 'Footwear variations' },
  { id: 'gloves' as const, name: 'Gloves', description: 'Hand armor variations' },
];

const EQUIPMENT_PRESETS = [
  {
    name: 'Basic Set',
    slots: ['helmet', 'chest', 'weapon'] as const,
    description: '3 core equipment pieces',
  },
  {
    name: 'Armor Set',
    slots: ['helmet', 'chest', 'legs', 'boots', 'gloves'] as const,
    description: 'Complete armor setup',
  },
  {
    name: 'Full Equipment',
    slots: ['helmet', 'chest', 'legs', 'weapon', 'shield', 'cape', 'boots', 'gloves'] as const,
    description: 'All equipment slots',
  },
];

export function CharacterCustomizationSettings({ enabled, onToggle, onSettingsChange }: CharacterCustomizationSettingsProps) {
  const [equipmentSlots, setEquipmentSlots] = useState<('helmet' | 'chest' | 'legs' | 'weapon' | 'shield' | 'cape' | 'boots' | 'gloves')[]>([
    'helmet',
    'chest',
    'weapon',
  ]);
  const [variationsPerSlot, setVariationsPerSlot] = useState<number>(3);
  const [maintainConsistency, setMaintainConsistency] = useState(true);
  const [generateBase, setGenerateBase] = useState(true);

  const handleChange = (newSettings: Partial<CharacterCustomizationSettings>) => {
    const settings: CharacterCustomizationSettings = {
      enabled,
      equipmentSlots,
      variationsPerSlot,
      maintainConsistency,
      generateBase,
      ...newSettings,
    };

    if (newSettings.equipmentSlots !== undefined) setEquipmentSlots(newSettings.equipmentSlots);
    if (newSettings.variationsPerSlot !== undefined) setVariationsPerSlot(newSettings.variationsPerSlot);
    if (newSettings.maintainConsistency !== undefined) setMaintainConsistency(newSettings.maintainConsistency);
    if (newSettings.generateBase !== undefined) setGenerateBase(newSettings.generateBase);

    onSettingsChange(settings);
  };

  const toggleEquipmentSlot = (slot: typeof EQUIPMENT_SLOTS[0]['id']) => {
    const newSlots = equipmentSlots.includes(slot)
      ? equipmentSlots.filter(s => s !== slot)
      : [...equipmentSlots, slot];
    handleChange({ equipmentSlots: newSlots });
  };

  const selectPreset = (preset: typeof EQUIPMENT_PRESETS[0]) => {
    handleChange({ equipmentSlots: [...preset.slots] });
  };

  const getTotalGenerations = () => {
    const baseCount = generateBase ? 1 : 0;
    const equipmentCount = equipmentSlots.length * variationsPerSlot;
    return baseCount + equipmentCount;
  };

  return (
    <div className="space-y-4 border border-amber-200 dark:border-amber-800 rounded-lg p-4 bg-amber-50 dark:bg-amber-900/20">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="text-amber-600 dark:text-amber-400" size={20} />
          <span className="font-semibold text-gray-900 dark:text-white">Character Customization</span>
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
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Equipment Presets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Quick Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EQUIPMENT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => selectPreset(preset)}
                  className="px-2 py-2 rounded text-xs font-medium transition bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-amber-400"
                >
                  <div className="font-semibold">{preset.name}</div>
                  <div className="opacity-75">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Equipment Slots Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <User className="inline w-4 h-4 mr-1" />
              Equipment Slots ({equipmentSlots.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EQUIPMENT_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => toggleEquipmentSlot(slot.id)}
                  className={`px-3 py-2 rounded text-sm font-medium transition text-left ${
                    equipmentSlots.includes(slot.id)
                      ? 'bg-amber-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-amber-400'
                  }`}
                >
                  <div className="font-semibold">{slot.name}</div>
                  <div className="text-xs opacity-75">{slot.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Variations Per Slot */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Variations Per Slot: {variationsPerSlot}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={variationsPerSlot}
              onChange={(e) => handleChange({ variationsPerSlot: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-amber-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1 variation</span>
              <span>5 variations</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded p-3">
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Generate Base Character</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">Create unequipped version first</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateBase}
                  onChange={(e) => handleChange({ generateBase: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded p-3">
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-300">Maintain Consistency</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">Keep base character appearance uniform</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={maintainConsistency}
                  onChange={(e) => handleChange({ maintainConsistency: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          {/* Generation Summary */}
          <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded p-3 text-sm text-amber-800 dark:text-amber-300">
            <p className="font-medium mb-1">Character Customization Active:</p>
            <ul className="space-y-1 text-xs">
              <li>• Will generate {getTotalGenerations()} total variations</li>
              <li>• {equipmentSlots.length} equipment slots × {variationsPerSlot} variations each</li>
              {generateBase && <li>• Includes 1 base unequipped character</li>}
              {maintainConsistency && <li>• Character appearance will stay consistent across all variations</li>}
              <li>• Perfect for RPGs, character creators, and customization systems</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
