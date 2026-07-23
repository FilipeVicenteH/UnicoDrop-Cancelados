'use client'

import { DashboardMetrics } from '@/lib/types'
import {
  TrendingUp, Users, CheckCircle, XCircle, Clock,
  PhoneCall, UserMinus, Activity, ShoppingBag, AlertTriangle,
  BarChart2, MessageSquare, Store
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
  type PieLabelRenderProps
} from 'recharts'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'

interface DashboardProps {
  metrics: DashboardMetrics
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = (props: PieLabelRenderProps) => {
  const cx = props.cx as number
  const cy = props.cy as number
  const midAngle = props.midAngle as number
  const innerRadius = props.innerRadius as number
  const outerRadius = props.outerRadius as number
  const percent = props.percent as number
  if (!percent || percent < 0.07) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const tooltipStyle = {
  contentStyle: {
    background: '#13131f',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: '10px',
    color: '#e5e7eb',
    fontSize: '12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  cursor: { fill: 'rgba(139,92,246,0.06)' },
}

const CHART_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6']

export default function Dashboard({ metrics }: DashboardProps) {
  const taxa = metrics.taxa_conversao

  const statCards = [
    {
      label: 'Total de Clientes',
      value: metrics.total,
      icon: Users,
      color: 'text-purple-400',
      bg: 'from-purple-500/15 to-purple-500/5',
      border: 'border-purple-500/25',
      glow: 'shadow-purple-500/10',
    },
    {
      label: 'Convertidos',
      value: metrics.convertidos,
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'from-emerald-500/15 to-emerald-500/5',
      border: 'border-emerald-500/25',
      glow: 'shadow-emerald-500/10',
    },
    {
      label: 'Em Negociação',
      value: metrics.em_negociacao,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'from-amber-500/15 to-amber-500/5',
      border: 'border-amber-500/25',
      glow: 'shadow-amber-500/10',
    },
    {
      label: 'Não Convertidos',
      value: metrics.nao_convertidos,
      icon: XCircle,
      color: 'text-red-400',
      bg: 'from-red-500/15 to-red-500/5',
      border: 'border-red-500/25',
      glow: 'shadow-red-500/10',
    },
    {
      label: 'Taxa de Conversão',
      value: `${taxa}%`,
      icon: TrendingUp,
      color: taxa >= 30 ? 'text-emerald-400' : taxa >= 15 ? 'text-amber-400' : 'text-rose-400',
      bg: 'from-violet-500/15 to-violet-500/5',
      border: 'border-violet-500/25',
      glow: 'shadow-violet-500/10',
    },
    {
      label: 'Pendentes',
      value: metrics.pendentes,
      icon: Activity,
      color: 'text-gray-400',
      bg: 'from-gray-500/15 to-gray-500/5',
      border: 'border-gray-500/25',
      glow: 'shadow-gray-500/10',
    },
    {
      label: 'Contatados Hoje',
      value: metrics.contatados_hoje,
      icon: PhoneCall,
      color: 'text-sky-400',
      bg: 'from-sky-500/15 to-sky-500/5',
      border: 'border-sky-500/25',
      glow: 'shadow-sky-500/10',
    },
    {
      label: 'Cancelaram Hoje',
      value: metrics.cancelados_hoje,
      icon: UserMinus,
      color: 'text-rose-400',
      bg: 'from-rose-500/15 to-rose-500/5',
      border: 'border-rose-500/25',
      glow: 'shadow-rose-500/10',
    },
  ]

  const pieData = metrics.por_status.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#6B7280',
  }))

  const checkoutData = metrics.por_checkout
    .filter(c => c.checkout !== 'Não informado')
    .slice(0, 7)
    .map(c => ({
      name: c.checkout.length > 14 ? c.checkout.slice(0, 14) + '…' : c.checkout,
      value: c.count,
    }))

  const plataformaData = metrics.por_plataforma
    .filter(p => p.plataforma !== 'Não informado')
    .slice(0, 7)
    .map(p => ({
      name: p.plataforma.length > 12 ? p.plataforma.slice(0, 12) + '…' : p.plataforma,
      value: p.count,
    }))

  const prioridadeData = metrics.por_prioridade.map((p, i) => ({
    name: p.prioridade === 'ALTA' ? '🔴 Alta' : p.prioridade === 'MEDIA' ? '🟡 Média' : '🔵 Baixa',
    value: p.count,
    fill: p.prioridade === 'ALTA' ? '#EF4444' : p.prioridade === 'MEDIA' ? '#F59E0B' : '#3B82F6',
  }))

  const maxMotivo = metrics.top_motivos[0]?.count || 1

