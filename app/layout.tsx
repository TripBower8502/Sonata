import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import PinScreen from '@/components/PinScreen';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sonata — Echo Study App',
  description: 'Master echocardiography with AI-powered flashcards, quizzes, and an expert tutor',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sonata Echo',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#fdf2f8',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-navy-900 text-gray-900 min-h-screen">
        <PinScreen>
          <div
            className="min-h-screen flex flex-col"
            style={{ paddingBottom: 'calc(64px + env(safe-area-inset-bottom))' }}
          >
            <main className="flex-1">
              {children}
            </main>
          </div>
          <BottomNav />
        </PinScreen>
      </body>
    </html>
  );
}
