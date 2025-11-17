import { useProjectStore } from '@/stores/project-store';
import { useAudioStore } from '@/stores/audio-store';
import { Button } from '../ui/Button';
import TrackList from './TrackList';
import MidiExportDialog from '../project/MidiExportDialog';
import { getAudioEngine } from '@/lib/audio/engine';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useKeyboardShortcuts, isTypingInInput } from '@/hooks/useKeyboardShortcuts';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

export default function SceneEditor() {
  const { project, currentSceneId, setCurrentScene } = useProjectStore();
  const { isPlaying, setPlaying } = useAudioStore();
  const audioEngine = getAudioEngine();
  const [showMidiExport, setShowMidiExport] = useState(false);

  // Memoize scene lookup
  const currentScene = useMemo(
    () => project?.scenes.find(s => s.id === currentSceneId),
    [project?.scenes, currentSceneId]
  );

  useEffect(() => {
    if (currentScene) {
      audioEngine.loadScene(currentScene).catch((error) => {
        errorHandler.handle(error, 'Scene Loading', ErrorSeverity.ERROR);
      });
    }
  }, [currentScene, audioEngine]);

  const handlePlayPause = useCallback(async () => {
    if (!audioEngine.initialized) {
      await audioEngine.init();
    }

    if (isPlaying) {
      audioEngine.pause();
      setPlaying(false);
    } else {
      audioEngine.play();
      setPlaying(true);
    }
  }, [audioEngine, isPlaying, setPlaying]);

  const handleStop = useCallback(() => {
    audioEngine.stop();
    setPlaying(false);
  }, [audioEngine, setPlaying]);

  // Register keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: ' ',
      action: () => {
        if (!isTypingInInput()) {
          handlePlayPause();
        }
      },
      description: 'Play/Pause',
      preventDefault: true,
    },
    {
      key: 'Escape',
      action: () => {
        if (isPlaying) {
          handleStop();
        }
      },
      description: 'Stop playback',
    },
    {
      key: 'e',
      ctrl: true,
      action: () => {
        if (!isTypingInInput()) {
          setShowMidiExport(true);
        }
      },
      description: 'Export MIDI',
    },
    {
      key: 'Escape',
      action: () => {
        if (showMidiExport) {
          setShowMidiExport(false);
        } else {
          setCurrentScene(null);
        }
      },
      description: 'Close dialog or go back',
    },
    {
      key: 'n',
      ctrl: true,
      action: () => {
        if (!isTypingInInput() && currentScene) {
          // Add new track
          const { addTrack } = useProjectStore.getState();
          addTrack(currentScene.id, {
            name: `Track ${currentScene.tracks.length + 1}`,
            role: 'lead',
            instrumentRef: 'default-synth',
            volume: 0.8,
            pan: 0,
            muted: false,
            solo: false,
            clips: [],
          });
        }
      },
      description: 'Add new track',
    },
    {
      key: 'ArrowLeft',
      ctrl: true,
      action: () => {
        if (!isTypingInInput() && project) {
          const currentIndex = project.scenes.findIndex(s => s.id === currentSceneId);
          if (currentIndex > 0) {
            setCurrentScene(project.scenes[currentIndex - 1].id);
          }
        }
      },
      description: 'Previous scene',
    },
    {
      key: 'ArrowRight',
      ctrl: true,
      action: () => {
        if (!isTypingInInput() && project) {
          const currentIndex = project.scenes.findIndex(s => s.id === currentSceneId);
          if (currentIndex < project.scenes.length - 1) {
            setCurrentScene(project.scenes[currentIndex + 1].id);
          }
        }
      },
      description: 'Next scene',
    },
  ]);

  if (!currentScene) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Select a scene to edit</p>
        <Button onClick={() => setCurrentScene(null)} className="mt-4" variant="secondary">
          Back to Scenes
        </Button>
      </div>
    );
  }

  return (
    <>
      <MidiExportDialog
        open={showMidiExport}
        onClose={() => setShowMidiExport(false)}
        scene={currentScene}
      />
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentScene(null)}
              >
                ← Back to Scenes
              </Button>
              <h2 className="text-xl font-bold text-gray-900 mt-2">{currentScene.name}</h2>
              <p className="text-sm text-gray-500">
                {currentScene.key} {currentScene.scale} • {currentScene.bpm || project?.bpm} BPM
              </p>
            </div>
            <div className="flex gap-2" data-tutorial="playback" role="toolbar" aria-label="Playback controls">
              <Button 
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </Button>
              <Button 
                onClick={handleStop} 
                variant="secondary"
                aria-label="Stop playback"
              >
                ⏹ Stop
              </Button>
              <Button 
                onClick={() => setShowMidiExport(true)} 
                variant="secondary"
                aria-label="Export MIDI file"
              >
                🎹 Export MIDI
              </Button>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="flex-1 overflow-auto p-4">
          <TrackList sceneId={currentScene.id} />
        </div>
      </div>
    </>
  );
}
