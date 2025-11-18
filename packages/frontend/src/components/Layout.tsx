/**
 * Main Layout Component
 * Provides navigation and consistent page structure
 * Memoized for performance optimization
 */

import React, { useEffect, useState, useMemo, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

// Navigation items constant (defined outside component to prevent recreation)
const NAV_ITEMS = [
  { path: '/', label: 'Projects', icon: '📁' },
  { path: '/templates', label: 'Templates', icon: '🎨' },
  { path: '/tutorial', label: 'Tutorial', icon: '📖' },
  { path: '/health', label: 'Status', icon: '⚡' },
] as const;

function LayoutComponent({ children }: LayoutProps) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage first, then system preference
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored === 'dark' || (!stored && prefersDark);

    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);

    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-30 dark:opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100 dark:bg-indigo-900/20 rounded-full blur-3xl opacity-30 dark:opacity-20" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-700/80 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 group transition-opacity hover:opacity-90"
              aria-label="GameStory Lab Home"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-lg shadow-md group-hover:shadow-lg transition-shadow">
                GS
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  GameStory Lab
                </div>
                <div className="flex items-center gap-2 -mt-0.5">
                  <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Experience Design OS</h1>
                  <span className="rounded-md bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
                    Beta
                  </span>
                </div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="text-base" aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <Link
                to="/templates"
                className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-slate-900 dark:bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-slate-800 dark:hover:bg-blue-700 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <span>🎯</span>
                <span>Explore Templates</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-slate-600 dark:text-slate-400 space-y-2">
            <p>
              Crafted with care for player-first storytelling.{' '}
              <a 
                href="mailto:team@gamestory.lab" 
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                Share feedback
              </a>
            </p>
            <p>
              <Link 
                to="/tutorial"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors"
              >
                📖 Read the Tutorial
              </Link>
              {' • '}
              <a 
                href="https://github.com/Pastorsimon1798/GameStory-Lab" 
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline underline-offset-2 transition-colors"
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
