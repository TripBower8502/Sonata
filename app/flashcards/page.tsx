'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import FlashCard from '@/components/FlashCard';
import { preloadedFlashcards, ECHO_TOPICS, type Flashcard } from '@/lib/data';

const SESSION_KEY = 'sonata-generated-cards';
const STUDIED_KEY = 'sonata-studied-cards';
const STATS_KEY = 'sonata-stats';

function loadGeneratedCards(): Flashcard[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Flashcard[]) : [];
  } catch {
    return [];
  }
}

function saveGeneratedCards(cards: Flashcard[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(cards));
  } catch {
    // ignore
  }
}

function loadStudiedIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STUDIED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function markStudied(id: string) {
  if (typeof window === 'undefined') return;
  try {
    const studied = loadStudiedIds();
    studied.add(id);
    localStorage.setItem(STUDIED_KEY, JSON.stringify(Array.from(studied)));
    // update stats
    const raw = localStorage.getItem(STATS_KEY);
    const stats = raw ? JSON.parse(raw) : {};
    stats.flashcardsStudied = studied.size;
    stats.lastStudied = new Date().toDateString();
    if (!stats.streak) stats.streak = 0;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (stats.lastStudied !== new Date().toDateString() && stats.lastStudied !== yesterday) {
      stats.streak = 1;
    } else if (stats.lastStudied !== new Date().toDateString()) {
      stats.streak = (stats.streak || 0) + 1;
    }
    stats.lastStudied = new Date().toDateString();
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

interface GenerateModalProps {
  onClose: () => void;
  onGenerated: (cards: Flashcard[]) => void;
}

function GenerateModal({ onClose, onGenerated }: GenerateModalProps) {
  const [selectedTopic, setSelectedTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'flashcards', topic: selectedTopic }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate cards');
      }
      const newCards: Flashcard[] = (
        data.cards as Array<{
          front: string;
          back: string;
          category: string;
          normalValues?: string;
        }>
      ).map((c, i) => ({
        id: `gen-${Date.now()}-${i}`,
        front: c.front,
        back: c.back,
        category: c.category || selectedTopic,
        normalValues: c.normalValues,
      }));
      onGenerated(newCards);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl p-6 pb-8 shadow-xl"
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}>
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Generate Cards</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-4">Pick a topic to generate 5 new AI flashcards.</p>

        {/* Topic pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {ECHO_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                selectedTopic === topic
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-pink-300'
              }`}
            >
              {topic}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!selectedTopic || loading}
          className="w-full py-3.5 rounded-2xl bg-pink-500 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity"
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Generating cards...
            </>
          ) : (
            <>
              <span>✨</span>
              Generate 5 Cards
              {selectedTopic && <span className="font-normal opacity-80">· {selectedTopic}</span>}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const [generatedCards, setGeneratedCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [studiedIds, setStudiedIds] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [mounted, setMounted] = useState(false);
  const cardKey = useRef(0); // force re-mount FlashCard on index change to reset flip

  useEffect(() => {
    setMounted(true);
    setGeneratedCards(loadGeneratedCards());
    setStudiedIds(loadStudiedIds());
  }, []);

  const allCards = [...preloadedFlashcards, ...generatedCards];

  const categories = ['All', ...Array.from(new Set(allCards.map((c) => c.category)))];

  const filteredCards =
    filterCategory === 'All' ? allCards : allCards.filter((c) => c.category === filterCategory);

  const currentCard = filteredCards[currentIndex] ?? filteredCards[0];
  const safeIndex = Math.min(currentIndex, filteredCards.length - 1);

  const goNext = useCallback(() => {
    const next = (safeIndex + 1) % filteredCards.length;
    setCurrentIndex(next);
    cardKey.current += 1;
    if (filteredCards[safeIndex]) {
      markStudied(filteredCards[safeIndex].id);
      setStudiedIds(loadStudiedIds());
    }
  }, [safeIndex, filteredCards]);

  const goPrev = useCallback(() => {
    const prev = (safeIndex - 1 + filteredCards.length) % filteredCards.length;
    setCurrentIndex(prev);
    cardKey.current += 1;
  }, [safeIndex, filteredCards.length]);

  const handleGenerated = (newCards: Flashcard[]) => {
    const updated = [...generatedCards, ...newCards];
    setGeneratedCards(updated);
    saveGeneratedCards(updated);
    // Navigate to first new card
    const newIndex = allCards.length; // after preloaded
    setCurrentIndex(Math.min(newIndex, allCards.length + newCards.length - 1));
    setFilterCategory('All');
    cardKey.current += 1;
  };

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
      <div
        className="px-5 pt-4 pb-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Flashcards</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {studiedIds.size} of {allCards.length} studied
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-pink-500 text-white rounded-xl text-xs font-semibold shadow-sm active:scale-95 transition-transform"
          >
            <span>✨</span>
            Generate
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilterCategory(cat);
                setCurrentIndex(0);
                cardKey.current += 1;
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all flex-shrink-0 ${
                filterCategory === cat
                  ? 'bg-pink-500 text-white border-pink-500'
                  : 'bg-white text-gray-600 border-pink-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Card */}
      {filteredCards.length > 0 ? (
        <>
          <FlashCard
            key={cardKey.current}
            card={currentCard}
            cardNumber={safeIndex + 1}
            totalCards={filteredCards.length}
          />

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-5 px-5">
            <button
              onClick={goPrev}
              className="flex items-center gap-2 px-5 py-3 bg-white border border-pink-100 rounded-2xl text-sm font-medium text-gray-700 shadow-sm active:scale-95 transition-transform"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Prev
            </button>

            {/* Dot progress */}
            <div className="flex items-center gap-1">
              {filteredCards.slice(Math.max(0, safeIndex - 2), safeIndex + 3).map((_, i) => {
                const absIndex = Math.max(0, safeIndex - 2) + i;
                return (
                  <div
                    key={absIndex}
                    className={`rounded-full transition-all ${
                      absIndex === safeIndex
                        ? 'w-4 h-2 bg-pink-500'
                        : studiedIds.has(filteredCards[absIndex]?.id)
                        ? 'w-2 h-2 bg-pink-300'
                        : 'w-2 h-2 bg-gray-200'
                    }`}
                  />
                );
              })}
            </div>

            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-3 bg-pink-500 text-white rounded-2xl text-sm font-semibold shadow-sm active:scale-95 transition-transform"
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-5 mt-4">
            <div className="bg-white border border-pink-100 rounded-2xl p-3 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium text-gray-500">Overall Progress</span>
                <span className="text-xs font-bold text-pink-500">
                  {Math.round((studiedIds.size / allCards.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-pink-50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-400 rounded-full transition-all duration-500"
                  style={{ width: `${(studiedIds.size / allCards.length) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                {studiedIds.size} studied · {allCards.length - studiedIds.size} remaining
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="px-5 py-12 text-center">
          <p className="text-gray-400 text-sm">No cards in this category.</p>
        </div>
      )}

      {showModal && (
        <GenerateModal onClose={() => setShowModal(false)} onGenerated={handleGenerated} />
      )}
    </div>
  );
}
