import React, { useEffect, useState } from 'react';

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

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Health check failed:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🎮 GameForge Studio
          </h1>
          <p className="text-xl text-gray-600">
            AI-Powered Game Concept Generator
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : health ? (
          <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                System Status
              </h2>
              <p className="text-sm text-gray-500">
                Last checked: {new Date(health.timestamp).toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  API Status
                </h3>
                <p className="text-green-700 text-3xl font-bold">
                  {health.status.toUpperCase()}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Database
                </h3>
                <p className="text-blue-700 text-3xl font-bold">
                  {health.database.toUpperCase()}
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                AI Providers
              </h3>
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

            <div className="border-t pt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Cost Tracking
              </h3>
              <p className="text-yellow-700">
                Current hour: ${health.ai.currentHourCost.toFixed(4)} / $
                {health.ai.costLimit.toFixed(2)} limit
              </p>
            </div>

            <div className="border-t pt-6 text-center">
              <p className="text-gray-600 mb-4">
                ✨ The backend is running successfully!
              </p>
              <p className="text-sm text-gray-500">
                Frontend UI is currently in development. The API is fully functional and ready to use.
              </p>
              <a
                href="https://github.com/Pastorsimon1798/GameStory-Lab"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                View Documentation
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <h3 className="text-xl font-semibold text-red-800 mb-2">
              Backend Offline
            </h3>
            <p className="text-red-600">
              Unable to connect to the API. Please ensure the backend server is running on port 3001.
            </p>
          </div>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Made with ❤️ for indie game developers</p>
        </div>
      </div>
    </div>
  );
}

export default App;
