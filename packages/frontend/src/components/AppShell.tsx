/**
 * App Shell Component
 * Professional tool layout with Sidebar + Top Bar + Workspace + Right Panel
 */

import React, { useEffect, useState, memo, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FolderKanban, Settings, Sparkles, ChevronRight, Search, X, MessageSquare, ChevronLeft } from 'lucide-react';
import { CursorGlow } from './CursorGlow';
import { ProjectAssistantPanel } from './ProjectAssistantPanel';

interface AppShellProps {
  children: React.ReactNode;
}

// Navigation items constant
const NAV_ITEMS = [
  { path: '/', label: 'Projects', icon: FolderKanban },
  { path: '/templates', label: 'Templates', icon: Sparkles },
  { path: '/settings', label: 'Settings', icon: Settings },
] as const;

function AppShellComponent({ children }: AppShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(() => {
    // Load visibility preference from localStorage
    return localStorage.getItem('assistantPanelVisible') !== 'false';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const projectMatch = location.pathname.match(/^\/projects\/([^/]+)(?:$|\/)/);
  const activeProjectId = projectMatch ? projectMatch[1] : null;
  
  // Determine assistant type based on route
  const assistantType = location.pathname.includes('/architect') ? 'architect' : 
                        activeProjectId ? 'concept' : 'project';

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // Save right panel visibility preference
  useEffect(() => {
    localStorage.setItem('assistantPanelVisible', showRightPanel.toString());
  }, [showRightPanel]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Command palette keyboard shortcut (CMD+K / CTRL+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const crumbs: Array<{ label: string; path: string }> = [{ label: 'Home', path: '/' }];
    
    if (paths[0] === 'projects') {
      crumbs.push({ label: 'Projects', path: '/projects' });
      if (paths[1]) {
        crumbs.push({ label: activeProjectId || 'Project', path: `/projects/${paths[1]}` });
      }
      if (paths[2] === 'architect') {
        crumbs.push({ label: 'Architect', path: location.pathname });
      }
    } else if (paths[0]) {
      const label = paths[0].charAt(0).toUpperCase() + paths[0].slice(1);
      crumbs.push({ label, path: `/${paths[0]}` });
    }
    
    return crumbs;
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] transition-colors flex relative overflow-hidden">
      <CursorGlow />

      {/* Left Sidebar (Fixed) */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-40 bg-[var(--color-surface-card)] border-r border-[var(--color-border-subtle)] transition-all duration-300 ${
          sidebarCollapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--color-border-subtle)]">
            <Link
              to="/"
              className="flex items-center gap-3 group transition-opacity hover:opacity-90"
              aria-label="GameStory Lab Home"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-mint-500 text-white font-bold text-sm shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                GS
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-bold text-tertiary uppercase tracking-[0.12em] truncate">
                    GameStory Lab
                  </div>
                </div>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label="Main navigation">
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
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                        showSettingsMenu
                          ? 'bg-[var(--brand-primary)]/20 text-primary border-l-2 border-l-[var(--jewel-garnet)]'
                          : isActive
                          ? 'bg-[var(--brand-primary)]/15 text-primary border-l-2 border-l-[var(--jewel-garnet)]'
                          : 'text-secondary border-l-2 border-l-transparent hover:border-l-[var(--color-border-subtle)] hover:bg-[var(--color-surface-elevated)]'
                      }`}
                      aria-expanded={showSettingsMenu}
                      aria-haspopup="menu"
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                    {showSettingsMenu && !sidebarCollapsed && (
                      <div className="absolute left-full ml-2 top-0 w-64 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg shadow-lg overflow-hidden z-50">
                        <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
                          <p className="text-sm font-semibold text-primary">Workspace Settings</p>
                          <p className="text-xs text-tertiary">Tutorial & status live here now.</p>
                        </div>
                        <div className="flex flex-col">
                          <Link
                            to="/templates"
                            className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-[var(--color-surface-elevated)] transition"
                            onClick={() => setShowSettingsMenu(false)}
                          >
                            <span className="mt-0.5 text-brand-600">🎨</span>
                            <div>
                              <p className="font-semibold text-primary">Browse Templates</p>
                              <p className="text-xs text-tertiary">Start from pre-made game concepts.</p>
                            </div>
                          </Link>
                          <Link
                            to="/tutorial"
                            className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-[var(--color-surface-elevated)] transition"
                            onClick={() => setShowSettingsMenu(false)}
                          >
                            <span className="mt-0.5 text-brand-600">✨</span>
                            <div>
                              <p className="font-semibold text-primary">View Tutorial</p>
                              <p className="text-xs text-tertiary">Replay the guided experience any time.</p>
                            </div>
                          </Link>
                          <Link
                            to="/health"
                            className="flex items-start gap-3 px-4 py-3 text-sm hover:bg-[var(--color-surface-elevated)] transition"
                            onClick={() => setShowSettingsMenu(false)}
                          >
                            <span className="mt-0.5 text-green-600">📡</span>
                            <div>
                              <p className="font-semibold text-primary">System Status</p>
                              <p className="text-xs text-tertiary">API, AI providers, and rate limits.</p>
                            </div>
                          </Link>
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
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                    isActive
                      ? 'bg-[var(--brand-primary)]/15 text-primary border-l-2 border-l-[var(--jewel-garnet)]'
                      : 'text-secondary border-l-2 border-l-transparent hover:border-l-[var(--color-border-subtle)] hover:bg-[var(--color-surface-elevated)]'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Collapse Toggle */}
          <div className="flex-shrink-0 p-2 border-t border-[var(--color-border-subtle)]">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-[var(--color-surface-elevated)] transition"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-300 ${sidebarCollapsed ? '' : 'rotate-180'}`}
              />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-[var(--sidebar-width-collapsed)]' : 'ml-[var(--sidebar-width)]'
        } ${showRightPanel ? 'mr-[var(--right-panel-width)]' : ''}`}
      >
        {/* Top Bar (Contextual) */}
        <header className="flex-shrink-0 h-[var(--top-bar-height)] border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-card)] flex items-center px-4 gap-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-secondary flex-1 min-w-0">
            {getBreadcrumbs().map((crumb, index, arr) => (
              <React.Fragment key={crumb.path}>
                {index > 0 && <ChevronRight className="w-3 h-3 flex-shrink-0" />}
                <Link
                  to={crumb.path}
                  className={`truncate ${
                    index === arr.length - 1 ? 'text-primary font-semibold' : 'hover:text-primary'
                  }`}
                >
                  {crumb.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>

          {/* Project Status / Actions */}
          {activeProjectId && (
            <div className="flex items-center gap-2">
              <Link
                to={`/projects/${activeProjectId}/architect`}
                className="px-3 py-1.5 text-xs font-medium border border-[var(--color-border-subtle)] rounded-lg text-secondary hover:text-primary hover:border-[var(--brand-primary)]/40 transition h-8"
              >
                🏗️ Architect
              </Link>
            </div>
          )}

          {/* Command Trigger */}
          <button
            onClick={() => setShowCommandPalette(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-[var(--color-border-subtle)] rounded-lg text-secondary hover:text-primary hover:border-[var(--brand-primary)]/40 transition h-8"
            title="Open command palette (⌘K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">⌘K</span>
          </button>

          {/* AI Assistant Toggle */}
          <button
            onClick={() => setShowRightPanel(!showRightPanel)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium border rounded-lg transition h-8 ${
              showRightPanel
                ? 'bg-[var(--brand-primary)]/20 text-primary border-[var(--brand-primary)]/40'
                : 'border-[var(--color-border-subtle)] text-secondary hover:text-primary hover:border-[var(--brand-primary)]/40'
            }`}
            title={showRightPanel ? 'Hide AI Assistant' : 'Show AI Assistant'}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Assistant</span>
          </button>
        </header>

        {/* Workspace */}
        <main className="flex-1 min-h-0 overflow-auto">
          {children}
        </main>
      </div>

      {/* Right Panel - AI Assistant (Collapsible) */}
      {showRightPanel && (
        <aside
          className={`fixed right-0 top-[var(--top-bar-height)] bottom-0 z-30 bg-[var(--color-surface-card)] border-l border-[var(--color-border-subtle)] transition-all duration-300 w-[var(--right-panel-width)] flex flex-col`}
        >
          {/* Panel Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--brand-primary)]" />
              <h3 className="text-sm font-semibold text-primary">AI Assistant</h3>
            </div>
            <button
              onClick={() => setShowRightPanel(false)}
              className="p-1 hover:bg-[var(--color-surface-elevated)] rounded transition text-secondary hover:text-primary"
              title="Hide assistant panel"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Assistant Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ProjectAssistantPanel
              projectId={activeProjectId}
              type={assistantType}
              mode={assistantType === 'architect' ? 'architect' : 'auto'}
              onProposalAccepted={async () => {
                // Handle proposal acceptance - could trigger page refresh if needed
                console.log('[AppShell] Proposal accepted');
              }}
            />
          </div>
        </aside>
      )}

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
          onClick={() => setShowCommandPalette(false)}
        >
          <div
            className="w-full max-w-lg bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-subtle)]">
              <Search className="w-4 h-4 text-secondary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commands..."
                className="flex-1 bg-transparent text-primary placeholder:text-tertiary focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => setShowCommandPalette(false)}
                className="p-1 hover:bg-[var(--color-surface-elevated)] rounded transition"
              >
                <X className="w-4 h-4 text-secondary" />
              </button>
            </div>
            <div className="p-2 text-sm text-secondary">
              <p className="px-3 py-2 text-tertiary">Command palette coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const AppShell = memo(AppShellComponent);

