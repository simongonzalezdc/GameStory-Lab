import { Dialog } from './Dialog';
import type { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { formatShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({ open, onClose }: KeyboardShortcutsHelpProps) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: ' ',
      action: () => {},
      description: 'Play/Pause (in Scene Editor)',
    },
    {
      key: 'Escape',
      action: () => {},
      description: 'Stop playback or close dialog',
    },
    {
      key: 's',
      ctrl: true,
      action: () => {},
      description: 'Save/Export Project',
    },
    {
      key: 'e',
      ctrl: true,
      action: () => {},
      description: 'Export MIDI (in Scene Editor)',
    },
    {
      key: '/',
      ctrl: true,
      action: () => {},
      description: 'Toggle AI Chat',
    },
    {
      key: 'k',
      ctrl: true,
      action: () => {},
      description: 'Toggle AI Chat (alternate)',
    },
    {
      key: 'z',
      ctrl: true,
      shift: false,
      action: () => {},
      description: 'Undo',
    },
    {
      key: 'z',
      ctrl: true,
      shift: true,
      action: () => {},
      description: 'Redo',
    },
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      title="Keyboard Shortcuts"
      description="Use these keyboard shortcuts to speed up your workflow"
    >
      <div className="space-y-4">

        <div className="space-y-2">
          {shortcuts.map((shortcut, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded hover:bg-gray-100 transition"
            >
              <span className="text-sm text-gray-900">{shortcut.description}</span>
              <kbd className="px-3 py-1 bg-white border border-gray-300 rounded shadow-sm font-mono text-sm text-gray-700">
                {formatShortcut(shortcut)}
              </kbd>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
          <strong>Tip:</strong> Shortcuts won't work when typing in text fields. Press <kbd className="px-1 py-0.5 bg-white border border-gray-300 rounded text-xs">?</kbd> to show this help again.
        </div>
      </div>
    </Dialog>
  );
}
