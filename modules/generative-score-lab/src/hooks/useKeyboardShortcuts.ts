/**
 * Keyboard shortcuts hook
 * Manages global keyboard shortcuts for the application
 */

import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

/**
 * Hook to register global keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  enabled: boolean = true
): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere if user is typing in an input field
      if (isTypingInInput(event)) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl === undefined || shortcut.ctrl === (event.ctrlKey || event.metaKey);
        const shiftMatches = shortcut.shift === undefined || shortcut.shift === event.shiftKey;
        const altMatches = shortcut.alt === undefined || shortcut.alt === event.altKey;
        const metaMatches = shortcut.meta === undefined || shortcut.meta === event.metaKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, enabled]);
}

/**
 * Check if user is typing in an input field
 */
export function isTypingInInput(event?: KeyboardEvent): boolean {
  if (!event) {
    const activeElement = document.activeElement;
    if (!activeElement) return false;
    
    return (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement instanceof HTMLSelectElement ||
      (activeElement instanceof HTMLElement && activeElement.contentEditable === 'true')
    );
  }

  const target = event.target as HTMLElement;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.contentEditable === 'true'
  );
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // Format key display
  const keyDisplay: { [key: string]: string } = {
    ' ': 'Space',
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    'Delete': 'Del',
    'Backspace': '⌫',
  };

  const key = keyDisplay[shortcut.key] || shortcut.key.toUpperCase();
  parts.push(key);

  return parts.join(isMac ? '' : '+');
}
