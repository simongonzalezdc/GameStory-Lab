/**
 * Settings dialog component
 */

import { Dialog } from './Dialog';
import ThemeToggle from './ThemeToggle';
import { useThemeStore } from '@/stores/theme-store';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { theme, setTheme } = useThemeStore();

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Settings"
      description="Configure application settings"
    >
      <div className="space-y-6">
        {/* Theme Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Appearance</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Theme
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose your preferred color scheme
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Keyboard Shortcuts</h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Undo</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Z</kbd>
            </div>
            <div className="flex justify-between">
              <span>Redo</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Shift+Z</kbd>
            </div>
            <div className="flex justify-between">
              <span>Export Project</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+S</kbd>
            </div>
            <div className="flex justify-between">
              <span>Toggle AI Chat</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+/</kbd>
            </div>
            <div className="flex justify-between">
              <span>Show Shortcuts</span>
              <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">?</kbd>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

