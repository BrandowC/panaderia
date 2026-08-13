import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { ThemeScript } from '@/components/theme/theme-script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Inventario de Panadería',
  description: 'Conteo diario de productos elaborados y reportes compartibles.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Sin maximumScale: limitar el zoom perjudica a quien necesita ampliar el texto.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5B32B' },
    { media: '(prefers-color-scheme: dark)', color: '#1A1310' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CO" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
