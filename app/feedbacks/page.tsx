'use client'

import { useState, useEffect, useCallback } from 'react'
import { FeedbackMelhoria } from '@/lib/types'
import { FEEDBACK_STATUS_LABELS, PRIORIDADE_LABELS } from '@/lib/constants'
import { Plus, Search, X, ChevronDown, MessageSquare, Edit2, Trash2, CalendarDays, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import FeedbackForm from '@/components/FeedbackForm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_OPTIONS = ['TODOS', 'PENDENTE', 'EM_ANALISE', 'PLANEJADO', 'CONCLUIDO']
const PRIORIDADE_OPTIONS = ['TODOS', 'ALTA', 'MEDIA', 'BAIXA']
const TIPO_OPTIONS = ['TODOS', 'ATIVO', 'CANCELADO']

const STATUS_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  PENDENTE: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  EM_ANALISE: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  PLANEJADO: { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
  CONCLUIDO: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
}

const PRIORIDADE_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  ALTA: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  MEDIA: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  BAIXA: { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
}

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<FeedbackMelhoria[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
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
    } catch { toast.error('Erro ao carregar feedbacks') }
    finally { setLoading(false) }
  }, [search, status, prioridade, tipo])

  useEffect(() => {
    const t = setTimeout(fetchFeedbacks, 300)
    return () => clearTimeout(t)
  }, [fetchFeedbacks])

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja remover este feedback?')) return
    try {
      await fetch(`/api/feedbacks/${id}`, { method: 'DELETE' })
      toast.success('Feedback removido')
      fetchFeedbacks()
    } catch { toast.error('Erro ao remover') }
  }

  const activeFiltersCount = [status !== 'TODOS', prioridade !== 'TODOS', tipo !== 'TODOS'].filter(Boolean).length
  const clearAll = () => { setStatus('TODOS'); setPrioridade('TODOS'); setTipo('TODOS'); setSearch('') }

  return (
    <>
      <div className="animate-fade-in">
        {/* Topbar */}
        <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3 bg-white border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Feedbacks & Sugestões de Melhoria
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? 'Carregando...' : `${feedbacks.length} feedbacks registrados`}
            </p>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Feedback
          </button>
        </div>

        <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-5">
          {/* Search + Filter */}
          <div className="flex gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                className="form-input pl-9"
                style={{ height: '36px', fontSize: '12.5px' }}
                placeholder="Buscar por cliente, funcionalidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-all ${
                activeFiltersCount > 0
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-white text-slate-900">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>

            {activeFiltersCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg text-red-600 bg-red-50 border border-red-200 hover:bg-red-100">
                <X className="w-3.5 h-3.5" /> Limpar
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {filtersOpen && (
            <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="form-label">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(s => {
                      const badge = STATUS_BADGE[s]
                      const isActive = status === s
                      return (
                        <button key={s} onClick={() => setStatus(s)} className="px-2.5 py-1 rounded font-semibold transition-all border"
                          style={{
                            background: isActive && badge ? badge.bg : isActive ? '#0f172a' : '#ffffff',
                            color: isActive && badge ? badge.color : isActive ? '#ffffff' : '#64748b',
                            borderColor: isActive && badge ? badge.border : isActive ? '#0f172a' : '#e2e8f0',
                          }}>
                          {s === 'TODOS' ? 'Todos' : FEEDBACK_STATUS_LABELS[s]}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="form-label">Prioridade</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRIORIDADE_OPTIONS.map(p => {
                      const badge = PRIORIDADE_BADGE[p]
                      const isActive = prioridade === p
                      return (
                        <button key={p} onClick={() => setPrioridade(p)} className="px-2.5 py-1 rounded font-semibold transition-all border"
                          style={{
                            background: isActive && badge ? badge.bg : isActive ? '#0f172a' : '#ffffff',
                            color: isActive && badge ? badge.color : isActive ? '#ffffff' : '#64748b',
                            borderColor: isActive && badge ? badge.border : isActive ? '#0f172a' : '#e2e8f0',
                          }}>
                          {p === 'TODOS' ? 'Todas' : p}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div>
                  <p className="form-label">Tipo de Cliente</p>
                  <div className="flex flex-wrap gap-1.5">
                    {TIPO_OPTIONS.map(t => {
                      const isActive = tipo === t
                      return (
                        <button key={t} onClick={() => setTipo(t)} className={`px-2.5 py-1 rounded font-semibold transition-all border ${
                          isActive ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}>
                          {t === 'TODOS' ? 'Todos' : t === 'ATIVO' ? 'Ativos' : 'Cancelados'}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading && feedbacks.length === 0 ? (
              <div className="col-span-full flex items-center justify-center h-48 bg-white rounded-lg border border-slate-200 shadow-xs">
                <p className="text-xs text-slate-500">Carregando feedbacks...</p>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="col-span-full py-16 flex flex-col items-center gap-2 bg-white rounded-lg border border-slate-200">
                <MessageSquare className="w-8 h-8 text-slate-300" />
                <p className="font-semibold text-xs text-slate-700">Nenhum feedback encontrado</p>
              </div>
            ) : (
              feedbacks.map((item) => {
                const statusBadge = STATUS_BADGE[item.status] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
                const prioridadeBadge = PRIORIDADE_BADGE[item.prioridade] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            item.tipo_cliente === 'ATIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                          }`}>
                            {item.tipo_cliente === 'ATIVO' ? 'Ativo' : 'Cancelado'}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border" style={{ background: prioridadeBadge.bg, color: prioridadeBadge.color, borderColor: prioridadeBadge.border }}>
                            {PRIORIDADE_LABELS[item.prioridade]}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditId(item.id); setFormOpen(true) }} className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xs font-semibold text-slate-900 mb-1 truncate" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }} title={item.funcionalidade}>
                        {item.funcionalidade}
                      </h3>
                      <div className="flex items-center gap-2 mb-2.5">
                        <p className="text-[11px] text-slate-500 truncate">{item.cliente}</p>
                        {item.unico_id && <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200">{item.unico_id}</span>}
                      </div>

                      <div
                        className={`text-xs text-slate-600 leading-relaxed cursor-pointer p-2.5 rounded bg-slate-50 border border-slate-200 mb-3 ${expandedId === item.id ? '' : 'line-clamp-3'}`}
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        {item.descricao}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-[11px]">
                      <span className="font-semibold px-2 py-0.5 rounded border" style={{ background: statusBadge.bg, color: statusBadge.color, borderColor: statusBadge.border }}>
                        {FEEDBACK_STATUS_LABELS[item.status]}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
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
      </div>

      <FeedbackForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditId(null) }}
        onSaved={fetchFeedbacks}
        feedbackId={editId}
      />
    </>
  )
}
