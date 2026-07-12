'use client'

import { useEffect, useState, useCallback } from 'react'
import { DashboardMetrics, Cliente } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/lib/constants'
import { BarChart2, Download, Calendar, TrendingUp, Users, CheckCircle, Globe, Puzzle, LayoutDashboard, MessageCircle, ShoppingCart } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
      const mData = await mRes.json()
      const cData = await cRes.json()
      setMetrics(mData)
      setClientes(cData.clientes || [])
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
      'Checkout', 'Plugins', 'Usava Dashboard', 'Usava Plugin', 'Usava WhatsApp',
      'Motivo', 'Feedback', 'Responsável'
    ]
    const rows = clientes.map(c => [
      c.unico_id || '',
      c.nome,
      c.empresa || '',
      c.contato || '',
      STATUS_LABELS[c.status],
      c.prioridade,
      c.data_cancelamento ? format(new Date(c.data_cancelamento), 'dd/MM/yyyy') : '',
      c.data_contato ? format(new Date(c.data_contato), 'dd/MM/yyyy') : '',
      c.site_url || '',
      c.site_online,
      c.checkout || '',
      (c.plugins_rastreio || []).join('; '),
      c.usava_dashboard ? 'Sim' : 'Não',
      c.usava_plugin ? 'Sim' : 'Não',
      c.usava_whatsapp ? 'Sim' : 'Não',
      c.motivo_cancelamento || '',
      c.feedback_completo || '',
      c.responsavel || '',
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
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
        <div className="w-7 h-7 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    )
  }

  // Compute statistics
  const usandoDashboard = clientes.filter(c => c.usava_dashboard).length
  const usandoPlugin = clientes.filter(c => c.usava_plugin).length
  const usandoWhatsapp = clientes.filter(c => c.usava_whatsapp).length
  const siteOnline = clientes.filter(c => c.site_online === 'ONLINE').length
  const siteOffline = clientes.filter(c => c.site_online === 'OFFLINE').length

  const motivosMap: Record<string, number> = {}
  clientes.forEach(c => {
    if (c.motivo_cancelamento) {
      const m = c.motivo_cancelamento.trim()
      motivosMap[m] = (motivosMap[m] || 0) + 1
    }
  })
  const topMotivos = Object.entries(motivosMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

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
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-all"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-5">

          {/* KPI Summary */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Resumo Geral
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total', value: metrics.total, color: 'text-white' },
                { label: 'Convertidos', value: metrics.convertidos, color: 'text-emerald-400' },
                { label: 'Em Negociação', value: metrics.em_negociacao, color: 'text-amber-400' },
                { label: 'Taxa de Conversão', value: `${metrics.taxa_conversao}%`, color: 'text-purple-400' },
              ].map(item => (
                <div key={item.label} className="text-center p-3 bg-white/3 rounded-xl border border-white/5">
                  <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="text-[11px] text-gray-600 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Status breakdown */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Distribuição por Status
            </h2>
            <div className="space-y-3">
              {metrics.por_status.map(item => {
                const pct = metrics.total > 0 ? (item.count / metrics.total) * 100 : 0
                const color = STATUS_COLORS[item.status] || '#6B7280'
                return (
                  <div key={item.status} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-32 flex-shrink-0">
                      {STATUS_LABELS[item.status] || item.status}
                    </span>
                    <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-400 w-12 text-right">
                      {item.count} ({pct.toFixed(0)}%)
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Checkouts */}
          {metrics.por_checkout.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-purple-400" /> Checkouts Utilizados
              </h2>
              <div className="space-y-2.5">
                {metrics.por_checkout.map(item => {
                  const pct = metrics.total > 0 ? (item.count / metrics.total) * 100 : 0
                  return (
                    <div key={item.checkout} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-28 flex-shrink-0 truncate">{item.checkout}</span>
                      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 w-10 text-right">{item.count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Motivos */}
          {topMotivos.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-400" /> Principais Motivos de Cancelamento
              </h2>
              <div className="space-y-2">
                {topMotivos.map(([motivo, count], i) => (
                  <div key={motivo} className="flex items-start gap-3 p-3 bg-white/3 rounded-lg border border-white/5">
                    <span className="text-xs font-bold text-gray-600 w-5 flex-shrink-0">#{i + 1}</span>
                    <p className="flex-1 text-sm text-gray-300">{motivo}</p>
                    <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full flex-shrink-0">
                      {count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          {/* Site Status */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-400" /> Status dos Sites
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Online', value: siteOnline, color: 'bg-emerald-500', textColor: 'text-emerald-400' },
                { label: 'Offline', value: siteOffline, color: 'bg-red-500', textColor: 'text-red-400' },
                {
                  label: 'Não Verificado',
                  value: clientes.length - siteOnline - siteOffline,
                  color: 'bg-gray-500',
                  textColor: 'text-gray-400'
                },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-white/3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm text-gray-400">{item.label}</span>
                  </div>
                  <span className={`text-lg font-bold ${item.textColor}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Uso na UD */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4">Recursos UD Utilizados</h2>
            <div className="space-y-3">
              {[
                { label: 'Dashboard', value: usandoDashboard, icon: LayoutDashboard },
                { label: 'Plugin', value: usandoPlugin, icon: Puzzle },
                { label: 'WhatsApp', value: usandoWhatsapp, icon: MessageCircle },
              ].map(item => {
                const Icon = item.icon
                const pct = clientes.length > 0 ? Math.round((item.value / clientes.length) * 100) : 0
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-purple-400" />
                        <span className="text-xs text-gray-400">{item.label}</span>
                      </div>
                      <span className="text-xs text-gray-400">{item.value} ({pct}%)</span>
                    </div>
                    <div className="bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-purple-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Conversão por prioridade */}
          <div className="glass-card p-5">
            <h2 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-purple-400" /> Distribuição por Prioridade
            </h2>
            <div className="space-y-2.5">
              {metrics.por_prioridade.map(item => {
                const pct = metrics.total > 0 ? (item.count / metrics.total) * 100 : 0
                const colorMap: Record<string, string> = {
                  ALTA: 'bg-red-500',
                  MEDIA: 'bg-yellow-500',
                  BAIXA: 'bg-blue-500',
                }
                const labelMap: Record<string, string> = { ALTA: '🔴 Alta', MEDIA: '🟡 Média', BAIXA: '🔵 Baixa' }
                return (
                  <div key={item.prioridade} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0">{labelMap[item.prioridade] || item.prioridade}</span>
                    <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colorMap[item.prioridade] || 'bg-gray-500'} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-6 text-right">{item.count}</span>
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
