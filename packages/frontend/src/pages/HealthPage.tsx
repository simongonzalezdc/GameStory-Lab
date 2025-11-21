/**
 * Health Page
 * System status and diagnostics
 */

import { useEffect, useState } from 'react';
import { healthAPI } from '../services/api';

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
          className="btn btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
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
          className="btn btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50 flex items-center gap-2"
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
    </>
  );
}
