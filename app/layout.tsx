import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundaryWrapper } from '@/components/ErrorBoundaryWrapper'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'AdCure Client Portal',
  description: 'Manage your ad accounts, wallet, and invoices',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#0A0E14] text-white">
        <ErrorBoundaryWrapper>
          <AuthProvider>
            {children}
            <Toaster
              theme="dark"
              toastOptions={{
                style: {
                  background: '#1A1F2B',
                  border: '1px solid #2A3040',
                  color: '#FFFFFF',
                },
              }}
            />
          </AuthProvider>
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
}
