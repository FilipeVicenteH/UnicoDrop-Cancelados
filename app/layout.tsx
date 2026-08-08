import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'UnicoCRM — Gestão & Reconversão de Churn',
  description: 'Sistema de acompanhamento e reconversão de clientes cancelados da UnicoDrop.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="h-full flex bg-[#09090b] text-zinc-200 antialiased selection:bg-zinc-800 selection:text-zinc-100">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-y-auto bg-[#09090b]">
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#18181b',
              color: '#f4f4f5',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#18181b' },
            },
            error: {
              iconTheme: { primary: '#f43f5e', secondary: '#18181b' },
            },
          }}
        />
      </body>
    </html>
  )
}
