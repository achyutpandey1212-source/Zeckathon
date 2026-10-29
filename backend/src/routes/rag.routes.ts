import { Router } from 'express';
import {
  RAG_DOCUMENT_CHUNKS_SEED,
  TWENTY_FIVE_FUND_BENCHMARK_QUESTIONS,
} from '../data/ragDocuments.seed';
import { env } from '../config/env';
import { authenticateOrDemoRia } from '../middleware/auth.middleware';
import { recordAuditLog } from '../services/planOrchestrator.service';
import { ragEngine } from '../services/rag/ragEngine';

export const ragRouter = Router();

ragRouter.get('/documents', authenticateOrDemoRia, (_req, res) => {
  res.json({
    totalChunks: RAG_DOCUMENT_CHUNKS_SEED.length,
    documents: RAG_DOCUMENT_CHUNKS_SEED.map((c) => ({
      chunkId: c.chunkId,
      documentId: c.documentId,
      documentTitle: c.documentTitle,
      documentType: c.documentType,
      schemeCode: c.schemeCode,
      amcName: c.amcName,
      asOfDate: c.asOfDate,
      pageNumber: c.pageNumber,
      sectionHeading: c.sectionHeading,
      content: c.content,
      structuredFacts: c.structuredFacts,
    })),
    benchmarkQuestions: TWENTY_FIVE_FUND_BENCHMARK_QUESTIONS,
  });
});

ragRouter.post('/query', authenticateOrDemoRia, async (req, res) => {
  try {
    const { query, fastMode } = req.body as { query?: string; fastMode?: boolean };
    if (!query || !query.trim()) {
      res.status(400).json({ error: 'Research query string is required.' });
      return;
    }

    const result = await ragEngine.answerResearchQuestion(query.trim(), Boolean(fastMode));

    recordAuditLog({
      eventType: 'RAG_CITATION_QUERY',
      actorName: req.user?.fullName || env.DEFAULT_RIA_NAME,
      actorRole: req.user?.role || 'RIA_ADVISER',
      sebiRegNo: req.user?.sebiRegistrationNo || env.DEFAULT_SEBI_REG_NO,
      referenceId: result.citations[0]?.documentId || 'RAG-QUERY',
      summary: `RAG Query: "${query.slice(0, 70)}" -> Cited: ${
        result.citations.map((c) => c.citationTag).join(', ') || 'Refused Unverified'
      }`,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

ragRouter.post('/benchmark-25', authenticateOrDemoRia, async (_req, res) => {
  try {
    const summary = await ragEngine.run25QuestionBenchmark();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
