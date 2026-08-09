'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BarChart2, MessageSquarePlus,
  ChevronRight, ShieldCheck
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, badge: null },
  { href: '/clientes', label: 'Clientes', icon: Users, badge: null },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2, badge: null },
  { href: '/feedbacks', label: 'Feedbacks', icon: MessageSquarePlus, badge: 'Novo' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-screen sticky top-0 bg-white"
      style={{
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* ── Brand Logo ── */}
      <div
        className="px-5 py-4 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--border-color)' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
          style={{ background: '#0f172a' }}
        >
          U
        </div>
        <div>
          <p className="font-bold text-sm leading-tight text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            UnicoCRM
          </p>
          <p className="text-[11px] text-slate-500">Gestão de Churn SaaS</p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Menu Operacional
        </p>

        <div className="space-y-1">
          {navItems.map(({ href, label, icon: Icon, badge }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 relative ${
                  active
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: active ? '#ffffff' : '#64748b' }}
                />
                <span className="flex-1">{label}</span>

                {badge && (
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{
                      background: active ? 'rgba(255,255,255,0.2)' : '#e0e7ff',
                      color: active ? '#ffffff' : '#4338ca',
                    }}
                  >
                    {badge}
                  </span>
                )}

                {active && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                )}
              </Link>
            )
          })}
        </div>

        {/* ── System Status ── */}
        <div
          className="mt-8 p-3 rounded-lg border text-xs"
          style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}
        >
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>UnicoDrop SaaS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dados Anônimos Protegidos
          </p>
        </div>
      </nav>

      {/* ── Footer ── */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold bg-slate-800"
          >
            F
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-900 leading-tight">
              Filipe Vicente
            </p>
            <p className="text-[10px] text-slate-400">Analista N2 / Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
