'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  BarChart2,
  MessageSquarePlus,
  Command,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/feedbacks', label: 'Feedbacks de Melhoria', icon: MessageSquarePlus },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 flex-shrink-0 bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-zinc-200">
            <Command className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-100 tracking-tight flex items-center gap-1.5">
              UnicoCRM
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 bg-zinc-800 text-zinc-400 rounded border border-zinc-700/50">PRO</span>
            </p>
            <p className="text-[10px] text-zinc-500 font-mono">UnicoDrop SaaS</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-4 space-y-1">
        <div className="px-2 pb-2">
          <p className="text-[10px] font-mono font-semibold text-zinc-500 uppercase tracking-wider">Menu Principal</p>
        </div>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                active
                  ? 'bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-emerald-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer System Status */}
      <div className="px-4 py-3.5 border-t border-zinc-800/80 bg-zinc-950/40">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500 font-mono">Retenção & Churn</span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Online
          </span>
        </div>
      </div>
    </aside>
  )
}
