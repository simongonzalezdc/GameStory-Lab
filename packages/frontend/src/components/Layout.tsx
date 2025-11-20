/**
 * Main Layout Component
 * Provides navigation and consistent page structure
 * Memoized for performance optimization
 */

import React, { useEffect, useState, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const IconProjects = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path d="M5 7.5A1.5 1.5 0 016.5 6h11A1.5 1.5 0 0119 7.5V18a.5.5 0 01-.5.5H5.5a.5.5 0 01-.5-.5V7.5Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconTemplates = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path d="M5 8h14M5 12h14M5 16h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const IconBook = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path d="M6.5 5.5H17a1.5 1.5 0 011.5 1.5v10.5a.5.5 0 01-.8.4l-1.7-1.3a2 2 0 00-1.2-.4H7a1.5 1.5 0 01-1.5-1.5V7A1.5 1.5 0 016.5 5.5Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 9h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconPulse = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
    <path d="M4 13h3.5l2-6 3 12 2.5-7H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Navigation items constant (defined outside component to prevent recreation)
const NAV_ITEMS = [
  { path: '/', label: 'Projects', icon: IconProjects },
  { path: '/templates', label: 'Templates', icon: IconTemplates },
  { path: '/tutorial', label: 'Tutorial', icon: IconBook },
  { path: '/health', label: 'Status', icon: IconPulse },
] as const;

function LayoutComponent({ children }: LayoutProps) {
  const location = useLocation();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    setIsDark(true);
  }, []);

  const isFullWidth = location.pathname.includes('/projects/') || location.pathname.includes('/architect');

  return (
    <div className="min-h-screen bg-[linear-gradient(140deg,rgba(99,102,241,0.05),rgba(20,184,166,0.05)),var(--color-bg-primary)] transition-colors flex flex-col">
      {/* Depth background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-10 w-80 h-80 bg-brand-500/10 dark:bg-brand-500/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[26rem] h-[26rem] bg-mint-500/10 dark:bg-mint-500/15 rounded-full blur-3xl" />
      </div>

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
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
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
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/20">★</span>
                <span>Explore Templates</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`mx-auto ${isFullWidth ? 'max-w-full px-2 sm:px-4 lg:px-6' : 'max-w-7xl px-4 sm:px-6 lg:px-8'} py-6 lg:py-8 flex-1 flex flex-col min-h-0`}>
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-white/75 dark:bg-[rgba(10,15,26,0.9)] backdrop-blur-md mt-16">
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
