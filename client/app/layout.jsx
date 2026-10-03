import { Inter } from 'next/font/google';
import Providers from '../src/components/Providers';
import '../src/index.css';

// Self-hosted by Next.js (no request to Google at runtime, no layout shift).
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173'),
  title: {
    default: 'Koorm — Wear Your Story',
    template: '%s | Koorm',
  },
  description: 'Thoughtfully designed shirts for everyday living — premium cotton and linen, honest pricing, and cash on delivery across India.',
  openGraph: {
    siteName: 'Koorm',
    type: 'website',
    locale: 'en_IN',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {/* Drawer marks #root inert while open, so the app keeps this wrapper. */}
        <div id="root">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
