import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const projects = sqliteTable('projects', {
  id: text('id')
    .primaryKey()
    .$default(() => crypto.randomUUID()),
  name: text('name').notNull(),
  path: text('path').notNull(),
  language: text('language').notNull(),
  framework: text('framework'),
  gitUrl: text('git_url'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date()),
});

export const analysisResults = sqliteTable('analysis_results', {
  id: text('id')
    .primaryKey()
    .$default(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  module: text('module').notNull(), // 'quality' | 'docs' | 'license' | 'marketing' | 'deploy'
  results: text('results', { mode: 'json' }).notNull(), // JSON object
  status: text('status').notNull().default('pending'), // 'pending' | 'success' | 'error'
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date()),
});

export const documents = sqliteTable('documents', {
  id: text('id')
    .primaryKey()
    .$default(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'README' | 'API' | 'LICENSE' | 'MARKETING'
  filename: text('filename').notNull(),
  content: text('content').notNull(),
  metadata: text('metadata', { mode: 'json' }), // JSON object
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date()),
});

export const llmUsage = sqliteTable('llm_usage', {
  id: text('id')
    .primaryKey()
    .$default(() => crypto.randomUUID()),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  provider: text('provider').notNull(), // 'ollama' | 'openrouter'
  model: text('model').notNull(),
  tokensInput: integer('tokens_input').notNull(),
  tokensOutput: integer('tokens_output').notNull(),
  cost: real('cost').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$default(() => new Date()),
});

// Type exports for use in application code
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type AnalysisResult = typeof analysisResults.$inferSelect;
export type NewAnalysisResult = typeof analysisResults.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type LLMUsage = typeof llmUsage.$inferSelect;
export type NewLLMUsage = typeof llmUsage.$inferInsert;
