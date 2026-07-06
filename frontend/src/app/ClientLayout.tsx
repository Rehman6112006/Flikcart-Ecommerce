
'use client'

import { usePathname } from 'next/navigation'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ThemeProvider } from '@/components/ThemeProvider'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  const isAdminRoute = pathname?.startsWith('/admin')
  const isRiderRoute = pathname?.startsWith('/rider')
  
  return (
    <ThemeProvider>
      {!isAdminRoute && !isRiderRoute && <Header />}
      <main className={isAdminRoute || isRiderRoute ? 'min-h-screen bg-slate-900' : 'min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors'}>
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      {!isAdminRoute && !isRiderRoute && <Footer />}
    </ThemeProvider>
  )
}


