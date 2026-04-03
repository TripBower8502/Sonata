'use client';

import { useState } from 'react';
import type { Flashcard } from '@/lib/data';

interface FlashCardProps {
  card: Flashcard;
  cardNumber: number;
  totalCards: number;
}

export default function FlashCard({ card, cardNumber, totalCards }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const categoryColors: Record<string, string> = {
    Views: 'bg-blue-50 text-blue-600 border-blue-200',
    Measurements: 'bg-purple-50 text-purple-600 border-purple-200',
    Pathology: 'bg-red-50 text-red-600 border-red-200',
    Doppler: 'bg-amber-50 text-amber-600 border-amber-200',
  };

  const categoryBorder: Record<string, string> = {
    Views: 'border-blue-200',
    Measurements: 'border-purple-200',
    Pathology: 'border-red-200',
    Doppler: 'border-amber-200',
  };

  const colorClass = categoryColors[card.category] || 'bg-gray-50 text-gray-600 border-gray-200';
  const borderClass = categoryBorder[card.category] || 'border-gray-200';

  return (
    <div className="w-full px-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${colorClass}`}>
          {card.category}
        </span>
        <span className="text-xs text-gray-400 font-medium">
          {cardNumber} / {totalCards}
        </span>
      </div>

      {/* Card container with 3D flip */}
      <div
        className="relative w-full cursor-pointer select-none"
        style={{ height: '420px', perspective: '1000px' }}
        onClick={() => setIsFlipped(!isFlipped)}
        role="button"
        aria-label={isFlipped ? 'Card showing answer, tap to see question' : 'Card showing question, tap to see answer'}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front face */}
          <div
            className={`absolute inset-0 rounded-2xl border ${borderClass} bg-white shadow-sm flex flex-col overflow-hidden`}
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          >
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-200 flex items-center justify-center mb-4">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">
                {card.front}
              </h2>
              {card.normalValues && (
                <div className="mt-4 px-3 py-2 bg-pink-50 border border-pink-200 rounded-xl">
                  <p className="text-xs text-pink-500 font-medium">Normal Values Preview</p>
                  <p className="text-xs text-gray-600 mt-0.5">{card.normalValues}</p>
                </div>
              )}
            </div>
            <div className="px-6 pb-5 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-xs text-gray-400">Tap to reveal</span>
            </div>
          </div>

          {/* Back face */}
          <div
            className={`absolute inset-0 rounded-2xl border ${borderClass} bg-white shadow-sm flex flex-col overflow-hidden`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-xs font-semibold text-pink-500 uppercase tracking-wider">Answer</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{card.back}</p>
              {card.normalValues && (
                <div className="mt-4 p-3 bg-pink-50 border border-pink-200 rounded-xl">
                  <p className="text-xs font-semibold text-pink-500 mb-1">Normal Values</p>
                  <p className="text-xs text-gray-600 leading-relaxed">{card.normalValues}</p>
                </div>
              )}
            </div>
            <div className="px-6 pb-5 flex items-center justify-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
              <span className="text-xs text-gray-400">Tap to flip back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
