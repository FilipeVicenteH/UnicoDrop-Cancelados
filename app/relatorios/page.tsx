'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardMetrics, Cliente } from '@/lib/types'
import { STATUS_LABELS, RECURSOS_UD } from '@/lib/constants'
import DateFilterBar from '@/components/DateFilterBar'
import {
  Download, BarChart2, Users, CheckCircle2, Globe, ShoppingBag,
  MessageSquare, AlertCircle, Store, Radio, WifiOff, Activity,
  Zap, DollarSign, LayoutDashboard, Puzzle, MessageCircle, AlertTriangle
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
  contentStyle: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontFamily: "'Inter', sans-serif" },
  labelStyle: { color: '#0f172a', fontWeight: 600 },
  itemStyle: { color: '#475569' },
  cursor: { fill: 'rgba(241,245,249,0.8)' },
}

const STATUS_COLORS: Record<string, string> = {
  CONVERTIDO: '#059669', EM_NEGOCIACAO: '#d97706', PENDENTE: '#64748b', NAO_CONVERTIDO: '#dc2626',
}
const STATUS_BG: Record<string, string> = {
  CONVERTIDO: '#ecfdf5', EM_NEGOCIACAO: '#fffbeb', PENDENTE: '#f1f5f9', NAO_CONVERTIDO: '#fef2f2',
}
const CHART_PALETTE = ['#0f172a', '#3b82f6', '#059669', '#d97706', '#64748b', '#0284c7', '#ea580c', '#6b21a8']
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
      <div className="p-8 flex items-center justify-center h-64 rounded-xl m-8 bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-7 h-7 animate-spin text-slate-700" />
          <p className="text-xs text-slate-500 font-medium">Gerando relatórios consolidados...</p>
        </div>
      </div>
    )
  }

  // Computed metrics
  const pluginsCount: Record<string, number> = {}
  const recursosCount: Record<string, number> = {}
  let usavaDashboardCount = 0
  let usavaPluginCount = 0
  let usavaWhatsappCount = 0

  clientes.forEach(c => {
    (c.plugins_rastreio || []).forEach(p => { pluginsCount[p] = (pluginsCount[p] || 0) + 1 })
    ;(c.recursos_ud || []).forEach(r => { recursosCount[r] = (recursosCount[r] || 0) + 1 })
    if (c.usava_dashboard) usavaDashboardCount++
    if (c.usava_plugin) usavaPluginCount++
    if (c.usava_whatsapp) usavaWhatsappCount++
  })

  const pluginsSorted = Object.entries(pluginsCount).sort((a, b) => b[1] - a[1])
  const maxPlugin = pluginsSorted[0]?.[1] || 1

  const siteOnline = clientes.filter(c => c.site_online === 'ONLINE').length
  const siteOffline = clientes.filter(c => c.site_online === 'OFFLINE').length
  const siteNaoVerif = clientes.length - siteOnline - siteOffline

  const pieStatusData = metrics.por_status.map(s => {
    if (s.status === 'PENDENTE') return { name: 'Pendentes', value: Math.max(0, s.count - metrics.inacessiveis), color: STATUS_COLORS[s.status] || '#64748b' }
    return { name: STATUS_LABELS[s.status] || s.status, value: s.count, color: STATUS_COLORS[s.status] || '#64748b' }
  }).filter(d => d.value > 0)
  if (metrics.inacessiveis > 0) pieStatusData.push({ name: 'Inacessíveis', value: metrics.inacessiveis, color: '#ea580c' })

  const checkoutChart = metrics.por_checkout.filter(c => c.checkout !== 'Não informado').slice(0, 8).map(c => ({ name: c.checkout.length > 14 ? c.checkout.slice(0, 14) + '…' : c.checkout, value: c.count }))
  const plataformaChart = metrics.por_plataforma.filter(p => p.plataforma !== 'Não informado').slice(0, 8).map(p => ({ name: p.plataforma.length > 14 ? p.plataforma.slice(0, 14) + '…' : p.plataforma, value: p.count }))
  const maxMotivo = metrics.top_motivos[0]?.count || 1

  // Faturamento pie data
  const rawFat = metrics.por_faturamento ? metrics.por_faturamento.filter(f => f.count > 0 && f.faixa !== 'Não Informado') : []
  const totalFatCount = rawFat.reduce((acc, f) => acc + f.count, 0) || 1
  const fatPieData = rawFat.map((f, i) => ({
    name: f.faixa,
    value: f.count,
    percent: Math.round((f.count / totalFatCount) * 100),
    color: CHART_PALETTE[i % CHART_PALETTE.length],
  }))

  return (
    <div className="animate-fade-in">
      {/* Topbar */}
      <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Análise & Relatórios Operacionais
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Relatório gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all">
          <Download className="w-3.5 h-3.5" />
          Exportar Dados (CSV)
        </button>
      </div>

      <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-6">
        <DateFilterBar value={dateFilter} onChange={setDateFilter} />

        {/* ── 1. KPI Summary Bar ── */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-3">
          {[
            { label: 'Total Base', value: metrics.total, color: '#0f172a', bg: '#f8fafc' },
            { label: 'Convertidos', value: metrics.convertidos, color: '#059669', bg: '#ecfdf5' },
            { label: 'Em Negociação', value: metrics.em_negociacao, color: '#d97706', bg: '#fffbeb' },
            { label: 'Pendentes', value: metrics.pendentes, color: '#475569', bg: '#f1f5f9' },
            { label: 'Inacessíveis', value: metrics.inacessiveis, color: '#ea580c', bg: '#fff7ed' },
            { label: 'Não Conv.', value: metrics.nao_convertidos, color: '#dc2626', bg: '#fef2f2' },
            { label: 'Taxa Conv.', value: `${metrics.taxa_conversao}%`, color: '#059669', bg: '#ecfdf5' },
            { label: 'Contatados Hj', value: metrics.contatados_hoje, color: '#0284c7', bg: '#f0f9ff' },
            { label: 'Cancelados Hj', value: metrics.cancelados_hoje, color: '#dc2626', bg: '#fef2f2' },
          ].map(item => (
            <div key={item.label} className="rounded-lg p-3 text-center border border-slate-200 bg-white">
              <p className="text-base font-extrabold leading-none" style={{ color: item.color }}>{item.value}</p>
              <p className="text-[10px] font-semibold mt-1 text-slate-500 uppercase tracking-wide truncate">{item.label}</p>
            </div>
          ))}
        </div>

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Columns */}
          <div className="lg:col-span-2 space-y-5">
            {/* Status Breakdown */}
            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
              <div className="section-header">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700"><Users className="w-4 h-4" /></div>
                <div>
                  <h2 className="section-header-title">Distribuição por Status do Lojista</h2>
                  <p className="section-header-subtitle">Volume absoluto e percentual por etapa do funil</p>
                </div>
              </div>
              <div className="space-y-3.5">
                {metrics.por_status.sort((a, b) => b.count - a.count).map(item => {
                  const pct = metrics.total > 0 ? (item.count / metrics.total) * 100 : 0
                  const color = STATUS_COLORS[item.status] || '#64748b'
                  const bg = STATUS_BG[item.status] || '#f1f5f9'
                  return (
                    <div key={item.status}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-medium text-slate-700">{STATUS_LABELS[item.status] || item.status}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded border border-transparent" style={{ background: bg, color }}>{item.count}</span>
                          <span className="text-xs font-mono text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
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
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-medium text-slate-700 flex items-center gap-1.5"><WifiOff className="w-3.5 h-3.5 text-orange-600" /> Inacessíveis</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded border border-orange-200 bg-orange-50 text-orange-700">{metrics.inacessiveis}</span>
                          <span className="text-xs font-mono text-slate-400 w-8 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="progress-bar-crm">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: '#ea580c' }} />
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Motivos de Cancelamento */}
            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
              <div className="section-header">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700"><MessageSquare className="w-4 h-4" /></div>
                <div>
                  <h2 className="section-header-title">Principais Motivos de Cancelamento</h2>
                  <p className="section-header-subtitle">Justificativas mais informadas pelos lojistas</p>
                </div>
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
                <div className="py-6 text-center text-xs text-slate-400">Nenhum motivo registrado</div>
              )}
            </div>

            {/* ── Faturamento Anterior (Lojistas) ── */}
            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
              <div className="section-header">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700"><DollarSign className="w-4 h-4" /></div>
                <div>
                  <h2 className="section-header-title">Faturamento Mensal Anterior dos Lojistas</h2>
                  <p className="section-header-subtitle">Distribuição por porte de faturamento</p>
                </div>
              </div>
              {fatPieData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={fatPieData} cx="50%" cy="50%" labelLine={false} outerRadius={70} innerRadius={35} dataKey="value" strokeWidth={2} stroke="#fff">
                        {fatPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip {...tt} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {fatPieData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                          <span className="text-slate-700 font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-900">{item.value} ({item.percent}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">Sem dados de faturamento</div>
              )}
            </div>

            {/* Checkouts & Plataformas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Checkouts */}
              <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
                <div className="section-header">
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700"><ShoppingBag className="w-4 h-4" /></div>
                  <h2 className="section-header-title">Checkouts Utilizados</h2>
                </div>
                {checkoutChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={checkoutChart} barCategoryGap="30%" layout="vertical">
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={95} />
                      <Tooltip {...tt} />
                      <Bar dataKey="value" fill="#0f172a" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">Sem dados</div>
                )}
              </div>

              {/* Plataformas */}
              <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
                <div className="section-header">
                  <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700"><Store className="w-4 h-4" /></div>
                  <h2 className="section-header-title">Plataformas de Loja</h2>
                </div>
                {plataformaChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={plataformaChart} barCategoryGap="30%" layout="vertical">
                      <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} width={95} />
                      <Tooltip {...tt} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-xs text-slate-400">Sem dados</div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* ── Recursos UD Utilizados ── */}
            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
              <div className="section-header">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700"><Zap className="w-4 h-4" /></div>
                <div>
                  <h2 className="section-header-title">Recursos UD Utilizados</h2>
                  <p className="section-header-subtitle">Funcionalidades adotadas na plataforma</p>
                </div>
              </div>
              <div className="space-y-3">
                {RECURSOS_UD.map(r => {
                  const count = recursosCount[r.key] || 0
                  const pct = clientes.length > 0 ? Math.round((count / clientes.length) * 100) : 0
                  return (
                    <div key={r.key}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="text-slate-700 font-medium flex items-center gap-1.5">
                          <span>{r.icon}</span> {r.key}
                        </span>
                        <span className="font-semibold text-slate-900">{count} ({pct}%)</span>
                      </div>
                      <div className="progress-bar-crm">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: '#0f172a' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Ferramentas Usadas (Dashboard / Plugin / WhatsApp) ── */}
            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
              <div className="section-header">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700"><LayoutDashboard className="w-4 h-4" /></div>
                <div>
                  <h2 className="section-header-title">Uso de Ferramentas Principais</h2>
                  <p className="section-header-subtitle">Adoção das 3 ferramentas chave</p>
                </div>
              </div>
              <div className="space-y-3.5">
                {[
                  { label: 'Dashboard UnicoDrop', count: usavaDashboardCount, icon: LayoutDashboard },
                  { label: 'Plugin de Rastreio', count: usavaPluginCount, icon: Puzzle },
                  { label: 'Notificações WhatsApp', count: usavaWhatsappCount, icon: MessageCircle },
                ].map(tool => {
                  const pct = clientes.length > 0 ? Math.round((tool.count / clientes.length) * 100) : 0
                  const Icon = tool.icon
                  return (
                    <div key={tool.label}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="text-slate-700 font-medium flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-slate-500" /> {tool.label}
                        </span>
                        <span className="font-semibold text-slate-900">{tool.count} ({pct}%)</span>
                      </div>
                      <div className="progress-bar-crm">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: '#3b82f6' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Por Prioridade ── */}
            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
              <div className="section-header">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700"><AlertTriangle className="w-4 h-4" /></div>
                <h2 className="section-header-title">Por Nível de Prioridade</h2>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'ALTA', label: 'Alta Prioridade', color: '#dc2626', bg: '#fef2f2' },
                  { key: 'MEDIA', label: 'Média Prioridade', color: '#d97706', bg: '#fffbeb' },
                  { key: 'BAIXA', label: 'Baixa Prioridade', color: '#0284c7', bg: '#f0f9ff' },
                ].map(p => {
                  const count = metrics.por_prioridade.find(x => x.prioridade === p.key)?.count || 0
                  const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0
                  return (
                    <div key={p.key}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-medium text-slate-700">{p.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold px-2 py-0.5 rounded text-xs" style={{ background: p.bg, color: p.color }}>{count}</span>
                          <span className="text-slate-400 font-mono text-[11px] w-8 text-right">{pct}%</span>
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

            {/* Plugins Rastreio */}
            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
              <div className="section-header">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700"><Radio className="w-4 h-4" /></div>
                <h2 className="section-header-title">Plugins de Rastreio Utilizados</h2>
              </div>
              {pluginsSorted.length > 0 ? (
                <div className="space-y-2.5">
                  {pluginsSorted.map(([plugin, count]) => {
                    const isUnico = UNICO_PLUGINS.includes(plugin)
                    const pct = Math.round((count / maxPlugin) * 100)
                    return (
                      <div key={plugin}>
                        <div className="flex items-center justify-between mb-1 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isUnico && <Radio className="w-3 h-3 flex-shrink-0 text-emerald-600" />}
                            <span className={`truncate ${isUnico ? 'font-semibold text-slate-900' : 'text-slate-600'}`} title={plugin}>{plugin}</span>
                            {isUnico && <span className="text-[9px] font-bold px-1 rounded bg-emerald-100 text-emerald-700">UD</span>}
                          </div>
                          <span className="font-semibold text-slate-900">{count}</span>
                        </div>
                        <div className="progress-bar-crm">
                          <div className="progress-fill" style={{ width: `${pct}%`, background: isUnico ? '#059669' : '#0f172a' }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Nenhum plugin registrado</p>
              )}
            </div>

            {/* Sites Status */}
            <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs">
              <div className="section-header">
                <div className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center text-slate-700"><Globe className="w-4 h-4" /></div>
                <h2 className="section-header-title">Status dos Sites dos Lojistas</h2>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Online', value: siteOnline, bar: '#059669', bg: '#ecfdf5', text: '#059669' },
                  { label: 'Offline', value: siteOffline, bar: '#dc2626', bg: '#fef2f2', text: '#dc2626' },
                  { label: 'Não Verificado', value: siteNaoVerif, bar: '#64748b', bg: '#f1f5f9', text: '#475569' },
                ].map(item => {
                  const pct = clientes.length > 0 ? Math.round((item.value / clientes.length) * 100) : 0
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="font-semibold px-2 py-0.5 rounded border border-transparent" style={{ background: item.bg, color: item.text }}>{item.value}</span>
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
