'use client'

import { useState, useEffect, useCallback } from 'react'
import { FeedbackMelhoria } from '@/lib/types'
import { FEEDBACK_STATUS_LABELS, PRIORIDADE_LABELS } from '@/lib/constants'
import {
  Plus, Search, Filter, X, ChevronDown, MessageSquare, Edit2, Trash2, MessageSquarePlus, Clock, CalendarDays
} from 'lucide-react'
import toast from 'react-hot-toast'
import FeedbackForm from '@/components/FeedbackForm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_OPTIONS = ['TODOS', 'PENDENTE', 'EM_ANALISE', 'PLANEJADO', 'CONCLUIDO']
const PRIORIDADE_OPTIONS = ['TODOS', 'ALTA', 'MEDIA', 'BAIXA']
const TIPO_OPTIONS = ['TODOS', 'ATIVO', 'CANCELADO']

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackMelhoria[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('TODOS')
  const [prioridade, setPrioridade] = useState('TODOS')
  const [tipo, setTipo] = useState('TODOS')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status !== 'TODOS') params.set('status', status)
      if (prioridade !== 'TODOS') params.set('prioridade', prioridade)
      if (tipo !== 'TODOS') params.set('tipo_cliente', tipo)

      const res = await fetch(`/api/feedbacks?${params.toString()}`)
      const data = await res.json()
      setFeedbacks(data || [])
    } catch {
      toast.error('Erro ao carregar feedbacks')
    } finally {
      setLoading(false)
    }
  }, [search, status, prioridade, tipo])

  useEffect(() => {
    const timer = setTimeout(fetchFeedbacks, 300)
    return () => clearTimeout(timer)
  }, [fetchFeedbacks])

  const handleEdit = (id: number) => {
    setEditId(id)
    setFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja remover este feedback? Esta ação não pode ser desfeita.')) return
    try {
      await fetch(`/api/feedbacks/${id}`, { method: 'DELETE' })
      toast.success('Feedback removido')
      fetchFeedbacks()
    } catch {
      toast.error('Erro ao remover feedback')
    }
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setEditId(null)
  }

  const activeFiltersCount = [
    status !== 'TODOS',
    prioridade !== 'TODOS',
    tipo !== 'TODOS',
  ].filter(Boolean).length

  const clearAllFilters = () => {
    setStatus('TODOS')
    setPrioridade('TODOS')
    setTipo('TODOS')
    setSearch('')
  }

  return (
    <>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-medium text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Feedbacks
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">Melhoria Contínua</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Feedbacks de Melhoria de Produto</h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              {loading ? 'Buscando...' : `${feedbacks.length} registros cadastrados`}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Feedback
            </button>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex gap-2.5 flex-wrap">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              className="form-input pl-9 text-xs h-9 bg-[#121316] border-zinc-800 focus:border-zinc-700"
              placeholder="Buscar por cliente, funcionalidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              filtersOpen || activeFiltersCount > 0
                ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
                : 'border-zinc-800 bg-[#121316] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-zinc-100 text-zinc-950 font-mono text-[10px] font-bold px-1.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-lg bg-rose-500/5 transition-all font-mono"
            >
              <X className="w-3 h-3" />
              Limpar tudo
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {filtersOpen && (
          <div className="bg-[#121316] border border-zinc-800 rounded-xl p-5 animate-fade-in space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="form-label">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all ${
                        status === s
                          ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-medium'
                          : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {s === 'TODOS' ? 'Todos' : FEEDBACK_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Prioridade</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORIDADE_OPTIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPrioridade(p)}
                      className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all ${
                        prioridade === p
                          ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-medium'
                          : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {p === 'TODOS' ? 'Todas' : p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Tipo de Cliente</label>
                <div className="flex flex-wrap gap-1.5">
                  {TIPO_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all ${
                        tipo === t
                          ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-medium'
                          : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {t === 'TODOS' ? 'Todos' : t === 'ATIVO' ? 'Ativos' : 'Cancelados'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading && feedbacks.length === 0 ? (
            <div className="col-span-full flex items-center justify-center h-48 border border-zinc-800 rounded-xl bg-zinc-900/30">
              <div className="flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
                <p className="text-xs font-mono text-zinc-500">Buscando feedbacks...</p>
              </div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="col-span-full bg-[#121316] border border-zinc-800 rounded-xl py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-zinc-300 font-medium text-sm">Nenhum feedback encontrado</p>
            </div>
          ) : (
            feedbacks.map((item, i) => {
              const statusBadgeClass = {
                PENDENTE: 'bg-zinc-800 text-zinc-300 border-zinc-700',
                EM_ANALISE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                PLANEJADO: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                CONCLUIDO: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              }[item.status] || 'bg-zinc-800 text-zinc-400 border-zinc-700'

              const prioridadeClass = {
                ALTA: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                MEDIA: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                BAIXA: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
              }[item.prioridade] || 'text-zinc-400 bg-zinc-800 border-zinc-700'

              return (
                <div
                  key={item.id}
                  className="bg-[#121316] border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 group animate-fade-in transition-all flex flex-col justify-between"
                  style={{ animationDelay: `${i * 15}ms` }}
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            item.tipo_cliente === 'ATIVO'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {item.tipo_cliente === 'ATIVO' ? 'Cliente Ativo' : 'Cancelado'}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${prioridadeClass}`}>
                            {PRIORIDADE_LABELS[item.prioridade]}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-100 truncate" title={item.funcionalidade}>
                          {item.funcionalidade}
                        </h3>
                        <p className="text-xs text-zinc-400 truncate mt-0.5" title={item.cliente}>
                          <span>{item.cliente}</span>
                          {item.unico_id && <span className="ml-2 font-mono text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700/50">{item.unico_id}</span>}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item.id)}
                          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div
                      className={`text-xs text-zinc-400 mb-4 leading-relaxed cursor-pointer hover:text-zinc-200 transition-colors bg-zinc-950/40 p-3 rounded border border-zinc-800/80 ${expandedId === item.id ? '' : 'line-clamp-3'}`}
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    >
                      {item.descricao}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80 font-mono text-xs">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusBadgeClass}`}>
                      {FEEDBACK_STATUS_LABELS[item.status]}
                    </span>
                    <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {format(new Date(item.created_at), 'dd/MM/yy', { locale: ptBR })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <FeedbackForm
        isOpen={formOpen}
        onClose={handleCloseForm}
        onSaved={fetchFeedbacks}
        feedbackId={editId}
      />
    </>
  )
}
