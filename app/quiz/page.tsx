'use client';

import { useState, useEffect, useRef } from 'react';
import { ECHO_TOPICS } from '@/lib/data';

type Phase = 'setup' | 'loading' | 'playing' | 'results';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface AnswerRecord {
  question: QuizQuestion;
  selectedIndex: number;
  correct: boolean;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function saveScore(topic: string, score: number) {
  if (typeof window === 'undefined') return;
  try {
    const key = `sonata-best-${topic.toLowerCase().replace(/\s+/g, '-')}`;
    const existing = parseInt(localStorage.getItem(key) || '0', 10);
    if (score > existing) localStorage.setItem(key, String(score));

    const overall = parseInt(localStorage.getItem('sonata-best-overall') || '0', 10);
    if (score > overall) localStorage.setItem('sonata-best-overall', String(score));

    // update stats
    const raw = localStorage.getItem('sonata-stats');
    const stats = raw ? JSON.parse(raw) : {};
    stats.quizzesTaken = (stats.quizzesTaken || 0) + 1;
    stats.lastStudied = new Date().toDateString();
    localStorage.setItem('sonata-stats', JSON.stringify(stats));
  } catch {
    // ignore
  }
}

// ── Explanation card (streaming) ─────────────────────────────────────────────
function ExplanationCard({ record }: { record: AnswerRecord }) {
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const fetchExplanation = async () => {
    if (explanation) {
      setOpen(!open);
      return;
    }
    setOpen(true);
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'explanation',
          question: record.question.question,
          correctAnswer: record.question.options[record.question.correctIndex],
          userAnswer: record.question.options[record.selectedIndex],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to fetch explanation');
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setExplanation(accumulated);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <button
        onClick={fetchExplanation}
        className="flex items-center gap-1.5 text-xs font-medium text-pink-500 hover:text-pink-600"
      >
        <span>✨</span>
        {open ? (explanation ? 'Hide explanation' : 'Hide') : 'Explain this'}
      </button>
      {open && (
        <div className="mt-2 p-3 bg-pink-50 border border-pink-100 rounded-xl">
          {loading && !explanation && (
            <div className="flex items-center gap-2">
              <svg className="animate-spin text-pink-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span className="text-xs text-gray-400">Generating explanation...</span>
            </div>
          )}
          {error && <p className="text-xs text-red-500">{error}</p>}
          {explanation && <p className="text-xs text-gray-700 leading-relaxed">{explanation}</p>}
        </div>
      )}
    </div>
  );
}

// ── Score arc ────────────────────────────────────────────────────────────────
function ScoreArc({ score }: { score: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated ? score / 100 : 0) * circumference;

  const grade =
    score >= 90 ? 'Excellent!' : score >= 75 ? 'Great Job!' : score >= 60 ? 'Good Effort' : 'Keep Practicing';
  const gradeColor =
    score >= 90 ? 'text-emerald-500' : score >= 75 ? 'text-pink-500' : score >= 60 ? 'text-amber-500' : 'text-gray-500';

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={radius} fill="none" stroke="#fce7f3" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="#ec4899"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{score}%</span>
        </div>
      </div>
      <p className={`text-xl font-bold mt-2 ${gradeColor}`}>{grade}</p>
    </div>
  );
}

