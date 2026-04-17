import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LeadFinder',
  description: 'B2B lead finder for Guilford & Forsyth counties',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-gray-50 text-gray-900 antialiased">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
          <span className="font-bold text-gray-900 text-lg">LeadFinder</span>
          <a href="/leads" className="text-sm text-gray-600 hover:text-gray-900">Leads</a>
          <a href="/scrape" className="text-sm text-gray-600 hover:text-gray-900">Scrape</a>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
