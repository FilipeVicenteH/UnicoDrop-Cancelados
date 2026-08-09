'use client'

import { DashboardMetrics } from '@/lib/types'
import {
  TrendingUp, Users, CheckCircle2, XCircle, Clock,
  PhoneCall, UserMinus, AlertCircle, ShoppingBag, Store,
  BarChart3, MessageSquare, WifiOff, DollarSign
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, type PieLabelRenderProps
} from 'recharts'
import { STATUS_LABELS } from '@/lib/constants'

interface DashboardProps { metrics: DashboardMetrics }

const RADIAN = Math.PI / 180
const renderCustomizedLabel = (props: PieLabelRenderProps) => {
  const cx = props.cx as number, cy = props.cy as number
  const midAngle = props.midAngle as number
  const innerRadius = props.innerRadius as number, outerRadius = props.outerRadius as number
  const percent = props.percent as number
  if (!percent || percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">{`${(percent * 100).toFixed(0)}%`}</text>
}

const tooltipStyle = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid #e8ecf0',
    borderRadius: '12px',
    color: '#131523',
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    fontFamily: "'Nunito', sans-serif",
  },
  labelStyle: { color: '#131523', fontWeight: 700 },
  itemStyle: { color: '#7b8fa6' },
  cursor: { fill: 'rgba(102,16,242,0.05)' },
}

const STATUS_COLORS: Record<string, string> = {
  CONVERTIDO: '#1eab5a',
  EM_NEGOCIACAO: '#f59e0b',
  PENDENTE: '#a0aec0',
  NAO_CONVERTIDO: '#ef4444',
}

