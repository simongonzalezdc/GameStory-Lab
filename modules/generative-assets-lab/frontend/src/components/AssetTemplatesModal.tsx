import { useState } from 'react';
import { X, Sparkles, Search } from 'lucide-react';

interface AssetTemplate {
  id: string;
  name: string;
  prompt: string;
  category: string;
  tags: string[];
  recommendedSettings?: {
    pixelArt?: boolean;
    isometric?: boolean;
    dimensions?: { width: number; height: number };
  };
}

interface AssetTemplatesModalProps {
  onClose: () => void;
  onSelectTemplate: (template: AssetTemplate) => void;
}

const ASSET_TEMPLATES: AssetTemplate[] = [
  // Characters
  { id: 'knight', name: 'Fantasy Knight', prompt: 'fantasy knight character, full armor, sword and shield, heroic pose, game sprite', category: 'Characters', tags: ['fantasy', 'warrior', 'medieval'] },
  { id: 'mage', name: 'Wizard/Mage', prompt: 'wizard character with staff, flowing robes, magical aura, fantasy game sprite', category: 'Characters', tags: ['fantasy', 'magic', 'medieval'] },
  { id: 'archer', name: 'Archer', prompt: 'archer character with bow, leather armor, quiver of arrows, game sprite', category: 'Characters', tags: ['fantasy', 'ranged', 'medieval'] },
  { id: 'rogue', name: 'Rogue/Thief', prompt: 'rogue character, dark cloak, daggers, sneaky pose, game sprite', category: 'Characters', tags: ['fantasy', 'stealth', 'medieval'] },
  { id: 'villager', name: 'Village NPC', prompt: 'friendly village npc, casual medieval clothing, warm expression, game sprite', category: 'Characters', tags: ['fantasy', 'npc', 'medieval'] },

  // Enemies
  { id: 'goblin', name: 'Goblin', prompt: 'goblin enemy, green skin, crude weapon, menacing expression, game sprite', category: 'Enemies', tags: ['fantasy', 'monster', 'hostile'] },
  { id: 'skeleton', name: 'Skeleton Warrior', prompt: 'skeleton warrior, bones, rusty sword and shield, undead enemy sprite', category: 'Enemies', tags: ['fantasy', 'undead', 'hostile'] },
  { id: 'slime', name: 'Slime Monster', prompt: 'slime creature, gelatinous body, cute and bouncy, enemy sprite', category: 'Enemies', tags: ['fantasy', 'monster', 'basic'] },
  { id: 'dragon', name: 'Dragon', prompt: 'fierce dragon, scales, wings, breathing fire, boss enemy sprite', category: 'Enemies', tags: ['fantasy', 'boss', 'flying'] },
  { id: 'zombie', name: 'Zombie', prompt: 'zombie enemy, decaying flesh, slow movement, horror game sprite', category: 'Enemies', tags: ['horror', 'undead', 'hostile'] },

  // Weapons
  { id: 'sword', name: 'Iron Sword', prompt: 'iron sword weapon, sharp blade, leather-wrapped handle, game item sprite', category: 'Weapons', tags: ['weapon', 'melee', 'medieval'], recommendedSettings: { dimensions: { width: 32, height: 32 } } },
  { id: 'bow', name: 'Wooden Bow', prompt: 'wooden bow weapon, curved wood, bowstring, game item sprite', category: 'Weapons', tags: ['weapon', 'ranged', 'medieval'], recommendedSettings: { dimensions: { width: 32, height: 32 } } },
  { id: 'staff', name: 'Magic Staff', prompt: 'magical staff, glowing crystal orb on top, carved wood, game item sprite', category: 'Weapons', tags: ['weapon', 'magic', 'medieval'], recommendedSettings: { dimensions: { width: 32, height: 32 } } },
  { id: 'axe', name: 'Battle Axe', prompt: 'battle axe weapon, heavy blade, wooden handle, game item sprite', category: 'Weapons', tags: ['weapon', 'melee', 'medieval'], recommendedSettings: { dimensions: { width: 32, height: 32 } } },

  // Items & Pickups
  { id: 'potion-health', name: 'Health Potion', prompt: 'health potion, red liquid in glass bottle, cork stopper, game item sprite', category: 'Items', tags: ['consumable', 'healing', 'fantasy'], recommendedSettings: { dimensions: { width: 16, height: 16 } } },
  { id: 'potion-mana', name: 'Mana Potion', prompt: 'mana potion, blue liquid in glass bottle, glowing, game item sprite', category: 'Items', tags: ['consumable', 'magic', 'fantasy'], recommendedSettings: { dimensions: { width: 16, height: 16 } } },
  { id: 'coin', name: 'Gold Coin', prompt: 'gold coin, shiny metal, embossed design, game currency sprite', category: 'Items', tags: ['currency', 'collectible'], recommendedSettings: { dimensions: { width: 16, height: 16 } } },
  { id: 'gem', name: 'Gemstone', prompt: 'precious gemstone, faceted crystal, sparkles, game collectible sprite', category: 'Items', tags: ['currency', 'collectible', 'valuable'], recommendedSettings: { dimensions: { width: 16, height: 16 } } },
  { id: 'key', name: 'Old Key', prompt: 'antique key, brass metal, ornate handle, game item sprite', category: 'Items', tags: ['key-item', 'puzzle'], recommendedSettings: { dimensions: { width: 16, height: 16 } } },
  { id: 'chest', name: 'Treasure Chest', prompt: 'wooden treasure chest, iron bindings, closed, game object sprite', category: 'Items', tags: ['container', 'treasure'], recommendedSettings: { dimensions: { width: 32, height: 32 } } },

  // Tiles & Terrain
  { id: 'grass', name: 'Grass Tile', prompt: 'grass ground tile, green blades, detailed texture, tileable seamless', category: 'Tiles', tags: ['terrain', 'nature', 'ground'], recommendedSettings: { pixelArt: true, dimensions: { width: 32, height: 32 } } },
  { id: 'dirt', name: 'Dirt Path', prompt: 'dirt path tile, brown earth, small rocks, tileable seamless', category: 'Tiles', tags: ['terrain', 'ground', 'path'], recommendedSettings: { pixelArt: true, dimensions: { width: 32, height: 32 } } },
  { id: 'stone', name: 'Stone Floor', prompt: 'stone floor tile, gray cobblestone, medieval dungeon, tileable seamless', category: 'Tiles', tags: ['terrain', 'dungeon', 'stone'], recommendedSettings: { pixelArt: true, dimensions: { width: 32, height: 32 } } },
  { id: 'water', name: 'Water', prompt: 'water tile, blue ripples, animated surface, tileable seamless', category: 'Tiles', tags: ['terrain', 'water', 'animated'], recommendedSettings: { pixelArt: true, dimensions: { width: 32, height: 32 } } },
  { id: 'lava', name: 'Lava', prompt: 'lava tile, molten rock, glowing orange-red, animated, tileable seamless', category: 'Tiles', tags: ['terrain', 'hazard', 'animated'], recommendedSettings: { pixelArt: true, dimensions: { width: 32, height: 32 } } },

  // Buildings & Structures
  { id: 'house', name: 'Village House', prompt: 'small village house, thatched roof, wooden walls, isometric view', category: 'Buildings', tags: ['building', 'medieval', 'residential'], recommendedSettings: { isometric: true, dimensions: { width: 64, height: 64 } } },
  { id: 'tower', name: 'Watch Tower', prompt: 'stone watch tower, crenellations, flag on top, isometric view', category: 'Buildings', tags: ['building', 'medieval', 'defense'], recommendedSettings: { isometric: true, dimensions: { width: 64, height: 64 } } },
  { id: 'tree', name: 'Fantasy Tree', prompt: 'fantasy tree, lush green foliage, thick trunk, game environment sprite', category: 'Buildings', tags: ['nature', 'decoration', 'environment'], recommendedSettings: { dimensions: { width: 48, height: 64 } } },
  { id: 'rock', name: 'Large Rock', prompt: 'large rock formation, gray stone, moss patches, game environment sprite', category: 'Buildings', tags: ['nature', 'obstacle', 'environment'], recommendedSettings: { dimensions: { width: 32, height: 32 } } },

  // UI Elements
  { id: 'button', name: 'Game Button', prompt: 'game UI button, wooden frame, medieval style, normal state', category: 'UI', tags: ['ui', 'button', 'interface'], recommendedSettings: { dimensions: { width: 128, height: 48 } } },
  { id: 'health-bar', name: 'Health Bar', prompt: 'health bar UI element, red fill, gray border, game interface', category: 'UI', tags: ['ui', 'hud', 'health'], recommendedSettings: { dimensions: { width: 100, height: 16 } } },
  { id: 'icon-heart', name: 'Heart Icon', prompt: 'heart icon, red pixelated heart, health indicator, UI sprite', category: 'UI', tags: ['ui', 'icon', 'health'], recommendedSettings: { pixelArt: true, dimensions: { width: 16, height: 16 } } },
  { id: 'icon-star', name: 'Star Icon', prompt: 'star icon, golden shining star, collectible indicator, UI sprite', category: 'UI', tags: ['ui', 'icon', 'collectible'], recommendedSettings: { pixelArt: true, dimensions: { width: 16, height: 16 } } },
];

const CATEGORIES = ['All', 'Characters', 'Enemies', 'Weapons', 'Items', 'Tiles', 'Buildings', 'UI'];

export function AssetTemplatesModal({ onClose, onSelectTemplate }: AssetTemplatesModalProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = ASSET_TEMPLATES.filter((template) => {
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="text-purple-600 dark:text-purple-400" size={28} />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Asset Templates</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl leading-none"
            >
              <X size={24} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <div className="flex gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template);
                  onClose();
                }}
                className="bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-lg transition text-left"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{template.prompt}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {template.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {template.recommendedSettings && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {template.recommendedSettings.pixelArt && '🎮 Pixel Art'}
                    {template.recommendedSettings.isometric && '📐 Isometric'}
                    {template.recommendedSettings.dimensions &&
                      ` • ${template.recommendedSettings.dimensions.width}x${template.recommendedSettings.dimensions.height}`
                    }
                  </div>
                )}
              </button>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Sparkles className="mx-auto mb-4 text-gray-400" size={48} />
              <p>No templates found matching your search.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            💡 Click any template to use it as your prompt. {filteredTemplates.length} templates available.
          </p>
        </div>
      </div>
    </div>
  );
}
