/**
 * Lore Viewer Component
 * Displays game lore and story in a readable, formatted way
 */

import type { LoreData } from '@gameforge/shared';

interface LoreViewerProps {
  lore: LoreData;
}

export function LoreViewer({ lore }: LoreViewerProps) {
  if (!lore || Object.keys(lore).length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <p>No lore data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Setting */}
      {lore.setting && (
        <section className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 sm:p-6 border border-purple-200 dark:border-purple-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">🌍</span>
            <span>Setting</span>
          </h3>
          <div className="space-y-3">
            {lore.setting.era && (
              <div className="flex items-start gap-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[80px]">Era:</span>
                <span className="text-slate-700 dark:text-slate-300">{lore.setting.era}</span>
              </div>
            )}
            {lore.setting.location && (
              <div className="flex items-start gap-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[80px]">Location:</span>
                <span className="text-slate-700 dark:text-slate-300">{lore.setting.location}</span>
              </div>
            )}
            {lore.setting.worldType && (
              <div className="flex items-start gap-3">
                <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[80px]">World Type:</span>
                <span className="text-slate-700 dark:text-slate-300">{lore.setting.worldType}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Protagonist */}
      {lore.protagonist && (
        <section className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            <span>Protagonist</span>
          </h3>
          <div className="space-y-4">
            {lore.protagonist.background && (
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Background</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {lore.protagonist.background}
                </p>
              </div>
            )}
            {lore.protagonist.motivation && (
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Motivation</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {lore.protagonist.motivation}
                </p>
              </div>
            )}
            {lore.protagonist.abilities && lore.protagonist.abilities.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Abilities</h4>
                <ul className="space-y-2">
                  {lore.protagonist.abilities.map((ability, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">✨</span>
                      <span className="text-slate-700 dark:text-slate-300 flex-1">{ability}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Conflict */}
      {lore.conflict && (
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <span>Conflict</span>
          </h3>
          {lore.conflict.primary && (
            <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Primary Conflict</h4>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {lore.conflict.primary}
              </p>
            </div>
          )}
          {lore.conflict.secondary && lore.conflict.secondary.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Secondary Conflicts</h4>
              <ul className="space-y-2">
                {lore.conflict.secondary.map((conflict, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                  >
                    <span className="text-orange-600 dark:text-orange-400 font-bold mt-0.5">•</span>
                    <span className="text-slate-700 dark:text-slate-300 flex-1">{conflict}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* World Rules */}
      {lore.worldRules && (
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <span>World Rules</span>
          </h3>
          <div className="space-y-4">
            {lore.worldRules.physics && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Physics</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {lore.worldRules.physics}
                </p>
              </div>
            )}
            {lore.worldRules.magic && (
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Magic</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {lore.worldRules.magic}
                </p>
              </div>
            )}
            {lore.worldRules.technology && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Technology</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {lore.worldRules.technology}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Themes */}
      {lore.themes && lore.themes.length > 0 && (
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">🎭</span>
            <span>Themes</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {lore.themes.map((theme, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full font-medium border border-purple-200 dark:border-purple-800"
              >
                {theme}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Economy */}
      {lore.economy && typeof lore.economy === 'object' && (
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span>Economy</span>
          </h3>
          <div className="space-y-4">
            {Object.entries(lore.economy as Record<string, unknown>).map(([key, value]) => (
              <div key={key} className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {typeof value === 'string' ? value : String(value)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resource Context */}
      {lore.resourceContext && typeof lore.resourceContext === 'object' && (
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">📦</span>
            <span>Resource Context</span>
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(lore.resourceContext as Record<string, unknown>).map(([resourceName, description]) => (
              <div
                key={resourceName}
                className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{resourceName}</h4>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {typeof description === 'string' ? description : String(description)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Resource Logic */}
      {lore.resourceLogic && typeof lore.resourceLogic === 'object' && (
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span>Resource Logic</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(lore.resourceLogic as Record<string, unknown>).map(([resourceName, description]) => {
              if (Array.isArray(description)) {
                return (
                  <div key={resourceName} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{resourceName}</h4>
                    <ul className="space-y-1">
                      {description.map((item, idx) => (
                        <li key={idx} className="text-slate-700 dark:text-slate-300">
                          • {typeof item === 'string' ? item : String(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              if (typeof description === 'object' && description !== null) {
                return (
                  <div key={resourceName} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{resourceName}</h4>
                    <div className="space-y-2">
                      {Object.entries(description as Record<string, unknown>).map(([subKey, subValue]) => (
                        <div key={subKey}>
                          <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {subKey.replace(/([A-Z])/g, ' $1').trim()}:{' '}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {typeof subValue === 'string' ? subValue : String(subValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={resourceName} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{resourceName}</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {typeof description === 'string' ? description : String(description)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tutorial Phase */}
      {lore.tutorialPhase && typeof lore.tutorialPhase === 'object' && (
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span>Tutorial Phase</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(lore.tutorialPhase as Record<string, unknown>).map(([key, value]) => {
              if (Array.isArray(value)) {
                return (
                  <div key={key} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <ul className="space-y-1">
                      {value.map((item, idx) => (
                        <li key={idx} className="text-slate-700 dark:text-slate-300">
                          • {typeof item === 'string' ? item : String(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              if (typeof value === 'object' && value !== null) {
                return (
                  <div key={key} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                        <div key={subKey}>
                          <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {subKey.replace(/([A-Z])/g, ' $1').trim()}:{' '}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {typeof subValue === 'string' ? subValue : String(subValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={key} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {typeof value === 'string' ? value : String(value)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Primary Conflict (enhanced) */}
      {lore.primaryConflict && typeof lore.primaryConflict === 'object' && (
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <span>Primary Conflict</span>
          </h3>
          <div className="space-y-4">
            {Object.entries(lore.primaryConflict as Record<string, unknown>).map(([key, value]) => {
              if (Array.isArray(value)) {
                return (
                  <div key={key} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <ul className="space-y-1">
                      {value.map((item, idx) => (
                        <li key={idx} className="text-slate-700 dark:text-slate-300">
                          • {typeof item === 'string' ? item : String(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              if (typeof value === 'object' && value !== null) {
                return (
                  <div key={key} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(value as Record<string, unknown>).map(([subKey, subValue]) => (
                        <div key={subKey}>
                          <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {subKey.replace(/([A-Z])/g, ' $1').trim()}:{' '}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {typeof subValue === 'string' ? subValue : String(subValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={key} className="p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {typeof value === 'string' ? value : String(value)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Gating Justification */}
      {lore.gatingJustification && typeof lore.gatingJustification === 'object' && (
        <section className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <span className="text-2xl">🚪</span>
            <span>Gating Justification</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(lore.gatingJustification as Record<string, unknown>).map(([gateName, justification]) => {
              if (Array.isArray(justification)) {
                return (
                  <div key={gateName} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{gateName}</h4>
                    <ul className="space-y-1">
                      {justification.map((item, idx) => (
                        <li key={idx} className="text-slate-700 dark:text-slate-300">
                          • {typeof item === 'string' ? item : String(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              if (typeof justification === 'object' && justification !== null) {
                return (
                  <div key={gateName} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{gateName}</h4>
                    <div className="space-y-2">
                      {Object.entries(justification as Record<string, unknown>).map(([subKey, subValue]) => (
                        <div key={subKey}>
                          <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                            {subKey.replace(/([A-Z])/g, ' $1').trim()}:{' '}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {typeof subValue === 'string' ? subValue : String(subValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={gateName} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{gateName}</h4>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {typeof justification === 'string' ? justification : String(justification)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Additional Fields */}
      {Object.entries(lore).map(([key, value]) => {
        // Skip already rendered fields
        if (['setting', 'protagonist', 'conflict', 'worldRules', 'themes', 'resourceLogic', 'resourceContext', 'economy', 'tutorialPhase', 'primaryConflict', 'gatingJustification'].includes(key)) {
          return null;
        }

        // Skip if value is empty/null/undefined
        if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'object' && Object.keys(value).length === 0)) {
          return null;
        }

        return (
          <section key={key} className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-3 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </h3>
            {Array.isArray(value) ? (
              <ul className="space-y-2">
                {value.map((item, index) => (
                  <li key={index} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-slate-700 dark:text-slate-300">
                    {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                  </li>
                ))}
              </ul>
            ) : typeof value === 'object' ? (
              <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg text-sm text-slate-700 dark:text-slate-300 overflow-x-auto">
                {JSON.stringify(value, null, 2)}
              </pre>
            ) : (
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{String(value)}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

