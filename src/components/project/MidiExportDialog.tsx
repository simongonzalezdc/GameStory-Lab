import { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { exportSceneToMidi } from '@/lib/io/midi-export';
import type { Scene } from '@/types';

interface MidiExportDialogProps {
  open: boolean;
  onClose: () => void;
  scene: Scene;
}

export default function MidiExportDialog({ open, onClose, scene }: MidiExportDialogProps) {
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(
    new Set(scene.tracks.map((t) => t.id))
  );
  const [separateFiles, setSeparateFiles] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string>('');

  const handleToggleTrack = (trackId: string) => {
    const newSelected = new Set(selectedTracks);
    if (newSelected.has(trackId)) {
      newSelected.delete(trackId);
    } else {
      newSelected.add(trackId);
    }
    setSelectedTracks(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedTracks(new Set(scene.tracks.map((t) => t.id)));
  };

  const handleDeselectAll = () => {
    setSelectedTracks(new Set());
  };

  const handleExport = async () => {
    if (selectedTracks.size === 0) {
      setError('Please select at least one track to export');
      return;
    }

    try {
      setExporting(true);
      setError('');
      setExportSuccess(false);

      await exportSceneToMidi(scene, {
        trackIds: Array.from(selectedTracks),
        filenamePrefix: scene.name,
        separateFiles,
      });

      setExportSuccess(true);
      setTimeout(() => {
        onClose();
        setExportSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('MIDI export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleClose = () => {
    if (!exporting) {
      setError('');
      setExportSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Export to MIDI">
      <div className="space-y-4">
        {exportSuccess ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            ✓ MIDI file{separateFiles && selectedTracks.size > 1 ? 's' : ''} exported successfully!
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600">
              Export your scene as MIDI files that can be imported into any DAW or music software.
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Track Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Select Tracks</label>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAll}
                    className="text-xs text-forest-600 hover:underline"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-64 overflow-y-auto">
                {scene.tracks.map((track) => (
                  <label
                    key={track.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTracks.has(track.id)}
                      onChange={() => handleToggleTrack(track.id)}
                      className="w-4 h-4 text-forest-600 border-gray-300 rounded focus:ring-forest-500"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {track.name || track.role}
                      </div>
                      <div className="text-xs text-gray-500">
                        {track.clips.length} clip{track.clips.length !== 1 ? 's' : ''} •{' '}
                        {track.role}
                      </div>
                    </div>
                    {track.muted && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        Muted
                      </span>
                    )}
                  </label>
                ))}
              </div>

              <div className="text-xs text-gray-500 mt-2">
                {selectedTracks.size} of {scene.tracks.length} tracks selected
              </div>
            </div>

            {/* Export Options */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Export Mode</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={!separateFiles}
                    onChange={() => setSeparateFiles(false)}
                    className="w-4 h-4 text-forest-600 border-gray-300 focus:ring-forest-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Single MIDI file</div>
                    <div className="text-xs text-gray-500">
                      All tracks in one file (multi-track MIDI)
                    </div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    checked={separateFiles}
                    onChange={() => setSeparateFiles(true)}
                    className="w-4 h-4 text-forest-600 border-gray-300 focus:ring-forest-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Separate files</div>
                    <div className="text-xs text-gray-500">
                      One MIDI file per track ({selectedTracks.size} files)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Export Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs text-blue-800">
                <strong>Export Details:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Scene: {scene.name}</li>
                  <li>Tempo: {scene.bpm || 120} BPM</li>
                  <li>Key: {scene.key} {scene.scale}</li>
                  <li>
                    Format: {separateFiles ? `${selectedTracks.size} separate MIDI files` : 'Multi-track MIDI file'}
                  </li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Actions */}
        {!exportSuccess && (
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={handleClose} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting || selectedTracks.size === 0}>
              {exporting ? 'Exporting...' : 'Export MIDI'}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
