'use client'

import { DashboardMetrics } from '@/lib/types'
import {
  TrendingUp, Users, CheckCircle2, XCircle, Clock,
  PhoneCall, UserMinus, Activity, ShoppingBag, AlertCircle,
  BarChart3, MessageSquare, Store, WifiOff, DollarSign
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
  type PieLabelRenderProps
} from 'recharts'
import { STATUS_LABELS } from '@/lib/constants'

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
  if (!percent || percent < 0.06) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="#f4f4f5" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="700" className="font-mono">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

const tooltipStyle = {
  contentStyle: {
    background: '#18181b',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    color: '#f4f4f5',
    fontSize: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  labelStyle: { color: '#f4f4f5', fontWeight: 600 },
  itemStyle: { color: '#a1a1aa' },
  cursor: { fill: 'rgba(255,255,255,0.03)' },
}

const STATUS_NEUTRAL_COLORS: Record<string, string> = {
  CONVERTIDO: '#10B981',
  EM_NEGOCIACAO: '#F59E0B',
  PENDENTE: '#71717A',
  NAO_CONVERTIDO: '#F43F5E',
}

const CHART_PALETTE = ['#6366F1', '#10B981', '#F59E0B', '#06B6D4', '#F43F5E', '#EC4899', '#8B5CF6', '#3B82F6']

export default function Dashboard({ metrics }: DashboardProps) {
  const taxa = metrics.taxa_conversao

  const statCards = [
    {
      label: 'Total de Clientes',
      value: metrics.total,
      icon: Users,
      badgeColor: 'text-zinc-300',
    },
    {
      label: 'Convertidos',
      value: metrics.convertidos,
      icon: CheckCircle2,
      badgeColor: 'text-emerald-400',
    },
    {
      label: 'Em Negociação',
      value: metrics.em_negociacao,
      icon: Clock,
      badgeColor: 'text-amber-400',
    },
    {
      label: 'Não Convertidos',
      value: metrics.nao_convertidos,
      icon: XCircle,
      badgeColor: 'text-rose-400',
    },
    {
      label: 'Taxa de Conversão',
      value: `${taxa}%`,
      icon: TrendingUp,
      badgeColor: taxa >= 30 ? 'text-emerald-400' : taxa >= 15 ? 'text-amber-400' : 'text-rose-400',
    },
    {
      label: 'Pendentes',
      value: metrics.pendentes,
      icon: Activity,
      badgeColor: 'text-zinc-400',
    },
    {
      label: 'Inacessíveis',
      value: metrics.inacessiveis,
      icon: WifiOff,
      badgeColor: 'text-orange-400',
    },
    {
      label: 'Contatados Hoje',
      value: metrics.contatados_hoje,
      icon: PhoneCall,
      badgeColor: 'text-sky-400',
    },
    {
      label: 'Cancelaram Hoje',
      value: metrics.cancelados_hoje,
      icon: UserMinus,
      badgeColor: 'text-rose-400',
    },
  ]

  // Build pie data: split PENDENTE raw into Pendentes (reachable) + Inacessíveis
  const pieData = metrics.por_status.map(s => {
    if (s.status === 'PENDENTE') {
      return {
        name: 'Pendentes',
        value: Math.max(0, s.count - metrics.inacessiveis),
        color: STATUS_NEUTRAL_COLORS[s.status] || '#71717A',
      }
    }
    return {
      name: STATUS_LABELS[s.status] || s.status,
      value: s.count,
      color: STATUS_NEUTRAL_COLORS[s.status] || '#71717A',
    }
  }).filter(d => d.value > 0)

  if (metrics.inacessiveis > 0) {
    pieData.push({ name: 'Inacessíveis', value: metrics.inacessiveis, color: '#F97316' })
  }

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

  const rawFaturamento = (metrics.por_faturamento || []).filter(f => f.count > 0 && f.faixa !== 'Não Informado')
  const faturamentoTotal = rawFaturamento.reduce((acc, f) => acc + f.count, 0)
  const faturamentoData = rawFaturamento.map(f => ({
    ...f,
    percent: faturamentoTotal > 0 ? Math.round((f.count / faturamentoTotal) * 100) : 0
  }))

  const maxMotivo = metrics.top_motivos[0]?.count || 1

  return (
    <div className="space-y-6">
      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-[#121316] border border-zinc-800/80 rounded-xl p-4 hover:border-zinc-700/80 transition-all group"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider truncate">
                  {card.label}
                </span>
                <div className="p-1.5 rounded-md bg-zinc-800/50 border border-zinc-700/40 text-zinc-400 flex-shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <p className={`text-2xl font-bold font-mono tracking-tight mt-2 ${card.badgeColor}`}>
                {card.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* ── Conversion Funnel + Status Breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Funil de Reconversão */}
        <div className="lg:col-span-2 bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Funil de Reconversão</h3>
                <p className="text-[11px] text-zinc-500">Distribuição operacional do status dos lojistas</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/60 px-2.5 py-1 rounded border border-zinc-700/50">
              {metrics.total} clientes
            </span>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Convertidos', value: metrics.convertidos, barBg: 'bg-emerald-500', textColor: 'text-emerald-400', dotColor: 'bg-emerald-500' },
              { label: 'Em Negociação', value: metrics.em_negociacao, barBg: 'bg-amber-500', textColor: 'text-amber-400', dotColor: 'bg-amber-500' },
              { label: 'Pendentes', value: metrics.pendentes, barBg: 'bg-zinc-500', textColor: 'text-zinc-400', dotColor: 'bg-zinc-500' },
              { label: 'Inacessíveis', value: metrics.inacessiveis, barBg: 'bg-orange-500', textColor: 'text-orange-400', dotColor: 'bg-orange-500' },
              { label: 'Não Convertidos', value: metrics.nao_convertidos, barBg: 'bg-rose-500', textColor: 'text-rose-400', dotColor: 'bg-rose-500' },
            ].map(item => {
              const pct = metrics.total > 0 ? (item.value / metrics.total) * 100 : 0
              return (
                <div key={item.label} className="group">
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${item.dotColor}`} />
                      <span className="text-zinc-300 font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className={`font-semibold ${item.textColor}`}>{item.value}</span>
                      <span className="text-[11px] text-zinc-500 w-10 text-right">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.barBg} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Taxa de conversão destaque */}
          <div className="mt-6 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium">Taxa de Conversão Efetiva</span>
              <p className="text-[11px] text-zinc-500 font-mono">Exclui {metrics.inacessiveis} lojistas sem telefone ou offline</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-28 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${taxa}%` }}
                />
              </div>
              <span className={`text-base font-mono font-bold ${taxa >= 30 ? 'text-emerald-400' : taxa >= 15 ? 'text-amber-400' : 'text-rose-400'}`}>
                {taxa}%
              </span>
            </div>
          </div>
        </div>

        {/* Status Donut Chart */}
        <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Visão Geral de Status</h3>
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
                    innerRadius={36}
                    dataKey="value"
                    strokeWidth={2}
                    stroke="#121316"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2 pt-2 border-t border-zinc-800/60">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-zinc-400">{item.name}</span>
                    </div>
                    <span className="font-mono font-semibold text-zinc-200">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-zinc-500 text-xs font-mono">Sem dados registrados</div>
          )}
        </div>
      </div>

      {/* ── Charts Row: Checkouts & Plataformas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Checkouts */}
        <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Checkouts Mais Utilizados</h3>
          </div>
          {checkoutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={checkoutData} barCategoryGap="30%" layout="vertical">
                <XAxis type="number" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} width={95} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {checkoutData.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-zinc-500 text-xs font-mono">Sem dados de checkouts</div>
          )}
        </div>

        {/* Plataformas */}
        <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
              <Store className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Plataformas de E-Commerce</h3>
          </div>
          {plataformaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={plataformaData} barCategoryGap="30%" layout="vertical">
                <XAxis type="number" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} width={95} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {plataformaData.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[(i + 2) % CHART_PALETTE.length]} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-zinc-500 text-xs font-mono">Sem dados de plataformas</div>
          )}
        </div>
      </div>

      {/* ── Motivos & Prioridade ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Top Motivos de Cancelamento */}
        <div className="lg:col-span-2 bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Principais Motivos de Cancelamento</h3>
          </div>

          {metrics.top_motivos.length > 0 ? (
            <div className="space-y-3.5">
              {metrics.top_motivos.map((item, i) => {
                const pct = Math.round((item.count / maxMotivo) * 100)
                return (
                  <div key={i} className="group">
                    <div className="flex items-start justify-between mb-1 gap-3 text-xs">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="font-mono text-[10px] text-zinc-500 font-semibold mt-0.5">#{i + 1}</span>
                        <p className="text-zinc-300 leading-snug line-clamp-2">{item.motivo}</p>
                      </div>
                      <span className="font-mono text-xs font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/50">
                        {item.count}x
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden ml-6">
                      <div
                        className="h-full rounded-full bg-zinc-400 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <AlertCircle className="w-6 h-6 text-zinc-600" />
              <p className="text-xs text-zinc-500 font-mono">Nenhum motivo de cancelamento registrado</p>
            </div>
          )}
        </div>

        {/* Prioridade Breakdown */}
        <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">Distribuição por Prioridade</h3>
          </div>
          <div className="space-y-4 mt-3">
            {[
              { label: 'Alta Prioridade', key: 'ALTA', value: metrics.por_prioridade.find(p => p.prioridade === 'ALTA')?.count || 0, bar: 'bg-rose-500', text: 'text-rose-400', badge: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
              { label: 'Média Prioridade', key: 'MEDIA', value: metrics.por_prioridade.find(p => p.prioridade === 'MEDIA')?.count || 0, bar: 'bg-amber-500', text: 'text-amber-400', badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400' },
              { label: 'Baixa Prioridade', key: 'BAIXA', value: metrics.por_prioridade.find(p => p.prioridade === 'BAIXA')?.count || 0, bar: 'bg-sky-500', text: 'text-sky-400', badge: 'bg-sky-500/10 border-sky-500/20 text-sky-400' },
            ].map(p => {
              const total = metrics.por_prioridade.reduce((s, x) => s + x.count, 0) || 1
              const pct = Math.round((p.value / total) * 100)
              return (
                <div key={p.key}>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="text-zinc-300 font-medium">{p.label}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className={`font-bold ${p.text}`}>{p.value}</span>
                      <span className="text-[11px] text-zinc-500 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.bar} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Faturamento Anterior (Lojas) ── */}
      <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">Faturamento Mensal Anterior (Base de Lojistas)</h3>
            <p className="text-[11px] text-zinc-500">Mapeamento de porte dos e-commerces em churn</p>
          </div>
        </div>
        {faturamentoData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={faturamentoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={75}
                  innerRadius={45}
                  paddingAngle={3}
                  dataKey="percent"
                  nameKey="faixa"
                  stroke="none"
                >
                  {faturamentoData.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} formatter={(val: any) => [`${val}%`, 'Lojas']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {faturamentoData.map((item, i) => (
                <div key={item.faixa} className="flex items-center justify-between bg-zinc-900/80 border border-zinc-800 rounded-md px-2.5 py-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                    <span className="text-[11px] text-zinc-400 font-medium truncate" title={item.faixa}>{item.faixa}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-zinc-200 ml-1">{item.percent}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-zinc-500 text-xs font-mono">Sem faturamentos reportados</div>
        )}
      </div>

    </div>
  )
}
