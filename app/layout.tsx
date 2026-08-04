import type { Metadata, Viewport } from 'next';
import { Roboto, Roboto_Condensed } from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-roboto',
  display: 'swap',
});

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  variable: '--font-roboto-condensed',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Meal planner',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${roboto.variable} ${robotoCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