const CHART_PALETTE = ['#6610f2', '#1eab5a', '#f59e0b', '#06b6d4', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6']

export default function Dashboard({ metrics }: DashboardProps) {
  const taxa = metrics.taxa_conversao

  const kpiCards = [
    {
      label: 'Total de Clientes',
      value: metrics.total,
      icon: Users,
      iconBox: 'icon-box-primary',
      textColor: '#6610f2',
      subLabel: 'Base completa',
    },
    {
      label: 'Convertidos',
      value: metrics.convertidos,
      icon: CheckCircle2,
      iconBox: 'icon-box-success',
      textColor: '#1eab5a',
      subLabel: `Taxa: ${taxa}%`,
    },
    {
      label: 'Em Negociação',
      value: metrics.em_negociacao,
      icon: Clock,
      iconBox: 'icon-box-warning',
      textColor: '#d97706',
      subLabel: 'Em andamento',
    },
    {
      label: 'Não Convertidos',
      value: metrics.nao_convertidos,
      icon: XCircle,
      iconBox: 'icon-box-danger',
      textColor: '#dc2626',
      subLabel: 'Definitivos',
    },
    {
      label: 'Pendentes',
      value: metrics.pendentes,
      icon: AlertCircle,
      iconBox: 'icon-box-info',
      textColor: '#0891b2',
      subLabel: 'Aguardando',
    },
    {
      label: 'Inacessíveis',
      value: metrics.inacessiveis,
      icon: WifiOff,
      iconBox: 'icon-box-orange',
      textColor: '#ea580c',
      subLabel: 'Sem contato',
    },
    {
      label: 'Contatados Hoje',
      value: metrics.contatados_hoje,
      icon: PhoneCall,
      iconBox: 'icon-box-success',
      textColor: '#1eab5a',
      subLabel: 'Hoje',
    },
    {
      label: 'Cancelaram Hoje',
      value: metrics.cancelados_hoje,
      icon: UserMinus,
      iconBox: 'icon-box-danger',
      textColor: '#dc2626',
      subLabel: 'Hoje',
    },
  ]

  const pieData = metrics.por_status.map(s => {
    if (s.status === 'PENDENTE') {
      return { name: 'Pendentes', value: Math.max(0, s.count - metrics.inacessiveis), color: STATUS_COLORS[s.status] }
    }
    return { name: STATUS_LABELS[s.status] || s.status, value: s.count, color: STATUS_COLORS[s.status] || '#a0aec0' }
  }).filter(d => d.value > 0)
  if (metrics.inacessiveis > 0) pieData.push({ name: 'Inacessíveis', value: metrics.inacessiveis, color: '#f97316' })

  const checkoutData = metrics.por_checkout.filter(c => c.checkout !== 'Não informado').slice(0, 6).map(c => ({
    name: c.checkout.length > 14 ? c.checkout.slice(0, 14) + '…' : c.checkout,
    value: c.count,
  }))

  const plataformaData = metrics.por_plataforma.filter(p => p.plataforma !== 'Não informado').slice(0, 6).map(p => ({
    name: p.plataforma.length > 12 ? p.plataforma.slice(0, 12) + '…' : p.plataforma,
    value: p.count,
  }))

  const maxMotivo = metrics.top_motivos[0]?.count || 1

  return (
    <div className="space-y-6">
      {/* ── KPI Cards Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-lg cursor-default"
              style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
            >
              <div className={`icon-box ${card.iconBox} mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black leading-none" style={{ color: card.textColor, fontFamily: "'Poppins', sans-serif" }}>
                  {card.value}
                </p>
                <p className="text-xs font-semibold mt-1 leading-tight" style={{ color: 'var(--text-heading)' }}>{card.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{card.subLabel}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Row 2: Funil + Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Funil de Reconversão */}
        <div
          className="lg:col-span-2 rounded-2xl p-5"
          style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="section-header">
            <div className="icon-box icon-box-primary" style={{ width: 34, height: 34, borderRadius: 9 }}>
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="section-header-title">Funil de Reconversão</h3>
              <p className="section-header-subtitle">Distribuição de status dos lojistas</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Convertidos', value: metrics.convertidos, barColor: '#1eab5a', textColor: '#1eab5a', bg: '#d1fae5' },
              { label: 'Em Negociação', value: metrics.em_negociacao, barColor: '#f59e0b', textColor: '#d97706', bg: '#fef3c7' },
              { label: 'Pendentes', value: metrics.pendentes, barColor: '#a0aec0', textColor: '#718096', bg: '#f1f3f6' },
              { label: 'Inacessíveis', value: metrics.inacessiveis, barColor: '#f97316', textColor: '#ea580c', bg: '#ffedd5' },
              { label: 'Não Convertidos', value: metrics.nao_convertidos, barColor: '#ef4444', textColor: '#dc2626', bg: '#fee2e2' },
            ].map(item => {
              const pct = metrics.total > 0 ? (item.value / metrics.total) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5 text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.barColor }} />
                      <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: item.bg, color: item.textColor }}
                      >
                        {item.value}
                      </span>
                      <span className="text-xs w-9 text-right font-semibold" style={{ color: 'var(--text-muted)' }}>
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar-crm">
                    <div
                      className="progress-fill"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${item.barColor}, ${item.barColor}cc)` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Taxa de Conversão destaque */}
          <div
            className="mt-5 p-4 rounded-xl flex items-center justify-between"
            style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', border: '1px solid #ddd6fe' }}
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#7c3aed' }}>Taxa de Conversão</p>
              <p className="text-[11px] mt-0.5" style={{ color: '#a78bfa' }}>Excluindo {metrics.inacessiveis} inacessíveis</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full" style={{ background: '#ddd6fe' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(taxa, 100)}%`, background: 'linear-gradient(90deg, #6610f2, #7c3aed)' }}
                />
              </div>
              <span className="text-xl font-black" style={{ color: '#6610f2', fontFamily: "'Poppins', sans-serif" }}>
                {taxa}%
              </span>
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}
        >
          <div className="section-header">
            <div className="icon-box icon-box-info" style={{ width: 34, height: 34, borderRadius: 9 }}>
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h3 className="section-header-title">Status Geral</h3>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={165}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={72} innerRadius={36}
                    dataKey="value"
                    strokeWidth={3} stroke="#fff"
                  >
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span style={{ color: 'var(--text-secondary)' }}>{item.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: 'var(--text-heading)' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Sem dados registrados
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Checkouts + Plataformas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Checkouts */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
          <div className="section-header">
            <div className="icon-box icon-box-warning" style={{ width: 34, height: 34, borderRadius: 9 }}>
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <h3 className="section-header-title">Checkouts Utilizados</h3>
          </div>
          {checkoutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={checkoutData} barCategoryGap="30%" layout="vertical">
                <XAxis type="number" tick={{ fill: '#a0aec0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#7b8fa6', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {checkoutData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Sem dados</div>
          )}
        </div>

        {/* Plataformas */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
          <div className="section-header">
            <div className="icon-box icon-box-primary" style={{ width: 34, height: 34, borderRadius: 9 }}>
              <Store className="w-4 h-4 text-white" />
            </div>
            <h3 className="section-header-title">Plataformas de E-Commerce</h3>
          </div>
          {plataformaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={plataformaData} barCategoryGap="30%" layout="vertical">
                <XAxis type="number" tick={{ fill: '#a0aec0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#7b8fa6', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {plataformaData.map((_, i) => <Cell key={i} fill={CHART_PALETTE[(i + 2) % CHART_PALETTE.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Sem dados</div>
          )}
        </div>
      </div>

      {/* ── Row 4: Motivos + Prioridade ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Motivos */}
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
          <div className="section-header">
            <div className="icon-box icon-box-info" style={{ width: 34, height: 34, borderRadius: 9 }}>
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <h3 className="section-header-title">Principais Motivos de Cancelamento</h3>
          </div>
          {metrics.top_motivos.length > 0 ? (
            <div className="space-y-4">
              {metrics.top_motivos.map((item, i) => {
                const pct = Math.round((item.count / maxMotivo) * 100)
                const colors = ['#6610f2', '#1eab5a', '#f59e0b', '#06b6d4', '#ef4444', '#ec4899']
                const color = colors[i % colors.length]
                return (
                  <div key={i}>
                    <div className="flex items-start justify-between mb-1.5 gap-3 text-sm">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5"
                          style={{ background: color }}
                        >
                          {i + 1}
                        </span>
                        <p className="leading-snug" style={{ color: 'var(--text-heading)' }}>{item.motivo}</p>
                      </div>
                      <span
                        className="text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: `${color}18`, color }}
                      >
                        {item.count}×
                      </span>
                    </div>
                    <div className="progress-bar-crm ml-7">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <AlertCircle className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum motivo registrado</p>
            </div>
          )}
        </div>

        {/* Prioridade */}
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
          <div className="section-header">
            <div className="icon-box icon-box-danger" style={{ width: 34, height: 34, borderRadius: 9 }}>
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <h3 className="section-header-title">Por Prioridade</h3>
          </div>
          <div className="space-y-5">
            {[
              { label: 'Alta Prioridade', key: 'ALTA', color: '#ef4444', bg: '#fee2e2' },
              { label: 'Média Prioridade', key: 'MEDIA', color: '#f59e0b', bg: '#fef3c7' },
              { label: 'Baixa Prioridade', key: 'BAIXA', color: '#06b6d4', bg: '#cffafe' },
            ].map(p => {
              const value = metrics.por_prioridade.find(x => x.prioridade === p.key)?.count || 0
              const total = metrics.por_prioridade.reduce((s, x) => s + x.count, 0) || 1
              const pct = Math.round((value / total) * 100)
              return (
                <div key={p.key}>
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>{p.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: p.bg, color: p.color }}>{value}</span>
                      <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="progress-bar-crm">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${p.color}, ${p.color}bb)` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Faturamento ── */}
      {(metrics.por_faturamento || []).filter(f => f.count > 0 && f.faixa !== 'Não Informado').length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
          <div className="section-header">
            <div className="icon-box icon-box-success" style={{ width: 34, height: 34, borderRadius: 9 }}>
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="section-header-title">Faturamento Mensal Anterior (Lojistas)</h3>
              <p className="section-header-subtitle">Porte dos e-commerces em churn</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(metrics.por_faturamento || []).filter(f => f.count > 0 && f.faixa !== 'Não Informado').map((item, i) => {
              const total = (metrics.por_faturamento || []).reduce((a, b) => a + b.count, 0) || 1
              const pct = Math.round((item.count / total) * 100)
              const color = CHART_PALETTE[i % CHART_PALETTE.length]
              return (
                <div
                  key={item.faixa}
                  className="p-4 rounded-xl"
                  style={{ background: `${color}10`, border: `1px solid ${color}30` }}
                >
                  <p className="text-lg font-black" style={{ color, fontFamily: "'Poppins', sans-serif" }}>{pct}%</p>
                  <p className="text-xs font-semibold mt-1" style={{ color: 'var(--text-heading)' }} title={item.faixa}>
                    {item.faixa.length > 16 ? item.faixa.slice(0, 16) + '…' : item.faixa}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.count} lojistas</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
