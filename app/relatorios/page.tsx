'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardMetrics, Cliente } from '@/lib/types'
import { STATUS_LABELS, RECURSOS_UD } from '@/lib/constants'
import DateFilterBar from '@/components/DateFilterBar'
import {
  BarChart2, Download, TrendingUp, Users, CheckCircle2, Globe,
  ShoppingBag, MessageSquare, AlertCircle, Store,
  Target, Zap, Radio, WifiOff, DollarSign, Activity
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
  return <text x={x} y={y} fill="#f4f4f5" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="700" className="font-mono">{`${(percent * 100).toFixed(0)}%`}</text>
}

const tt = {
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

export default function RelatoriosPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState({
    dateField: 'cancelamento',
    dateFrom: '',
    dateTo: '',
  })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter.dateFrom || dateFilter.dateTo) {
        params.set('date_field', dateFilter.dateField)
        if (dateFilter.dateFrom) params.set('date_from', dateFilter.dateFrom)
        if (dateFilter.dateTo) params.set('date_to', dateFilter.dateTo)
      }
      const qs = params.toString()
      const [mRes, cRes] = await Promise.all([
        fetch(`/api/dashboard${qs ? '?' + qs : ''}`),
        fetch(`/api/clientes?limit=1000${qs ? '&' + qs : ''}`),
      ])
      setMetrics(await mRes.json())
      const cd = await cRes.json()
      setClientes(cd.clientes || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [dateFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const exportCSV = () => {
    if (!clientes.length) return
    const headers = [
      'ID Unico', 'Nome', 'Empresa', 'Contato', 'Status', 'Prioridade',
      'Data Cancelamento', 'Data Contato', 'Site', 'Site Online',
      'Checkout', 'Plataforma Loja', 'Faturamento Anterior', 'Plugins Rastreio',
      'Recursos UD Utilizados', 'Motivo', 'Feedback', 'Responsável'
    ]
    const rows = clientes.map(c => [
      c.unico_id || '', c.nome, c.empresa || '', c.contato || '',
      STATUS_LABELS[c.status], c.prioridade,
      c.data_cancelamento ? format(new Date(c.data_cancelamento), 'dd/MM/yyyy') : '',
      c.data_contato ? format(new Date(c.data_contato), 'dd/MM/yyyy') : '',
      c.site_url || '', c.site_online, c.checkout || '', c.plataforma_loja || '',
      c.faturamento_anterior !== null && c.faturamento_anterior !== undefined ? `R$ ${c.faturamento_anterior}` : 'Não Informado',
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
      <div className="p-8 flex items-center justify-center h-64 border border-zinc-800 rounded-xl bg-zinc-900/30">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-6 h-6 text-zinc-500 animate-spin" />
          <p className="text-xs font-mono text-zinc-500">Gerando relatórios detalhados...</p>
        </div>
      </div>
    )
  }

  // Computed stats
  const recursosCount: Record<string, number> = {}
  clientes.forEach(c => {
    (c.recursos_ud || []).forEach(r => { recursosCount[r] = (recursosCount[r] || 0) + 1 })
  })

  // Plugins de rastreio count
  const pluginsCount: Record<string, number> = {}
  clientes.forEach(c => {
    (c.plugins_rastreio || []).forEach(p => { pluginsCount[p] = (pluginsCount[p] || 0) + 1 })
  })
  const pluginsSorted = Object.entries(pluginsCount)
    .sort((a, b) => b[1] - a[1])
  const maxPlugin = pluginsSorted[0]?.[1] || 1
  const UNICO_PLUGINS = ['UnicoDrop Novo', 'UnicoDrop Antigo']

  const siteOnline = clientes.filter(c => c.site_online === 'ONLINE').length
  const siteOffline = clientes.filter(c => c.site_online === 'OFFLINE').length
  const siteNaoVerif = clientes.length - siteOnline - siteOffline

  const pieStatusData = metrics.por_status.map(s => {
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
    pieStatusData.push({ name: 'Inacessíveis', value: metrics.inacessiveis, color: '#F97316' })
  }

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
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-medium text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Reports
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">UnicoCRM</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Análise & Relatórios Consolidados</h1>
          <p className="text-xs text-zinc-400 font-mono mt-1">
            Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Date Filter */}
      <DateFilterBar value={dateFilter} onChange={setDateFilter} />

      {/* ── KPI Summary Row ── */}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5">
        {[
          { label: 'Total', value: metrics.total, color: 'text-zinc-100' },
          { label: 'Convertidos', value: metrics.convertidos, color: 'text-emerald-400' },
          { label: 'Em Neg.', value: metrics.em_negociacao, color: 'text-amber-400' },
          { label: 'Pendentes', value: metrics.pendentes, color: 'text-zinc-400' },
          { label: 'Inacessíveis', value: metrics.inacessiveis, color: 'text-orange-400' },
          { label: 'Não Conv.', value: metrics.nao_convertidos, color: 'text-rose-400' },
          { label: 'Conversão', value: `${metrics.taxa_conversao}%`, color: 'text-emerald-400' },
          { label: 'Cont. Hoje', value: metrics.contatados_hoje, color: 'text-sky-400' },
          { label: 'Cancel. Hj', value: metrics.cancelados_hoje, color: 'text-rose-400' },
        ].map(item => (
          <div key={item.label} className="bg-[#121316] border border-zinc-800/80 rounded-xl p-3 text-center">
            <p className={`text-lg font-bold font-mono ${item.color}`}>{item.value}</p>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5 truncate">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Status breakdown */}
          <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-100">Distribuição por Status</h2>
            </div>
            <div className="space-y-4">
              {metrics.por_status
                .sort((a, b) => b.count - a.count)
                .map(item => {
                  const pct = metrics.total > 0 ? (item.count / metrics.total) * 100 : 0
                  const color = STATUS_NEUTRAL_COLORS[item.status] || '#71717A'
                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-zinc-300 font-medium">{STATUS_LABELS[item.status] || item.status}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="font-bold text-zinc-200">{item.count}</span>
                          <span className="text-[11px] text-zinc-500 w-9 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
              {metrics.inacessiveis > 0 && (() => {
                const pct = metrics.total > 0 ? (metrics.inacessiveis / metrics.total) * 100 : 0
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500" />
                        <span className="text-zinc-300 font-medium flex items-center gap-1">
                          <WifiOff className="w-3 h-3 text-orange-400" />
                          Inacessíveis
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="font-bold text-orange-400">{metrics.inacessiveis}</span>
                        <span className="text-[11px] text-zinc-500 w-9 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-orange-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Top Motivos de Cancelamento */}
          <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-100">Principais Motivos de Cancelamento</h2>
            </div>

            {metrics.top_motivos.length > 0 ? (
              <div className="space-y-4">
                {metrics.top_motivos.map((item, i) => {
                  const pct = Math.round((item.count / maxMotivo) * 100)
                  return (
                    <div key={i}>
                      <div className="flex items-start justify-between mb-1.5 gap-3 text-xs">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="font-mono text-[11px] font-bold text-zinc-500 mt-0.5">#{i + 1}</span>
                          <p className="text-zinc-300 leading-relaxed">{item.motivo}</p>
                        </div>
                        <span className="font-mono text-xs font-bold text-zinc-200 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/50 flex-shrink-0">
                          {item.count}×
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
                <p className="text-xs font-mono text-zinc-500">Nenhum motivo registrado ainda</p>
              </div>
            )}
          </div>

          {/* Checkouts */}
          {checkoutChart.length > 0 && (
            <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-100">Checkouts Utilizados</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={checkoutChart} barCategoryGap="30%" layout="vertical">
                  <XAxis type="number" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip {...tt} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {checkoutChart.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Plataformas */}
          {plataformaChart.length > 0 && (
            <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
                  <Store className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-semibold text-zinc-100">Plataformas de Loja</h2>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={plataformaChart} barCategoryGap="30%" layout="vertical">
                  <XAxis type="number" tick={{ fill: '#71717A', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#A1A1AA', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip {...tt} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {plataformaChart.map((_, i) => (
                      <Cell key={i} fill={CHART_PALETTE[(i + 3) % CHART_PALETTE.length]} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="space-y-5">

          {/* Plugins de Rastreio */}
          <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
                <Radio className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-100">Plugins de Rastreio</h2>
            </div>
            {pluginsSorted.length > 0 ? (
              <div className="space-y-3">
                {pluginsSorted.map(([plugin, count]) => {
                  const isUnico = UNICO_PLUGINS.includes(plugin)
                  const pct = Math.round((count / maxPlugin) * 100)
                  return (
                    <div key={plugin}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isUnico && <Radio className="w-3 h-3 flex-shrink-0 text-emerald-400" />}
                          <span className={`truncate ${isUnico ? 'text-zinc-100 font-semibold font-mono' : 'text-zinc-400'}`} title={plugin}>{plugin}</span>
                          {isUnico && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold flex-shrink-0">
                              UD
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-xs font-bold text-zinc-300 ml-2">{count}</span>
                      </div>
                      <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isUnico ? 'bg-emerald-500' : 'bg-zinc-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs font-mono text-zinc-500">Nenhum plugin registrado</p>
            )}
          </div>

          {/* Status Pie */}
          <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-100">Status Geral</h2>
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
                      innerRadius={36}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#121316"
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
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                        <span className="text-zinc-400">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-zinc-200">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-zinc-500 text-xs font-mono">Sem dados</div>
            )}
          </div>

          {/* Sites */}
          <div className="bg-[#121316] border border-zinc-800/80 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
                <Globe className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-semibold text-zinc-100">Status dos Sites</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Online', value: siteOnline, bar: 'bg-emerald-500', text: 'text-emerald-400' },
                { label: 'Offline', value: siteOffline, bar: 'bg-rose-500', text: 'text-rose-400' },
                { label: 'Não Verificado', value: siteNaoVerif, bar: 'bg-zinc-600', text: 'text-zinc-400' },
              ].map(item => {
                const pct = clientes.length > 0 ? Math.round((item.value / clientes.length) * 100) : 0
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="text-zinc-300 font-medium">{item.label}</span>
                      <span className={`font-mono font-bold ${item.text}`}>{item.value}</span>
                    </div>
                    <div className="w-full bg-zinc-800/80 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-full rounded-full ${item.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
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
