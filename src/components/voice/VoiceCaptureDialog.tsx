import { useState, useEffect, useRef } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { PitchDetector, midiToNoteName } from '@/lib/audio/pitch-detection';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';

interface VoiceCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onCapture: (notes: number[]) => void;
}

export default function VoiceCaptureDialog({
  open,
  onClose,
  onCapture,
}: VoiceCaptureDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [capturedNotes, setCapturedNotes] = useState<number[]>([]);
  const [currentNote, setCurrentNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const detectorRef = useRef<PitchDetector | null>(null);
  const lastNoteRef = useRef<number>(-1);
  const noteStabilityRef = useRef<{ note: number; count: number }>({ note: -1, count: 0 });

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (detectorRef.current) {
        detectorRef.current.dispose();
      }
    };
  }, []);

  const handleStartRecording = async () => {
    try {
      setError('');
      setCapturedNotes([]);
      lastNoteRef.current = -1;
      noteStabilityRef.current = { note: -1, count: 0 };

      // Initialize pitch detector
      const detector = new PitchDetector();
      await detector.init();
      detectorRef.current = detector;

      // Start detecting
      detector.start((midi, note) => {
        setCurrentNote(note);

        // Note stability - only capture if note is stable for 3+ detections
        if (midi === noteStabilityRef.current.note) {
          noteStabilityRef.current.count++;
        } else {
          noteStabilityRef.current = { note: midi, count: 1 };
        }

        // Capture note if stable and different from last captured note
        if (noteStabilityRef.current.count >= 3 && midi !== lastNoteRef.current) {
          setCapturedNotes((prev) => [...prev, midi]);
          lastNoteRef.current = midi;
        }
      });

      setIsRecording(true);
    } catch (err) {
      errorHandler.handle(err, 'Voice Capture', ErrorSeverity.ERROR);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    if (detectorRef.current) {
      detectorRef.current.stop();
      detectorRef.current.dispose();
      detectorRef.current = null;
    }
    setIsRecording(false);
    setCurrentNote('');
  };

  const handleSave = () => {
    if (capturedNotes.length === 0) {
      setError('No notes captured. Please record a melody first.');
      return;
    }

    onCapture(capturedNotes);
    handleClose();
  };

  const handleClose = () => {
    handleStopRecording();
    setCapturedNotes([]);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} title="Capture Voice Melody">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Hum or sing a melody into your microphone. The app will detect the pitches and convert
          them to MIDI notes.
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Current Note Display */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <div className="text-sm text-gray-500 mb-2">Current Note</div>
          <div className="text-4xl font-bold text-gray-900">
            {isRecording ? (currentNote || '—') : '—'}
          </div>
        </div>

        {/* Captured Notes Display */}
        <div>
          <div className="text-sm text-gray-700 mb-2">
            Captured Notes ({capturedNotes.length})
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[100px] max-h-[150px] overflow-y-auto">
            {capturedNotes.length === 0 ? (
              <p className="text-gray-400 text-sm text-center">No notes captured yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {capturedNotes.map((midi, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-forest-100 text-forest-800 rounded-full text-sm font-medium"
                  >
                    {midiToNoteName(midi)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center pt-4">
          <div>
            {!isRecording ? (
              <Button onClick={handleStartRecording}>🎤 Start Recording</Button>
            ) : (
              <Button onClick={handleStopRecording} variant="secondary">
                ⏹ Stop Recording
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleClose} disabled={isRecording}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isRecording || capturedNotes.length === 0}>
              Save Melody
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 border-t border-gray-200 pt-4">
          <strong>Tips:</strong>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Hum or sing clearly into your microphone</li>
            <li>Hold each note for at least half a second</li>
            <li>The detector works best with clean, sustained notes</li>
            <li>Background noise may affect accuracy</li>
          </ul>
        </div>
      </div>
    </Dialog>
  );
}
