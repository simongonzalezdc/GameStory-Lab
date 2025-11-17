import { useProjectStore } from '@/stores/project-store';
import { useAudioStore } from '@/stores/audio-store';
import { Button } from '../ui/Button';
import TrackList from './TrackList';
import MidiExportDialog from '../project/MidiExportDialog';
import { getAudioEngine } from '@/lib/audio/engine';
import { useEffect, useState } from 'react';
import { useKeyboardShortcuts, isTypingInInput } from '@/hooks/useKeyboardShortcuts';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

export default function SceneEditor() {
  const { project, currentSceneId, setCurrentScene } = useProjectStore();
  const { isPlaying, setPlaying } = useAudioStore();
  const audioEngine = getAudioEngine();
  const [showMidiExport, setShowMidiExport] = useState(false);

  const currentScene = project?.scenes.find(s => s.id === currentSceneId);

  useEffect(() => {
    if (currentScene) {
      audioEngine.loadScene(currentScene).catch((error) => {
        errorHandler.handle(error, 'Scene Loading', ErrorSeverity.ERROR);
      });
    }
  }, [currentScene]);

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

  const handlePlayPause = async () => {
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
  };

  const handleStop = () => {
    audioEngine.stop();
    setPlaying(false);
  };

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
  ]);

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
            <div className="flex gap-2" data-tutorial="playback">
              <Button onClick={handlePlayPause}>
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </Button>
              <Button onClick={handleStop} variant="secondary">
                ⏹ Stop
              </Button>
              <Button onClick={() => setShowMidiExport(true)} variant="secondary">
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
