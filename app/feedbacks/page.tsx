'use client'

import { useState, useEffect, useCallback } from 'react'
import { FeedbackMelhoria } from '@/lib/types'
import { FEEDBACK_STATUS_LABELS, FEEDBACK_STATUS_COLORS, PRIORIDADE_LABELS } from '@/lib/constants'
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
      <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquarePlus className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">Feedbacks</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Feedbacks de Melhoria</h1>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Carregando...' : `${feedbacks.length} ${feedbacks.length === 1 ? 'registro' : 'registros'} encontrado${feedbacks.length === 1 ? '' : 's'}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Novo Feedback
            </button>
          </div>
        </div>

        {/* Search + Filter Bar */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              className="form-input pl-10 h-10"
              placeholder="Buscar por cliente, funcionalidade..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
              filtersOpen || activeFiltersCount > 0
                ? 'border-purple-500/40 bg-purple-500/10 text-purple-300'
                : 'border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-purple-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              Limpar tudo
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {filtersOpen && (
          <div className="glass-card p-5 mb-4 animate-fade-in space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Status */}
              <div>
                <label className="form-label">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                        status === s
                          ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                          : 'border-white/10 bg-white/5 text-gray-500 hover:text-gray-300 hover:border-white/20'
                      }`}
                    >
                      {s === 'TODOS' ? 'Todos' : FEEDBACK_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prioridade */}
              <div>
                <label className="form-label">Prioridade</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORIDADE_OPTIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPrioridade(p)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                        prioridade === p
                          ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                          : 'border-white/10 bg-white/5 text-gray-500 hover:text-gray-300 hover:border-white/20'
                      }`}
                    >
                      {p === 'TODOS' ? 'Todas' : p === 'ALTA' ? '🔴 Alta' : p === 'MEDIA' ? '🟡 Média' : '🔵 Baixa'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tipo Cliente */}
              <div>
                <label className="form-label">Tipo de Cliente</label>
                <div className="flex flex-wrap gap-1.5">
                  {TIPO_OPTIONS.map(t => (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                        tipo === t
                          ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                          : 'border-white/10 bg-white/5 text-gray-500 hover:text-gray-300 hover:border-white/20'
                      }`}
                    >
                      {t === 'TODOS' ? 'Todos' : t === 'ATIVO' ? '🟢 Ativos' : '🔴 Cancelados'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {loading && feedbacks.length === 0 ? (
            <div className="col-span-full flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-sm text-gray-600">Buscando feedbacks...</p>
              </div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="col-span-full glass-card py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-purple-500/50" />
              </div>
              <p className="text-gray-500 font-medium">Nenhum feedback encontrado</p>
              <p className="text-gray-600 text-sm text-center max-w-md">
                {activeFiltersCount > 0 || search 
                  ? 'Tente ajustar os filtros da busca' 
                  : 'Registre sugestões, problemas ou necessidades passadas pelos clientes (ativos e cancelados) para mapear melhorias.'}
              </p>
              {!activeFiltersCount && !search && (
                <button
                  onClick={() => setFormOpen(true)}
                  className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" /> Adicionar Primeiro
                </button>
              )}
            </div>
          ) : (
            feedbacks.map((item, i) => {
              const statusColor = FEEDBACK_STATUS_COLORS[item.status] || '#6B7280'
              const prioridadeClass = {
                ALTA: 'text-red-400 bg-red-400/10 border-red-500/20',
                MEDIA: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
                BAIXA: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
              }[item.prioridade] || 'text-gray-400 bg-gray-400/10 border-gray-500/20'

              return (
                <div
                  key={item.id}
                  className="glass-card p-5 group animate-fade-in relative overflow-hidden"
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  {/* Status Indicator Bar */}
                  <div 
                    className="absolute top-0 left-0 h-1 w-full"
                    style={{ backgroundColor: statusColor }}
                  />

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          item.tipo_cliente === 'ATIVO' 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {item.tipo_cliente === 'ATIVO' ? 'Cliente Ativo' : 'Cancelado'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${prioridadeClass}`}>
                          Prioridade {PRIORIDADE_LABELS[item.prioridade]}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-white truncate" title={item.funcionalidade}>
                        {item.funcionalidade}
                      </h3>
                      <p className="text-xs text-gray-500 truncate" title={item.cliente}>
                        <span className="font-medium text-gray-400">{item.cliente}</span>
                        {item.unico_id && <span className="ml-2 px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-[10px]">ID: {item.unico_id}</span>}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(item.id)}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`text-sm text-gray-400 mb-4 leading-relaxed cursor-pointer hover:text-gray-300 transition-colors ${expandedId === item.id ? '' : 'line-clamp-3'}`}
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                    title={expandedId === item.id ? 'Clique para recolher' : 'Clique para ler tudo'}
                  >
                    {item.descricao}
                    {expandedId !== item.id && item.descricao.length > 200 && (
                      <span className="text-purple-400 font-medium ml-1 not-italic">· ver mais</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${statusColor}15`,
                        color: statusColor,
                        border: `1px solid ${statusColor}30`
                      }}
                    >
                      {item.status === 'PENDENTE' && <Clock className="w-3 h-3" />}
                      {FEEDBACK_STATUS_LABELS[item.status]}
                    </span>
                    <span className="text-xs text-gray-600 flex items-center gap-1">
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
