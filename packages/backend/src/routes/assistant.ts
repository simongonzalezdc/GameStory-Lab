/**
 * Assistant API Routes
 * Provides chat sessions and proposal management
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma, aiOrchestrator } from '../server.js';
import { getAssistantService } from '../services/assistant/assistant-service.js';
import { logger } from '../utils/logger.js';

const router = Router();
const assistantService = getAssistantService(prisma, aiOrchestrator);

router.post('/session', async (req: Request, res: Response) => {
  const { projectId, type } = req.body;
  if (!projectId) {
    return res.status(400).json({ error: 'projectId is required' });
  }
  try {
    const session = await assistantService.getOrCreateSession(projectId, type || 'concept');
    const messages = await assistantService.getMessages(session.id);
    const proposals = await assistantService.listPendingProposals(session.id);
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
    const messages = await assistantService.getMessages(req.params.sessionId);
    res.json({ messages });
  } catch (error) {
    logger.error('Failed to load assistant messages', { error, sessionId: req.params.sessionId });
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

router.get('/session/:sessionId/proposals', async (req: Request, res: Response) => {
  try {
    const proposals = await assistantService.listPendingProposals(req.params.sessionId);
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
    const response = await assistantService.sendMessage(req.params.sessionId, content);
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
    const result = await assistantService.applyProposal(req.params.proposalId);
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Failed to apply assistant proposal', { error, proposalId: req.params.proposalId });
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to apply proposal' });
  }
});

router.post('/proposals/:proposalId/reject', async (req: Request, res: Response) => {
  try {
    await assistantService.rejectProposal(req.params.proposalId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to reject assistant proposal', { error, proposalId: req.params.proposalId });
    res.status(500).json({ error: 'Failed to reject proposal' });
  }
});

export default router;
