import { eq, desc } from 'drizzle-orm';
import { db } from './client';
import { projects, analysisResults, documents, llmUsage } from './schema';
import type { NewProject, NewAnalysisResult, NewDocument, NewLLMUsage } from './schema';

// Project queries
export async function createProject(data: NewProject) {
  const [project] = await db.insert(projects).values(data).returning();
  return project;
}

export async function getProject(id: string) {
  return await db.query.projects.findFirst({
    where: eq(projects.id, id),
  });
}

export async function getAllProjects() {
  return await db.query.projects.findMany({
    orderBy: [desc(projects.updatedAt)],
  });
}

export async function updateProject(id: string, data: Partial<NewProject>) {
  const [updated] = await db
    .update(projects)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();
  return updated;
}

export async function deleteProject(id: string) {
  await db.delete(projects).where(eq(projects.id, id));
}

// Analysis queries
export async function createAnalysisResult(data: NewAnalysisResult) {
  const [result] = await db.insert(analysisResults).values(data).returning();
  return result;
}

export async function getAnalysisResults(projectId: string) {
  return await db.query.analysisResults.findMany({
    where: eq(analysisResults.projectId, projectId),
    orderBy: [desc(analysisResults.createdAt)],
  });
}

export async function getLatestAnalysisResult(projectId: string, module: string) {
  return await db.query.analysisResults.findFirst({
    where: (results, { and, eq }) =>
      and(eq(results.projectId, projectId), eq(results.module, module)),
    orderBy: [desc(analysisResults.createdAt)],
  });
}

// Document queries
export async function createDocument(data: NewDocument) {
  const [document] = await db.insert(documents).values(data).returning();
  return document;
}

export async function getDocuments(projectId: string) {
  return await db.query.documents.findMany({
    where: eq(documents.projectId, projectId),
    orderBy: [desc(documents.createdAt)],
  });
}

export async function getDocumentsByType(projectId: string, type: string) {
  return await db.query.documents.findMany({
    where: (docs, { and, eq }) => and(eq(docs.projectId, projectId), eq(docs.type, type)),
    orderBy: [desc(documents.createdAt)],
  });
}

// LLM usage queries
export async function trackLLMUsage(data: NewLLMUsage) {
  const [usage] = await db.insert(llmUsage).values(data).returning();
  return usage;
}

export async function getLLMUsageForProject(projectId: string) {
  return await db.query.llmUsage.findMany({
    where: eq(llmUsage.projectId, projectId),
    orderBy: [desc(llmUsage.createdAt)],
  });
}

export async function getTotalLLMCost(projectId?: string) {
  const results = projectId
    ? await db.query.llmUsage.findMany({
        where: eq(llmUsage.projectId, projectId),
      })
    : await db.query.llmUsage.findMany();

  return results.reduce((total, usage) => total + (usage.cost || 0), 0);
}
