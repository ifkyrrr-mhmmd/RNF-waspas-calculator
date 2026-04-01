import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata = {
  title: 'RNF WASPAS Calculator — Kelompok 2',
  description:
    'Sistem Pendukung Keputusan menggunakan metode WASPAS (Weighted Aggregated Sum Product Assessment). Dibuat oleh Kelompok 2 — Teknik Informatika.',
  keywords: ['SPK', 'WASPAS', 'SAW', 'WP', 'Sistem Pendukung Keputusan'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
