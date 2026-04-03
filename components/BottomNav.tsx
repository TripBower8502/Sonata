'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  {
    href: '/',
    label: 'Home',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          fill={active ? 'currentColor' : 'none'}
        />
        <polyline points="9 22 9 12 15 12 15 22" stroke={active ? 'white' : 'currentColor'} />
      </svg>
    ),
  },
  {
    href: '/flashcards',
    label: 'Cards',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Bottom card */}
        <rect x="4" y="7" width="17" height="13" rx="2" fill={active ? 'currentColor' : 'none'} opacity={active ? '0.3' : '1'} />
        {/* Top card */}
        <rect x="2" y="4" width="17" height="13" rx="2" fill={active ? 'currentColor' : 'none'} />
        {!active && <line x1="6" y1="10" x2="14" y2="10" />}
        {!active && <line x1="6" y1="13" x2="11" y2="13" />}
      </svg>
    ),
  },
  {
    href: '/quiz',
    label: 'Quiz',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" fill={active ? 'currentColor' : 'none'} />
        <circle cx="12" cy="12" r="4" stroke={active ? 'white' : 'currentColor'} />
        <line x1="21.17" y1="8" x2="12" y2="8" stroke={active ? 'white' : 'currentColor'} />
        <line x1="3.95" y1="6.06" x2="8.54" y2="14" stroke={active ? 'white' : 'currentColor'} />
        <line x1="10.88" y1="21.94" x2="15.46" y2="14" stroke={active ? 'white' : 'currentColor'} />
      </svg>
    ),
  },
  {
    href: '/cases',
    label: 'Cases',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
          fill={active ? 'currentColor' : 'none'}
        />
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" fill={active ? 'white' : 'none'} />
        {!active && <line x1="9" y1="12" x2="15" y2="12" />}
        {!active && <line x1="9" y1="16" x2="12" y2="16" />}
        {active && <line x1="9" y1="12" x2="15" y2="12" stroke="white" />}
        {active && <line x1="9" y1="16" x2="12" y2="16" stroke="white" />}
      </svg>
    ),
  },
  {
    href: '/progress',
    label: 'Progress',
    icon: (active: boolean) => (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {active ? (
          <>
            <rect x="3" y="12" width="4" height="9" rx="1" fill="currentColor" stroke="none" />
            <rect x="10" y="6" width="4" height="15" rx="1" fill="currentColor" stroke="none" />
            <rect x="17" y="2" width="4" height="19" rx="1" fill="currentColor" stroke="none" />
          </>
        ) : (
          <>
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </>
        )}
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-pink-100"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 min-h-[44px] gap-1 transition-colors duration-150 ${
                isActive ? 'text-pink-500' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {item.icon(isActive)}
              <span
                className={`text-[10px] font-medium ${isActive ? 'text-pink-500' : 'text-gray-400'}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
