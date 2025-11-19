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
  const { projectId, type } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }
  try {
    const service = await getService();
    const session = await service.getOrCreateSession(projectId, type || 'concept');
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

router.post('/session/:sessionId/message', async (req: Request, res: Response) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'content is required' });
  }
  try {
    const service = await getService();
    const response = await service.sendMessage(req.params.sessionId, content);
    res.json(response);
  } catch (error: any) {
    logger.error('Assistant message failed', {
      error: error?.message || error,
      sessionId: req.params.sessionId,
    });
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to send message' });
  }
});

router.post('/proposals/:proposalId/accept', async (req: Request, res: Response) => {
  try {
    const service = await getService();
    const result = await service.applyProposal(req.params.proposalId);
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Failed to apply assistant proposal', { error, proposalId: req.params.proposalId });
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to apply proposal' });
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