  return (
    <div className="space-y-5">
      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className={`relative overflow-hidden rounded-2xl border ${card.border} bg-gradient-to-br ${card.bg} p-4 shadow-lg ${card.glow} transition-all hover:scale-[1.02] hover:shadow-xl group`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] text-gray-500 font-medium uppercase tracking-wider truncate">{card.label}</p>
                  <p className={`text-2xl font-black mt-1.5 ${card.color} tabular-nums`}>{card.value}</p>
                </div>
                <div className={`p-2 rounded-xl bg-white/5 flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              {/* Decorative orb */}
              <div className={`absolute -bottom-6 -right-6 w-20 h-20 rounded-full ${card.bg} blur-2xl opacity-60 group-hover:opacity-80 transition-opacity`} />
            </div>
          )
        })}
      </div>

      {/* ── Conversion funnel + Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Funil de Reconversão */}
        <div className="lg:col-span-2 bg-white/3 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-sm font-semibold text-gray-200">Funil de Reconversão</h3>
            </div>
            <span className="text-[11px] text-gray-600 bg-white/5 px-2 py-1 rounded-full">
              {metrics.total} clientes
            </span>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Convertidos', value: metrics.convertidos, color: 'from-emerald-500 to-emerald-400', textColor: 'text-emerald-400', emoji: '✅' },
              { label: 'Em Negociação', value: metrics.em_negociacao, color: 'from-amber-500 to-amber-400', textColor: 'text-amber-400', emoji: '🔄' },
              { label: 'Pendentes', value: metrics.pendentes, color: 'from-gray-600 to-gray-500', textColor: 'text-gray-400', emoji: '⏳' },
              { label: 'Não Convertidos', value: metrics.nao_convertidos, color: 'from-red-600 to-red-500', textColor: 'text-red-400', emoji: '❌' },
            ].map(item => {
              const pct = metrics.total > 0 ? (item.value / metrics.total) * 100 : 0
              return (
                <div key={item.label} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{item.emoji}</span>
                      <span className="text-xs text-gray-400 font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold ${item.textColor}`}>{item.value}</span>
                      <span className="text-[10px] text-gray-600 w-9 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${item.color} transition-all duration-1000 ease-out`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Taxa de conversão destaque */}
          <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-600">Taxa de conversão geral</span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full transition-all duration-1000"
                  style={{ width: `${taxa}%` }}
                />
              </div>
              <span className={`text-sm font-black ${taxa >= 30 ? 'text-emerald-400' : taxa >= 15 ? 'text-amber-400' : 'text-red-400'}`}>
                {taxa}%
              </span>
            </div>
          </div>
        </div>

        {/* Pie - Status */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-violet-500/10 rounded-lg">
              <BarChart2 className="w-4 h-4 text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Por Status</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={70}
                    innerRadius={28}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#07070f"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-1">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                      <span className="text-[11px] text-gray-500">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-300">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* ── Charts Row: Checkout + Plataforma ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Checkouts */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-cyan-500/10 rounded-lg">
              <ShoppingBag className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Checkouts Utilizados</h3>
          </div>
          {checkoutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={checkoutData} barCategoryGap="35%" layout="vertical">
                <XAxis type="number" tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {checkoutData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">Sem dados</div>
          )}
        </div>

        {/* Plataformas */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <Store className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Plataformas de Loja</h3>
          </div>
          {plataformaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={plataformaData} barCategoryGap="35%" layout="vertical">
                <XAxis type="number" tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {plataformaData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">Sem dados</div>
          )}
        </div>
      </div>

      {/* ── Motivos + Prioridade ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Top Motivos de Cancelamento */}
        <div className="lg:col-span-2 bg-white/3 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-rose-500/10 rounded-lg">
              <MessageSquare className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Principais Motivos de Cancelamento</h3>
          </div>

          {metrics.top_motivos.length > 0 ? (
            <div className="space-y-3">
              {metrics.top_motivos.map((item, i) => {
                const pct = Math.round((item.count / maxMotivo) * 100)
                const colors = ['text-rose-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400', 'text-lime-400', 'text-green-400', 'text-teal-400', 'text-cyan-400']
                const bars = ['from-rose-600 to-rose-400', 'from-orange-600 to-orange-400', 'from-amber-600 to-amber-400', 'from-yellow-600 to-yellow-400', 'from-lime-600 to-lime-400', 'from-green-600 to-green-400', 'from-teal-600 to-teal-400', 'from-cyan-600 to-cyan-400']
                return (
                  <div key={i} className="group">
                    <div className="flex items-start justify-between mb-1.5 gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className={`text-[10px] font-black w-5 flex-shrink-0 mt-0.5 ${colors[i] || 'text-gray-500'}`}>
                          #{i + 1}
                        </span>
                        <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{item.motivo}</p>
                      </div>
                      <span className={`text-xs font-black flex-shrink-0 ${colors[i] || 'text-gray-500'} bg-white/5 px-2 py-0.5 rounded-full`}>
                        {item.count}x
                      </span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden ml-7">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${bars[i] || 'from-gray-600 to-gray-500'} transition-all duration-1000`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <AlertTriangle className="w-8 h-8 text-gray-700" />
              <p className="text-sm text-gray-600">Nenhum motivo cadastrado ainda</p>
              <p className="text-xs text-gray-700">Preencha o campo &quot;Motivo do Cancelamento&quot; ao adicionar clientes</p>
            </div>
          )}
        </div>

        {/* Distribuição por Prioridade */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-yellow-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-200">Por Prioridade</h3>
          </div>
          {prioridadeData.length > 0 ? (
            <div className="space-y-3 mt-2">
              {[
                { label: '🔴 Alta', value: metrics.por_prioridade.find(p => p.prioridade === 'ALTA')?.count || 0, bar: 'bg-gradient-to-r from-red-600 to-red-400', text: 'text-red-400' },
                { label: '🟡 Média', value: metrics.por_prioridade.find(p => p.prioridade === 'MEDIA')?.count || 0, bar: 'bg-gradient-to-r from-amber-600 to-amber-400', text: 'text-amber-400' },
                { label: '🔵 Baixa', value: metrics.por_prioridade.find(p => p.prioridade === 'BAIXA')?.count || 0, bar: 'bg-gradient-to-r from-blue-600 to-blue-400', text: 'text-blue-400' },
              ].map(p => {
                const total = metrics.por_prioridade.reduce((s, x) => s + x.count, 0) || 1
                const pct = Math.round((p.value / total) * 100)
                return (
                  <div key={p.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400">{p.label}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${p.text}`}>{p.value}</span>
                        <span className="text-[10px] text-gray-600 w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.bar} transition-all duration-700 ease-out`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">Sem dados</div>
          )}
        </div>
      </div>
    </div>
  )
}
