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
        <section className="lg:col-span-2 bg-[var(--color-surface-elevated)] rounded-xl p-4 sm:p-6 border border-[var(--color-border-subtle)]">
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
                className="p-4 rounded-lg border border-border-subtle"
                style={{
                  background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--jewel-fireopal) 8%, var(--color-surface-card)), color-mix(in srgb, var(--jewel-topaz) 12%, var(--color-surface-elevated)))',
                  borderColor: 'color-mix(in srgb, var(--jewel-topaz) 30%, var(--color-border-subtle))',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-primary">{safeString((resource as any).name, 'Resource')}</h4>
                  {(resource as any).scarcity && (
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      (resource as any).scarcity === 'abundant'
                        ? 'validation-success'
                        : (resource as any).scarcity === 'balanced'
                        ? 'validation-warning'
                        : 'validation-error'
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
                className="flex items-start gap-3 p-3 validation-success rounded-lg"
              >
                <span className="text-[var(--color-success)] font-bold mt-0.5">✓</span>
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
                className="flex items-start gap-3 p-3 validation-error rounded-lg"
              >
                <span className="text-[var(--color-danger)] font-bold mt-0.5">✗</span>
                <span className="text-secondary flex-1">{condition}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tutorial System - Special handling */}
      {mechanics.tutorialSystem && typeof mechanics.tutorialSystem === 'object' && (
        <section className="lg:col-span-2 jewel-card p-4 sm:p-6">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span>Tutorial System</span>
          </h3>
          {mechanics.tutorialSystem.phases && Array.isArray(mechanics.tutorialSystem.phases) ? (
            <div className="space-y-4">
              {mechanics.tutorialSystem.phases.map((phase: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-subtle)]"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl font-bold text-[var(--color-brand-primary)]">
                      Run {phase.run || index + 1}
                    </span>
                    {phase.focus && (
                      <span className="text-primary font-semibold">{phase.focus}</span>
                    )}
                  </div>
                  {phase.unlockedActions && Array.isArray(phase.unlockedActions) && phase.unlockedActions.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-semibold text-secondary mb-2">Unlocked Actions:</h4>
                      <ul className="space-y-1.5">
                        {phase.unlockedActions.map((action: string, actionIndex: number) => (
                          <li
                            key={actionIndex}
                            className="flex items-start gap-2 text-secondary"
                          >
                            <span className="text-[var(--color-brand-primary)] mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <div className="text-xs font-medium mb-1.5 px-2 py-1 rounded-t-md inline-block"
                style={{ 
                  backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 80%, transparent)',
                  color: 'var(--color-text-tertiary)',
                  borderBottom: '1px solid var(--color-border-subtle)'
                }}
              >
                JSON
              </div>
              <pre
                className="code-block text-[var(--color-text-primary)] overflow-auto font-mono text-sm leading-relaxed rounded-md rounded-tl-none"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 60%, transparent)',
                  border: '1px solid var(--color-border-subtle)',
                  padding: '0.75rem',
                  marginTop: '0',
                }}
              >
                <code className="whitespace-pre-wrap break-words">
                  {JSON.stringify(mechanics.tutorialSystem, null, 2)}
                </code>
              </pre>
            </div>
          )}
        </section>
      )}

      {/* Additional Fields */}
      {Object.entries(mechanics).map(([key, value]) => {
        // Skip already rendered fields
        if (['coreLoop', 'playerActions', 'progressionSystems', 'progressionSystem', 'resourceSystems', 'winConditions', 'failConditions', 'tutorialSystem'].includes(key)) {
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
                    {typeof item === 'object' ? (
                      <div className="relative">
                        <div className="text-xs font-medium mb-1.5 px-2 py-1 rounded-t-md inline-block"
                          style={{ 
                            backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 80%, transparent)',
                            color: 'var(--color-text-tertiary)',
                            borderBottom: '1px solid var(--color-border-subtle)'
                          }}
                        >
                          JSON
                        </div>
                        <pre
                          className="code-block text-[var(--color-text-primary)] overflow-auto font-mono text-xs leading-relaxed rounded-md rounded-tl-none"
                          style={{
                            backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 60%, transparent)',
                            border: '1px solid var(--color-border-subtle)',
                            padding: '0.5rem',
                            marginTop: '0',
                          }}
                        >
                          <code className="whitespace-pre-wrap break-words">
                            {JSON.stringify(item, null, 2)}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      String(item)
                    )}
                  </li>
                ))}
              </ul>
            ) : typeof value === 'object' ? (
              <div className="relative">
                <div className="text-xs font-medium mb-1.5 px-2 py-1 rounded-t-md inline-block"
                  style={{ 
                    backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 80%, transparent)',
                    color: 'var(--color-text-tertiary)',
                    borderBottom: '1px solid var(--color-border-subtle)'
                  }}
                >
                  JSON
                </div>
                <pre
                  className="code-block text-[var(--color-text-primary)] overflow-auto font-mono text-sm leading-relaxed rounded-md rounded-tl-none"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-surface-panel) 60%, transparent)',
                    border: '1px solid var(--color-border-subtle)',
                    padding: '0.75rem',
                    marginTop: '0',
                  }}
                >
                  <code className="whitespace-pre-wrap break-words">
                    {JSON.stringify(value, null, 2)}
                  </code>
                </pre>
              </div>
            ) : (
              <p className="text-secondary whitespace-pre-wrap">{String(value)}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}
