import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, Zap, Award } from 'lucide-react';

interface GenerationStat {
  timestamp: number;
  model: string;
  success: boolean;
  dimensions: { width: number; height: number };
  generationTime?: number;
  features: string[]; // e.g., ['pixelArt', 'isometric']
}

interface Statistics {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  modelBreakdown: Record<string, number>;
  featureUsage: Record<string, number>;
  averageGenerationTime: number;
  totalGenerationTime: number;
  recentActivity: GenerationStat[];
  streakDays: number;
  lastGenerationDate?: number;
}

const STORAGE_KEY = 'asset-generation-stats';
const MAX_RECENT_ACTIVITY = 50;

export function AssetStatistics() {
  const [stats, setStats] = useState<Statistics>(() => loadStats());
  const [showDetails, setShowDetails] = useState(false);

  function loadStats(): Statistics {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        return {
          totalGenerations: data.totalGenerations || 0,
          successfulGenerations: data.successfulGenerations || 0,
          failedGenerations: data.failedGenerations || 0,
          modelBreakdown: data.modelBreakdown || {},
          featureUsage: data.featureUsage || {},
          averageGenerationTime: data.averageGenerationTime || 0,
          totalGenerationTime: data.totalGenerationTime || 0,
          recentActivity: data.recentActivity || [],
          streakDays: data.streakDays || 0,
          lastGenerationDate: data.lastGenerationDate,
        };
      }
    } catch (e) {
      console.error('Failed to load stats:', e);
    }

    return {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      modelBreakdown: {},
      featureUsage: {},
      averageGenerationTime: 0,
      totalGenerationTime: 0,
      recentActivity: [],
      streakDays: 0,
    };
  }

  function saveStats(newStats: Statistics) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
    setStats(newStats);
  }

  // Expose function globally for other components to record stats
  useEffect(() => {
    (window as any).recordGenerationStat = (stat: GenerationStat) => {
      const newStats = { ...stats };

      // Update counts
      newStats.totalGenerations++;
      if (stat.success) {
        newStats.successfulGenerations++;
      } else {
        newStats.failedGenerations++;
      }

      // Update model breakdown
      newStats.modelBreakdown[stat.model] = (newStats.modelBreakdown[stat.model] || 0) + 1;

      // Update feature usage
      stat.features.forEach((feature) => {
        newStats.featureUsage[feature] = (newStats.featureUsage[feature] || 0) + 1;
      });

      // Update generation time
      if (stat.generationTime) {
        newStats.totalGenerationTime += stat.generationTime;
        newStats.averageGenerationTime = newStats.totalGenerationTime / newStats.totalGenerations;
      }

      // Update recent activity
      newStats.recentActivity = [stat, ...newStats.recentActivity].slice(0, MAX_RECENT_ACTIVITY);

      // Update streak
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (newStats.lastGenerationDate) {
        const daysSinceLastGen = Math.floor((now - newStats.lastGenerationDate) / oneDayMs);
        if (daysSinceLastGen === 0) {
          // Same day, maintain streak
        } else if (daysSinceLastGen === 1) {
          // Next day, increment streak
          newStats.streakDays++;
        } else {
          // Streak broken
          newStats.streakDays = 1;
        }
      } else {
        newStats.streakDays = 1;
      }
      newStats.lastGenerationDate = now;

      saveStats(newStats);
    };
  }, [stats]);

  const successRate = stats.totalGenerations > 0
    ? Math.round((stats.successfulGenerations / stats.totalGenerations) * 100)
    : 0;

  const topModel = Object.entries(stats.modelBreakdown).sort((a, b) => b[1] - a[1])[0];
  const topFeature = Object.entries(stats.featureUsage).sort((a, b) => b[1] - a[1])[0];

  const modelNames: Record<string, string> = {
    openrouter: 'OpenRouter',
    google: 'Google Imagen',
    chatgpt: 'DALL-E 3',
  };

  const featureNames: Record<string, string> = {
    pixelArt: 'Pixel Art',
    multiAngle: 'Multi-Angle',
    colorVariation: 'Color Variations',
    isometric: 'Isometric',
    tileset: 'Tileset',
    animation: 'Animation',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={18} className="text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Statistics</h3>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Total Generations */}
        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <Zap size={14} />
            <span className="text-xs font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
            {stats.totalGenerations}
          </p>
        </div>

        {/* Success Rate */}
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
            <TrendingUp size={14} />
            <span className="text-xs font-medium">Success</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">
            {successRate}%
          </p>
        </div>

        {/* Average Time */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <Clock size={14} />
            <span className="text-xs font-medium">Avg Time</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {stats.averageGenerationTime > 0
              ? `${(stats.averageGenerationTime / 1000).toFixed(1)}s`
              : '—'}
          </p>
        </div>

        {/* Streak */}
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
            <Award size={14} />
            <span className="text-xs font-medium">Streak</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
            {stats.streakDays} {stats.streakDays === 1 ? 'day' : 'days'}
          </p>
        </div>
      </div>

      {/* Detailed Stats */}
      {showDetails && (
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
          {/* Model Breakdown */}
          {Object.keys(stats.modelBreakdown).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                By Model
              </h4>
              <div className="space-y-2">
                {Object.entries(stats.modelBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([model, count]) => {
                    const percentage = Math.round((count / stats.totalGenerations) * 100);
                    return (
                      <div key={model}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">
                            {modelNames[model] || model}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Feature Usage */}
          {Object.keys(stats.featureUsage).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Feature Usage
              </h4>
              <div className="space-y-2">
                {Object.entries(stats.featureUsage)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([feature, count]) => {
                    const percentage = Math.round((count / stats.totalGenerations) * 100);
                    return (
                      <div key={feature}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-700 dark:text-gray-300">
                            {featureNames[feature] || feature}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {count} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Top Model:</strong> {topModel ? modelNames[topModel[0]] || topModel[0] : 'None'}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mt-1">
              <strong>Top Feature:</strong> {topFeature ? featureNames[topFeature[0]] || topFeature[0] : 'None'}
            </p>
            {stats.lastGenerationDate && (
              <p className="text-gray-700 dark:text-gray-300 mt-1">
                <strong>Last Generation:</strong> {new Date(stats.lastGenerationDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
