import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'

export const metadata: Metadata = {
  title: '経営ダッシュボード | CRM',
  description: '売上・顧客・KPI管理システム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" translate="no" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 antialiased">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  )
}
