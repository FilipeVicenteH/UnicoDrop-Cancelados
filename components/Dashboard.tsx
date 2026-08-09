'use client'

import { DashboardMetrics } from '@/lib/types'
import {
  TrendingUp, Users, CheckCircle2, XCircle, Clock,
  PhoneCall, UserMinus, AlertCircle, ShoppingBag, Store,
  BarChart3, MessageSquare, WifiOff, DollarSign, Activity
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
  if (!percent || percent < 0.07) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">{`${(percent * 100).toFixed(0)}%`}</text>
}

const tooltipStyle = {
  contentStyle: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#0f172a',
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontFamily: "'Inter', sans-serif",
  },
  labelStyle: { color: '#0f172a', fontWeight: 600 },
  itemStyle: { color: '#475569' },
  cursor: { fill: 'rgba(241,245,249,0.8)' },
}

const STATUS_COLORS: Record<string, string> = {
  CONVERTIDO: '#059669',
  EM_NEGOCIACAO: '#d97706',
  PENDENTE: '#64748b',
  NAO_CONVERTIDO: '#dc2626',
}

const CHART_PALETTE = ['#0f172a', '#3b82f6', '#059669', '#d97706', '#64748b', '#0284c7', '#ea580c', '#6b21a8']

export default function Dashboard({ metrics }: DashboardProps) {
  const taxa = metrics.taxa_conversao

  const kpiCards = [
    { label: 'Total de Clientes', value: metrics.total, icon: Users, subLabel: 'Base total cadastrada' },
    { label: 'Convertidos', value: metrics.convertidos, icon: CheckCircle2, subLabel: `Taxa: ${taxa}%` },
    { label: 'Em Negociação', value: metrics.em_negociacao, icon: Clock, subLabel: 'Em andamento' },
    { label: 'Não Convertidos', value: metrics.nao_convertidos, icon: XCircle, subLabel: 'Churn definitivo' },
    { label: 'Pendentes', value: metrics.pendentes, icon: AlertCircle, subLabel: 'Aguardando contato' },
    { label: 'Inacessíveis', value: metrics.inacessiveis, icon: WifiOff, subLabel: 'Contato inválido' },
    { label: 'Contatados Hoje', value: metrics.contatados_hoje, icon: PhoneCall, subLabel: 'Atendimentos hoje' },
    { label: 'Cancelaram Hoje', value: metrics.cancelados_hoje, icon: UserMinus, subLabel: 'Novos cancelamentos' },
  ]

  const pieData = metrics.por_status.map(s => {
    if (s.status === 'PENDENTE') {
      return { name: 'Pendentes', value: Math.max(0, s.count - metrics.inacessiveis), color: STATUS_COLORS[s.status] }
    }
    return { name: STATUS_LABELS[s.status] || s.status, value: s.count, color: STATUS_COLORS[s.status] || '#64748b' }
  }).filter(d => d.value > 0)
  if (metrics.inacessiveis > 0) pieData.push({ name: 'Inacessíveis', value: metrics.inacessiveis, color: '#ea580c' })

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
    <div className="space-y-5">
      {/* ── KPI Cards Grid (Monochromatic Clean Style) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3.5">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide truncate">{card.label}</span>
                <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 leading-tight">
                  {card.value}
                </p>
                <p className="text-[10.5px] text-slate-400 mt-0.5 truncate">{card.subLabel}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Row 2: Funil + Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Funil de Reconversão */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
          <div className="section-header">
            <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="section-header-title">Funil de Reconversão</h3>
              <p className="section-header-subtitle">Distribuição e eficiência da retenção</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {[
              { label: 'Convertidos', value: metrics.convertidos, barColor: '#059669', bg: '#ecfdf5', text: '#059669' },
              { label: 'Em Negociação', value: metrics.em_negociacao, barColor: '#d97706', bg: '#fffbeb', text: '#d97706' },
              { label: 'Pendentes', value: metrics.pendentes, barColor: '#64748b', bg: '#f1f5f9', text: '#475569' },
              { label: 'Inacessíveis', value: metrics.inacessiveis, barColor: '#ea580c', bg: '#fff7ed', text: '#ea580c' },
              { label: 'Não Convertidos', value: metrics.nao_convertidos, barColor: '#dc2626', bg: '#fef2f2', text: '#dc2626' },
            ].map(item => {
              const pct = metrics.total > 0 ? (item.value / metrics.total) * 100 : 0
              return (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded border border-transparent" style={{ background: item.bg, color: item.text }}>
                        {item.value}
                      </span>
                      <span className="text-xs font-mono text-slate-400 w-8 text-right">
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="progress-bar-crm">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: item.barColor }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Conversão Destaque */}
          <div className="mt-5 p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-700">Taxa de Conversão Operacional</p>
              <p className="text-[11px] text-slate-500">Calculado sobre a base contactável ({metrics.total - metrics.inacessiveis} lojistas)</p>
            </div>
            <span className="text-2xl font-extrabold text-slate-900">
              {taxa}%
            </span>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
          <div className="section-header">
            <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="section-header-title">Status da Base</h3>
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
                    outerRadius={70} innerRadius={35}
                    dataKey="value"
                    strokeWidth={2} stroke="#fff"
                  >
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2 pt-3 border-t border-slate-100">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">
              Sem dados
            </div>
          )}
        </div>
      </div>

      {/* ── Row 3: Checkouts + Plataformas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Checkouts */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
          <div className="section-header">
            <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <h3 className="section-header-title">Checkouts Utilizados</h3>
          </div>
          {checkoutData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={checkoutData} barCategoryGap="30%" layout="vertical">
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill="#0f172a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[190px] flex items-center justify-center text-xs text-slate-400">Sem dados</div>
          )}
        </div>

        {/* Plataformas */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
          <div className="section-header">
            <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <Store className="w-4 h-4" />
            </div>
            <h3 className="section-header-title">Plataformas de E-Commerce</h3>
          </div>
          {plataformaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={plataformaData} barCategoryGap="30%" layout="vertical">
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[190px] flex items-center justify-center text-xs text-slate-400">Sem dados</div>
          )}
        </div>
      </div>

      {/* ── Row 4: Motivos + Prioridades ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Motivos */}
        <div className="lg:col-span-2 bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
          <div className="section-header">
            <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="section-header-title">Principais Motivos de Cancelamento</h3>
          </div>
          {metrics.top_motivos.length > 0 ? (
            <div className="space-y-3.5">
              {metrics.top_motivos.map((item, i) => {
                const pct = Math.round((item.count / maxMotivo) * 100)
                return (
                  <div key={i}>
                    <div className="flex items-start justify-between mb-1 gap-3 text-xs">
                      <span className="text-slate-800 font-medium flex-1">{item.motivo}</span>
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{item.count}×</span>
                    </div>
                    <div className="progress-bar-crm">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: '#0f172a' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <p className="text-xs text-slate-400">Nenhum motivo registrado</p>
            </div>
          )}
        </div>

        {/* Prioridade */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
          <div className="section-header">
            <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <AlertCircle className="w-4 h-4" />
            </div>
            <h3 className="section-header-title">Por Prioridade</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Alta Prioridade', key: 'ALTA', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
              { label: 'Média Prioridade', key: 'MEDIA', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
              { label: 'Baixa Prioridade', key: 'BAIXA', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
            ].map(p => {
              const value = metrics.por_prioridade.find(x => x.prioridade === p.key)?.count || 0
              const total = metrics.por_prioridade.reduce((s, x) => s + x.count, 0) || 1
              const pct = Math.round((value / total) * 100)
              return (
                <div key={p.key}>
                  <div className="flex items-center justify-between mb-1 text-xs">
                    <span className="font-medium text-slate-700">{p.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold px-2 py-0.5 rounded border text-xs" style={{ background: p.bg, color: p.color, borderColor: p.border }}>{value}</span>
                      <span className="text-slate-400 w-8 text-right font-mono text-[11px]">{pct}%</span>
                    </div>
                  </div>
                  <div className="progress-bar-crm">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Faturamento ── */}
      {(metrics.por_faturamento || []).filter(f => f.count > 0 && f.faixa !== 'Não Informado').length > 0 && (
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
          <div className="section-header">
            <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="section-header-title">Faturamento Mensal Anterior (Lojistas)</h3>
              <p className="section-header-subtitle">Porte dos e-commerces na base de churn</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(metrics.por_faturamento || []).filter(f => f.count > 0 && f.faixa !== 'Não Informado').map((item) => {
              const total = (metrics.por_faturamento || []).reduce((a, b) => a + b.count, 0) || 1
              const pct = Math.round((item.count / total) * 100)
              return (
                <div
                  key={item.faixa}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <p className="text-lg font-bold text-slate-900">{pct}%</p>
                  <p className="text-xs font-medium text-slate-700 mt-0.5 truncate" title={item.faixa}>{item.faixa}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{item.count} lojistas</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
