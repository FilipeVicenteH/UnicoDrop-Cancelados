'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BarChart2, MessageSquarePlus,
  ChevronRight, Zap, AlertOctagon
} from 'lucide-react'
import BugReportModal from './BugReportModal'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { href: '/clientes', label: 'Clientes', icon: Users, badge: null },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2, badge: null },
  { href: '/feedbacks', label: 'Feedbacks', icon: MessageSquarePlus, badge: 'Novo' },
  { href: '/whatsapp', label: 'Automação WhatsApp', icon: Zap, badge: null },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isBugModalOpen, setIsBugModalOpen] = useState(false)

  return (
    <>
      <aside
        className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0"
        style={{
          background: '#ffffff',
          borderRight: '1px solid var(--border-color)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.05)',
        }}
      >
        {/* ── Brand Logo ── */}
        <div
          className="px-6 py-5 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{ background: 'linear-gradient(135deg, #6610f2 0%, #7c3aed 100%)', boxShadow: '0 4px 12px rgba(102,16,242,0.35)' }}
          >
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Poppins', sans-serif" }}>
              UnicoCRM
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Gestão de Churn</p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          {/* Label de seção */}
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Menu Principal
          </p>

          <div className="space-y-1">
            {navItems.map(({ href, label, icon: Icon, badge }) => {
              const active = pathname === href || (href !== '/' && pathname.startsWith(href))

              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                    active ? 'nav-active-pill' : ''
                  }`}
                  style={!active ? {
                    color: 'var(--text-secondary)',
                  } : {
                    color: 'white',
                  }}
                >
                  {/* Hover background */}
                  {!active && (
                    <span
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'var(--primary-muted)' }}
                    />
                  )}

                  <Icon
                    className="w-4.5 h-4.5 flex-shrink-0 relative z-10 transition-colors"
                    style={{ color: active ? 'white' : 'var(--text-muted)' }}
                  />
                  <span className="flex-1 relative z-10" style={{ color: active ? 'white' : 'var(--text-secondary)' }}>
                    {label}
                  </span>

                  {badge && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full relative z-10"
                      style={{
                        background: active ? 'rgba(255,255,255,0.25)' : 'var(--primary-muted)',
                        color: active ? 'white' : 'var(--primary)',
                      }}
                    >
                      {badge}
                    </span>
                  )}

                  {active && (
                    <ChevronRight className="w-3.5 h-3.5 relative z-10 text-white/70" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* ── Report Bug Button ── */}
          <div className="mt-6 px-1">
            <button
              onClick={() => setIsBugModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 hover:border-rose-300 transition-all duration-200 shadow-2xs"
            >
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              Reportar Bug
            </button>
          </div>

          {/* ── Quick Stats ── */}
          <div
            className="mt-4 mx-0 p-4 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe' }}
          >
            <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--primary)', fontFamily: "'Poppins', sans-serif" }}>
              UnicoDrop SaaS
            </p>
            <p className="text-[11px]" style={{ color: '#7c3aed' }}>
              Sistema de Retenção & Churn
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-green-700">Sistema Online</span>
            </div>
          </div>
        </nav>

        {/* ── Footer ── */}
        <div
          className="px-4 py-3.5 flex items-center justify-between"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #6610f2, #7c3aed)' }}
            >
              F
            </div>
            <div>
              <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-heading)', fontFamily: "'Poppins', sans-serif" }}>
                Filipe Vicente
              </p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Bug Report Modal */}
      <BugReportModal isOpen={isBugModalOpen} onClose={() => setIsBugModalOpen(false)} />
    </>
  )
}

