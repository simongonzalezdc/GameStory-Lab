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
        <div className="text-gray-500">Checking system status...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">System Status</h2>
          <p className="text-gray-600 mt-1">Monitor backend health and AI providers</p>
        </div>
        <button
          onClick={loadHealth}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {health && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-4">
              Last checked: {new Date(health.timestamp).toLocaleString()}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">API Status</h3>
                <p className="text-green-700 text-3xl font-bold">
                  {health.status.toUpperCase()}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Database</h3>
                <p className="text-blue-700 text-3xl font-bold">
                  {health.database.toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">AI Providers</h3>
            <div className="space-y-3">
              {health.ai.clients.map((client) => (
                <div
                  key={client.name}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.type}</p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      client.available
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {client.available ? 'Available' : 'Offline'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Cost Tracking</h3>
            <p className="text-yellow-700">
              Current hour: ${health.ai.currentHourCost.toFixed(4)} / $
              {health.ai.costLimit.toFixed(2)} limit
            </p>
            <div className="mt-3 bg-yellow-100 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (health.ai.currentHourCost / health.ai.costLimit) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
