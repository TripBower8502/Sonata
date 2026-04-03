'use client';

import { useState, useEffect, useRef } from 'react';
import { caseStudies, type CaseStudy } from '@/lib/data';

const CASES_KEY = 'sonata-cases-reviewed';
const STATS_KEY = 'sonata-stats';

function markCaseReviewed(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(CASES_KEY);
    const reviewed: string[] = raw ? JSON.parse(raw) : [];
    if (!reviewed.includes(id)) {
      reviewed.push(id);
      localStorage.setItem(CASES_KEY, JSON.stringify(reviewed));
    }
    // sync into stats
    const sRaw = localStorage.getItem(STATS_KEY);
    const stats = sRaw ? JSON.parse(sRaw) : {};
    stats.casesReviewed = reviewed;
    stats.lastStudied = new Date().toDateString();
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

// ── AI Tutor Chat ─────────────────────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function CaseTutor({ caseStudy }: { caseStudy: CaseStudy }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const quickPrompts = [
    'Explain the key echo findings',
    'What is the prognosis?',
    'What treatment is indicated?',
    'What are the teaching points?',
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || streaming) return;
    setError('');
    const userMsg: ChatMessage = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);

    let assistantContent = '';
    const assistantMsg: ChatMessage = { role: 'assistant', content: '' };
    setMessages([...newMessages, assistantMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          systemPrompt: caseStudy.systemPrompt,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get response');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content ?? '';
            if (delta) {
              assistantContent += delta;
              setMessages([
                ...newMessages,
                { role: 'assistant', content: assistantContent },
              ]);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setMessages(newMessages); // remove empty assistant message
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-900">AI Tutor</h3>
        <span className="text-xs text-pink-400 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded-full">
          Case-specific
        </span>
      </div>

      {/* Quick prompts */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={streaming}
              className="px-3 py-1.5 text-xs font-medium text-pink-600 bg-pink-50 border border-pink-200 rounded-full hover:bg-pink-100 transition-colors disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="bg-white border border-pink-100 rounded-2xl p-4 mb-3 max-h-72 overflow-y-auto space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-pink-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 12 Q5 4 8 12 Q11 20 14 12 Q17 4 20 12" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-pink-500 text-white rounded-tr-sm'
                    : 'bg-gray-50 text-gray-800 rounded-tl-sm'
                }`}
              >
                {msg.content}
                {msg.role === 'assistant' && streaming && i === messages.length - 1 && (
                  <span className="inline-block w-1 h-3 bg-pink-400 ml-0.5 animate-pulse rounded-sm" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(input); }}
          placeholder="Ask about this case..."
          disabled={streaming}
          className="flex-1 bg-white border border-pink-200 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-pink-400 disabled:opacity-60"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || streaming}
          className="w-11 h-11 rounded-2xl bg-pink-500 text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
        >
          {streaming ? (
            <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Case Detail ───────────────────────────────────────────────────────────────
function CaseDetail({ caseStudy, onBack }: { caseStudy: CaseStudy; onBack: () => void }) {
  const [diagnosisRevealed, setDiagnosisRevealed] = useState(false);
  const [teachingExpanded, setTeachingExpanded] = useState(false);

  useEffect(() => {
    markCaseReviewed(caseStudy.id);
  }, [caseStudy.id]);

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <div className="px-5 pt-4 pb-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Case Studies
        </button>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center text-2xl flex-shrink-0">
            {caseStudy.icon}
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{caseStudy.title}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{caseStudy.subtitle}</p>
            <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${caseStudy.difficultyColor}`}>
              {caseStudy.difficulty}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-3 pb-8">
        {/* Patient info */}
        <div className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Patient</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{caseStudy.patient}</p>
          {caseStudy.history && (
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{caseStudy.history}</p>
          )}
        </div>

        {/* Echo findings */}
        <div className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Echo Findings</h3>
          <ul className="space-y-2">
            {caseStudy.echoFindings.map((finding, i) => (
              <li key={i} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0 mt-1.5" />
                <p className="text-sm text-gray-700 leading-snug">{finding}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Key question */}
        <div className="bg-pink-50 border border-pink-200 rounded-2xl p-4">
          <div className="flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
            </svg>
            <div>
              <p className="text-xs font-semibold text-pink-500 mb-1">Key Question</p>
              <p className="text-sm text-gray-800 font-medium leading-snug">{caseStudy.keyQuestion}</p>
            </div>
          </div>
        </div>

        {/* Diagnosis reveal */}
        <div className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Diagnosis</h3>
            <button
              onClick={() => setDiagnosisRevealed(!diagnosisRevealed)}
              className="text-xs font-medium text-pink-500 bg-pink-50 border border-pink-200 px-2.5 py-1 rounded-full"
            >
              {diagnosisRevealed ? 'Hide' : 'Reveal'}
            </button>
          </div>
          {diagnosisRevealed ? (
            <p className="text-sm text-gray-800 font-medium leading-relaxed">{caseStudy.diagnosis}</p>
          ) : (
            <div className="h-5 bg-gray-100 rounded-lg blur-sm select-none" aria-hidden>
              <p className="text-sm text-gray-800 opacity-0">{caseStudy.diagnosis}</p>
            </div>
          )}
        </div>

        {/* Teaching points */}
        <div className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm">
          <button
            onClick={() => setTeachingExpanded(!teachingExpanded)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Teaching Points ({caseStudy.teachingPoints.length})
            </h3>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
              className={`transition-transform ${teachingExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {teachingExpanded && (
            <ul className="mt-3 space-y-3">
              {caseStudy.teachingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-pink-100 border border-pink-200 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-bold text-pink-500">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-snug">{point}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* AI Tutor */}
        <CaseTutor caseStudy={caseStudy} />
      </div>
    </div>
  );
}

// ── Cases List ────────────────────────────────────────────────────────────────
export default function CasesPage() {
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CASES_KEY);
      if (raw) setReviewedIds(new Set(JSON.parse(raw) as string[]));
    } catch {
      // ignore
    }
  }, []);

  if (selectedCase) {
    return (
      <CaseDetail
        caseStudy={selectedCase}
        onBack={() => {
          setSelectedCase(null);
          // refresh reviewed ids
          try {
            const raw = localStorage.getItem(CASES_KEY);
            if (raw) setReviewedIds(new Set(JSON.parse(raw) as string[]));
          } catch { /* ignore */ }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <div className="px-5 pt-4 pb-5" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Case Studies</h1>
        <p className="text-sm text-gray-400">
          {reviewedIds.size} of {caseStudies.length} reviewed
        </p>
      </div>

      <div className="px-5 space-y-3 pb-6">
        {caseStudies.map((c) => (
          <div
            key={c.id}
            className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-2xl flex-shrink-0">
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-gray-900">{c.title}</h2>
                  {reviewedIds.has(c.id) && (
                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Reviewed
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{c.subtitle}</p>
                <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${c.difficultyColor}`}>
                  {c.difficulty}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-3 line-clamp-2">{c.patient}</p>

            <button
              onClick={() => setSelectedCase(c)}
              className="w-full py-2.5 rounded-xl bg-pink-500 text-white text-sm font-semibold active:scale-[0.98] transition-transform shadow-sm"
            >
              Open Case
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
