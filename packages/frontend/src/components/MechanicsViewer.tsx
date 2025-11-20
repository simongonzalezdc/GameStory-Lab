/**
 * Mechanics Viewer Component
 * Displays game mechanics in a readable, formatted way
 */

interface MechanicsViewerProps {
  mechanics: any;
}

export function MechanicsViewer({ mechanics }: MechanicsViewerProps) {
  const safeString = (val: unknown, fallback = '—') => {
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    return fallback;
  };

  if (!mechanics || Object.keys(mechanics).length === 0) {
    return (
      <div className="text-center py-12 text-tertiary">
        <p>No mechanics data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Core Loop - Full Width */}
      {mechanics.coreLoop && (
        <section className="lg:col-span-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            <span>Core Gameplay Loop</span>
          </h3>
          <p className="text-secondary leading-relaxed whitespace-pre-wrap">
            {mechanics.coreLoop}
          </p>
        </section>
      )}

      {/* Player Actions */}
      {Array.isArray(mechanics.playerActions) && mechanics.playerActions.length > 0 && (
        <section className="jewel-card p-4 sm:p-6">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-2xl">🎮</span>
            <span>Player Actions</span>
          </h3>
          <ul className="space-y-2">
            {mechanics.playerActions.map((action: any, index: number) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 bg-surface-muted rounded-lg border border-subtle"
              >
                <span className="text-brand font-bold mt-0.5">•</span>
                <span className="text-secondary flex-1">{action}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Progression Systems */}
      {(mechanics.progressionSystems || mechanics.progressionSystem) && (
        <section className="jewel-card p-4 sm:p-6">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-2xl">📈</span>
            <span>Progression System</span>
            {mechanics.progressionSystems?.type && (
              <span className="ml-auto text-sm font-normal px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full capitalize">
                {mechanics.progressionSystems.type}
              </span>
            )}
          </h3>
            {mechanics.progressionSystems?.mechanics && Array.isArray(mechanics.progressionSystems.mechanics) && mechanics.progressionSystems.mechanics.length > 0 ? (
            <ul className="space-y-2">
              {mechanics.progressionSystems.mechanics.map((mechanic: any, index: number) => (
                <li
                  key={index}
                  className="flex items-start gap-3 p-3 bg-surface-muted rounded-lg border border-subtle"
                >
                  <span className="text-purple-600 dark:text-purple-400 font-bold mt-0.5">→</span>
                  <span className="text-secondary flex-1">{mechanic}</span>
                </li>
              ))}
            </ul>
          ) : mechanics.progressionSystem ? (
            <div className="space-y-3">
              {typeof mechanics.progressionSystem === 'object' && !Array.isArray(mechanics.progressionSystem) ? (
                <>
                  {mechanics.progressionSystem.name && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h4 className="font-semibold text-primary mb-2">
                        {mechanics.progressionSystem.name}
                      </h4>
                      {mechanics.progressionSystem.mechanics && (
                        <div>
                          {Array.isArray(mechanics.progressionSystem.mechanics) ? (
                            <ul className="space-y-2 mt-2">
                              {mechanics.progressionSystem.mechanics.map((mechanic: string, index: number) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-3 p-2 rounded border border-border-subtle"
                                  style={{ background: 'var(--color-surface-muted)' }}
                                >
                                  <span className="text-purple-600 dark:text-purple-400 font-bold mt-0.5">→</span>
                                  <span className="text-secondary flex-1">{mechanic}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-secondary mt-2 whitespace-pre-wrap">
                              {String(mechanics.progressionSystem.mechanics)}
                            </p>
                          )}
                        </div>
                      )}
                      {mechanics.progressionSystem.type && (
                        <span className="inline-block mt-2 text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full capitalize">
                          {mechanics.progressionSystem.type}
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-secondary whitespace-pre-wrap">
                  {String(mechanics.progressionSystem)}
                </p>
              )}
            </div>
          ) : null}
        </section>
      )}

      {/* Resource Systems */}
      {Array.isArray(mechanics.resourceSystems) && mechanics.resourceSystems.length > 0 && (
        <section className="lg:col-span-2 jewel-card p-4 sm:p-6">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-2xl">💎</span>
            <span>Resource Systems</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {mechanics.resourceSystems.map((resource: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-primary">{safeString((resource as any).name, 'Resource')}</h4>
                  {(resource as any).scarcity && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      (resource as any).scarcity === 'abundant'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : (resource as any).scarcity === 'balanced'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                    }`}>
                      {safeString((resource as any).scarcity)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary">{safeString((resource as any).mechanics)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Win Conditions */}
      {Array.isArray(mechanics.winConditions) && mechanics.winConditions.length > 0 && (
        <section className="jewel-card p-4 sm:p-6">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-2xl">🏆</span>
            <span>Win Conditions</span>
          </h3>
          <ul className="space-y-2">
            {mechanics.winConditions.map((condition: any, index: number) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <span className="text-green-600 dark:text-green-400 font-bold mt-0.5">✓</span>
                <span className="text-secondary flex-1">{condition}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Fail Conditions */}
      {Array.isArray(mechanics.failConditions) && mechanics.failConditions.length > 0 && (
        <section className="jewel-card p-4 sm:p-6">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <span>Fail Conditions</span>
          </h3>
          <ul className="space-y-2">
            {mechanics.failConditions.map((condition: any, index: number) => (
              <li
                key={index}
                className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
              >
                <span className="text-red-600 dark:text-red-400 font-bold mt-0.5">✗</span>
                <span className="text-secondary flex-1">{condition}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Additional Fields */}
      {Object.entries(mechanics).map(([key, value]) => {
        // Skip already rendered fields
        if (['coreLoop', 'playerActions', 'progressionSystems', 'progressionSystem', 'resourceSystems', 'winConditions', 'failConditions'].includes(key)) {
          return null;
        }

        // Skip if value is empty/null/undefined
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
          return null;
        }

        return (
          <section key={key} className="jewel-card p-4 sm:p-6">
            <h3 className="text-lg font-bold text-primary mb-3 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            {Array.isArray(value) ? (
              <ul className="space-y-2">
                {value.map((item, index) => (
                  <li key={index} className="p-3 bg-surface-muted rounded-lg text-secondary">
                    {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                  </li>
                ))}
              </ul>
            ) : typeof value === 'object' ? (
              <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm text-secondary overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <p className="text-secondary whitespace-pre-wrap">{String(value)}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
