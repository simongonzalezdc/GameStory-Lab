/**
 * Template Browser Page - Redesigned
 * Browse and select genre templates, or blend multiple genres automatically
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { templatesAPI } from '../services/api';
import { ProjectAssistantPanel } from '../components/ProjectAssistantPanel';

interface GenreInfo {
  id: string;
  name: string;
  description: string;
}

// Genre color mapping using actual jewel theme colors with logical groupings
const genreColors: Record<string, { gradient: string; border: string; shadow: string; icon: string; intensity: 'low' | 'medium' | 'high' }> = {
  // ACTION/COMBAT - Garnet variations (Intense, fast-paced, aggressive)
  'fps': {
    gradient: 'linear-gradient(135deg, #5B2B33 0%, #8F3E48 50%, #AE5D37 100%)', // Garnet family from theme
    border: 'rgba(143, 62, 72, 0.8)',
    shadow: '0 4px 20px -6px rgba(143, 62, 72, 0.5)',
    icon: '🎯',
    intensity: 'high'
  },
  'fighting': {
    gradient: 'linear-gradient(135deg, #8F3E48 0%, #AE5D37 50%, #B5933C 100%)', // Garnet to Fire Opal
    border: 'rgba(174, 93, 55, 0.8)',
    shadow: '0 4px 20px -6px rgba(174, 93, 55, 0.5)',
    icon: '🥊',
    intensity: 'high'
  },
  'action-adventure': {
    gradient: 'linear-gradient(135deg, #AE5D37 0%, #B5933C 50%, #c9a85a 100%)', // Fire Opal to Topaz
    border: 'rgba(181, 147, 60, 0.8)',
    shadow: '0 4px 20px -6px rgba(181, 147, 60, 0.5)',
    icon: '🗡️',
    intensity: 'medium'
  },

  // ADVENTURE/HEROIC - Topaz variations (Story-driven, exploration, heroic)
  'rpg': {
    gradient: 'linear-gradient(135deg, #7F6530 0%, #B5933C 50%, #c9a85a 100%)', // Topaz variations
    border: 'rgba(181, 147, 60, 0.8)',
    shadow: '0 4px 20px -6px rgba(181, 147, 60, 0.5)',
    icon: '⚔️',
    intensity: 'medium'
  },
  'adventure': {
    gradient: 'linear-gradient(135deg, #B5933C 0%, #c9a85a 50%, #d4a3ab 100%)', // Lighter Topaz
    border: 'rgba(201, 168, 90, 0.8)',
    shadow: '0 4px 20px -6px rgba(201, 168, 90, 0.5)',
    icon: '🗺️',
    intensity: 'low'
  },
  'platformer': {
    gradient: 'linear-gradient(135deg, #c9a85a 0%, #d4a3ab 50%, #e0b5c2 100%)', // Very light Topaz
    border: 'rgba(212, 163, 171, 0.8)',
    shadow: '0 4px 20px -6px rgba(212, 163, 171, 0.5)',
    icon: '🪜',
    intensity: 'low'
  },

  // PUZZLE/TACTICAL - Amethyst variations (Cerebral, tactical, methodical)
  'puzzle': {
    gradient: 'linear-gradient(135deg, #4a3a6a 0%, #6B5D88 50%, #8a7ca8 100%)', // Amethyst family
    border: 'rgba(107, 93, 136, 0.8)',
    shadow: '0 4px 20px -6px rgba(107, 93, 136, 0.5)',
    icon: '🧩',
    intensity: 'medium'
  },
  'strategy': {
    gradient: 'linear-gradient(135deg, #6B5D88 0%, #8a7ca8 50%, #a99cc8 100%)', // Lighter Amethyst
    border: 'rgba(138, 124, 168, 0.8)',
    shadow: '0 4px 20px -6px rgba(138, 124, 168, 0.5)',
    icon: '♟️',
    intensity: 'low'
  },

  // CREATIVE/BUILDING - Turquoise variations (Creative, innovative, technical)
  'simulation': {
    gradient: 'linear-gradient(135deg, #2a5a52 0%, #346C68 50%, #4a7a74 100%)', // Turquoise from theme
    border: 'rgba(52, 108, 104, 0.8)',
    shadow: '0 4px 20px -6px rgba(52, 108, 104, 0.5)',
    icon: '🏗️',
    intensity: 'medium'
  },

  // SPORTS/OUTDOOR - Emerald variations (Grass, fields, competitive outdoors)
  'sports': {
    gradient: 'linear-gradient(135deg, #3d5639 0%, #5A7850 50%, #6a8861 100%)', // Emerald from theme
    border: 'rgba(90, 120, 80, 0.8)',
    shadow: '0 4px 20px -6px rgba(90, 120, 80, 0.5)',
    icon: '⚽',
    intensity: 'medium'
  },

  // SURVIVAL/HORROR - Fire Opal variations (Intense, dangerous, survival)
  'horror': {
    gradient: 'linear-gradient(135deg, #3d2019 0%, #5B2B33 50%, #7a343c 100%)', // Dark Fire Opal
    border: 'rgba(91, 43, 51, 0.8)',
    shadow: '0 4px 20px -6px rgba(91, 43, 51, 0.5)',
    icon: '👻',
    intensity: 'high'
  },
  'survival': {
    gradient: 'linear-gradient(135deg, #5B2B33 0%, #AE5D37 50%, #c07581 100%)', // Fire Opal from theme
    border: 'rgba(174, 93, 55, 0.8)',
    shadow: '0 4px 20px -6px rgba(174, 93, 55, 0.5)',
    icon: '🏕️',
    intensity: 'medium'
  },
  'roguelike': {
    gradient: 'linear-gradient(135deg, #AE5D37 0%, #c07581 50%, #d4a3ab 100%)', // Lighter Fire Opal
    border: 'rgba(192, 117, 129, 0.8)',
    shadow: '0 4px 20px -6px rgba(192, 117, 129, 0.5)',
    icon: '🎲',
    intensity: 'low'
  },

  // RACING/SPEED - Sapphire variations (Fast, competitive, high-speed)
  'racing': {
    gradient: 'linear-gradient(135deg, #2a3a5a 0%, #344676 50%, #4a5688 100%)', // Sapphire from theme
    border: 'rgba(52, 70, 118, 0.8)',
    shadow: '0 4px 20px -6px rgba(52, 70, 118, 0.5)',
    icon: '🏎️',
    intensity: 'high'
  },
  'battle-royale': {
    gradient: 'linear-gradient(135deg, #344676 0%, #4a5688 50%, #5e6a99 100%)', // Lighter Sapphire
    border: 'rgba(74, 86, 136, 0.8)',
    shadow: '0 4px 20px -6px rgba(74, 86, 136, 0.5)',
    icon: '👑',
    intensity: 'medium'
  }
};

interface Template {
  id?: string;
  name?: string;
  description?: string;
  genre?: string;
  mechanics: {
    coreLoop: string;
    playerActions: string[];
    progression?: string;
    resources?: string[];
  };
  lore: {
    setting: {
      era?: string;
      location?: string;
      worldType?: string;
    };
    protagonist: {
      background?: string;
      motivation?: string;
      abilities?: string[];
    };
    conflict: {
      primary?: string;
      secondary?: string[];
    };
    themes: string[];
  };
  tags?: string[];
  difficulty?: string;
  targetAudience?: string;
}

export function TemplateBrowserPage() {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<GenreInfo[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [designOptions, setDesignOptions] = useState({
    tone: 'dark intrigue',
    camera: 'isometric',
    platform: 'PC',
    multiplayer: 'solo',
    sessionLength: '20-40m',
    complexity: 'medium',
    artDirection: 'stylized minimal HUD',
    monetization: 'premium',
    accessibility: 'comfort+color-safe',
  });

  // Automatic genre mixing state - no separate mix mode needed
  const [selectedGenres, setSelectedGenres] = useState<Array<{ genre: string; weight: number }>>([]);
  const [isBlended, setIsBlended] = useState(false);
  
  // LLM enhancement state
  const [blendAnalysis, setBlendAnalysis] = useState<{
    conflicts: Array<{
      type: 'mechanics' | 'lore' | 'setting' | 'conflict' | 'themes';
      description: string;
      severity: 'low' | 'medium' | 'high';
      resolution: string;
    }>;
    coherence_score: number;
    improvements: string[];
  } | null>(null);
  
  const [blendStrategy, setBlendStrategy] = useState<string>('');
  const [blendReasoning, setBlendReasoning] = useState<string>('');

  // Assistant panel state
  const [showAssistant, setShowAssistant] = useState(() => {
    // Load visibility preference from localStorage
    return localStorage.getItem('assistantVisible') !== 'false';
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Save assistant visibility preference
  useEffect(() => {
    localStorage.setItem('assistantVisible', showAssistant.toString());
  }, [showAssistant]);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const response = await templatesAPI.list();
      setGenres(response.genres);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = async (genre: string) => {
    try {
      setLoadingTemplate(true);
      setSelectedGenre(genre);
      setIsBlended(false);
      const data = await templatesAPI.get(genre);
      setTemplate(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
      setTemplate(null);
    } finally {
      setLoadingTemplate(false);
    }
  };

  // Intelligent genre selection - auto-detects single vs multiple selection
  const toggleGenreSelection = (genreId: string) => {
    setSelectedGenres(prev => {
      const exists = prev.find(g => g.genre === genreId);
      if (exists) {
        // Remove genre
        const filtered = prev.filter(g => g.genre !== genreId);
        if (filtered.length === 0) {
          // If no genres selected, clear template and selection
          setTemplate(null);
          setSelectedGenre(null);
          setIsBlended(false);
          return [];
        } else if (filtered.length === 1) {
          // If only one genre left, switch to single mode
          const remaining = filtered[0];
          setTemplate(null);
          setSelectedGenre(remaining.genre);
          setIsBlended(false);
          return filtered;
        } else {
          // Multiple genres still selected, redistribute weights equally
          return filtered.map(g => ({ ...g, weight: 1.0 / filtered.length }));
        }
      } else {
        // Add genre
        const newWeight = 1.0 / (prev.length + 1);
        const newSelection = [...prev.map(g => ({ ...g, weight: newWeight })), { genre: genreId, weight: newWeight }];
        
        if (prev.length === 0) {
          // First selection - load single genre
          setTimeout(() => loadTemplate(genreId), 0);
        } else if (prev.length === 1) {
          // Second selection - start blending
          setSelectedGenre(null);
          setTemplate(null);
          setIsBlended(false);
        }
        
        return newSelection;
      }
    });
  };

  const updateGenreWeight = (genreId: string, weight: number) => {
    setSelectedGenres(prev => prev.map(g => g.genre === genreId ? { ...g, weight } : g));
  };

  const normalizeWeights = () => {
    const total = selectedGenres.reduce((sum, g) => sum + g.weight, 0);
    if (total === 0) return;
    setSelectedGenres(prev => prev.map(g => ({ ...g, weight: g.weight / total })));
  };

  const blendGenres = async () => {
    if (selectedGenres.length < 2) return;

    try {
      setLoadingTemplate(true);
      normalizeWeights();
      
      // Use LLM-enhanced intelligent blending
      const response = await templatesAPI.blendIntelligent({ 
        genres: selectedGenres, 
        designOptions 
      });
      
      setTemplate(response.template);
      setSelectedGenre(null);
      setIsBlended(true);
      setError(null);
      
      // Store analysis data for UI display
      setBlendAnalysis(response.analysis);
      setBlendStrategy(response.blend_strategy);
      setBlendReasoning(response.reasoning);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to blend genres');
      setTemplate(null);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    try {
      setCreating(true);

      if (isBlended) {
        const response = await templatesAPI.blendAndCreate({
          projectName: projectName.trim(),
          genres: selectedGenres,
          designOptions,
        });
        navigate(`/projects/${response.project.id}`);
      } else {
        if (!selectedGenre) return;
        const response = await templatesAPI.createProject(selectedGenre, {
          projectName: projectName.trim(),
          designOptions,
        });
        navigate(`/projects/${response.project.id}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400 text-lg">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Genre Templates</h1>
        <p className="text-slate-400">
          {selectedGenres.length === 0 
            ? 'Select a genre to get started, or choose multiple to blend custom templates'
            : selectedGenres.length === 1 
              ? `Selected: ${genres.find(g => g.id === selectedGenres[0].genre)?.name}`
              : `Blending ${selectedGenres.length} genres`
          }
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Thin Horizontal Settings Strip */}
      <div className="mb-6 bg-[var(--color-surface-strong)] border border-border-subtle rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-slate-200">Quick Settings</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="px-2 py-1 bg-[var(--color-surface-card)] rounded border border-border-subtle">
              {selectedGenres.length === 1 ? 'Single Genre' : `${selectedGenres.length} Genres`}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
          {/* Row 1: Core Experience Settings */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Tone</label>
            <select
              className="input w-full rounded border border-border-subtle bg-[var(--color-surface-card)] text-slate-200 p-1.5 text-xs"
              value={designOptions.tone}
              onChange={(e) => setDesignOptions((o) => ({ ...o, tone: e.target.value }))}
            >
              <option value="dark intrigue">Dark</option>
              <option value="hopeful adventure">Hopeful</option>
              <option value="cozy">Cozy</option>
              <option value="high-tension">Tense</option>
              <option value="whimsical">Whimsy</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Session</label>
            <select
              className="input w-full rounded border border-border-subtle bg-[var(--color-surface-card)] text-slate-200 p-1.5 text-xs"
              value={designOptions.sessionLength}
              onChange={(e) => setDesignOptions((o) => ({ ...o, sessionLength: e.target.value }))}
            >
              <option value="5-10m">5-10m</option>
              <option value="20-40m">20-40m</option>
              <option value="60m+">60m+</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Complexity</label>
            <select
              className="input w-full rounded border border-border-subtle bg-[var(--color-surface-card)] text-slate-200 p-1.5 text-xs"
              value={designOptions.complexity}
              onChange={(e) => setDesignOptions((o) => ({ ...o, complexity: e.target.value }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Camera</label>
            <select
              className="input w-full rounded border border-border-subtle bg-[var(--color-surface-card)] text-slate-200 p-1.5 text-xs"
              value={designOptions.camera}
              onChange={(e) => setDesignOptions((o) => ({ ...o, camera: e.target.value }))}
            >
              <option value="isometric">Iso</option>
              <option value="side">Side</option>
              <option value="first">1st</option>
              <option value="third">3rd</option>
              <option value="top-down">Top</option>
            </select>
          </div>

          {/* Row 2: Platform & Delivery Settings */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Platform</label>
            <select
              className="input w-full rounded border border-border-subtle bg-[var(--color-surface-card)] text-slate-200 p-1.5 text-xs"
              value={designOptions.platform}
              onChange={(e) => setDesignOptions((o) => ({ ...o, platform: e.target.value }))}
            >
              <option value="PC">PC</option>
              <option value="Console">Console</option>
              <option value="Mobile">Mobile</option>
              <option value="Web">Web</option>
              <option value="VR">VR</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Multiplayer</label>
            <select
              className="input w-full rounded border border-border-subtle bg-[var(--color-surface-card)] text-slate-200 p-1.5 text-xs"
              value={designOptions.multiplayer}
              onChange={(e) => setDesignOptions((o) => ({ ...o, multiplayer: e.target.value }))}
            >
              <option value="solo">Solo</option>
              <option value="co-op">Co-op</option>
              <option value="pvp">PvP</option>
              <option value="pvevp">PvEvP</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Art Style</label>
            <select
              className="input w-full rounded border border-border-subtle bg-[var(--color-surface-card)] text-slate-200 p-1.5 text-xs"
              value={designOptions.artDirection}
              onChange={(e) => setDesignOptions((o) => ({ ...o, artDirection: e.target.value }))}
            >
              <option value="stylized minimal HUD">Minimal</option>
              <option value="bold neon UI">Neon</option>
              <option value="painterly low-sat">Painterly</option>
              <option value="gritty realistic">Gritty</option>
              <option value="diegetic ui">Diegetic</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Monetization</label>
            <select
              className="input w-full rounded border border-border-subtle bg-[var(--color-surface-card)] text-slate-200 p-1.5 text-xs"
              value={designOptions.monetization}
              onChange={(e) => setDesignOptions((o) => ({ ...o, monetization: e.target.value }))}
            >
              <option value="premium">Premium</option>
              <option value="cosmetic-pass">Seasonal</option>
              <option value="free-ipa">Free+</option>
              <option value="none">Free</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-16rem)]">
        {/* Left: Genre Selection Grid */}
        <div className="col-span-12 lg:col-span-7">
          <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-200">
                Choose Your Genres
              </h3>
              {selectedGenres.length > 1 && (
                <button
                  onClick={blendGenres}
                  className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  Blend {selectedGenres.length}
                </button>
              )}
            </div>
            
            {/* Larger Genre Grid with Descriptions - No Scrolling */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
              {genres.map((genre) => {
                const isSelected = selectedGenres.some(g => g.genre === genre.id);
                const genreWeight = selectedGenres.find(g => g.genre === genre.id)?.weight || 0;
                const colorScheme = genreColors[genre.id] || {
                  gradient: 'linear-gradient(135deg, #374151 0%, #4b5563 50%, #6b7280 100%)',
                  border: 'rgba(107, 114, 128, 0.8)',
                  shadow: '0 4px 20px -6px rgba(107, 114, 128, 0.5)',
                  icon: '🎮',
                  intensity: 'medium' as const
                };

                return (
                  <div key={genre.id} className="relative">
                    <button
                      onClick={() => toggleGenreSelection(genre.id)}
                      className={`w-full h-32 text-left p-4 rounded-lg border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                        isSelected
                          ? 'border-purple-400 bg-purple-900/30 shadow-lg'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      style={!isSelected ? {
                        background: colorScheme.gradient,
                        borderColor: colorScheme.border,
                        boxShadow: colorScheme.shadow,
                      } : undefined}
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xl">{colorScheme.icon}</span>
                            <h4 className={`font-bold text-sm leading-tight ${
                              isSelected 
                                ? 'text-slate-100' 
                                : 'text-white drop-shadow-sm'
                            }`}>
                              {genre.name}
                            </h4>
                          </div>
                          <p className={`text-xs leading-relaxed ${
                            isSelected 
                              ? 'text-slate-300' 
                              : 'text-slate-100/90 drop-shadow-sm'
                          }`}>
                            {genre.description}
                          </p>
                        </div>
                        
                        {selectedGenres.length > 1 && isSelected && (
                          <div className="mt-3">
                            <div className="bg-black/20 rounded-full h-1.5 mb-1">
                              <div 
                                className="bg-white/80 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${genreWeight * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/90 font-medium">
                              {Math.round(genreWeight * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                    
                    {/* Weight slider for blended genres */}
                    {isSelected && selectedGenres.length > 1 && (
                      <div className="absolute -bottom-2 left-0 right-0 px-1 z-10">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={Math.round(genreWeight * 100)}
                          onChange={(e) => updateGenreWeight(genre.id, parseInt(e.target.value) / 100)}
                          onMouseUp={normalizeWeights}
                          onTouchEnd={normalizeWeights}
                          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Template Preview */}
        <div className="col-span-12 lg:col-span-5">
          <div className="h-full bg-[var(--color-surface-card)] border border-border-subtle rounded-xl p-6">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">Template Preview</h3>
            
            {loadingTemplate ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-slate-300 font-medium">
                    {selectedGenres.length > 1 ? 'AI analyzing and blending genres...' : 'Loading template...'}
                  </p>
                  <p className="text-slate-500 text-sm mt-1">
                    {selectedGenres.length > 1 
                      ? 'Resolving conflicts and creating coherent synergy'
                      : 'Fetching template details'
                    }
                  </p>
                </div>
              </div>
            ) : template ? (
              <div className="space-y-4 max-h-full overflow-y-auto">
                {/* Template Header */}
                {template.name && (
                  <div className="border-b border-border-subtle pb-3">
                    {isBlended && (
                      <div className="space-y-3">
                        <div className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold rounded mb-2">
                          🤖 AI-ENHANCED BLENDED TEMPLATE
                        </div>
                        
                        {/* AI Analysis Summary */}
                        {blendAnalysis && (
                          <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-slate-300">AI Analysis</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400">Coherence:</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 ${
                                        blendAnalysis.coherence_score >= 80 ? 'bg-green-500' :
                                        blendAnalysis.coherence_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${blendAnalysis.coherence_score}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-slate-300 font-mono">
                                    {blendAnalysis.coherence_score}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {blendAnalysis.conflicts.length > 0 && (
                              <div>
                                <span className="text-xs text-slate-400 font-medium">Conflicts Resolved:</span>
                                <div className="mt-1 space-y-1">
                                  {blendAnalysis.conflicts.slice(0, 3).map((conflict, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                      <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                        conflict.severity === 'high' ? 'bg-red-400' :
                                        conflict.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                                      }`} />
                                      <div>
                                        <span className="text-slate-300 font-medium">{conflict.type}:</span>
                                        <span className="text-slate-400 ml-1">{conflict.resolution}</span>
                                      </div>
                                    </div>
                                  ))}
                                  {blendAnalysis.conflicts.length > 3 && (
                                    <div className="text-xs text-purple-400">
                                      +{blendAnalysis.conflicts.length - 3} more improvements
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {blendStrategy && (
                              <div className="pt-2 border-t border-slate-700">
                                <span className="text-xs text-slate-400 font-medium">Strategy:</span>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{blendStrategy}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <h4 className="text-xl font-bold text-slate-100">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                    )}
                  </div>
                )}

                {/* Mechanics */}
                <div>
                  <h5 className="font-semibold text-slate-200 mb-2 text-sm">Core Loop</h5>
                  <p className="text-sm text-slate-400 mb-3">{template.mechanics.coreLoop}</p>
                  
                  {template.mechanics.playerActions && template.mechanics.playerActions.length > 0 && (
                    <div>
                      <h6 className="text-xs font-medium text-slate-300 mb-2">Player Actions</h6>
                      <div className="grid grid-cols-1 gap-1 text-xs text-slate-500">
                        {template.mechanics.playerActions.slice(0, 6).map((action, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0"></span>
                            <span>{action}</span>
                          </div>
                        ))}
                        {template.mechanics.playerActions.length > 6 && (
                          <div className="text-purple-400 text-xs mt-1">
                            + {template.mechanics.playerActions.length - 6} more actions
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Lore Preview */}
                <div>
                  <h5 className="font-semibold text-slate-200 mb-2 text-sm">Setting & Conflict</h5>
                  <div className="space-y-2 text-xs text-slate-500">
                    {template.lore.setting?.location && (
                      <div><span className="text-slate-400 font-medium">World:</span> {template.lore.setting.location}</div>
                    )}
                    {template.lore.conflict?.primary && (
                      <div><span className="text-slate-400 font-medium">Challenge:</span> {template.lore.conflict.primary}</div>
                    )}
                    {template.lore.themes && template.lore.themes.length > 0 && (
                      <div>
                        <span className="text-slate-400 font-medium">Themes:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.lore.themes.slice(0, 3).map((theme, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-slate-700 text-slate-300 rounded-full text-xs"
                            >
                              {theme}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className={`w-full px-4 py-3 text-white rounded-lg transition font-medium mt-6 ${
                    isBlended
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isBlended ? '✨ Create Project from Blended Template' : '🚀 Create Project from Template'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <div className="text-5xl mb-4">🎮</div>
                <p className="text-lg font-medium mb-3 text-center">
                  {selectedGenres.length === 0 
                    ? 'Select genres to begin'
                    : selectedGenres.length === 1
                      ? 'Ready to create!'
                      : 'Blend your selection'
                    }
                </p>
                <p className="text-sm text-center max-w-sm leading-relaxed">
                  {selectedGenres.length === 0 
                    ? 'Click on genre cards to view templates, or select multiple to blend them together'
                    : selectedGenres.length > 1
                      ? 'Adjust the weights above and click "Blend" to create your custom template'
                      : 'Your template is ready to customize and create'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (selectedGenre || isBlended) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="modal max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-100 mb-4">
              {isBlended
                ? 'Create Project from Blended Template'
                : `Create Project from ${genres.find((g) => g.id === selectedGenre)?.name} Template`}
            </h3>
            {isBlended && template?.name && (
              <p className="text-sm text-purple-400 mb-4">{template.name}</p>
            )}
            <form onSubmit={handleCreateProject}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="input w-full px-3 py-2 border border-gray-600 bg-[var(--color-surface-card)] text-slate-100 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="My Game Project"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setProjectName('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 text-slate-200 rounded-lg hover:bg-gray-500 transition font-medium"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium disabled:opacity-50 ${
                    isBlended
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  disabled={creating || !projectName.trim()}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

    {/* Assistant Panel */}
    {showAssistant && (
      <div className="fixed right-4 top-4 bottom-4 w-96 z-40 bg-surface rounded-2xl shadow-2xl border border-border-subtle overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-border-subtle bg-surface-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">AI Assistant</h3>
              <button
                onClick={() => setShowAssistant(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title="Close assistant"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Assistant Content */}
          <div className="flex-1 min-h-0">
            {selectedProjectId ? (
              <ProjectAssistantPanel
                projectId={selectedProjectId}
                type="concept"
                onProposalAccepted={async () => {
                  // Refresh template browser state if needed
                  if (template) {
                    // Reload template to reflect any changes
                    await loadTemplate(selectedGenre!);
                  }
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Template Assistant
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Need help choosing or blending templates? Chat with the AI assistant for guidance on game design decisions.
                </p>
                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <p>• Get help choosing genre combinations</p>
                  <p>• Understand template mechanics and lore</p>
                  <p>• Learn about game design patterns</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
  );
}
