/**
 * Assistant API Routes
 * Provides chat sessions and proposal management
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { getAssistantService } from '../services/assistant/assistant-service.js';
import { logger } from '../utils/logger.js';
import type { AssistantService } from '../services/assistant/assistant-service.js';

const router = Router();

// Lazy initialization to avoid circular dependencies
let assistantService: AssistantService | null = null;

async function getService() {
  if (!assistantService) {
    // Lazy import to avoid circular dependency - use the singleton instances
    const serverModule = await import('../server.js');
    assistantService = getAssistantService(serverModule.prisma, serverModule.aiOrchestrator);
  }
  return assistantService;
}

router.post('/session', async (req: Request, res: Response) => {
  const { projectId, type, mode } = req.body;
  // Allow 'general' as a special projectId for workflow assistance without a project
  // Reject if projectId is not 'general' AND (it's falsy OR not a string)
  if (projectId !== 'general' && (!projectId || typeof projectId !== 'string')) {
    return res.status(400).json({ error: 'projectId is required' });
  }
  try {
    const service = await getService();
    // Always use unified 'project' session type, but accept mode hints
    // For 'general', we'll handle it specially in the service
    const session = await service.getOrCreateSession(projectId, 'project', mode);
    const messages = await service.getMessages(session.id);
    const proposals = await service.listPendingProposals(session.id);
    res.json({
      session,
      messages,
      proposals,
    });
  } catch (error) {
    logger.error('Failed to create assistant session', { error, projectId });
    res.status(500).json({ error: 'Failed to create assistant session' });
  }
});

router.get('/session/:sessionId/messages', async (req: Request, res: Response) => {
  try {
    const service = await getService();
    const messages = await service.getMessages(req.params.sessionId);
    res.json({ messages });
  } catch (error) {
    logger.error('Failed to load assistant messages', { error, sessionId: req.params.sessionId });
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.get('/session/:sessionId/proposals', async (req: Request, res: Response) => {
  try {
    const service = await getService();
    const proposals = await service.listPendingProposals(req.params.sessionId);
    res.json({ proposals });
  } catch (error) {
    logger.error('Failed to load assistant proposals', { error, sessionId: req.params.sessionId });
    res.status(500).json({ error: 'Failed to load proposals' });
  }
});

router.post('/session/:sessionId/mode', async (req: Request, res: Response) => {
  const { mode } = req.body;
  if (!mode || !['concept', 'architect', 'auto'].includes(mode)) {
    return res.status(400).json({ error: 'Valid mode is required (concept|architect|auto)' });
  }
  try {
    const service = await getService();
    const session = await service.getSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Update session mode in metadata
    const updatedSession = await service.updateSessionMode(session.id, mode);
    res.json({
      session: updatedSession,
      message: `Session mode updated to ${mode}`,
    });
  } catch (error) {
    logger.error('Failed to update session mode', { error, sessionId: req.params.sessionId });
    res.status(500).json({ error: 'Failed to update session mode' });
  }
});

router.post('/session/:sessionId/message', async (req: Request, res: Response) => {
  const { content, mode, quickActionId } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }
  try {
    const service = await getService();
    
    // If mode is provided, update the session mode first
    if (mode && ['concept', 'architect', 'auto'].includes(mode)) {
      await service.updateSessionMode(req.params.sessionId, mode);
    }
    
    const response = await service.sendMessage(req.params.sessionId, content, {
      quickActionId,
    });
    res.json(response);
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: errorStack,
    } : {
      type: typeof error,
      value: String(error),
    };
    
    logger.error('Assistant message failed', {
      error: errorMessage,
      stack: errorStack,
      sessionId: req.params.sessionId,
      errorType: error?.constructor?.name,
      errorDetails,
    });
    
    console.error('[Assistant Route] Full error:', error);
    console.error('[Assistant Route] Error details:', JSON.stringify(errorDetails, null, 2));
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      errorType: error?.constructor?.name,
    });
  }
});

router.post('/proposals/:proposalId/accept', async (req: Request, res: Response) => {
  try {
    const service = await getService();
    const result = await service.applyProposal(req.params.proposalId);
    
    // Validate that we got a result
    if (!result || (!result.newVersion && !result.documentation)) {
      logger.error('Proposal accepted but no result generated', {
        proposalId: req.params.proposalId,
        result,
        hasNewVersion: !!(result && result.newVersion),
        hasDocumentation: !!(result && result.documentation),
      });
      return res.status(400).json({
        error: 'Proposal was accepted but no changes could be applied. The proposal may be empty or invalid.',
        details: 'The proposal does not contain any mechanics, lore, or documentation changes to apply.',
      });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Failed to apply assistant proposal', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      proposalId: req.params.proposalId 
    });
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to apply proposal',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
    });
  }
});

router.post('/proposals/:proposalId/reject', async (req: Request, res: Response) => {
  try {
    const service = await getService();
    await service.rejectProposal(req.params.proposalId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to reject assistant proposal', { error, proposalId: req.params.proposalId });
    res.status(500).json({ error: 'Failed to reject proposal' });
  }
});

export default router;
