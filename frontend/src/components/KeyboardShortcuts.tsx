import { useState, useEffect } from 'react';
import { Keyboard, X } from 'lucide-react';

interface KeyboardShortcutsProps {
  onGenerate?: () => void;
  onExport?: () => void;
  onToggleDarkMode?: () => void;
  onFocusPrompt?: () => void;
}

interface Shortcut {
  key: string;
  description: string;
  modifiers?: string[];
  action: () => void;
  category: 'Generation' | 'Navigation' | 'UI' | 'General';
}

export function KeyboardShortcuts({
  onGenerate,
  onExport,
  onToggleDarkMode,
  onFocusPrompt,
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    // Generation shortcuts
    {
      key: 'g',
      description: 'Trigger generation',
      action: () => onGenerate?.(),
      category: 'Generation',
    },
    {
      key: 'Enter',
      modifiers: ['Ctrl/⌘'],
      description: 'Submit form / Generate',
      action: () => onGenerate?.(),
      category: 'Generation',
    },

    // Navigation shortcuts
    {
      key: 'e',
      description: 'Open export modal',
      action: () => onExport?.(),
      category: 'Navigation',
    },
    {
      key: 'k',
      modifiers: ['Ctrl/⌘'],
      description: 'Focus prompt input',
      action: () => onFocusPrompt?.(),
      category: 'Navigation',
    },
    {
      key: 'Escape',
      description: 'Close modal / Clear focus',
      action: () => {
        setShowHelp(false);
        // Let the event propagate to close other modals
      },
      category: 'Navigation',
    },

    // UI shortcuts
    {
      key: 'd',
      modifiers: ['Ctrl/⌘'],
      description: 'Toggle dark mode',
      action: () => onToggleDarkMode?.(),
      category: 'UI',
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowHelp(true),
      category: 'General',
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input/textarea
      const target = e.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow Ctrl/Cmd + shortcuts even in input fields
      const isModifierCombo = e.ctrlKey || e.metaKey;

      // Escape always works
      if (e.key === 'Escape') {
        setShowHelp(false);
        return;
      }

      // Show help with '?' (shift + /)
      if (e.key === '?' && !isInputField) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // Handle modifier combos
      if (isModifierCombo) {
        if (e.key === 'k') {
          e.preventDefault();
          onFocusPrompt?.();
          return;
        }
        if (e.key === 'd') {
          e.preventDefault();
          onToggleDarkMode?.();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          onGenerate?.();
          return;
        }
      }

      // Handle single-key shortcuts (only when not in input fields)
      if (!isInputField && !isModifierCombo) {
        if (e.key === 'g') {
          e.preventDefault();
          onGenerate?.();
          return;
        }
        if (e.key === 'e') {
          e.preventDefault();
          onExport?.();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onGenerate, onExport, onToggleDarkMode, onFocusPrompt]);

  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <>
      {/* Shortcut Hint Button */}
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all hover:scale-110 z-40"
        title="Keyboard Shortcuts (?)"
      >
        <Keyboard size={20} />
      </button>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Keyboard className="text-purple-600 dark:text-purple-400" size={24} />
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryShortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                        >
                          <span className="text-gray-700 dark:text-gray-300">
                            {shortcut.description}
                          </span>
                          <div className="flex items-center gap-1">
                            {shortcut.modifiers?.map((mod, idx) => (
                              <kbd
                                key={idx}
                                className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono text-gray-800 dark:text-gray-200 shadow-sm"
                              >
                                {mod}
                              </kbd>
                            ))}
                            {shortcut.modifiers && (
                              <span className="text-gray-500 dark:text-gray-400">+</span>
                            )}
                            <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono text-gray-800 dark:text-gray-200 shadow-sm">
                              {shortcut.key}
                            </kbd>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tip */}
              <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  <strong>💡 Pro Tip:</strong> Press <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded text-xs font-mono mx-1">?</kbd> anytime to view this help, or press <kbd className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded text-xs font-mono mx-1">Esc</kbd> to close any modal.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
