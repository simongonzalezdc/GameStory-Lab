/**
 * AI Project Architect API Routes
 * Handles interview flow and documentation generation
 */

import { Router, Request, Response } from 'express';
import AdmZip from 'adm-zip';
import { architectService } from '../services/architect/architect-service.js';
import { handleApiError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/architect/start
 * Start a new interview session for a project
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PROJECT_ID',
          message: 'Project ID is required',
        },
      });
    }

    const result = architectService.startInterview(projectId);

    logger.info({ message: 'Started architect interview', projectId, sessionId: result.sessionId });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * POST /api/architect/answer
 * Submit an answer to the current question
 */
router.post('/answer', async (req: Request, res: Response) => {
  try {
    const { sessionId, questionId, answer } = req.body;

    if (!sessionId || !questionId || answer === undefined) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'sessionId, questionId, and answer are required',
        },
      });
    }

    const result = architectService.submitAnswer(sessionId, questionId, answer);

    logger.debug({ message: 'Submitted interview answer', sessionId, questionId });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * GET /api/architect/session/:sessionId
 * Get the current session progress
 */
router.get('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const progress = architectService.getSessionProgress(sessionId);

    res.json({
      success: true,
      data: progress,
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * GET /api/architect/questions
 * Get all available interview questions
 */
router.get('/questions', async (_req: Request, res: Response) => {
  try {
    const questions = architectService.getAllQuestions();

    res.json({
      success: true,
      data: {
        questions,
        total: questions.length,
      },
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * POST /api/architect/generate
 * Generate complete documentation package
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { projectId, sessionId } = req.body;

    if (!projectId || !sessionId) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'projectId and sessionId are required',
        },
      });
    }

    logger.info({ message: 'Generating project documentation', projectId, sessionId });

    const documentation = await architectService.generateDocumentation(projectId, sessionId);

    logger.info({
      message: 'Documentation generated successfully',
      projectId,
      documentCount: documentation.documents.length,
    });

    res.json({
      success: true,
      data: {
        projectId: documentation.projectId,
        sessionId: documentation.sessionId,
        documentCount: documentation.documents.length,
        documents: documentation.documents.map((d) => ({
          name: d.templateName,
          generatedAt: d.generatedAt,
          size: d.content.length,
        })),
        generatedAt: documentation.generatedAt,
      },
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * GET /api/architect/documentation/:projectId
 * Get generated documentation for a project
 */
router.get('/documentation/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const documentation = architectService.getDocumentation(projectId);

    if (!documentation) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'No documentation found for this project',
        },
      });
    }

    res.json({
      success: true,
      data: documentation,
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * GET /api/architect/document/:projectId/:documentName
 * Get a specific document from the documentation package
 */
router.get('/document/:projectId/:documentName', async (req: Request, res: Response) => {
  try {
    const { projectId, documentName } = req.params;

    const document = architectService.getDocument(projectId, documentName);

    if (!document) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found',
        },
      });
    }

    // Return as markdown with proper content type
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${documentName}.md"`);
    res.send(document.content);
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * GET /api/architect/export/:projectId
 * Download all documentation as a zip archive
 */
router.get('/export/:projectId', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const documentation = architectService.getDocumentation(projectId);
    if (!documentation) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'No documentation available to export',
        },
      });
    }

    const zip = new AdmZip();
    documentation.documents.forEach((doc) => {
      zip.addFile(`${doc.templateName}.md`, Buffer.from(doc.content, 'utf-8'));
    });

    const zipBuffer = zip.toBuffer();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${projectId}-documents.zip"`);
    res.send(zipBuffer);
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * GET /api/architect/templates
 * Get list of available document templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = architectService.getTemplateList();

    res.json({
      success: true,
      data: {
        templates,
        total: templates.length,
      },
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

/**
 * DELETE /api/architect/session/:sessionId
 * Delete a session and its associated data
 */
router.delete('/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const deleted = architectService.deleteSession(sessionId);

    if (!deleted) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      });
    }

    logger.info({ message: 'Deleted architect session', sessionId });

    res.json({
      success: true,
      data: {
        sessionId,
        deleted: true,
      },
    });
  } catch (error) {
    handleApiError(error, res);
  }
});

export default router;
