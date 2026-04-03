'use client';

import { useState, useEffect } from 'react';

const CORRECT_PIN = '7985';

export default function PinScreen({ children }: { children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (sessionStorage.getItem('sonata-unlocked') === '1') {
      setUnlocked(true);
    }
  }, []);

  const handleDigit = (d: string) => {
    if (pin.length >= 4 || error) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 4) {
      if (next === CORRECT_PIN) {
        sessionStorage.setItem('sonata-unlocked', '1');
        setTimeout(() => setUnlocked(true), 200);
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 700);
      }
    }
  };

  const handleDelete = () => {
    if (error) return;
    setPin(p => p.slice(0, -1));
  };

  if (!mounted) return null;
  if (unlocked) return <>{children}</>;

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del'],
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      style={{
        background: 'linear-gradient(145deg, #fdf2f8 0%, #fce7f3 50%, #fdf4ff 100%)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-pink-500 shadow-lg shadow-pink-200 flex items-center justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M2 12 Q5 4 8 12 Q11 20 14 12 Q17 4 20 12 Q21 16 22 12"
              stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sonata</h1>
        <p className="text-sm text-gray-400 mt-1">Enter your PIN to continue</p>
      </div>

      {/* PIN dots */}
      <div className={`flex gap-4 mb-10 ${error ? 'pin-shake' : ''}`}>
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? error
                  ? 'bg-red-400 border-red-400'
                  : 'bg-pink-500 border-pink-500 scale-110'
                : 'bg-transparent border-pink-300'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-400 font-medium mb-6 -mt-4">Incorrect PIN</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {digits.flat().map((d, i) => {
          if (d === '') return <div key={i} />;
          if (d === 'del') {
            return (
              <button
                key={i}
                onClick={handleDelete}
                disabled={pin.length === 0}
                className="h-16 rounded-2xl bg-white/70 border border-pink-100 flex items-center justify-center text-gray-500 active:scale-95 transition-all disabled:opacity-30 shadow-sm"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                  <line x1="18" y1="9" x2="12" y2="15" />
                  <line x1="12" y1="9" x2="18" y2="15" />
                </svg>
              </button>
            );
          }
          return (
            <button
              key={i}
              onClick={() => handleDigit(d)}
              className="h-16 rounded-2xl bg-white border border-pink-100 text-2xl font-semibold text-gray-900 active:scale-95 active:bg-pink-50 transition-all shadow-sm hover:border-pink-200"
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