export default function QuizPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [error, setError] = useState('');

  const score =
    answers.length > 0 ? Math.round((answers.filter((a) => a.correct).length / answers.length) * 100) : 0;

  const wrongAnswers = answers.filter((a) => !a.correct);

  const generateQuiz = async () => {
    if (!selectedTopic) return;
    setPhase('loading');
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quiz', topic: selectedTopic }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed to generate quiz');
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('No questions returned. Please try again.');
      }
      setQuestions(data.questions);
      setCurrentQ(0);
      setSelectedAnswer(null);
      setAnswered(false);
      setAnswers([]);
      setPhase('playing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setPhase('setup');
    }
  };

  const handleAnswer = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;
    const q = questions[currentQ];
    const record: AnswerRecord = {
      question: q,
      selectedIndex: selectedAnswer,
      correct: selectedAnswer === q.correctIndex,
    };
    const newAnswers = [...answers, record];
    setAnswers(newAnswers);

    if (currentQ + 1 >= questions.length) {
      const finalScore = Math.round((newAnswers.filter((a) => a.correct).length / newAnswers.length) * 100);
      saveScore(selectedTopic, finalScore);
      setPhase('results');
    } else {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const resetToSetup = () => {
    setPhase('setup');
    setQuestions([]);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setAnswers([]);
    setError('');
  };

  // ── SETUP ───────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-navy-900">
        <div className="px-5 pt-4 pb-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Quiz Mode</h1>
          <p className="text-sm text-gray-400">Choose a topic — AI will craft 5 questions for you.</p>
        </div>

        <div className="px-5">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Select Topic</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {ECHO_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`p-3 rounded-2xl border text-left transition-all active:scale-95 ${
                  selectedTopic === topic
                    ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                    : 'bg-white text-gray-700 border-pink-100 hover:border-pink-300'
                }`}
              >
                <span className="text-sm font-medium leading-tight block">{topic}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            onClick={generateQuiz}
            disabled={!selectedTopic}
            className="mt-5 w-full py-4 rounded-2xl bg-pink-500 text-white font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
          >
            Generate Quiz
            {selectedTopic && <span className="font-normal opacity-80 text-sm">· {selectedTopic}</span>}
          </button>
        </div>
      </div>
    );
  }

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center gap-5 px-5">
        <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center">
          <svg className="animate-spin text-pink-500" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-gray-900">Crafting your quiz...</p>
          <p className="text-sm text-gray-400 mt-1">{selectedTopic}</p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-pink-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── PLAYING ─────────────────────────────────────────────────────────────────
  if (phase === 'playing' && questions.length > 0) {
    const q = questions[currentQ];
    const progress = ((currentQ) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-navy-900">
        {/* Header */}
        <div className="px-5 pt-4 pb-3" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <div className="flex items-center justify-between mb-3">
            <button onClick={resetToSetup} className="text-gray-400 text-sm flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Topics
            </button>
            <span className="text-sm font-semibold text-gray-500">
              {currentQ + 1} / {questions.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-pink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="px-5">
          {/* Topic badge */}
          <div className="mb-3">
            <span className="text-xs font-medium text-pink-500 bg-pink-50 border border-pink-200 px-2.5 py-1 rounded-full">
              {selectedTopic}
            </span>
          </div>

          {/* Question */}
          <div className="bg-white border border-pink-100 rounded-2xl p-5 shadow-sm mb-4">
            <p className="text-base font-semibold text-gray-900 leading-snug">{q.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {q.options.map((option, i) => {
              let style =
                'bg-white border-pink-100 text-gray-800';
              if (answered) {
                if (i === q.correctIndex) {
                  style = 'bg-emerald-50 border-emerald-400 text-emerald-800';
                } else if (i === selectedAnswer && i !== q.correctIndex) {
                  style = 'bg-red-50 border-red-400 text-red-800';
                } else {
                  style = 'bg-white border-pink-100 text-gray-400';
                }
              } else if (selectedAnswer === i) {
                style = 'bg-pink-50 border-pink-400 text-pink-800';
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                  className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all active:scale-[0.98] shadow-sm ${style}`}
                >
                  <span className={`w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${
                    answered && i === q.correctIndex
                      ? 'bg-emerald-400 text-white'
                      : answered && i === selectedAnswer && i !== q.correctIndex
                      ? 'bg-red-400 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {answered && i === q.correctIndex ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : answered && i === selectedAnswer ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    ) : (
                      OPTION_LABELS[i]
                    )}
                  </span>
                  <span className="text-sm leading-snug">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation after answer */}
          {answered && (
            <div className="mt-4 p-4 bg-white border border-pink-100 rounded-2xl shadow-sm">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Explanation</p>
              <p className="text-sm text-gray-700 leading-relaxed">{q.explanation}</p>
            </div>
          )}

          {answered && (
            <button
              onClick={handleNext}
              className="mt-4 w-full py-4 bg-pink-500 text-white font-bold rounded-2xl text-base shadow-sm active:scale-[0.98] transition-transform"
            >
              {currentQ + 1 >= questions.length ? 'See Results' : 'Next Question'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── RESULTS ─────────────────────────────────────────────────────────────────
  if (phase === 'results') {
    const correct = answers.filter((a) => a.correct).length;

    return (
      <div className="min-h-screen bg-navy-900">
        <div className="px-5 pt-4 pb-6" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Quiz Results</h1>
          <p className="text-sm text-gray-400">{selectedTopic}</p>
        </div>

        {/* Score circle */}
        <div className="px-5 mb-5 flex justify-center">
          <div className="bg-white border border-pink-100 rounded-3xl p-6 shadow-sm w-full max-w-xs flex flex-col items-center gap-3">
            <ScoreArc score={score} />
            <p className="text-sm text-gray-500">
              {correct} of {answers.length} correct
            </p>
          </div>
        </div>

        {/* Wrong answers */}
        {wrongAnswers.length > 0 && (
          <div className="px-5 mb-5">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Review Wrong Answers ({wrongAnswers.length})
            </h2>
            <div className="space-y-3">
              {wrongAnswers.map((record, i) => (
                <div key={i} className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-sm font-medium text-gray-800 mb-2 leading-snug">
                    {record.question.question}
                  </p>
                  <div className="flex items-start gap-2 mb-1">
                    <span className="w-4 h-4 rounded-full bg-red-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </span>
                    <p className="text-xs text-red-600">
                      Your answer: {record.question.options[record.selectedIndex]}
                    </p>
                  </div>
                  <div className="flex items-start gap-2 mb-2">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <p className="text-xs text-emerald-700">
                      Correct: {record.question.options[record.question.correctIndex]}
                    </p>
                  </div>
                  <ExplanationCard record={record} />
                </div>
              ))}
            </div>
          </div>
        )}

        {wrongAnswers.length === 0 && (
          <div className="px-5 mb-5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm font-semibold text-emerald-700">Perfect score! All questions correct.</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-5 flex gap-3 pb-6">
          <button
            onClick={() => {
              setCurrentQ(0);
              setSelectedAnswer(null);
              setAnswered(false);
              setAnswers([]);
              generateQuiz();
            }}
            className="flex-1 py-3.5 bg-pink-500 text-white rounded-2xl font-semibold text-sm shadow-sm active:scale-95 transition-transform"
          >
            Try Again
          </button>
          <button
            onClick={resetToSetup}
            className="flex-1 py-3.5 bg-white border border-pink-200 text-pink-500 rounded-2xl font-semibold text-sm shadow-sm active:scale-95 transition-transform"
          >
            New Topic
          </button>
        </div>
      </div>
    );
  }

  return null;
}
