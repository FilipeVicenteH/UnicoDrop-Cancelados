import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'UnicoCRM — Gestão & Reconversão de Churn',
  description: 'Sistema de acompanhamento e reconversão de clientes cancelados da UnicoDrop.',
  openGraph: {
    title: 'UnicoCRM — Plataforma SaaS CRM & Analytics',
    description: 'Sistema completo de gestão de relacionamento e relatórios operacionais desenvolvido com React e arquitetura limpa.',
    url: 'https://unico-crm.vercel.app',
    siteName: 'UnicoCRM',
    images: [
      {
        url: 'https://unico-crm.vercel.app/preview_linkedin.jpg',
        width: 1200,
        height: 630,
        alt: 'UnicoCRM Preview',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full flex" style={{ background: 'var(--bg-body)', color: 'var(--text-primary)', fontFamily: "'Nunito', sans-serif" }}>
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#131523',
              border: '1px solid #e8ecf0',
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: "'Nunito', sans-serif",
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            },
            success: {
              iconTheme: { primary: '#1eab5a', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
      </body>
    </html>
  )
}
