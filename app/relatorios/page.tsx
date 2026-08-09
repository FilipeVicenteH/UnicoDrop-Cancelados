'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardMetrics, Cliente } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/constants'
import DateFilterBar from '@/components/DateFilterBar'
import {
  Download, BarChart2, Users, CheckCircle2, Globe, ShoppingBag,
  MessageSquare, AlertCircle, Store, Radio, WifiOff, Activity
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
  return <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="700">{`${(percent * 100).toFixed(0)}%`}</text>
}

const tt = {
  contentStyle: { background: '#fff', border: '1px solid #e8ecf0', borderRadius: '12px', color: '#131523', fontSize: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', fontFamily: "'Nunito', sans-serif" },
  labelStyle: { color: '#131523', fontWeight: 700 },
  itemStyle: { color: '#7b8fa6' },
  cursor: { fill: 'rgba(102,16,242,0.04)' },
}

const STATUS_COLORS: Record<string, string> = {
  CONVERTIDO: '#1eab5a', EM_NEGOCIACAO: '#f59e0b', PENDENTE: '#a0aec0', NAO_CONVERTIDO: '#ef4444',
}
const STATUS_BG: Record<string, string> = {
  CONVERTIDO: '#d1fae5', EM_NEGOCIACAO: '#fef3c7', PENDENTE: '#f1f3f6', NAO_CONVERTIDO: '#fee2e2',
}
const CHART_PALETTE = ['#6610f2', '#1eab5a', '#f59e0b', '#06b6d4', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6']
const UNICO_PLUGINS = ['UnicoDrop Novo', 'UnicoDrop Antigo']

export default function RelatoriosPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState({ dateField: 'cancelamento', dateFrom: '', dateTo: '' })

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
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [dateFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  const exportCSV = () => {
    if (!clientes.length) return
    const headers = ['ID Unico', 'Nome', 'Empresa', 'Contato', 'Status', 'Prioridade', 'Data Cancelamento', 'Data Contato', 'Site', 'Site Online', 'Checkout', 'Plataforma Loja', 'Faturamento Anterior', 'Plugins Rastreio', 'Recursos UD', 'Motivo', 'Feedback', 'Responsável']
    const rows = clientes.map(c => [
      c.unico_id || '', c.nome, c.empresa || '', c.contato || '',
      STATUS_LABELS[c.status], c.prioridade,
      c.data_cancelamento ? format(new Date(c.data_cancelamento), 'dd/MM/yyyy') : '',
      c.data_contato ? format(new Date(c.data_contato), 'dd/MM/yyyy') : '',
      c.site_url || '', c.site_online, c.checkout || '', c.plataforma_loja || '',
      c.faturamento_anterior !== null && c.faturamento_anterior !== undefined ? `R$ ${c.faturamento_anterior}` : '',
      (c.plugins_rastreio || []).join('; '),
      (c.recursos_ud || []).join('; '),
      c.motivo_cancelamento || '', c.feedback_completo || '', c.responsavel || '',
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `unico-crm-${format(new Date(), 'yyyy-MM-dd')}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  if (loading || !metrics) {
    return (
      <div className="p-8 flex items-center justify-center h-64 rounded-2xl m-8" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 animate-spin" style={{ color: 'var(--primary)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Gerando relatórios...</p>
        </div>
      </div>
    )
  }

  // Computed
  const pluginsCount: Record<string, number> = {}
  clientes.forEach(c => { (c.plugins_rastreio || []).forEach(p => { pluginsCount[p] = (pluginsCount[p] || 0) + 1 }) })
  const pluginsSorted = Object.entries(pluginsCount).sort((a, b) => b[1] - a[1])
  const maxPlugin = pluginsSorted[0]?.[1] || 1

  const siteOnline = clientes.filter(c => c.site_online === 'ONLINE').length
  const siteOffline = clientes.filter(c => c.site_online === 'OFFLINE').length
  const siteNaoVerif = clientes.length - siteOnline - siteOffline

  const pieStatusData = metrics.por_status.map(s => {
    if (s.status === 'PENDENTE') return { name: 'Pendentes', value: Math.max(0, s.count - metrics.inacessiveis), color: STATUS_COLORS[s.status] || '#a0aec0' }
    return { name: STATUS_LABELS[s.status] || s.status, value: s.count, color: STATUS_COLORS[s.status] || '#a0aec0' }
  }).filter(d => d.value > 0)
  if (metrics.inacessiveis > 0) pieStatusData.push({ name: 'Inacessíveis', value: metrics.inacessiveis, color: '#f97316' })

  const checkoutChart = metrics.por_checkout.filter(c => c.checkout !== 'Não informado').slice(0, 8).map(c => ({ name: c.checkout.length > 14 ? c.checkout.slice(0, 14) + '…' : c.checkout, value: c.count }))
  const plataformaChart = metrics.por_plataforma.filter(p => p.plataforma !== 'Não informado').slice(0, 8).map(p => ({ name: p.plataforma.length > 14 ? p.plataforma.slice(0, 14) + '…' : p.plataforma, value: p.count }))
  const maxMotivo = metrics.top_motivos[0]?.count || 1

  return (
    <div className="animate-fade-in">
      {/* Topbar */}
      <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3"
        style={{ background: 'white', borderBottom: '1px solid var(--border-color)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Poppins', sans-serif", color: 'var(--text-heading)' }}>
            Análise & Relatórios
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white btn-primary">
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-6">
        <DateFilterBar value={dateFilter} onChange={setDateFilter} />

        {/* KPI Row */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {[
            { label: 'Total', value: metrics.total, color: '#6610f2', bg: '#f5f3ff' },
            { label: 'Convertidos', value: metrics.convertidos, color: '#1eab5a', bg: '#d1fae5' },
            { label: 'Em Neg.', value: metrics.em_negociacao, color: '#d97706', bg: '#fef3c7' },
            { label: 'Pendentes', value: metrics.pendentes, color: '#6b7280', bg: '#f1f3f6' },
            { label: 'Inacessíveis', value: metrics.inacessiveis, color: '#ea580c', bg: '#ffedd5' },
            { label: 'Não Conv.', value: metrics.nao_convertidos, color: '#dc2626', bg: '#fee2e2' },
            { label: 'Conversão', value: `${metrics.taxa_conversao}%`, color: '#1eab5a', bg: '#d1fae5' },
            { label: 'Cont. Hoje', value: metrics.contatados_hoje, color: '#0891b2', bg: '#cffafe' },
            { label: 'Cancel. Hj', value: metrics.cancelados_hoje, color: '#dc2626', bg: '#fee2e2' },
          ].map(item => (
            <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: item.bg, border: `1px solid ${item.color}22` }}>
              <p className="text-lg font-black leading-none" style={{ color: item.color, fontFamily: "'Poppins', sans-serif" }}>{item.value}</p>
              <p className="text-[10px] font-bold mt-1 uppercase tracking-wide" style={{ color: item.color + 'aa' }}>{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2/3 */}
          <div className="lg:col-span-2 space-y-5">
            {/* Status Breakdown */}
            <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <div className="section-header">
                <div className="icon-box icon-box-primary" style={{ width: 34, height: 34, borderRadius: 9 }}><Users className="w-4 h-4 text-white" /></div>
                <h2 className="section-header-title">Distribuição por Status</h2>
              </div>
              <div className="space-y-4">
                {metrics.por_status.sort((a, b) => b.count - a.count).map(item => {
                  const pct = metrics.total > 0 ? (item.count / metrics.total) * 100 : 0
                  const color = STATUS_COLORS[item.status] || '#a0aec0'
                  const bg = STATUS_BG[item.status] || '#f1f3f6'
                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-1.5 text-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>{STATUS_LABELS[item.status] || item.status}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: bg, color }}>{item.count}</span>
                          <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="progress-bar-crm">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  )
                })}
                {metrics.inacessiveis > 0 && (() => {
                  const pct = metrics.total > 0 ? (metrics.inacessiveis / metrics.total) * 100 : 0
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1.5 text-sm">
                        <div className="flex items-center gap-2.5">
                          <WifiOff className="w-3.5 h-3.5" style={{ color: '#f97316' }} />
                          <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>Inacessíveis</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: '#ffedd5', color: '#ea580c' }}>{metrics.inacessiveis}</span>
                          <span className="text-xs w-8 text-right" style={{ color: 'var(--text-muted)' }}>{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="progress-bar-crm">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: '#f97316' }} />
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Motivos */}
            <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <div className="section-header">
                <div className="icon-box icon-box-warning" style={{ width: 34, height: 34, borderRadius: 9 }}><MessageSquare className="w-4 h-4 text-white" /></div>
                <h2 className="section-header-title">Principais Motivos de Cancelamento</h2>
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
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 mt-0.5" style={{ background: color }}>{i + 1}</span>
                            <p style={{ color: 'var(--text-heading)' }}>{item.motivo}</p>
                          </div>
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full flex-shrink-0" style={{ background: `${color}18`, color }}>{item.count}×</span>
                        </div>
                        <div className="progress-bar-crm ml-7">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}aa)` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 gap-2">
                  <AlertCircle className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum motivo registrado</p>
                </div>
              )}
            </div>

            {/* Checkouts */}
            {checkoutChart.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                <div className="section-header">
                  <div className="icon-box icon-box-info" style={{ width: 34, height: 34, borderRadius: 9 }}><ShoppingBag className="w-4 h-4 text-white" /></div>
                  <h2 className="section-header-title">Checkouts Utilizados</h2>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={checkoutChart} barCategoryGap="30%" layout="vertical">
                    <XAxis type="number" tick={{ fill: '#a0aec0', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#7b8fa6', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip {...tt} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {checkoutChart.map((_, i) => <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Plataformas */}
            {plataformaChart.length > 0 && (
              <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                <div className="section-header">
                  <div className="icon-box icon-box-success" style={{ width: 34, height: 34, borderRadius: 9 }}><Store className="w-4 h-4 text-white" /></div>
                  <h2 className="section-header-title">Plataformas de Loja</h2>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={plataformaChart} barCategoryGap="30%" layout="vertical">
                    <XAxis type="number" tick={{ fill: '#a0aec0', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#7b8fa6', fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip {...tt} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                      {plataformaChart.map((_, i) => <Cell key={i} fill={CHART_PALETTE[(i + 3) % CHART_PALETTE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Right 1/3 */}
          <div className="space-y-5">
            {/* Plugins */}
            <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <div className="section-header">
                <div className="icon-box icon-box-primary" style={{ width: 34, height: 34, borderRadius: 9 }}><Radio className="w-4 h-4 text-white" /></div>
                <h2 className="section-header-title">Plugins de Rastreio</h2>
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
                            {isUnico && <Radio className="w-3 h-3 flex-shrink-0" style={{ color: '#1eab5a' }} />}
                            <span className="truncate font-semibold" style={{ color: isUnico ? 'var(--text-heading)' : 'var(--text-secondary)' }} title={plugin}>{plugin}</span>
                            {isUnico && <span className="text-[9px] font-bold px-1.5 rounded-full" style={{ background: '#d1fae5', color: '#059669' }}>UD</span>}
                          </div>
                          <span className="font-bold ml-2" style={{ color: 'var(--text-heading)' }}>{count}</span>
                        </div>
                        <div className="progress-bar-crm">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: isUnico ? '#1eab5a' : 'var(--primary)' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum plugin registrado</p>
              )}
            </div>

            {/* Status Pie */}
            <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <div className="section-header">
                <div className="icon-box icon-box-warning" style={{ width: 34, height: 34, borderRadius: 9 }}><BarChart2 className="w-4 h-4 text-white" /></div>
                <h2 className="section-header-title">Status Geral</h2>
              </div>
              {pieStatusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieStatusData} cx="50%" cy="50%" labelLine={false} label={renderLabel} outerRadius={72} innerRadius={36} dataKey="value" strokeWidth={3} stroke="#fff">
                        {pieStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip {...tt} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                    {pieStatusData.map(item => (
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
                <div className="h-[180px] flex items-center justify-center text-sm" style={{ color: 'var(--text-muted)' }}>Sem dados</div>
              )}
            </div>

            {/* Sites */}
            <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <div className="section-header">
                <div className="icon-box icon-box-info" style={{ width: 34, height: 34, borderRadius: 9 }}><Globe className="w-4 h-4 text-white" /></div>
                <h2 className="section-header-title">Status dos Sites</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Online', value: siteOnline, bar: '#1eab5a', bg: '#d1fae5', text: '#059669' },
                  { label: 'Offline', value: siteOffline, bar: '#ef4444', bg: '#fee2e2', text: '#dc2626' },
                  { label: 'Não Verificado', value: siteNaoVerif, bar: '#a0aec0', bg: '#f1f3f6', text: '#6b7280' },
                ].map(item => {
                  const pct = clientes.length > 0 ? Math.round((item.value / clientes.length) * 100) : 0
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-semibold" style={{ color: 'var(--text-heading)' }}>{item.label}</span>
                        <span className="font-bold px-2 py-0.5 rounded-full" style={{ background: item.bg, color: item.text }}>{item.value}</span>
                      </div>
                      <div className="progress-bar-crm">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: item.bar }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
