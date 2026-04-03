'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { flashcards, quizQuestions } from '@/lib/data';

interface StudyStats {
  streak: number;
  lastStudied: string | null;
  flashcardsStudied: number;
  quizzesTaken: number;
  totalCorrect: number;
  totalAnswered: number;
}

function getDefaultStats(): StudyStats {
  return {
    streak: 0,
    lastStudied: null,
    flashcardsStudied: 0,
    quizzesTaken: 0,
    totalCorrect: 0,
    totalAnswered: 0,
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<StudyStats>(getDefaultStats());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem('sonata-stats');
      if (stored) {
        const parsed = JSON.parse(stored) as StudyStats;
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        let streak = parsed.streak;
        if (parsed.lastStudied !== today && parsed.lastStudied !== yesterday) {
          streak = 0;
        }
        setStats({ ...parsed, streak });
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const accuracy = stats.totalAnswered > 0
    ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100)
    : 0;

  const quickActions = [
    {
      href: '/flashcards',
      label: 'Flashcards',
      description: `${flashcards.length} cards across 4 categories`,
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="7" y1="10" x2="17" y2="10" />
          <line x1="7" y1="14" x2="13" y2="14" />
        </svg>
      ),
      color: 'bg-blue-50 border-blue-100 hover:border-blue-200',
      iconBg: 'bg-blue-100 text-blue-500',
      badge: 'Views · Measurements · Pathology · Doppler',
    },
    {
      href: '/quiz',
      label: 'Quiz Mode',
      description: `${quizQuestions.length}+ questions with explanations`,
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
        </svg>
      ),
      color: 'bg-violet-50 border-violet-100 hover:border-violet-200',
      iconBg: 'bg-violet-100 text-violet-500',
      badge: 'Normal Values · Pathology · Formulas',
    },
    {
      href: '/tutor',
      label: 'AI Tutor',
      description: 'Ask Grok anything about echo',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      color: 'bg-pink-50 border-pink-100 hover:border-pink-200',
      iconBg: 'bg-pink-100 text-pink-500',
      badge: 'Powered by Grok AI',
    },
    {
      href: '/reference',
      label: 'Reference Guide',
      description: 'Normal values, formulas & grading',
      icon: (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="15" x2="12" y2="15" />
        </svg>
      ),
      color: 'bg-amber-50 border-amber-100 hover:border-amber-200',
      iconBg: 'bg-amber-100 text-amber-500',
      badge: 'AS · AR · MR · MS Grading',
    },
  ];

  return (
    <div className="page-enter min-h-screen bg-navy-900">
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
                  <path d="M2 12 Q5 4 8 12 Q11 20 14 12 Q17 4 20 12"
                    stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
              <div className="text-xl font-bold text-violet-500">{stats.quizzesTaken}</div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">Quizzes Done</div>
            </div>
            <div className="bg-white border border-pink-100 rounded-2xl p-3 text-center shadow-sm">
              <div className="text-xl font-bold text-amber-500">{accuracy}%</div>
              <div className="text-[10px] text-gray-400 font-medium mt-0.5">Accuracy</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="px-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Study Modules</h2>
        <div className="space-y-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-4 p-4 rounded-2xl border bg-white transition-all duration-200 active:scale-[0.98] shadow-sm ${action.color}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${action.iconBg}`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 text-base">{action.label}</h3>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
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

      {/* Quick tip */}
      <div className="px-5 mt-5 mb-2">
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-pink-500 mb-1">Daily Tip</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                The modified Bernoulli equation (ΔP = 4v²) is essential for gradient calculations. Always align your CW Doppler beam within 20° of flow direction for accurate measurements.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
