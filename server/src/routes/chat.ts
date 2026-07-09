import { Router, Request, Response, NextFunction } from 'express';
import { answerQuestion } from '../lib/rag';
import { ChatRequest, ChatResponse } from '../types';

const router = Router();

/**
 * POST /api/chat
 * Resolves a chat question using the context loaded in the specified vector store collection.
 */
router.post(
  '/',
  async (
    req: Request<{}, {}, ChatRequest>,
    res: Response<ChatResponse | { error: string }>,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { question, collectionName } = req.body;

      if (!question || !question.trim()) {
        res.status(400).json({ error: 'Question is required.' });
        return;
      }

      if (!collectionName || !collectionName.trim()) {
        res.status(400).json({ error: 'Collection name is required.' });
        return;
      }

      console.log(`Received question for collection ${collectionName}: "${question}"`);
      const result = await answerQuestion(question, collectionName);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
