'use client';

import type { QuizQuestion } from '@/lib/data';

interface QuizQuestionProps {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  onAnswer: (index: number) => void;
  showExplanation: boolean;
}

export default function QuizQuestionComponent({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswer,
  showExplanation,
}: QuizQuestionProps) {
  const isCorrect = selectedAnswer === question.correctIndex;

  const getOptionStyle = (index: number) => {
    if (selectedAnswer === null) {
      return 'bg-white border-pink-100 text-gray-700 hover:border-pink-300 active:bg-pink-50';
    }
    if (index === question.correctIndex) {
      return 'bg-emerald-50 border-emerald-300 text-emerald-700';
    }
    if (index === selectedAnswer && selectedAnswer !== question.correctIndex) {
      return 'bg-red-50 border-red-300 text-red-600';
    }
    return 'bg-white border-pink-100 text-gray-400 opacity-60';
  };

  const getOptionIcon = (index: number) => {
    if (selectedAnswer === null) return null;
    if (index === question.correctIndex) {
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      );
    }
    if (index === selectedAnswer) {
      return (
        <div className="w-6 h-6 rounded-full bg-red-400 flex items-center justify-center flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      );
    }
    return (
      <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-pink-300">{String.fromCharCode(65 + index)}</span>
      </div>
    );
  };

  const getOptionLabel = (index: number) => {
    if (selectedAnswer !== null) return null;
    return (
      <div className="w-6 h-6 rounded-full bg-pink-50 border border-pink-200 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-pink-400">{String.fromCharCode(65 + index)}</span>
      </div>
    );
  };

  return (
    <div className="w-full px-4">
      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400 font-medium">Question {questionNumber} of {totalQuestions}</span>
        <span className="text-xs text-gray-500 px-2 py-0.5 bg-white rounded-full border border-pink-100 shadow-sm">{question.category}</span>
      </div>
      <div className="w-full bg-pink-100 rounded-full h-1 mb-5">
        <div
          className="bg-pink-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="bg-white border border-pink-100 rounded-2xl p-5 mb-4 shadow-sm">
        <p className="text-base font-semibold text-gray-900 leading-relaxed">{question.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => selectedAnswer === null && onAnswer(index)}
            disabled={selectedAnswer !== null}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-start gap-3 min-h-[52px] shadow-sm ${getOptionStyle(index)}`}
          >
            {selectedAnswer !== null ? getOptionIcon(index) : getOptionLabel(index)}
            <span className="text-sm leading-relaxed pt-0.5">{option}</span>
          </button>
        ))}
      </div>

      {/* Explanation */}
      {showExplanation && (
        <div className={`rounded-2xl border p-4 mt-2 ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isCorrect ? '#10b981' : '#f59e0b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span className={`text-xs font-bold uppercase tracking-wider ${isCorrect ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isCorrect ? 'Correct!' : 'Explanation'}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </div>
  );
}
