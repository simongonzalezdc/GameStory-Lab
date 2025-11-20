/**
 * Main Layout Component
 * Provides navigation and consistent page structure
 * Memoized for performance optimization
 */

import React, { useEffect, useState, memo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const IconProjects = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path d="M5 7.5A1.5 1.5 0 016.5 6h11A1.5 1.5 0 0119 7.5V18a.5.5 0 01-.5.5H5.5a.5.5 0 01-.5-.5V7.5Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M19.4 12a7.4 7.4 0 00-.1-1l1.7-1.3-1.6-2.8-2 .6a7.5 7.5 0 00-1.8-1L15 2.5h-3.1L11.3 6a7.5 7.5 0 00-1.8 1l-2-.6-1.6 2.8L7.6 11a7.4 7.4 0 000 2l-1.7 1.3 1.6 2.8 2-.6a7.5 7.5 0 001.8 1l.6 3.5H15l.6-3.5a7.5 7.5 0 001.8-1l2 .6 1.6-2.8-1.7-1.3c.1-.3.1-.7.1-1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const IconSpark = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l2.1 5.9L20 11l-5.9 2.1L12 19l-2.1-5.9L4 11l5.9-2.1L12 3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
  </svg>
);

// Navigation items constant (defined outside component to prevent recreation)
const NAV_ITEMS = [
  { path: '/', label: 'Projects', icon: IconProjects },
  { path: '/projects#assistant', label: 'Assistant', icon: IconSpark },
  { path: '/settings', label: 'Settings', icon: IconSettings },
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
    <div className="min-h-screen bg-[var(--color-bg-primary)] transition-colors flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border-subtle bg-white dark:bg-[rgba(12,18,36,0.94)] backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group transition-opacity hover:opacity-90"
              aria-label="GameStory Lab Home"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-mint-500 text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                GS
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-[0.12em]">
                  GameStory Lab
                </div>
                <div className="flex items-center gap-2 -mt-0.5">
                  <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Experience Design OS</h1>
                  <span className="rounded-md bg-brand-50 dark:bg-brand-900/40 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 dark:text-brand-200 border border-brand-100/60 dark:border-brand-800/70">
                    Beta
                  </span>
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
                const isAssistant = item.path.includes('#assistant');

                if (isSettings) {
                  return (
                    <div key={item.path} className="relative" ref={settingsRef}>
                      <button
                        type="button"
                        onClick={() => setShowSettingsMenu((open) => !open)}
                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 border ${
                          showSettingsMenu
                            ? 'bg-surface-card text-slate-900 dark:text-white border-brand-400 shadow-md'
                            : 'text-slate-600 dark:text-slate-300 border-transparent hover:border-border-subtle hover:bg-surface-elevated dark:hover:bg-surface-elevated'
                        }`}
                        aria-expanded={showSettingsMenu}
                        aria-haspopup="menu"
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center ${showSettingsMenu ? 'bg-brand-500/15 text-brand-700 dark:text-brand-100' : 'bg-surface-elevated text-slate-500 dark:text-slate-300'} border border-border-subtle`}>
                          <Icon />
                        </span>
                        <span>{item.label}</span>
                      </button>
                      {showSettingsMenu && (
                        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border-subtle bg-white dark:bg-slate-900 shadow-lg overflow-hidden z-50">
                          <div className="px-4 py-3 border-b border-border-subtle bg-surface-card dark:bg-slate-800/70">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Workspace Settings</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Tutorial & status live here now.</p>
                          </div>
                          <div className="flex flex-col">
                            <Link
                              to="/tutorial"
                              className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-surface-elevated dark:hover:bg-slate-800 transition"
                              onClick={() => setShowSettingsMenu(false)}
                            >
                              <span className="mt-0.5 text-brand-600 dark:text-brand-300">✨</span>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">View Tutorial</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Replay the guided experience any time.</p>
                              </div>
                            </Link>
                            <Link
                              to="/health"
                              className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-surface-elevated dark:hover:bg-slate-800 transition"
                              onClick={() => setShowSettingsMenu(false)}
                            >
                              <span className="mt-0.5 text-green-600 dark:text-green-300">📡</span>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">System Status</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">API, AI providers, and rate limits.</p>
                              </div>
                            </Link>
                            <button
                              type="button"
                              className="flex items-start gap-3 px-4 py-3 text-sm text-left hover:bg-surface-elevated dark:hover:bg-slate-800 transition"
                              onClick={() => {
                                localStorage.removeItem('tutorial_seen');
                                setShowSettingsMenu(false);
                                if (location.pathname !== '/tutorial') {
                                  navigate('/tutorial');
                                }
                              }}
                            >
                              <span className="mt-0.5 text-slate-600 dark:text-slate-300">🔁</span>
                              <div>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">Reset Tutorial</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">Show the intro experience again.</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                if (isAssistant) {
                  return (
                    <button
                      key="assistant-nav"
                      type="button"
                      onClick={() => {
                        // Jump to an active project assistant if available; otherwise go to projects list
                        if (activeProjectId) {
                          navigate(`/projects/${activeProjectId}`, { state: { focusAssistant: true } });
                        } else {
                          navigate('/projects', { state: { focusAssistant: true } });
                        }
                      }}
                      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 border ${
                        isActive
                          ? 'bg-surface-card text-slate-900 dark:text-white border-brand-400 shadow-md'
                          : 'text-slate-600 dark:text-slate-300 border-transparent hover:border-border-subtle hover:bg-surface-elevated dark:hover:bg-surface-elevated'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-brand-500/15 text-brand-700 dark:text-brand-100' : 'bg-surface-elevated text-slate-500 dark:text-slate-300'} border border-border-subtle`}>
                        <Icon />
                      </span>
                      <span>Assistant</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 border ${
                      isActive
                        ? 'bg-surface-card text-slate-900 dark:text-white border-brand-400 shadow-md'
                        : 'text-slate-600 dark:text-slate-300 border-transparent hover:border-border-subtle hover:bg-surface-elevated dark:hover:bg-surface-elevated'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-brand-500/15 text-brand-700 dark:text-brand-100' : 'bg-surface-elevated text-slate-500 dark:text-slate-300'} border border-border-subtle`}>
                      <Icon />
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
                className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-600 to-mint-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
                style={{ boxShadow: '0 10px 30px -12px rgba(63, 93, 168, 0.55)' }}
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/20">★</span>
                <span>Explore Templates</span>
              </Link>
              {activeProjectId && (
                <Link
                  to={`/projects/${activeProjectId}/architect`}
                  className="hidden sm:inline-flex items-center gap-2 rounded-lg border border-border-subtle px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-100 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-200 transition"
                >
                  🏗️ <span>Project Architect</span>
                </Link>
              )}
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
        <main className={`mx-auto ${isFullWidth ? 'max-w-full px-0' : 'max-w-7xl px-4 sm:px-6 lg:px-8'} py-6 lg:py-8 flex-1 flex flex-col min-h-0`}>
          {children}
        </main>
      )}

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-[var(--color-surface-card)] mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p className="font-medium text-slate-800 dark:text-slate-200">
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
