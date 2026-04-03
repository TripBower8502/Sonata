'use client';

import { useState, useEffect, useCallback } from 'react';
import { flashcards, type FlashcardCategory } from '@/lib/data';
import FlashCard from '@/components/FlashCard';

const CATEGORIES: FlashcardCategory[] = ['Views', 'Measurements', 'Pathology', 'Doppler'];

const categoryConfig: Record<FlashcardCategory, { color: string; bg: string; activeBg: string; activeText: string }> = {
  Views: {
    color: 'text-blue-500',
    bg: 'bg-white border-pink-100 text-gray-500',
    activeBg: 'bg-blue-50 border-blue-200',
    activeText: 'text-blue-600',
  },
  Measurements: {
    color: 'text-purple-500',
    bg: 'bg-white border-pink-100 text-gray-500',
    activeBg: 'bg-purple-50 border-purple-200',
    activeText: 'text-purple-600',
  },
  Pathology: {
    color: 'text-red-500',
    bg: 'bg-white border-pink-100 text-gray-500',
    activeBg: 'bg-red-50 border-red-200',
    activeText: 'text-red-600',
  },
  Doppler: {
    color: 'text-amber-500',
    bg: 'bg-white border-pink-100 text-gray-500',
    activeBg: 'bg-amber-50 border-amber-200',
    activeText: 'text-amber-600',
  },
};

export default function FlashcardsPage() {
  const [selectedCategory, setSelectedCategory] = useState<FlashcardCategory | 'All'>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studiedIds, setStudiedIds] = useState<Set<string>>(new Set());
  const [cardKey, setCardKey] = useState(0);

  const filteredCards = selectedCategory === 'All'
    ? flashcards
    : flashcards.filter(c => c.category === selectedCategory);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sonata-studied');
      if (stored) setStudiedIds(new Set(JSON.parse(stored)));
    } catch { /* ignore */ }
  }, []);

  const markStudied = useCallback((id: string) => {
    setStudiedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('sonata-studied', JSON.stringify([...next]));
        const statsStr = localStorage.getItem('sonata-stats');
        const stats = statsStr ? JSON.parse(statsStr) : {};
        const today = new Date().toDateString();
        const wasToday = stats.lastStudied === today;
        const wasYesterday = stats.lastStudied === new Date(Date.now() - 86400000).toDateString();
        localStorage.setItem('sonata-stats', JSON.stringify({
          ...stats,
          flashcardsStudied: (stats.flashcardsStudied || 0) + 1,
          streak: wasToday ? (stats.streak || 1) : (wasYesterday ? (stats.streak || 0) + 1 : 1),
          lastStudied: today,
        }));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleCategoryChange = (cat: FlashcardCategory | 'All') => {
    setSelectedCategory(cat);
    setCurrentIndex(0);
    setCardKey(k => k + 1);
  };

  const handleNext = () => {
    const card = filteredCards[currentIndex];
    if (card) markStudied(card.id);
    setCurrentIndex(i => Math.min(i + 1, filteredCards.length - 1));
    setCardKey(k => k + 1);
  };

  const handlePrev = () => {
    setCurrentIndex(i => Math.max(i - 1, 0));
    setCardKey(k => k + 1);
  };

  const handleShuffle = () => {
    setCurrentIndex(Math.floor(Math.random() * filteredCards.length));
    setCardKey(k => k + 1);
  };

  const currentCard = filteredCards[currentIndex];
  const studiedInCategory = filteredCards.filter(c => studiedIds.has(c.id)).length;
  const progressPercent = filteredCards.length > 0 ? (studiedInCategory / filteredCards.length) * 100 : 0;

  return (
    <div className="page-enter min-h-screen bg-navy-900">
      {/* Header */}
      <div
        className="px-5 pt-4 pb-4 border-b border-pink-100 bg-white"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Flashcards</h1>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-xl text-xs text-pink-600 font-medium active:scale-95 transition-transform"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
            </svg>
            Shuffle
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => handleCategoryChange('All')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              selectedCategory === 'All'
                ? 'bg-pink-50 border-pink-300 text-pink-600'
                : 'bg-white border-pink-100 text-gray-500'
            }`}
          >
            All ({flashcards.length})
          </button>
          {CATEGORIES.map(cat => {
            const cfg = categoryConfig[cat];
            const isActive = selectedCategory === cat;
            const count = flashcards.filter(c => c.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isActive ? `${cfg.activeBg} ${cfg.activeText}` : cfg.bg
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-400 font-medium">Progress</span>
          <span className="text-xs text-pink-500 font-semibold">{studiedInCategory} / {filteredCards.length} studied</span>
        </div>
        <div className="w-full bg-pink-100 rounded-full h-1.5">
          <div
            className="bg-pink-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Card display */}
      {currentCard ? (
        <div className="pb-4">
          <FlashCard
            key={cardKey}
            card={currentCard}
            cardNumber={currentIndex + 1}
            totalCards={filteredCards.length}
          />

          {/* Navigation buttons */}
          <div className="flex items-center justify-between px-4 mt-5 gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-pink-200 text-sm font-semibold text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === filteredCards.length - 1}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-pink-500 text-sm font-semibold text-white disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Category breakdown */}
          <div className="px-4 mt-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Category Progress</h3>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => {
                const catCards = flashcards.filter(c => c.category === cat);
                const catStudied = catCards.filter(c => studiedIds.has(c.id)).length;
                const pct = catCards.length > 0 ? Math.round((catStudied / catCards.length) * 100) : 0;
                const cfg = categoryConfig[cat];
                return (
                  <div key={cat} className="bg-white border border-pink-100 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold ${cfg.color}`}>{cat}</span>
                      <span className="text-xs text-gray-400">{catStudied}/{catCards.length}</span>
                    </div>
                    <div className="w-full bg-pink-50 rounded-full h-1">
                      <div
                        className="h-1 rounded-full transition-all duration-500 bg-pink-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">{pct}% complete</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 px-5">
          <p className="text-gray-400 text-center">No cards in this category.</p>
        </div>
      )}
    </div>
  );
}
