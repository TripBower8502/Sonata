'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { preloadedFlashcards, caseStudies } from '@/lib/data';

interface StudyStats {
  streak: number;
  lastStudied: string | null;
  flashcardsStudied: number;
  quizzesTaken: number;
  totalCorrect: number;
  totalAnswered: number;
  casesReviewed: string[];
  bestScore: number;
}

function getDefaultStats(): StudyStats {
  return {
    streak: 0,
    lastStudied: null,
    flashcardsStudied: 0,
    quizzesTaken: 0,
    totalCorrect: 0,
    totalAnswered: 0,
    casesReviewed: [],
    bestScore: 0,
  };
}

const DAILY_TIPS = [
  'The modified Bernoulli equation (ΔP = 4v²) is essential for gradient calculations. Always align your CW Doppler beam within 20° of flow direction for accurate measurements.',
  "Remember the four parameters for diastolic dysfunction grading: E/A ratio, e' velocity, E/e' ratio, and TR velocity. You need ≥3 abnormal to diagnose elevated LV filling pressures.",
  'Normal IVC diameter is <2.1 cm with >50% inspiratory collapse — this correlates with RAP of 3 mmHg. Plethoric IVC (>2.1 cm, <50% collapse) = RAP ≥15 mmHg.',
  "TAPSE <17mm and RV S' <9.5 cm/s both indicate RV systolic dysfunction. TAPSE is the most widely used bedside RV function parameter.",
  "Simpson's biplane method is the gold standard for EF calculation — it uses two orthogonal apical views (A4C and A2C) and doesn't assume LV geometry.",
];

export default function Dashboard() {
  const [stats, setStats] = useState<StudyStats>(getDefaultStats());
  const [mounted, setMounted] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    // pick a daily tip based on day of year
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    setTipIndex(dayOfYear % DAILY_TIPS.length);

    try {
      const stored = localStorage.getItem('sonata-stats');
      if (stored) {
        const parsed = JSON.parse(stored) as StudyStats;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        let streak = parsed.streak || 0;
        if (parsed.lastStudied !== today && parsed.lastStudied !== yesterday) {
          streak = 0;
        }
        // also pull best score from separate key
        let bestScore = parsed.bestScore || 0;
        try {
          const bs = localStorage.getItem('sonata-best-overall');
          if (bs) bestScore = Math.max(bestScore, parseInt(bs, 10));
        } catch {
          // ignore
        }
        setStats({ ...parsed, streak, bestScore });
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const accuracy =
    stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;

  const casesReviewedCount = Array.isArray(stats.casesReviewed) ? stats.casesReviewed.length : 0;

  const quickActions = [
    {
      href: '/flashcards',
      label: 'Flashcards',
      description: `${preloadedFlashcards.length}+ cards — tap to flip`,
      icon: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M6 2v3M18 2v3" />
          <line x1="7" y1="11" x2="17" y2="11" />
          <line x1="7" y1="15" x2="13" y2="15" />
        </svg>
      ),
      color: 'hover:border-pink-200',
      iconBg: 'bg-pink-50 text-pink-500',
      badge: 'LV Function · Doppler · Valves · Views',
    },
    {
      href: '/quiz',
      label: 'Quiz Mode',
      description: 'AI-generated quizzes on any topic',
      icon: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
          <line x1="21.17" y1="8" x2="12" y2="8" />
          <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
          <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
        </svg>
      ),
      color: 'hover:border-pink-200',
      iconBg: 'bg-rose-50 text-rose-500',
      badge: '10 topics · instant feedback · AI explanations',
    },
    {
      href: '/cases',
      label: 'Case Studies',
      description: `${caseStudies.length} clinical cases with AI tutor`,
      icon: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          <line x1="9" y1="12" x2="15" y2="12" />
          <line x1="9" y1="16" x2="12" y2="16" />
          <path d="M12 7v3" />
          <circle cx="12" cy="7" r="1" fill="currentColor" />
        </svg>
      ),
      color: 'hover:border-pink-200',
      iconBg: 'bg-fuchsia-50 text-fuchsia-500',
      badge: 'DCM · HOCM · Endocarditis',
    },
    {
      href: '/progress',
      label: 'My Progress',
      description: 'Streaks, scores, and achievements',
      icon: (
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      color: 'hover:border-pink-200',
      iconBg: 'bg-purple-50 text-purple-500',
      badge: 'Streak · Accuracy · Badges',
    },
  ];

  return (
    <div className="min-h-screen bg-navy-900">
      {/* Header */}
      <div
        className="px-5 pt-4 pb-5"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-pink-500 flex items-center justify-center shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M2 12 Q5 4 8 12 Q11 20 14 12 Q17 4 20 12"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sonata</h1>
            </div>
            <p className="text-gray-400 text-sm">Echocardiography Study App</p>
          </div>
          {mounted && (
            <div className="flex flex-col items-center bg-white border border-pink-100 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">🔥</span>
                <span className="text-xl font-bold text-gray-900">{stats.streak}</span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">day streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      {mounted && (
        <div className="px-5 mb-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-pink-100 rounded-2xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-pink-500">{stats.flashcardsStudied}</div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">Cards Studied</div>
            </div>
            <div className="bg-white border border-pink-100 rounded-2xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-pink-500">
                {stats.bestScore > 0 ? `${stats.bestScore}%` : '—'}
              </div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">Best Score</div>
            </div>
            <div className="bg-white border border-pink-100 rounded-2xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-pink-500">{casesReviewedCount}</div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">Cases Done</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Study Modules
        </h2>
        <div className="space-y-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-4 p-4 rounded-2xl border border-pink-100 bg-white transition-all duration-200 active:scale-[0.98] shadow-sm ${action.color}`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${action.iconBg}`}
              >
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-base">{action.label}</h3>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{action.description}</p>
                <p className="text-[10px] text-gray-400 mt-1">{action.badge}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Daily tip */}
      <div className="px-5 mt-5 mb-2">
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ec4899"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-pink-500 mb-1">Daily Tip</p>
              <p className="text-xs text-gray-600 leading-relaxed">{DAILY_TIPS[tipIndex]}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
