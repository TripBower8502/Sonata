'use client';

import { useEffect, useState } from 'react';
import { preloadedFlashcards, caseStudies } from '@/lib/data';

interface Stats {
  flashcardsStudied: number;
  quizzesTaken: number;
  totalCorrect: number;
  totalAnswered: number;
  streak: number;
  casesReviewed: string[];
  bestScore: number;
}

interface Achievement {
  id: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

function AnimatedBar({ pct, color = 'bg-pink-500' }: { pct: number; color?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className="h-2 bg-pink-50 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

export default function ProgressPage() {
  const [stats, setStats] = useState<Stats>({
    flashcardsStudied: 0,
    quizzesTaken: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    streak: 0,
    casesReviewed: [],
    bestScore: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem('sonata-stats');
      const base: Partial<Stats> = raw ? JSON.parse(raw) : {};

      // streak validation
      let streak = base.streak || 0;
      const lastStudied = (base as { lastStudied?: string }).lastStudied;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastStudied !== today && lastStudied !== yesterday) streak = 0;

      // best score
      let bestScore = base.bestScore || 0;
      const bsRaw = localStorage.getItem('sonata-best-overall');
      if (bsRaw) bestScore = Math.max(bestScore, parseInt(bsRaw, 10));

      // cards studied from dedicated key
      let flashcardsStudied = base.flashcardsStudied || 0;
      const studiedRaw = localStorage.getItem('sonata-studied-cards');
      if (studiedRaw) {
        const ids: string[] = JSON.parse(studiedRaw);
        flashcardsStudied = Math.max(flashcardsStudied, ids.length);
      }

      // cases reviewed from dedicated key
      let casesReviewed = base.casesReviewed || [];
      const casesRaw = localStorage.getItem('sonata-cases-reviewed');
      if (casesRaw) {
        const ids: string[] = JSON.parse(casesRaw);
        casesReviewed = ids;
      }

      setStats({
        flashcardsStudied,
        quizzesTaken: base.quizzesTaken || 0,
        totalCorrect: base.totalCorrect || 0,
        totalAnswered: base.totalAnswered || 0,
        streak,
        casesReviewed,
        bestScore,
      });
    } catch {
      // ignore
    }
  }, []);

  const accuracy =
    stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

  const totalCards = preloadedFlashcards.length;
  const cardGoal = 50;
  const cardProgress = Math.min((stats.flashcardsStudied / cardGoal) * 100, 100);
  const caseGoal = caseStudies.length;
  const caseProgress = Math.min((stats.casesReviewed.length / caseGoal) * 100, 100);

  const achievements: Achievement[] = [
    {
      id: 'first-quiz',
      label: 'First Quiz',
      description: 'Complete your first quiz',
      icon: '🎯',
      unlocked: stats.quizzesTaken >= 1,
    },
    {
      id: 'streak-master',
      label: 'Streak Master',
      description: 'Maintain a 3-day study streak',
      icon: '🔥',
      unlocked: stats.streak >= 3,
    },
    {
      id: 'case-solver',
      label: 'Case Solver',
      description: 'Review all 3 case studies',
      icon: '🩺',
      unlocked: stats.casesReviewed.length >= caseStudies.length,
    },
    {
      id: 'card-collector',
      label: 'Card Collector',
      description: 'Study 20 flashcards',
      icon: '📚',
      unlocked: stats.flashcardsStudied >= 20,
    },
    {
      id: 'ace',
      label: 'Ace',
      description: 'Score 90%+ on a quiz',
      icon: '⭐',
      unlocked: stats.bestScore >= 90,
    },
    {
      id: 'scholar',
      label: 'Scholar',
      description: 'Complete 5 quizzes',
      icon: '🎓',
      unlocked: stats.quizzesTaken >= 5,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const statCards = [
    {
      label: 'Day Streak',
      value: stats.streak,
      unit: 'days',
      icon: '🔥',
      color: 'text-orange-500',
    },
    {
      label: 'Quizzes Taken',
      value: stats.quizzesTaken,
      unit: 'total',
      icon: '🎯',
      color: 'text-pink-500',
    },
    {
      label: 'Best Score',
      value: stats.bestScore > 0 ? `${stats.bestScore}%` : '—',
      unit: 'overall',
      icon: '⭐',
      color: 'text-amber-500',
    },
    {
      label: 'Accuracy',
      value: stats.totalAnswered > 0 ? `${accuracy}%` : '—',
      unit: `${stats.totalAnswered} answered`,
      icon: '✅',
      color: 'text-emerald-500',
    },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <div className="px-5 pt-4 pb-5" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
        <h1 className="text-xl font-bold text-gray-900 mb-1">My Progress</h1>
        <p className="text-sm text-gray-400">
          {unlockedCount} of {achievements.length} achievements unlocked
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="px-5 mb-5">
        <div className="grid grid-cols-2 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{s.icon}</span>
                <span className="text-xs font-medium text-gray-500">{s.label}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.unit}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bars */}
      <div className="px-5 mb-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Goals</h2>
        <div className="bg-white border border-pink-100 rounded-2xl p-4 shadow-sm space-y-4">
          {/* Flashcards */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">📖</span>
                <span className="text-sm font-medium text-gray-700">Cards Studied</span>
              </div>
              <span className="text-xs font-bold text-pink-500">
                {stats.flashcardsStudied} / {cardGoal}
              </span>
            </div>
            <AnimatedBar pct={cardProgress} />
            <p className="text-[10px] text-gray-400 mt-1">
              {cardGoal - stats.flashcardsStudied > 0
                ? `${cardGoal - stats.flashcardsStudied} more to reach goal`
                : 'Goal reached!'}
            </p>
          </div>

          {/* Cases */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🩺</span>
                <span className="text-sm font-medium text-gray-700">Cases Reviewed</span>
              </div>
              <span className="text-xs font-bold text-pink-500">
                {stats.casesReviewed.length} / {caseGoal}
              </span>
            </div>
            <AnimatedBar pct={caseProgress} color="bg-fuchsia-400" />
            <p className="text-[10px] text-gray-400 mt-1">
              {caseGoal - stats.casesReviewed.length > 0
                ? `${caseGoal - stats.casesReviewed.length} case${caseGoal - stats.casesReviewed.length > 1 ? 's' : ''} remaining`
                : 'All cases reviewed!'}
            </p>
          </div>

          {/* Quiz accuracy */}
          {stats.totalAnswered > 0 && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🎯</span>
                  <span className="text-sm font-medium text-gray-700">Quiz Accuracy</span>
                </div>
                <span className="text-xs font-bold text-pink-500">{accuracy}%</span>
              </div>
              <AnimatedBar pct={accuracy} color={accuracy >= 80 ? 'bg-emerald-400' : accuracy >= 60 ? 'bg-amber-400' : 'bg-red-400'} />
              <p className="text-[10px] text-gray-400 mt-1">
                {stats.totalCorrect} correct of {stats.totalAnswered} answered
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div className="px-5 mb-6">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Achievements</h2>
        <div className="grid grid-cols-2 gap-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`bg-white border rounded-2xl p-4 shadow-sm transition-all ${
                a.unlocked ? 'border-pink-200' : 'border-pink-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-2xl ${!a.unlocked ? 'grayscale' : ''}`}>{a.icon}</span>
                {a.unlocked && (
                  <div className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center ml-auto">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                )}
              </div>
              <p className={`text-xs font-bold mt-1 ${a.unlocked ? 'text-gray-900' : 'text-gray-400'}`}>
                {a.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{a.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
