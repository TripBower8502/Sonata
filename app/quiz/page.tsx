'use client';

import { useState, useEffect, useCallback } from 'react';
import { quizQuestions } from '@/lib/data';
import QuizQuestionComponent from '@/components/QuizQuestion';

type QuizPhase = 'setup' | 'playing' | 'results';

const ALL_CATEGORIES = ['All', ...Array.from(new Set(quizQuestions.map(q => q.category)))];
const QUESTIONS_PER_SESSION = 20;

export default function QuizPage() {
  const [phase, setPhase] = useState<QuizPhase>('setup');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sessionQuestions, setSessionQuestions] = useState(quizQuestions.slice(0, QUESTIONS_PER_SESSION));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [totalStats, setTotalStats] = useState({ correct: 0, answered: 0, quizzes: 0 });

  useEffect(() => {
    try {
      const s = localStorage.getItem('sonata-stats');
      if (s) {
        const parsed = JSON.parse(s);
        setTotalStats({
          correct: parsed.totalCorrect || 0,
          answered: parsed.totalAnswered || 0,
          quizzes: parsed.quizzesTaken || 0,
        });
      }
    } catch { /* ignore */ }
  }, []);

  const startQuiz = useCallback(() => {
    const pool = selectedCategory === 'All'
      ? quizQuestions
      : quizQuestions.filter(q => q.category === selectedCategory);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(QUESTIONS_PER_SESSION, shuffled.length));
    setSessionQuestions(selected);
    setAnswers(new Array(selected.length).fill(null));
    setCurrentIndex(0);
    setShowExplanation(false);
    setPhase('playing');
  }, [selectedCategory]);

  const handleAnswer = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = index;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < sessionQuestions.length - 1) {
      setCurrentIndex(i => i + 1);
      setShowExplanation(false);
    } else {
      const correct = answers.filter((a, i) => a === sessionQuestions[i].correctIndex).length;
      const total = sessionQuestions.length;
      try {
        const s = localStorage.getItem('sonata-stats');
        const stats = s ? JSON.parse(s) : {};
        const today = new Date().toDateString();
        const wasToday = stats.lastStudied === today;
        const wasYesterday = stats.lastStudied === new Date(Date.now() - 86400000).toDateString();
        const newStats = {
          ...stats,
          quizzesTaken: (stats.quizzesTaken || 0) + 1,
          totalCorrect: (stats.totalCorrect || 0) + correct,
          totalAnswered: (stats.totalAnswered || 0) + total,
          streak: wasToday ? (stats.streak || 1) : (wasYesterday ? (stats.streak || 0) + 1 : 1),
          lastStudied: today,
        };
        localStorage.setItem('sonata-stats', JSON.stringify(newStats));
        setTotalStats({ correct: newStats.totalCorrect, answered: newStats.totalAnswered, quizzes: newStats.quizzesTaken });
      } catch { /* ignore */ }
      setPhase('results');
    }
  };

  const sessionScore = answers.filter((a, i) => a !== null && a === sessionQuestions[i].correctIndex).length;
  const sessionAnswered = answers.filter(a => a !== null).length;

  if (phase === 'setup') {
    return (
      <div className="page-enter min-h-screen bg-navy-900">
        <div
          className="px-5 pt-4 pb-5 border-b border-pink-100 bg-white"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <h1 className="text-xl font-bold text-gray-900 mb-1">Quiz Mode</h1>
          <p className="text-gray-400 text-sm">Test your echocardiography knowledge</p>
        </div>

        <div className="px-5 py-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white border border-pink-100 rounded-2xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-violet-500">{totalStats.quizzes}</div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">Quizzes</div>
            </div>
            <div className="bg-white border border-pink-100 rounded-2xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-emerald-500">{totalStats.correct}</div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">Correct</div>
            </div>
            <div className="bg-white border border-pink-100 rounded-2xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-pink-500">
                {totalStats.answered > 0 ? Math.round((totalStats.correct / totalStats.answered) * 100) : 0}%
              </div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">Accuracy</div>
            </div>
          </div>

          {/* Category select */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Filter by Category</h2>
            <div className="space-y-2">
              {ALL_CATEGORIES.map(cat => {
                const count = cat === 'All' ? quizQuestions.length : quizQuestions.filter(q => q.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'bg-pink-50 border-pink-300 text-pink-600'
                        : 'bg-white border-pink-100 text-gray-700 hover:border-pink-200'
                    }`}
                  >
                    <span className="font-semibold text-sm">{cat}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{count} questions</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start button */}
          <button
            onClick={startQuiz}
            className="w-full py-4 rounded-2xl bg-pink-500 text-white font-bold text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-sm"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            Start Quiz ({Math.min(QUESTIONS_PER_SESSION, selectedCategory === 'All' ? quizQuestions.length : quizQuestions.filter(q => q.category === selectedCategory).length)} questions)
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const correct = answers.filter((a, i) => a === sessionQuestions[i].correctIndex).length;
    const total = sessionQuestions.length;
    const pct = Math.round((correct / total) * 100);
    const grade = pct >= 90 ? 'Excellent!' : pct >= 75 ? 'Great Job!' : pct >= 60 ? 'Good Effort' : 'Keep Practicing';
    const gradeColor = pct >= 90 ? 'text-pink-500' : pct >= 75 ? 'text-emerald-500' : pct >= 60 ? 'text-amber-500' : 'text-red-400';
    const arcColor = pct >= 90 ? '#ec4899' : pct >= 75 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';

    return (
      <div className="page-enter min-h-screen bg-navy-900">
        <div
          className="px-5 pt-4 pb-5 border-b border-pink-100 bg-white"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <h1 className="text-xl font-bold text-gray-900">Quiz Results</h1>
        </div>

        <div className="px-5 py-6">
          {/* Score circle */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-32 h-32 flex items-center justify-center mb-3 relative">
              <svg className="absolute inset-0" width="128" height="128" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r="58" fill="none" stroke="#fce7f3" strokeWidth="8" />
                <circle
                  cx="64" cy="64" r="58" fill="none"
                  stroke={arcColor}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 58 * pct / 100} ${2 * Math.PI * 58 * (1 - pct / 100)}`}
                  strokeDashoffset={2 * Math.PI * 58 * 0.25}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center z-10">
                <div className="text-3xl font-bold text-gray-900">{pct}%</div>
                <div className="text-xs text-gray-400">{correct}/{total}</div>
              </div>
            </div>
            <h2 className={`text-2xl font-bold ${gradeColor}`}>{grade}</h2>
            <p className="text-gray-400 text-sm mt-1">
              {correct} correct out of {total} questions
            </p>
          </div>

          {/* Review answers */}
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Answer Review</h3>
          <div className="space-y-2 mb-6">
            {sessionQuestions.map((q, i) => {
              const isCorrect = answers[i] === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={`p-3 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCorrect ? 'bg-emerald-500' : 'bg-red-400'}`}>
                      {isCorrect ? (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-700 font-medium leading-snug">{q.question}</p>
                      {!isCorrect && (
                        <p className="text-xs text-emerald-600 mt-1">Correct: {q.options[q.correctIndex]}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={startQuiz}
              className="w-full py-4 rounded-2xl bg-pink-500 text-white font-bold text-base active:scale-[0.98] transition-transform shadow-sm"
            >
              Retake Quiz
            </button>
            <button
              onClick={() => setPhase('setup')}
              className="w-full py-4 rounded-2xl bg-white border border-pink-200 text-gray-700 font-semibold text-base active:scale-[0.98] transition-transform shadow-sm"
            >
              Change Category
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Playing phase
  const currentQuestion = sessionQuestions[currentIndex];
  const currentAnswer = answers[currentIndex];

  return (
    <div className="page-enter min-h-screen bg-navy-900">
      {/* Header */}
      <div
        className="px-5 pt-4 pb-3 border-b border-pink-100 bg-white"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPhase('setup')}
            className="flex items-center gap-1 text-gray-400 text-sm font-medium active:text-gray-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Exit
          </button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-gray-600 font-medium">{sessionScore} correct</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-pink-200" />
              <span className="text-xs text-gray-400">{sessionQuestions.length - sessionAnswered} left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="py-5">
        <QuizQuestionComponent
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          totalQuestions={sessionQuestions.length}
          selectedAnswer={currentAnswer ?? null}
          onAnswer={handleAnswer}
          showExplanation={showExplanation}
        />
      </div>

      {/* Next button */}
      {showExplanation && (
        <div className="px-4 pb-4">
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-2xl bg-pink-500 text-white font-bold text-base active:scale-[0.98] transition-transform flex items-center justify-center gap-2 shadow-sm"
          >
            {currentIndex < sessionQuestions.length - 1 ? (
              <>
                Next Question
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </>
            ) : (
              <>
                See Results
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
