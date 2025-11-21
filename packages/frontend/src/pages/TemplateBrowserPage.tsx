/**
 * Template Browser Page - Redesigned
 * Browse and select genre templates, or blend multiple genres automatically
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { templatesAPI } from '../services/api';
import { cn } from '../lib/utils';
import { JewelSpinner } from '../components/JewelSpinner';

interface GenreInfo {
  id: string;
  name: string;
  description: string;
}

// Genre color mapping using CSS variables - Strict theme compliance
const genreColors: Record<string, { gradient: string; border: string; shadow: string; icon: string; intensity: 'low' | 'medium' | 'high' }> = {
  // ACTION/COMBAT - Garnet variations (Intense, fast-paced, aggressive)
  // Using only colors from jewel-engine-theme: --jewel-garnet, --jewel-fireopal, --brand-primary-soft
  'fps': {
    gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--jewel-garnet) 60%, var(--bg-body)) 0%, var(--jewel-garnet) 50%, var(--brand-primary-hover) 100%)',
    border: 'color-mix(in srgb, var(--jewel-garnet) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-garnet) 50%, transparent)',
    icon: '🎯',
    intensity: 'high'
  },
  'fighting': {
    gradient: 'linear-gradient(135deg, var(--jewel-garnet) 0%, var(--brand-primary-hover) 50%, var(--jewel-fireopal) 100%)',
    border: 'color-mix(in srgb, var(--jewel-fireopal) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-fireopal) 50%, transparent)',
    icon: '🥊',
    intensity: 'high'
  },
  'action-adventure': {
    gradient: 'linear-gradient(135deg, var(--jewel-fireopal) 0%, var(--jewel-topaz) 50%, color-mix(in srgb, var(--jewel-topaz) 80%, var(--text-primary)) 100%)',
    border: 'color-mix(in srgb, var(--jewel-topaz) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-topaz) 50%, transparent)',
    icon: '🗡️',
    intensity: 'medium'
  },

  // ADVENTURE/HEROIC - Topaz variations (Story-driven, exploration, heroic)
  // Using only colors from jewel-engine-theme: --jewel-topaz, --brand-secondary-soft
  'rpg': {
    gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--jewel-topaz) 60%, var(--bg-body)) 0%, var(--jewel-topaz) 50%, color-mix(in srgb, var(--jewel-topaz) 80%, var(--text-primary)) 100%)',
    border: 'color-mix(in srgb, var(--jewel-topaz) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-topaz) 50%, transparent)',
    icon: '⚔️',
    intensity: 'medium'
  },
  'adventure': {
    gradient: 'linear-gradient(135deg, var(--jewel-topaz) 0%, color-mix(in srgb, var(--jewel-topaz) 80%, var(--text-primary)) 50%, var(--brand-primary-hover) 100%)',
    border: 'color-mix(in srgb, var(--jewel-topaz) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-topaz) 50%, transparent)',
    icon: '🗺️',
    intensity: 'low'
  },
  'platformer': {
    gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--jewel-topaz) 80%, var(--text-primary)) 0%, var(--brand-primary-hover) 50%, var(--brand-primary-hover) 100%)',
    border: 'color-mix(in srgb, var(--brand-primary-hover) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--brand-primary-hover) 50%, transparent)',
    icon: '🪜',
    intensity: 'low'
  },

  // PUZZLE/TACTICAL - Amethyst variations (Cerebral, tactical, methodical)
  // Using only colors from jewel-engine-theme: --jewel-amethyst
  'puzzle': {
    gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--jewel-amethyst) 60%, var(--bg-body)) 0%, var(--jewel-amethyst) 50%, color-mix(in srgb, var(--jewel-amethyst) 80%, var(--text-primary)) 100%)',
    border: 'color-mix(in srgb, var(--jewel-amethyst) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-amethyst) 50%, transparent)',
    icon: '🧩',
    intensity: 'medium'
  },
  'strategy': {
    gradient: 'linear-gradient(135deg, var(--jewel-amethyst) 0%, color-mix(in srgb, var(--jewel-amethyst) 80%, var(--text-primary)) 50%, color-mix(in srgb, var(--jewel-amethyst) 80%, var(--text-primary)) 100%)',
    border: 'color-mix(in srgb, var(--jewel-amethyst) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-amethyst) 50%, transparent)',
    icon: '♟️',
    intensity: 'low'
  },

  // CREATIVE/BUILDING - Turquoise variations (Creative, innovative, technical)
  // Using only colors from jewel-engine-theme: --jewel-turquoise
  'simulation': {
    gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--jewel-turquoise) 60%, var(--bg-body)) 0%, var(--jewel-turquoise) 50%, color-mix(in srgb, var(--jewel-turquoise) 80%, var(--text-primary)) 100%)',
    border: 'color-mix(in srgb, var(--jewel-turquoise) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-turquoise) 50%, transparent)',
    icon: '🏗️',
    intensity: 'medium'
  },

  // SPORTS/OUTDOOR - Emerald variations (Grass, fields, competitive outdoors)
  // Using only colors from jewel-engine-theme: --jewel-emerald
  'sports': {
    gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--jewel-emerald) 60%, var(--bg-body)) 0%, var(--jewel-emerald) 50%, color-mix(in srgb, var(--jewel-emerald) 80%, var(--text-primary)) 100%)',
    border: 'color-mix(in srgb, var(--jewel-emerald) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-emerald) 50%, transparent)',
    icon: '⚽',
    intensity: 'medium'
  },

  // SURVIVAL/HORROR - Fire Opal variations (Intense, dangerous, survival)
  // Using only colors from jewel-engine-theme: --jewel-fireopal, --jewel-garnet, --brand-primary-soft
  'horror': {
    gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--jewel-fireopal) 60%, var(--bg-body)) 0%, color-mix(in srgb, var(--jewel-garnet) 60%, var(--bg-body)) 50%, var(--jewel-garnet) 100%)',
    border: 'color-mix(in srgb, var(--brand-primary-soft) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--brand-primary-soft) 50%, transparent)',
    icon: '👻',
    intensity: 'high'
  },
  'survival': {
    gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--jewel-garnet) 60%, var(--bg-body)) 0%, var(--jewel-fireopal) 50%, color-mix(in srgb, var(--jewel-fireopal) 80%, var(--text-primary)) 100%)',
    border: 'color-mix(in srgb, var(--jewel-fireopal) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-fireopal) 50%, transparent)',
    icon: '🏕️',
    intensity: 'medium'
  },
  'roguelike': {
    gradient: 'linear-gradient(135deg, var(--jewel-fireopal) 0%, color-mix(in srgb, var(--jewel-fireopal) 80%, var(--text-primary)) 50%, var(--brand-primary-hover) 100%)',
    border: 'color-mix(in srgb, var(--jewel-fireopal) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-fireopal) 50%, transparent)',
    icon: '🎲',
    intensity: 'low'
  },

  // RACING/SPEED - Sapphire variations (Fast, competitive, high-speed)
  // Using only colors from jewel-engine-theme: --jewel-sapphire
  'racing': {
    gradient: 'linear-gradient(135deg, color-mix(in srgb, var(--jewel-sapphire) 60%, var(--bg-body)) 0%, var(--jewel-sapphire) 50%, color-mix(in srgb, var(--jewel-sapphire) 80%, var(--text-primary)) 100%)',
    border: 'color-mix(in srgb, var(--jewel-sapphire) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-sapphire) 50%, transparent)',
    icon: '🏎️',
    intensity: 'high'
  },
  'battle-royale': {
    gradient: 'linear-gradient(135deg, var(--jewel-sapphire) 0%, color-mix(in srgb, var(--jewel-sapphire) 80%, var(--text-primary)) 50%, color-mix(in srgb, var(--jewel-sapphire) 80%, var(--text-primary)) 100%)',
    border: 'color-mix(in srgb, var(--jewel-sapphire) 80%, transparent)',
    shadow: '0 4px 20px -6px color-mix(in srgb, var(--jewel-sapphire) 50%, transparent)',
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

  const templateFocusAreas = ['Mechanics kitbashing', 'Lore weaving', 'Conflict tuning', 'Export rituals'];
  const selectionSummary =
    selectedGenres.length === 0
      ? 'Pick a foundation genre or start blending to craft something new.'
      : selectedGenres.length === 1
        ? `Working from ${genres.find((g) => g.id === selectedGenres[0].genre)?.name}.`
        : `Blending ${selectedGenres.length} genres with conflict-safe AI guidance.`;

  const selectionModeLabel = selectedGenres.length <= 1 ? 'Single genre' : `${selectedGenres.length} genres`;

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
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <JewelSpinner size="lg" />
        <p className="text-primary text-lg font-semibold">Preparing the Template Forge...</p>
        <p className="text-secondary text-sm max-w-md">
          Loading genres, blending heuristics, and Cozy Creator Lab presets.
        </p>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-8">
      {/* Hero */}
      <section className="glass-card relative overflow-hidden px-6 py-8 lg:px-10 lg:py-12">
        <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 15% -10%, color-mix(in srgb, var(--jewel-garnet) 35%, transparent) 0%, transparent 45%), radial-gradient(circle at 50% -5%, color-mix(in srgb, var(--jewel-fireopal) 20%, transparent) 0%, transparent 40%), radial-gradient(circle at 80% 0%, color-mix(in srgb, var(--jewel-topaz) 25%, transparent) 0%, transparent 55%)' }} />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.35em] text-tertiary">
            <span className="signal-pill signal-pill--accent">Template Forge</span>
            <span className="signal-pill">Unified assistant</span>
            <span className="signal-pill">{selectionModeLabel}</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-[700] text-primary" style={{ fontFamily: 'var(--font-display)' }}>
              Craft & Blend Genre Templates
            </h1>
            <p className="text-lg text-secondary max-w-3xl">{selectionSummary}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={!selectedGenre && !isBlended}
              className="btn btn-primary shadow-glow disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="text-lg">✨</span>
              <span>{isBlended ? 'Create blended project' : 'Create from template'}</span>
            </button>
            {selectedGenres.length > 1 && (
              <button onClick={blendGenres} className="btn btn-secondary border border-brand-400/50 text-primary">
                Blend {selectedGenres.length} genres
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="stat-chip">
              <p className="stat-chip__label">Selection</p>
              <p className="stat-chip__value">{selectedGenres.length}</p>
              <p className="stat-chip__meta">{selectionModeLabel}</p>
            </div>
            <div className="stat-chip">
              <p className="stat-chip__label">Template status</p>
              <p className="stat-chip__value">{template ? 'Ready' : 'Idle'}</p>
              <p className="stat-chip__meta">{template ? 'Preview loaded' : 'Awaiting selection'}</p>
            </div>
            <div className="stat-chip">
              <p className="stat-chip__label">Blend mode</p>
              <p className="stat-chip__value">{isBlended ? 'AI' : 'Solo'}</p>
              <p className="stat-chip__meta">{isBlended ? 'Conflict-safe' : 'Single genre'}</p>
            </div>
            <div className="stat-chip">
              <p className="stat-chip__label">Coherence</p>
              <p className="stat-chip__value">{blendAnalysis ? `${blendAnalysis.coherence_score}%` : '--'}</p>
              <p className="stat-chip__meta">{blendAnalysis ? 'AI analysis' : 'Awaiting blend'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {templateFocusAreas.map((area) => (
              <span key={area} className="chip chip-muted">
                {area}
              </span>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="validation-error border border-danger/40 rounded-xl p-4">
          <p className="font-medium">{error}</p>
        </div>
      )}

      <section className="surface-panel p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-tertiary">Design toggles</p>
            <p className="text-sm text-secondary">
              Tune tone, session length, camera, and delivery before generating.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-secondary flex-wrap">
            <span className="chip chip-muted">{selectionModeLabel}</span>
            <span className="chip chip-muted">{designOptions.platform}</span>
            <span className="chip chip-muted">{designOptions.multiplayer}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
          {[
            { label: 'Tone', value: designOptions.tone, options: ['dark intrigue', 'hopeful adventure', 'cozy', 'high-tension', 'whimsical'], key: 'tone' },
            { label: 'Session', value: designOptions.sessionLength, options: ['5-10m', '20-40m', '60m+'], key: 'sessionLength' },
            { label: 'Complexity', value: designOptions.complexity, options: ['low', 'medium', 'high'], key: 'complexity' },
            { label: 'Camera', value: designOptions.camera, options: ['isometric', 'side', 'first', 'third', 'top-down'], key: 'camera' },
            { label: 'Platform', value: designOptions.platform, options: ['PC', 'Console', 'Mobile', 'Web', 'VR'], key: 'platform' },
            { label: 'Multiplayer', value: designOptions.multiplayer, options: ['solo', 'co-op', 'pvp', 'pvevp'], key: 'multiplayer' },
            { label: 'Art style', value: designOptions.artDirection, options: ['stylized minimal HUD', 'bold neon UI', 'painterly low-sat', 'gritty realistic', 'diegetic ui'], key: 'artDirection' },
            { label: 'Monetization', value: designOptions.monetization, options: ['premium', 'cosmetic-pass', 'free-ipa', 'none'], key: 'monetization' },
          ].map((control) => (
            <label key={control.key} className="text-xs text-secondary font-semibold tracking-wide space-y-1 uppercase">
              {control.label}
              <select
                className="input w-full py-2 text-sm bg-surface-card border-border-subtle text-primary"
                value={control.value}
                onChange={(e) =>
                  setDesignOptions((prev) => ({
                    ...prev,
                    [control.key]: e.target.value,
                  }))
                }
              >
                {control.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Genre Selection Grid */}
        <div className="xl:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-primary">Choose your genres</h3>
              <p className="text-sm text-secondary">
                Tap to add or remove. Adjust weights when blending multiple genres.
              </p>
            </div>
            {selectedGenres.length > 1 && (
              <button onClick={blendGenres} className="btn btn-secondary">
                Blend {selectedGenres.length}
              </button>
            )}
          </div>
            
            {/* Larger Genre Grid with Descriptions */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {genres.map((genre) => {
                const isSelected = selectedGenres.some(g => g.genre === genre.id);
                const genreWeight = selectedGenres.find(g => g.genre === genre.id)?.weight || 0;
                const colorScheme = genreColors[genre.id] || {
                  gradient: 'linear-gradient(135deg, var(--color-surface-strong) 0%, var(--color-border) 50%, var(--color-border-subtle) 100%)',
                  border: 'rgba(107, 114, 128, 0.8)',
                  shadow: '0 4px 20px -6px rgba(107, 114, 128, 0.5)',
                  icon: '🎮',
                  intensity: 'medium' as const
                };

                return (
                  <div key={genre.id} className="relative">
                    <button
                      onClick={() => toggleGenreSelection(genre.id)}
                      className={cn(
                        'w-full h-36 rounded-2xl p-4 text-left transition-all duration-300 border focus-visible:outline focus-visible:outline-brand-500 focus-visible:outline-offset-2',
                        isSelected
                          ? 'bg-surface border-brand-400/70 ring-2 ring-brand-400/40 shadow-glow'
                          : 'border-transparent hover:shadow-lg'
                      )}
                      style={
                        !isSelected
                          ? {
                              background: colorScheme.gradient,
                              boxShadow: colorScheme.shadow,
                            }
                          : undefined
                      }
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{colorScheme.icon}</span>
                            <h4 className="font-bold text-sm text-primary">{genre.name}</h4>
                          </div>
                          <p className="text-xs text-primary/80 leading-relaxed">
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
                            <span className="text-xs text-primary font-medium">
                              {Math.round(genreWeight * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                    
                    {/* Weight slider for blended genres */}
                    {isSelected && selectedGenres.length > 1 && (
                      <div className="absolute -bottom-3 left-0 right-0 px-3 z-10">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={Math.round(genreWeight * 100)}
                          onChange={(e) => updateGenreWeight(genre.id, parseInt(e.target.value) / 100)}
                          onMouseUp={normalizeWeights}
                          onTouchEnd={normalizeWeights}
                          className="w-full accent-brand-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
        </div>

        {/* Right: Template Preview */}
        <div className="xl:col-span-5">
          <div className="glass-card h-full p-6">
            <h3 className="text-lg font-semibold text-primary mb-4">Template Preview</h3>
            
            {loadingTemplate ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🤖</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-secondary font-medium">
                    {selectedGenres.length > 1 ? 'AI analyzing and blending genres...' : 'Loading template...'}
                  </p>
                  <p className="text-tertiary text-sm mt-1">
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
                        <div className="inline-block px-3 py-1 bg-brand-500/15 text-primary text-xs font-bold rounded mb-2 border border-brand-500/30">
                          🤖 AI-ENHANCED BLENDED TEMPLATE
                        </div>
                        
                        {/* AI Analysis Summary */}
                        {blendAnalysis && (
                          <div className="bg-surface-muted/60 rounded-lg p-3 space-y-2 border border-border-subtle">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-secondary">AI Analysis</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-secondary">Coherence:</span>
                                <div className="flex items-center gap-1">
                                  <div className="w-16 h-2 bg-surface rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 ${
                                        blendAnalysis.coherence_score >= 80 ? 'bg-green-500' :
                                        blendAnalysis.coherence_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${blendAnalysis.coherence_score}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-secondary font-mono">
                                    {blendAnalysis.coherence_score}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            {blendAnalysis.conflicts.length > 0 && (
                              <div>
                                <span className="text-xs text-secondary font-medium">Conflicts Resolved:</span>
                                <div className="mt-1 space-y-1">
                                  {blendAnalysis.conflicts.slice(0, 3).map((conflict, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                      <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                                        conflict.severity === 'high' ? 'bg-red-400' :
                                        conflict.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                                      }`} />
                                      <div>
                                        <span className="text-secondary font-medium">{conflict.type}:</span>
                                        <span className="text-secondary ml-1">{conflict.resolution}</span>
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
                              <div className="pt-2 border-t border-border-subtle">
                                <span className="text-xs text-secondary font-medium">Strategy:</span>
                                <p className="text-xs text-secondary mt-1 leading-relaxed">{blendStrategy}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <h4 className="text-xl font-bold text-primary">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-secondary mt-1">{template.description}</p>
                    )}
                  </div>
                )}

                {/* Mechanics */}
                <div>
                  <h5 className="font-semibold text-primary mb-2 text-sm">Core Loop</h5>
                  <p className="text-sm text-secondary mb-3">{template.mechanics.coreLoop}</p>
                  
                  {template.mechanics.playerActions && template.mechanics.playerActions.length > 0 && (
                    <div>
                      <h6 className="text-xs font-medium text-secondary mb-2">Player Actions</h6>
                      <div className="grid grid-cols-1 gap-1 text-xs text-tertiary">
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
                  <h5 className="font-semibold text-primary mb-2 text-sm">Setting & Conflict</h5>
                  <div className="space-y-2 text-xs text-tertiary">
                    {template.lore.setting?.location && (
                      <div><span className="text-secondary font-medium">World:</span> {template.lore.setting.location}</div>
                    )}
                    {template.lore.conflict?.primary && (
                      <div><span className="text-secondary font-medium">Challenge:</span> {template.lore.conflict.primary}</div>
                    )}
                    {template.lore.themes && template.lore.themes.length > 0 && (
                      <div>
                        <span className="text-secondary font-medium">Themes:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {template.lore.themes.slice(0, 3).map((theme, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-surface-strong text-secondary rounded-full text-xs"
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
                  className="btn btn-primary w-full px-4 py-3 font-medium mt-6"
                >
                  {isBlended ? '✨ Create Project from Blended Template' : '🚀 Create Project from Template'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-tertiary">
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
      </section>

      {/* Create Project Modal */}
      {showCreateModal && (selectedGenre || isBlended) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-lg w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-primary">
              {isBlended
                ? 'Create Project from Blended Template'
                : `Create Project from ${genres.find((g) => g.id === selectedGenre)?.name} Template`}
            </h3>
            {isBlended && template?.name && (
              <p className="text-sm text-purple-400 mb-4">{template.name}</p>
            )}
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="input w-full"
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
                  className="btn btn-secondary flex-1"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1 disabled:opacity-50"
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

    </>
  );
}
