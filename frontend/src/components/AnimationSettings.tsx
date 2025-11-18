import { useState } from 'react';
import { Film, Play } from 'lucide-react';

interface AnimationSettingsProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onSettingsChange: (settings: AnimationSettings) => void;
}

export interface AnimationSettings {
  enabled: boolean;
  animationType: string;
  frameCount: number;
  frameDuration: number;
  looping: boolean;
}

const ANIMATION_TYPES = [
  { id: 'walk', name: 'Walk Cycle', frames: 4, description: 'Character walking animation' },
  { id: 'run', name: 'Run Cycle', frames: 6, description: 'Character running animation' },
  { id: 'idle', name: 'Idle', frames: 4, description: 'Character standing/breathing' },
  { id: 'attack', name: 'Attack', frames: 5, description: 'Attack/swing animation' },
  { id: 'jump', name: 'Jump', frames: 4, description: 'Jump/hop animation' },
  { id: 'death', name: 'Death', frames: 5, description: 'Death/defeat animation' },
  { id: 'cast', name: 'Cast Spell', frames: 6, description: 'Magic casting animation' },
  { id: 'defend', name: 'Defend/Block', frames: 3, description: 'Defensive stance' },
];

const FRAME_COUNTS = [2, 3, 4, 5, 6, 7, 8, 10, 12];

const FRAME_DURATIONS = [
  { ms: 50, label: '50ms', fps: '20 FPS', description: 'Very fast' },
  { ms: 83, label: '83ms', fps: '12 FPS', description: 'Fast' },
  { ms: 100, label: '100ms', fps: '10 FPS', description: 'Standard' },
  { ms: 125, label: '125ms', fps: '8 FPS', description: 'Slow' },
  { ms: 167, label: '167ms', fps: '6 FPS', description: 'Very slow' },
];

export function AnimationSettings({ enabled, onToggle, onSettingsChange }: AnimationSettingsProps) {
  const [animationType, setAnimationType] = useState('walk');
  const [frameCount, setFrameCount] = useState(4);
  const [frameDuration, setFrameDuration] = useState(100);
  const [looping, setLooping] = useState(true);

  const currentAnimation = ANIMATION_TYPES.find((a) => a.id === animationType)!;

  const handleChange = (newSettings: Partial<AnimationSettings>) => {
    const settings: AnimationSettings = {
      enabled,
      animationType,
      frameCount,
      frameDuration,
      looping,
      ...newSettings,
    };

    if (newSettings.animationType !== undefined) {
      setAnimationType(newSettings.animationType);
      // Auto-set recommended frame count for the animation type
      const animData = ANIMATION_TYPES.find((a) => a.id === newSettings.animationType);
      if (animData) {
        setFrameCount(animData.frames);
        settings.frameCount = animData.frames;
      }
    }
    if (newSettings.frameCount !== undefined) setFrameCount(newSettings.frameCount);
    if (newSettings.frameDuration !== undefined) setFrameDuration(newSettings.frameDuration);
    if (newSettings.looping !== undefined) setLooping(newSettings.looping);

    onSettingsChange(settings);
  };

  return (
    <div className="space-y-4 border border-pink-200 dark:border-pink-800 rounded-lg p-4 bg-pink-50 dark:bg-pink-900/20">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="text-pink-600 dark:text-pink-400" size={20} />
          <span className="font-semibold text-gray-900 dark:text-white">Animation Sequences</span>
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
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
        </label>
      </div>

      {enabled && (
        <>
          {/* Animation Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Play className="inline w-4 h-4 mr-1" />
              Animation Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ANIMATION_TYPES.map((anim) => (
                <button
                  key={anim.id}
                  onClick={() => handleChange({ animationType: anim.id })}
                  className={`px-3 py-2 rounded text-sm font-medium transition text-left ${
                    animationType === anim.id
                      ? 'bg-pink-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-pink-400'
                  }`}
                >
                  <div className="font-semibold">{anim.name}</div>
                  <div className="text-xs opacity-75">{anim.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Frame Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frame Count: {frameCount} frames
            </label>
            <div className="flex gap-2 flex-wrap">
              {FRAME_COUNTS.map((count) => (
                <button
                  key={count}
                  onClick={() => handleChange({ frameCount: count })}
                  className={`px-3 py-2 rounded text-sm font-medium transition ${
                    frameCount === count
                      ? 'bg-pink-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-pink-400'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Recommended: {currentAnimation.frames} frames for {currentAnimation.name}
            </p>
          </div>

          {/* Frame Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frame Duration
            </label>
            <div className="space-y-2">
              {FRAME_DURATIONS.map((duration) => (
                <button
                  key={duration.ms}
                  onClick={() => handleChange({ frameDuration: duration.ms })}
                  className={`w-full px-3 py-2 rounded text-sm font-medium transition text-left ${
                    frameDuration === duration.ms
                      ? 'bg-pink-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-pink-400'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{duration.label}</span>
                      <span className="text-xs opacity-75 ml-2">({duration.fps})</span>
                    </div>
                    <span className="text-xs opacity-75">{duration.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Looping Toggle */}
          <div className="flex items-center justify-between bg-pink-100 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-700 rounded p-3">
            <div>
              <p className="text-sm font-medium text-pink-900 dark:text-pink-300">Loop Animation</p>
              <p className="text-xs text-pink-700 dark:text-pink-400">Seamlessly repeating cycle</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={looping}
                onChange={(e) => handleChange({ looping: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 dark:peer-focus:ring-pink-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-pink-600"></div>
            </label>
          </div>

          {/* Animation Info */}
          <div className="bg-pink-100 dark:bg-pink-900/30 border border-pink-300 dark:border-pink-700 rounded p-3 text-sm text-pink-800 dark:text-pink-300">
            <p className="font-medium mb-1">Animation Mode Active:</p>
            <ul className="space-y-1 text-xs">
              <li>• Generates {frameCount} animation frames for {currentAnimation.name}</li>
              <li>• Frame timing: {frameDuration}ms ({FRAME_DURATIONS.find((d) => d.ms === frameDuration)?.fps})</li>
              <li>• Total duration: ~{(frameCount * frameDuration) / 1000}s per cycle</li>
              <li>• {looping ? 'Looping enabled - seamless repeat' : 'One-shot animation - plays once'}</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
