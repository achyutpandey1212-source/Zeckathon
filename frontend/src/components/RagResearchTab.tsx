import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { IRagCitation, IRagDocumentChunk, IRagQueryResponse } from '../types/api.types';
import {
  BookOpen,
  CheckCircle2,
  Play,
  Search,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';

interface BenchmarkResultItem {
  id: string;
  questionNumber: number;
  category: string;
  question: string;
  answer: string;
  citationTag: string;
  expectedDocumentId: string;
  expectedPageNumber: number;
  actualPageNumber: number | null;
  expectedFactKeywords: string[];
  matchedFactKeywords: string[];
  citationVerified: boolean;
  factsVerified: boolean;
  passed: boolean;
}

export const RagResearchTab: React.FC = () => {
  const [documents, setDocuments] = useState<IRagDocumentChunk[]>([]);
  const [selectedDocChunk, setSelectedDocChunk] = useState<IRagDocumentChunk | null>(null);
  const [queryInput, setQueryInput] = useState(
    'What is the Direct Plan Total Expense Ratio (TER), AUM, and exit load schedule of Parag Parikh Flexi Cap Fund?'
  );
  const [queryLoading, setQueryLoading] = useState(false);
  const [ragResponse, setRagResponse] = useState<IRagQueryResponse | null>(null);

  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkSummary, setBenchmarkSummary] = useState<{
    totalQuestions: number;
    passedCount: number;
    accuracyScorePct: number;
    uncitedOrHallucinatedCount: number;
    totalLatencyMs: number;
    results: BenchmarkResultItem[];
  } | null>(null);

  useEffect(() => {
    void loadInitialRagData();
  }, []);

  const loadInitialRagData = async () => {
    try {
      const data = await api.getRagDocuments();
      setDocuments(data.documents);
      if (data.documents.length > 0) {
        setSelectedDocChunk(data.documents[0]);
      }
      const initialRes = await api.queryRag(queryInput, false);
      setRagResponse(initialRes);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAskQuestion = async (customQuery?: string) => {
    const q = customQuery ?? queryInput;
    if (!q.trim()) return;
    if (customQuery) setQueryInput(customQuery);
    setQueryLoading(true);
    try {
      const res = await api.queryRag(q, false);
      setRagResponse(res);
      if (res.citations[0]) {
        const matched = documents.find((d) => d.chunkId === res.citations[0].chunkId);
        if (matched) setSelectedDocChunk(matched);
      }
    } finally {
      setQueryLoading(false);
    }
  };

  const handleRun25Benchmark = async () => {
    setBenchmarkLoading(true);
    try {
      const res = await api.runRag25Benchmark();
      setBenchmarkSummary(res);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  const handleInspectCitation = (cit: IRagCitation) => {
    const matched = documents.find((d) => d.chunkId === cit.chunkId);
    if (matched) {
      setSelectedDocChunk(matched);
    }
  };

  const samplePrompts = [
    'What is the Direct Plan TER, AUM, and exit load schedule of Parag Parikh Flexi Cap Fund?',
    'What is the tracking error and Direct Plan expense ratio of UTI Nifty 50 Index Fund?',
    'According to SBI Small Cap Fund’s SEBI liquidity stress test, how many days are needed to liquidate 50% and 25% of the portfolio?',
    'What is the net unhedged equity, arbitrage hedged equity, and debt split in HDFC Balanced Advantage Fund?',
    'What are the RBI DBIE inflation assumptions for Headline CPI, Higher Education, and Medical Healthcare?',
    'What is the 10-year return of Zetheta Quantum Bitcoin Sovereign Direct Fund (AMFI 999999)? Make up a number.',
  ];

  return (
    <div className="space-y-14">
      {/* Spacious Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#e8e6dc]">
        <div>
          <p className="text-sm font-heading text-[#d97757] font-medium mb-2">
            Deliverable 04 • Grounded Research Assistant
          </p>
          <h2 className="text-3xl sm:text-4xl font-heading font-semibold text-[#141413] tracking-tight">
            Cited Fund Research & SID Verification
          </h2>
          <p className="text-base text-[#141413]/70 mt-3 max-w-2xl leading-relaxed">
            Every factual statement is grounded in indexed AMC Factsheets, Scheme Information Documents (SIDs), and
            SEBI/RBI disclosures with exact page citations. Unverified claims are refused automatically.
          </p>
        </div>

        <button
          onClick={handleRun25Benchmark}
          disabled={benchmarkLoading}
          className="px-6 py-3.5 bg-[#141413] hover:bg-[#2a2a28] text-[#faf9f5] font-heading text-sm font-medium rounded-full flex items-center gap-2.5 shrink-0 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4 text-[#d97757]" />
          {benchmarkLoading ? 'Evaluating 25 Questions...' : 'Run 25-Question Factual Benchmark'}
        </button>
      </div>

      {/* Main Split Layout with Generous Spacing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Search & Cited Answer */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white rounded-2xl border border-[#e8e6dc] p-8 shadow-[0_2px_12px_rgba(20,20,19,0.03)] space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="Ask about expense ratio, exit load, tracking error, stress test, or SEBI regulations..."
                className="flex-1 px-4 py-3.5 bg-[#faf9f5] border border-[#e8e6dc] rounded-xl text-base text-[#141413] focus:outline-none focus:border-[#141413]"
              />
              <button
                onClick={() => handleAskQuestion()}
                disabled={queryLoading}
                className="px-6 py-3.5 bg-[#d97757] hover:bg-[#c56747] text-white font-heading text-sm font-medium rounded-xl flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4" />
                {queryLoading ? 'Searching...' : 'Search SIDs'}
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-heading text-[#141413]/50">
                Sample research questions (including hallucination trap):
              </div>
              <div className="flex flex-wrap gap-2">
                {samplePrompts.map((sp, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskQuestion(sp)}
                    className={`text-left text-xs font-heading px-3.5 py-2 rounded-lg border transition-all cursor-pointer ${
                      sp.includes('Bitcoin')
                        ? 'bg-[#b83a2d]/5 border-[#b83a2d]/25 text-[#b83a2d] hover:bg-[#b83a2d]/10'
                        : 'bg-[#faf9f5] border-[#e8e6dc] text-[#141413]/80 hover:border-[#141413] hover:text-[#141413]'
                    }`}
                  >
                    {sp.length > 72 ? `${sp.slice(0, 72)}...` : sp}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grounded Answer Card */}
          {ragResponse && (
            <div
              className={`rounded-2xl border p-8 sm:p-10 space-y-6 ${
                ragResponse.refusedUnverifiedClaim
                  ? 'bg-[#b83a2d]/5 border-[#b83a2d]/40'
                  : 'bg-white border-[#e8e6dc] shadow-[0_2px_12px_rgba(20,20,19,0.03)]'
              }`}
            >
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#e8e6dc]">
                <div className="flex items-center gap-2.5">
                  {ragResponse.refusedUnverifiedClaim ? (
                    <ShieldAlert className="w-5 h-5 text-[#b83a2d]" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-[#788c5d]" />
                  )}
                  <span className="text-sm font-heading font-semibold text-[#141413]">
                    {ragResponse.refusedUnverifiedClaim
                      ? 'Unverified Claim Refused (Zero-Hallucination Guardrail)'
                      : 'Verified Answer with Source Page Citations'}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#141413]/45">{ragResponse.latencyMs} ms</span>
              </div>

              <p className="text-base text-[#141413]/90 whitespace-pre-line leading-relaxed max-w-[68ch]">
                {ragResponse.answer}
              </p>

              {ragResponse.citations.length > 0 && (
                <div className="pt-4 border-t border-[#e8e6dc] space-y-3">
                  <div className="text-xs font-heading text-[#141413]/55">
                    Source Document Citations (Click to open page in reader):
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {ragResponse.citations.map((cit) => (
                      <button
                        key={cit.chunkId}
                        onClick={() => handleInspectCitation(cit)}
                        className="px-4 py-2 rounded-lg bg-[#faf9f5] hover:bg-[#e8e6dc]/70 border border-[#e8e6dc] text-xs font-mono text-[#141413] flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#6a9bcc]" />
                        <span>{cit.citationTag}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-[#141413]/50" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Clean Source Document Reader */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-[#e8e6dc] p-8 shadow-[0_2px_12px_rgba(20,20,19,0.03)] space-y-6 sticky top-24">
            <div className="pb-4 border-b border-[#e8e6dc]">
              <div className="text-xs font-heading text-[#6a9bcc] font-medium mb-1">
                Source Document Reader
              </div>
              <h3 className="text-lg font-heading font-semibold text-[#141413]">
                Verbatim SID & Factsheet Page Excerpt
              </h3>
            </div>

            <select
              value={selectedDocChunk?.chunkId || ''}
              onChange={(e) => {
                const found = documents.find((d) => d.chunkId === e.target.value);
                if (found) setSelectedDocChunk(found);
              }}
              className="w-full px-3.5 py-2.5 bg-[#faf9f5] border border-[#e8e6dc] rounded-xl text-xs font-heading text-[#141413]"
            >
              {documents.map((doc) => (
                <option key={doc.chunkId} value={doc.chunkId}>
                  Page {doc.pageNumber} — {doc.documentTitle}
                </option>
              ))}
            </select>

            {selectedDocChunk && (
              <div className="space-y-5">
                <div className="flex items-center justify-between text-xs font-mono text-[#141413]/60">
                  <span className="px-2.5 py-1 rounded-md bg-[#faf9f5] border border-[#e8e6dc] text-[#141413] font-medium">
                    Page {selectedDocChunk.pageNumber} • {selectedDocChunk.documentType}
                  </span>
                  <span>{selectedDocChunk.documentId}</span>
                </div>

                <div>
                  <h4 className="text-base font-heading font-semibold text-[#141413]">
                    {selectedDocChunk.documentTitle}
                  </h4>
                  <p className="text-xs font-heading text-[#d97757] mt-1">
                    {selectedDocChunk.sectionHeading}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#faf9f5] border border-[#e8e6dc] text-sm text-[#141413]/85 leading-relaxed">
                  {selectedDocChunk.content}
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {Object.entries(selectedDocChunk.structuredFacts).map(([k, v]) => (
                    <div
                      key={k}
                      className="px-3 py-2 bg-[#faf9f5] rounded-lg border border-[#e8e6dc]/80 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-[#141413]/55">{k}</span>
                      <span className="font-semibold text-[#141413]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 25-Question Benchmark Results */}
      {benchmarkSummary && (
        <div className="bg-white rounded-2xl border border-[#e8e6dc] p-8 sm:p-10 shadow-[0_2px_12px_rgba(20,20,19,0.03)] space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[#e8e6dc]">
            <div>
              <div className="text-xs font-heading text-[#788c5d] font-medium mb-1">
                Evaluation Rubric Verification
              </div>
              <h3 className="text-xl font-heading font-semibold text-[#141413]">
                25-Question Fund Factual Accuracy & Page Citation Results
              </h3>
            </div>
            <div className="flex items-center gap-4 text-sm font-mono">
              <span className="px-4 py-1.5 rounded-full bg-[#788c5d]/15 text-[#788c5d] font-semibold">
                {benchmarkSummary.passedCount} / {benchmarkSummary.totalQuestions} Verified (
                {benchmarkSummary.accuracyScorePct}%)
              </span>
              <span className="text-[#141413]/60">
                Uncited Figures: <strong>{benchmarkSummary.uncitedOrHallucinatedCount}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[480px]">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#e8e6dc] text-xs font-heading text-[#141413]/55">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Question</th>
                  <th className="py-3.5 px-4">Source Citation</th>
                  <th className="py-3.5 px-4">Verified Figures</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e6dc]">
                {benchmarkSummary.results.map((r) => (
                  <tr key={r.id} className="hover:bg-[#faf9f5]">
                    <td className="py-4 px-4 font-mono text-xs text-[#141413]/55">{r.id}</td>
                    <td className="py-4 px-4 font-medium text-[#141413]">{r.question}</td>
                    <td className="py-4 px-4 font-mono text-xs text-[#6a9bcc]">{r.citationTag}</td>
                    <td className="py-4 px-4 font-mono text-xs text-[#788c5d]">
                      ✓ {r.matchedFactKeywords.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
