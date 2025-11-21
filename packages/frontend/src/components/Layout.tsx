/**
 * Main Layout Component
 * Provides navigation and consistent page structure
 * Memoized for performance optimization
 */

import React, { useEffect, useState, memo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FolderKanban, Settings, Sparkles } from 'lucide-react';
import { CursorGlow } from './CursorGlow';

interface LayoutProps {
  children: React.ReactNode;
}

// Navigation items constant (defined outside component to prevent recreation)
const NAV_ITEMS = [
  { path: '/', label: 'Projects', icon: FolderKanban },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

function LayoutComponent({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const projectMatch = location.pathname.match(/^\/projects\/([^/]+)(?:$|\/)/);
  const activeProjectId = projectMatch ? projectMatch[1] : null;

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const seenTutorial = localStorage.getItem('tutorial_seen');
    if (!seenTutorial && location.pathname !== '/tutorial') {
      localStorage.setItem('tutorial_seen', 'true');
      navigate('/tutorial');
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const isFullWidth = location.pathname.includes('/projects/') || location.pathname.includes('/architect');

return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] transition-colors flex flex-col relative overflow-hidden">
      <CursorGlow />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-[rgba(17,16,21,0.82)] backdrop-blur-2xl shadow-[0_20px_60px_rgba(11,8,15,0.75)]">
        <div className="absolute inset-0 pointer-events-none opacity-70" style={{ background: 'radial-gradient(circle at 20% -10%, color-mix(in srgb, var(--jewel-garnet) 25%, transparent) 0%, transparent 45%), radial-gradient(circle at 80% 0%, color-mix(in srgb, var(--jewel-topaz) 20%, transparent) 0%, transparent 50%)' }} />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group transition-opacity hover:opacity-90"
              aria-label="GameStory Lab Home"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-brand-to-br text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                GS
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-tertiary uppercase tracking-[0.12em]">
                  GameStory Lab
                </div>
                <div className="-mt-0.5">
                  <h1 className="text-base font-semibold text-primary">AI Game Design Tool</h1>
                </div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-2" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const normalizedPath = item.path.split('#')[0];
                const isActive = location.pathname === normalizedPath || location.pathname + location.hash === item.path;
                const Icon = item.icon;
                const isSettings = item.path === '/settings';

                if (isSettings) {
                  return (
                    <div key={item.path} className="relative" ref={settingsRef}>
                      <button
                        type="button"
                        onClick={() => setShowSettingsMenu((open) => !open)}
                        className={`flex items-center gap-2 nav-button text-sm font-semibold transition-all duration-200 border ${
                          showSettingsMenu
                            ? 'bg-surface-card text-primary border-brand-400 shadow-md'
                            : 'text-secondary border-transparent hover:border-subtle hover:bg-surface-elevated'
                        }`}
                        aria-expanded={showSettingsMenu}
                        aria-haspopup="menu"
                      >
                        <span className={`avatar avatar-sm flex items-center justify-center ${showSettingsMenu ? 'bg-brand-500/15 text-brand-700 dark:text-brand-100' : 'bg-surface-elevated text-tertiary'} border border-subtle`}>
                          <Icon className="w-4 h-4" strokeWidth={1.75} />
                        </span>
                        <span>{item.label}</span>
                      </button>
                      {showSettingsMenu && (
                        <div className="absolute right-0 mt-2 w-64 nav-dropdown overflow-hidden z-50">
                          <div className="px-4 py-3 border-b border-subtle bg-surface-card">
                            <p className="text-sm font-semibold text-primary">Workspace Settings</p>
                            <p className="text-xs text-tertiary">Tutorial & status live here now.</p>
                          </div>
                          <div className="flex flex-col">
                            <Link
                              to="/templates"
                              className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-surface-elevated transition"
                              onClick={() => setShowSettingsMenu(false)}
                            >
                              <span className="mt-0.5 text-brand-600 dark:text-brand-300">🎨</span>
                              <div>
                                <p className="font-semibold text-primary">Browse Templates</p>
                                <p className="text-xs text-tertiary">Start from pre-made game concepts.</p>
                              </div>
                            </Link>
                            <Link
                              to="/tutorial"
                              className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-surface-elevated transition"
                              onClick={() => setShowSettingsMenu(false)}
                            >
                              <span className="mt-0.5 text-brand-600 dark:text-brand-300">✨</span>
                              <div>
                                <p className="font-semibold text-primary">View Tutorial</p>
                                <p className="text-xs text-tertiary">Replay the guided experience any time.</p>
                              </div>
                            </Link>
                            <Link
                              to="/health"
                              className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-surface-elevated transition"
                              onClick={() => setShowSettingsMenu(false)}
                            >
                              <span className="mt-0.5 text-green-600 dark:text-green-300">📡</span>
                              <div>
                                <p className="font-semibold text-primary">System Status</p>
                                <p className="text-xs text-tertiary">API, AI providers, and rate limits.</p>
                              </div>
                            </Link>
                            <button
                              type="button"
                              className="flex items-start gap-3 px-4 py-3 text-sm text-left hover:bg-surface-elevated transition"
                              onClick={() => {
                                localStorage.removeItem('tutorial_seen');
                                setShowSettingsMenu(false);
                                if (location.pathname !== '/tutorial') {
                                  navigate('/tutorial');
                                }
                              }}
                            >
                              <span className="mt-0.5 text-tertiary">🔁</span>
                              <div>
                                <p className="font-semibold text-primary">Reset Tutorial</p>
                                <p className="text-xs text-tertiary">Show the intro experience again.</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 nav-button text-sm font-semibold transition-all duration-200 border ${
                      isActive
                        ? 'bg-surface-card text-primary border-brand-400 shadow-md'
                        : 'text-secondary border-transparent hover:border-subtle hover:bg-surface-elevated'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={`avatar avatar-sm flex items-center justify-center ${isActive ? 'bg-brand-500/15 text-brand-700 dark:text-brand-100' : 'bg-surface-elevated text-tertiary'} border border-subtle`}>
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                to="/templates"
                className="hidden sm:inline-flex items-center gap-2 btn gradient-brand-primary text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                style={{ boxShadow: '0 10px 30px -12px rgba(63, 93, 168, 0.55)' }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Explore Templates</span>
              </Link>
              {activeProjectId && (
                <Link
                  to={`/projects/${activeProjectId}/architect`}
                  className="hidden sm:inline-flex items-center gap-2 btn border border-subtle text-primary hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-200 transition"
                >
                  🏗️ <span>Project Architect</span>
                </Link>
              )}
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-between border-t border-border-subtle/60 pt-3 mt-3 text-xs text-tertiary">
            <div className="flex items-center gap-3">
              <span className="signal-pill signal-pill--accent">Workspace cockpit</span>
              <span className="signal-pill">Build · Garnet 0.7</span>
              <span className="signal-pill">Latency · 42ms</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="signal-pill">AI providers · stable</span>
              <span className="signal-pill">Cursor Glow enabled</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {location.pathname.includes('/architect') ? (
        <main className="w-full h-[calc(100vh-4rem)] overflow-hidden px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      ) : (
        <main className={`mx-auto ${isFullWidth ? 'max-w-full px-0' : 'max-w-7xl px-4 sm:px-6 lg:px-8'} py-6 lg:py-8 pb-24 lg:pb-32 flex-1 flex flex-col min-h-0`}>
          {children}
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-[var(--color-surface-card)] mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-secondary space-y-2">
            <p className="font-medium text-primary">
              Crafted for player-first storytelling.{' '}
              <a 
                href="mailto:team@gamestory.lab" 
                className="font-semibold text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 underline underline-offset-2 transition-colors"
              >
                Share feedback
              </a>
            </p>
            <p>
              <Link 
                to="/tutorial"
                className="font-medium text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 underline underline-offset-2 transition-colors"
              >
                Read the Tutorial
              </Link>
              {' • '}
              <a 
                href="https://github.com/Pastorsimon1798/GameStory-Lab" 
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 underline underline-offset-2 transition-colors"
              >
                View on GitHub
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Export memoized version to prevent unnecessary re-renders
export const Layout = memo(LayoutComponent);
