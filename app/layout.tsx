import type { Metadata, Viewport } from 'next';
import { Sora, Space_Mono } from 'next/font/google';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-space-mono',
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
  themeColor: '#fdf0f3',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${spaceMono.variable}`}>
      <body className="min-h-screen" style={{ background: '#fdf0f3' }}>
        {children}
      </body>
    </html>
  );
}
