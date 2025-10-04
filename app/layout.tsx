import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Hebrew } from 'next/font/google';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'GenFans',
  description: 'צרו תמונות AI מדהימות ל-OnlyFans ואינסטגרם - פלטפורמת AI מתקדמת ליצירת תוכן ריאליסטי'
};

export const viewport: Viewport = {
  maximumScale: 1
};

const notoSansHebrew = Noto_Sans_Hebrew({ subsets: ['hebrew', 'latin'] });

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${notoSansHebrew.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            fallback: {
              // We do NOT await here
              // Only components that read this data will suspend
              '/api/user': getUser(),
              '/api/team': getTeamForUser()
            }
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
