'use client'

import { useEffect, useState, useCallback } from 'react'
import Dashboard from '@/components/Dashboard'
import { DashboardMetrics } from '@/lib/types'
import { RefreshCw, Plus, TrendingUp, Calendar } from 'lucide-react'
import ClienteForm from '@/components/ClienteForm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const emptyMetrics: DashboardMetrics = {
  total: 0,
  convertidos: 0,
  nao_convertidos: 0,
  em_negociacao: 0,
  pendentes: 0,
  taxa_conversao: 0,
  contatados_hoje: 0,
  cancelados_hoje: 0,
  por_status: [],
  por_checkout: [],
  por_prioridade: [],
  por_plataforma: [],
  top_motivos: [],
}

export default function HomePage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard')
      const data = await res.json()
      setMetrics(data)
      setLastRefresh(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
    // Auto-refresh a cada 60 segundos
    const interval = setInterval(fetchMetrics, 60000)
    return () => clearInterval(interval)
  }, [fetchMetrics])

  const today = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Visão Geral</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-600" />
            <p className="text-sm text-gray-500">{todayCapitalized}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white text-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Cliente
          </button>
        </div>
      </div>

      {/* Last refresh */}
      <p className="text-[11px] text-gray-700 mb-5">
        Última atualização: {format(lastRefresh, "HH:mm:ss", { locale: ptBR })} • Atualização automática a cada 60s
      </p>

      {/* Dashboard Content */}
      {loading && metrics.total === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Carregando métricas...</p>
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
