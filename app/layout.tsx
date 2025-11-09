import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pantheon Pandemonium',
  description: 'Become a proto-god and shape the world to your divine will',
  keywords: ['strategy game', 'turn-based', 'gods', 'mythology', 'roguelite'],
  authors: [{ name: 'Pantheon Games' }],
  openGraph: {
    title: 'Pantheon Pandemonium',
    description: 'Become a proto-god and shape the world to your divine will',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
                border: '1px solid #374151',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}