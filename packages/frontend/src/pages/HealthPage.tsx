/**
 * Health Page
 * System status and diagnostics
 */

import { useEffect, useState } from 'react';
import { healthAPI } from '../services/api';
import { ProjectAssistantPanel } from '../components/ProjectAssistantPanel';

interface HealthStatus {
  status: string;
  timestamp: string;
  database: string;
  ai: {
    clients: Array<{ name: string; type: string; available: boolean }>;
    currentHourCost: number;
    costLimit: number;
  };
}

export function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assistant panel state
  const [showAssistant, setShowAssistant] = useState(() => {
    // Load visibility preference from localStorage
    return localStorage.getItem('assistantVisible') !== 'false';
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Save assistant visibility preference
  useEffect(() => {
    localStorage.setItem('assistantVisible', showAssistant.toString());
  }, [showAssistant]);

  const loadHealth = async () => {
    try {
      setLoading(true);
      const data = await healthAPI.check();
      setHealth(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check health');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-semibold text-primary mb-2">System Status</h3>
        <p className="text-secondary max-w-md mx-auto mb-8">
          Check system health, AI provider status, and cost monitoring
        </p>
        <button
          onClick={loadHealth}
          disabled={loading}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-brand-primary-hover transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-primary mb-2">System Status</h2>
          <p className="text-secondary max-w-md mx-auto mb-8">
            Monitor backend health and AI providers
          </p>
        </div>
        <button
          onClick={loadHealth}
          disabled={loading}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-brand-primary-hover transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <span>🔄</span>
              <span>Refresh</span>
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-error/20 border border-error rounded-lg p-4 mb-6">
          <p className="text-error">{error}</p>
        </div>
      )}
      
      {health && (
        <div className="space-y-6">
          <div className="surface-card rounded-lg shadow-sm border border-subtle p-6">
            <p className="text-sm text-tertiary mb-4">
              Last checked: {new Date(health.timestamp).toLocaleString()}
            </p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-primary mb-2">Database</h4>
                <p className="text-secondary">{health.database}</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-primary mb-2">AI Providers</h4>
                <ul className="space-y-2">
                  {health.ai.clients.map((client, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span className="text-secondary">
                        {client.name} ({client.type})
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        client.available 
                          ? 'bg-success/20 border border-success text-success' 
                          : 'bg-error/20 border border-error text-error'
                      }`}>
                        {client.available ? 'Available' : 'Offline'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-primary mb-2">Cost Tracking</h4>
                <p className="text-secondary mb-2">
                  Current hour: ${health.ai.currentHourCost.toFixed(4)} / ${health.ai.costLimit.toFixed(2)}
                </p>
                <div className="w-full bg-surface-muted rounded-full h-2 mb-2">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((health.ai.currentHourCost / health.ai.costLimit) * 100, 100)}%`,
                      backgroundColor: health.ai.currentHourCost / health.ai.costLimit > 0.8 
                        ? 'var(--color-error)' 
                        : health.ai.currentHourCost / health.ai.costLimit > 0.6 
                          ? 'var(--color-warning)' 
                          : 'var(--color-success)'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Assistant Panel */}
    {showAssistant && (
      <div className="fixed right-4 top-20 bottom-28 w-96 z-40 bg-surface rounded-2xl shadow-2xl border border-border-subtle overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-border-subtle bg-surface-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">AI Assistant</h3>
              <button
                onClick={() => setShowAssistant(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                title="Close assistant"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Assistant Content */}
          <div className="flex-1 min-h-0">
            {selectedProjectId ? (
              <ProjectAssistantPanel
                projectId={selectedProjectId}
                type="concept"
                onProposalAccepted={async () => {
                  // Refresh health data if needed
                  await loadHealth();
                }}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Health Assistant
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                  Need help interpreting health metrics or troubleshooting issues? Chat with the AI assistant.
                </p>
                <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  <p>• Understand system status</p>
                  <p>• Troubleshoot AI provider issues</p>
                  <p>• Get optimization suggestions</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
