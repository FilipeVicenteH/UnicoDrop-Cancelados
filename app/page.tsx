'use client'

import { useEffect, useState, useCallback } from 'react'
import Dashboard from '@/components/Dashboard'
import DateFilterBar from '@/components/DateFilterBar'
import { DashboardMetrics } from '@/lib/types'
import { RefreshCw, Plus, Calendar, Activity } from 'lucide-react'
import ClienteForm from '@/components/ClienteForm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const emptyMetrics: DashboardMetrics = {
  total: 0,
  convertidos: 0,
  nao_convertidos: 0,
  em_negociacao: 0,
  pendentes: 0,
  inacessiveis: 0,
  taxa_conversao: 0,
  contatados_hoje: 0,
  cancelados_hoje: 0,
  por_status: [],
  por_checkout: [],
  por_prioridade: [],
  por_plataforma: [],
  top_motivos: [],
  por_faturamento: [],
}

export default function HomePage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const [dateFilter, setDateFilter] = useState({
    dateField: 'cancelamento',
    dateFrom: '',
    dateTo: '',
  })

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter.dateFrom || dateFilter.dateTo) {
        params.set('date_field', dateFilter.dateField)
        if (dateFilter.dateFrom) params.set('date_from', dateFilter.dateFrom)
        if (dateFilter.dateTo) params.set('date_to', dateFilter.dateTo)
      }
      const url = `/api/dashboard${params.toString() ? '?' + params.toString() : ''}`
      const res = await fetch(url)
      const data = await res.json()
      setMetrics(data)
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [dateFilter])

  useEffect(() => {
    fetchMetrics()
    if (!dateFilter.dateFrom && !dateFilter.dateTo) {
      const interval = setInterval(fetchMetrics, 60000)
      return () => clearInterval(interval)
    }
  }, [fetchMetrics, dateFilter])

  const today = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)
  const hasDateFilter = dateFilter.dateFrom || dateFilter.dateTo

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono font-medium text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Overview
            </span>
            <span className="text-[11px] text-zinc-500 font-mono">UnicoCRM Analytics</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Visão Geral de Retenção & Churn</h1>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
            <p className="text-xs text-zinc-400">{todayCapitalized}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Subheader info */}
      <div className="flex items-center justify-between text-xs text-zinc-500 font-mono -mt-2">
        <p>
          Atualizado às {format(lastRefresh, 'HH:mm:ss', { locale: ptBR })}
          {!hasDateFilter && ' • Auto-refresh 60s'}
        </p>
        {hasDateFilter && (
          <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[11px]">
            Filtro de período ativo
          </span>
        )}
      </div>

      {/* Date Filter Bar */}
      <DateFilterBar value={dateFilter} onChange={setDateFilter} />

      {/* Dashboard Content */}
      {loading && metrics.total === 0 ? (
        <div className="flex items-center justify-center h-64 border border-zinc-800 rounded-xl bg-zinc-900/30">
          <div className="flex flex-col items-center gap-3">
            <Activity className="w-6 h-6 text-zinc-500 animate-spin" />
            <p className="text-xs text-zinc-400 font-mono">Carregando métricas da operação...</p>
          </div>
        </div>
      ) : (
        <Dashboard metrics={metrics} />
      )}

      {/* Form Modal */}
      <ClienteForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={fetchMetrics}
      />
    </div>
  )
}
