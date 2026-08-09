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
  total: 0, convertidos: 0, nao_convertidos: 0, em_negociacao: 0,
  pendentes: 0, inacessiveis: 0, taxa_conversao: 0,
  contatados_hoje: 0, cancelados_hoje: 0,
  por_status: [], por_checkout: [], por_prioridade: [],
  por_plataforma: [], top_motivos: [], por_faturamento: [],
}

export default function HomePage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const [dateFilter, setDateFilter] = useState({
    dateField: 'cancelamento', dateFrom: '', dateTo: '',
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

  return (
    <div className="animate-fade-in">
      {/* ── Topbar Header ── */}
      <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3 bg-white border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Dashboard Operacional
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-500">{todayCapitalized}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs text-slate-400 hidden sm:block">
            Atualizado às {format(lastRefresh, 'HH:mm', { locale: ptBR })}
          </span>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-5">
        <DateFilterBar value={dateFilter} onChange={setDateFilter} />

        {loading && metrics.total === 0 ? (
          <div className="flex items-center justify-center h-64 rounded-lg bg-white border border-slate-200 shadow-xs">
            <div className="flex flex-col items-center gap-3">
              <Activity className="w-7 h-7 animate-spin text-slate-700" />
              <p className="text-xs text-slate-500 font-medium">Carregando métricas...</p>
            </div>
          </div>
        ) : (
          <Dashboard metrics={metrics} />
        )}
      </div>

      <ClienteForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSaved={fetchMetrics} />
    </div>
  )
}
