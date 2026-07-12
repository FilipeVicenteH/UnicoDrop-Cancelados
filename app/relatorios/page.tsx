'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardMetrics, Cliente } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS, RECURSOS_UD } from '@/lib/constants'
import {
  BarChart2, Download, TrendingUp, Users, CheckCircle, Globe,
  ShoppingCart, MessageSquare, AlertTriangle, Store, Activity,
  Target, Zap
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, type PieLabelRenderProps
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const RADIAN = Math.PI / 180
const renderLabel = (props: PieLabelRenderProps) => {
  const cx = props.cx as number, cy = props.cy as number
  const midAngle = props.midAngle as number
  const innerRadius = props.innerRadius as number, outerRadius = props.outerRadius as number
  const percent = props.percent as number
  if (!percent || percent < 0.06) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">{`${(percent * 100).toFixed(0)}%`}</text>
}

const tt = {
  contentStyle: {
    background: '#13131f',
    border: '1px solid rgba(139,92,246,0.25)',
    borderRadius: '10px',
    color: '#e5e7eb',
    fontSize: '12px',
  },
  cursor: { fill: 'rgba(139,92,246,0.06)' },
}

const CHART_COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6']

export default function RelatoriosPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [mRes, cRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/clientes?limit=1000'),
      ])
      setMetrics(await mRes.json())
      const cd = await cRes.json()
      setClientes(cd.clientes || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const exportCSV = () => {
    if (!clientes.length) return
    const headers = [
      'ID Unico', 'Nome', 'Empresa', 'Contato', 'Status', 'Prioridade',
      'Data Cancelamento', 'Data Contato', 'Site', 'Site Online',
      'Checkout', 'Plataforma Loja', 'Plugins Rastreio',
      'Recursos UD Utilizados', 'Motivo', 'Feedback', 'Responsável'
    ]
    const rows = clientes.map(c => [
      c.unico_id || '', c.nome, c.empresa || '', c.contato || '',
      STATUS_LABELS[c.status], c.prioridade,
      c.data_cancelamento ? format(new Date(c.data_cancelamento), 'dd/MM/yyyy') : '',
      c.data_contato ? format(new Date(c.data_contato), 'dd/MM/yyyy') : '',
      c.site_url || '', c.site_online, c.checkout || '', c.plataforma_loja || '',
      (c.plugins_rastreio || []).join('; '),
      (c.recursos_ud || []).join('; '),
      c.motivo_cancelamento || '', c.feedback_completo || '', c.responsavel || '',
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `unico-crm-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !metrics) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Carregando relatório...</p>
        </div>
      </div>
    )
  }

  // Computed stats
  const recursosCount: Record<string, number> = {}
  clientes.forEach(c => {
    (c.recursos_ud || []).forEach(r => { recursosCount[r] = (recursosCount[r] || 0) + 1 })
  })
  const siteOnline = clientes.filter(c => c.site_online === 'ONLINE').length
  const siteOffline = clientes.filter(c => c.site_online === 'OFFLINE').length
  const siteNaoVerif = clientes.length - siteOnline - siteOffline

  const pieStatusData = metrics.por_status.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || '#6B7280',
  }))

  const checkoutChart = metrics.por_checkout
    .filter(c => c.checkout !== 'Não informado')
    .slice(0, 8)
    .map(c => ({ name: c.checkout.length > 14 ? c.checkout.slice(0, 14) + '…' : c.checkout, value: c.count }))

  const plataformaChart = metrics.por_plataforma
    .filter(p => p.plataforma !== 'Não informado')
    .slice(0, 8)
    .map(p => ({ name: p.plataforma.length > 14 ? p.plataforma.slice(0, 14) + '…' : p.plataforma, value: p.count }))

  const maxMotivo = metrics.top_motivos[0]?.count || 1

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">Relatórios</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Análise & Relatórios</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-all hover:scale-105"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* ── KPI Summary Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-5">
        {[
          { label: 'Total', value: metrics.total, color: 'text-white', icon: Users },
          { label: 'Convertidos', value: metrics.convertidos, color: 'text-emerald-400', icon: CheckCircle },
          { label: 'Em Negoc.', value: metrics.em_negociacao, color: 'text-amber-400', icon: Activity },
          { label: 'Pendentes', value: metrics.pendentes, color: 'text-gray-400', icon: Activity },
          { label: 'Não Conv.', value: metrics.nao_convertidos, color: 'text-red-400', icon: AlertTriangle },
          { label: 'Conversão', value: `${metrics.taxa_conversao}%`, color: 'text-purple-400', icon: Target },
          { label: 'Cont. Hoje', value: metrics.contatados_hoje, color: 'text-sky-400', icon: Zap },
          { label: 'Cancel. Hoje', value: metrics.cancelados_hoje, color: 'text-rose-400', icon: AlertTriangle },
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className="glass-card p-3 text-center">
              <Icon className={`w-4 h-4 mx-auto mb-1.5 ${item.color} opacity-70`} />
              <p className={`text-xl font-black tabular-nums ${item.color}`}>{item.value}</p>
              <p className="text-[10px] text-gray-600 mt-0.5 uppercase tracking-wide">{item.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status breakdown */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-purple-500/10 rounded-lg">
                <Users className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-200">Distribuição por Status</h2>
            </div>
            <div className="space-y-4">
              {metrics.por_status
                .sort((a, b) => b.count - a.count)
                .map(item => {
                  const pct = metrics.total > 0 ? (item.count / metrics.total) * 100 : 0
                  const color = STATUS_COLORS[item.status] || '#6B7280'
                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-xs text-gray-400">{STATUS_LABELS[item.status] || item.status}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-gray-300">{item.count}</span>
                          <span className="text-[10px] text-gray-600 w-9 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: color }}
                        />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Top Motivos de Cancelamento */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-rose-500/10 rounded-lg">
                <MessageSquare className="w-4 h-4 text-rose-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-200">Principais Motivos de Cancelamento</h2>
            </div>

            {metrics.top_motivos.length > 0 ? (
              <div className="space-y-4">
                {metrics.top_motivos.map((item, i) => {
                  const pct = Math.round((item.count / maxMotivo) * 100)
                  const barColors = [
                    'from-rose-600 to-rose-400', 'from-orange-600 to-orange-400',
                    'from-amber-600 to-amber-400', 'from-yellow-600 to-yellow-400',
                    'from-lime-600 to-lime-400', 'from-green-600 to-green-400',
                    'from-teal-600 to-teal-400', 'from-cyan-600 to-cyan-400',
                  ]
                  const textColors = [
                    'text-rose-400', 'text-orange-400', 'text-amber-400', 'text-yellow-400',
                    'text-lime-400', 'text-green-400', 'text-teal-400', 'text-cyan-400',
                  ]
                  return (
                    <div key={i}>
                      <div className="flex items-start justify-between mb-1.5 gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className={`text-[11px] font-black mt-0.5 flex-shrink-0 ${textColors[i] || 'text-gray-500'}`}>
                            #{i + 1}
                          </span>
                          <p className="text-xs text-gray-300 leading-relaxed">{item.motivo}</p>
                        </div>
                        <span className={`text-xs font-black flex-shrink-0 ${textColors[i] || 'text-gray-400'} bg-white/5 px-2.5 py-1 rounded-full`}>
                          {item.count}×
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden ml-6">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barColors[i] || 'from-gray-600 to-gray-500'} transition-all duration-1000`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2">
                <MessageSquare className="w-8 h-8 text-gray-700" />
                <p className="text-sm text-gray-600">Nenhum motivo registrado ainda</p>
              </div>
            )}
          </div>

          {/* Checkouts */}
          {checkoutChart.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-cyan-500/10 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-cyan-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-200">Checkouts Utilizados</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={checkoutChart} barCategoryGap="35%" layout="vertical">
                  <XAxis type="number" tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip {...tt} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {checkoutChart.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Plataformas */}
          {plataformaChart.length > 0 && (
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                  <Store className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-sm font-semibold text-gray-200">Plataformas de Loja</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={plataformaChart} barCategoryGap="35%" layout="vertical">
                  <XAxis type="number" tick={{ fill: '#4B5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip {...tt} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {plataformaChart.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} fillOpacity={0.9} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="space-y-5">

          {/* Status Pie */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-violet-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-violet-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-200">Status (Gráfico)</h2>
            </div>
            {pieStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={pieStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderLabel}
                      outerRadius={70}
                      innerRadius={28}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#07070f"
                    >
                      {pieStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tt} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieStatusData.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-[11px] text-gray-500">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-300">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-gray-600 text-sm">Sem dados</div>
            )}
          </div>

          {/* Sites */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-sky-500/10 rounded-lg">
                <Globe className="w-4 h-4 text-sky-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-200">Status dos Sites</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Online', value: siteOnline, color: 'bg-emerald-500', text: 'text-emerald-400', dot: '●' },
                { label: 'Offline', value: siteOffline, color: 'bg-red-500', text: 'text-red-400', dot: '●' },
                { label: 'Não Verificado', value: siteNaoVerif, color: 'bg-gray-600', text: 'text-gray-400', dot: '○' },
              ].map(item => {
                const pct = clientes.length > 0 ? Math.round((item.value / clientes.length) * 100) : 0
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] ${item.text}`}>{item.dot}</span>
                        <span className="text-xs text-gray-400">{item.label}</span>
                      </div>
                      <span className={`text-sm font-bold ${item.text}`}>{item.value}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recursos UD */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-purple-500/10 rounded-lg">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-200">Recursos UD Utilizados</h2>
            </div>
            {Object.keys(recursosCount).length === 0 ? (
              <p className="text-xs text-gray-600 italic">Nenhum dado registrado ainda</p>
            ) : (
              <div className="space-y-3">
                {RECURSOS_UD
                  .filter(r => recursosCount[r.key])
                  .sort((a, b) => (recursosCount[b.key] || 0) - (recursosCount[a.key] || 0))
                  .map(item => {
                    const count = recursosCount[item.key] || 0
                    const pct = clientes.length > 0 ? Math.round((count / clientes.length) * 100) : 0
                    return (
                      <div key={item.key}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                            <span>{item.icon}</span>
                            <span className="truncate max-w-[140px]" title={item.key}>{item.key}</span>
                          </span>
                          <span className="text-[11px] text-gray-500 flex-shrink-0 ml-1">{count} ({pct}%)</span>
                        </div>
                        <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-600 to-violet-400 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                {recursosCount['Outros'] && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-gray-400">✏️ Outros</span>
                      <span className="text-[11px] text-gray-500">{recursosCount['Outros']}</span>
                    </div>
                    <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-600 transition-all duration-700"
                        style={{ width: `${Math.round((recursosCount['Outros'] / clientes.length) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Prioridades */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              </div>
              <h2 className="text-sm font-semibold text-gray-200">Por Prioridade</h2>
            </div>
            <div className="space-y-3">
              {[
                { key: 'ALTA', label: '🔴 Alta', color: 'bg-red-500', text: 'text-red-400' },
                { key: 'MEDIA', label: '🟡 Média', color: 'bg-amber-500', text: 'text-amber-400' },
                { key: 'BAIXA', label: '🔵 Baixa', color: 'bg-blue-500', text: 'text-blue-400' },
              ].map(p => {
                const count = metrics.por_prioridade.find(x => x.prioridade === p.key)?.count || 0
                const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0
                return (
                  <div key={p.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{p.label}</span>
                      <span className={`text-sm font-bold ${p.text}`}>{count}</span>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${p.color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
