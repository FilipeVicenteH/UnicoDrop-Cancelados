'use client'

import { useState, useEffect, useCallback } from 'react'
import { FeedbackMelhoria } from '@/lib/types'
import { FEEDBACK_STATUS_LABELS, PRIORIDADE_LABELS } from '@/lib/constants'
import { Plus, Search, X, ChevronDown, MessageSquare, Edit2, Trash2, MessageSquarePlus, CalendarDays, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import FeedbackForm from '@/components/FeedbackForm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_OPTIONS = ['TODOS', 'PENDENTE', 'EM_ANALISE', 'PLANEJADO', 'CONCLUIDO']
const PRIORIDADE_OPTIONS = ['TODOS', 'ALTA', 'MEDIA', 'BAIXA']
const TIPO_OPTIONS = ['TODOS', 'ATIVO', 'CANCELADO']

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  PENDENTE: { bg: '#f1f3f6', color: '#6b7280' },
  EM_ANALISE: { bg: '#fef3c7', color: '#d97706' },
  PLANEJADO: { bg: '#ede9fe', color: '#6610f2' },
  CONCLUIDO: { bg: '#d1fae5', color: '#059669' },
}

const PRIORIDADE_BADGE: Record<string, { bg: string; color: string }> = {
  ALTA: { bg: '#fee2e2', color: '#dc2626' },
  MEDIA: { bg: '#fef3c7', color: '#d97706' },
  BAIXA: { bg: '#cffafe', color: '#0891b2' },
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
        <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3"
          style={{ background: 'white', borderBottom: '1px solid var(--border-color)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Poppins', sans-serif", color: 'var(--text-heading)' }}>
              Feedbacks de Melhoria
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {loading ? 'Carregando...' : `${feedbacks.length} feedbacks cadastrados`}
            </p>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white btn-primary"
          >
            <Plus className="w-4 h-4" />
            Novo Feedback
          </button>
        </div>

        <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-5">
          {/* Search + Filter */}
          <div className="flex gap-2.5 flex-wrap">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <input
                className="form-input pl-9"
                style={{ height: '38px', fontSize: '13px' }}
                placeholder="Buscar por cliente, funcionalidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all"
              style={{
                borderColor: activeFiltersCount > 0 ? 'var(--primary)' : 'var(--border-color)',
                background: activeFiltersCount > 0 ? 'var(--primary-muted)' : 'white',
                color: activeFiltersCount > 0 ? 'var(--primary)' : 'var(--text-secondary)',
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white" style={{ background: 'var(--primary)' }}>
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
            </button>

            {activeFiltersCount > 0 && (
              <button onClick={clearAll} className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg"
                style={{ color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5' }}>
                <X className="w-3.5 h-3.5" /> Limpar
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {filtersOpen && (
            <div className="rounded-2xl p-5 animate-fade-in" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <p className="form-label">Status</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATUS_OPTIONS.map(s => {
                      const badge = STATUS_BADGE[s]
                      const isActive = status === s
                      return (
                        <button key={s} onClick={() => setStatus(s)} className="text-xs px-3 py-1.5 rounded-full font-bold transition-all"
                          style={{
                            background: isActive && badge ? badge.bg : isActive ? 'var(--primary-muted)' : '#f1f3f6',
                            color: isActive && badge ? badge.color : isActive ? 'var(--primary)' : 'var(--text-muted)',
                            border: `1.5px solid ${isActive ? (badge?.color || 'var(--primary)') + '44' : 'transparent'}`,
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
                        <button key={p} onClick={() => setPrioridade(p)} className="text-xs px-3 py-1.5 rounded-full font-bold transition-all"
                          style={{
                            background: isActive && badge ? badge.bg : isActive ? 'var(--primary-muted)' : '#f1f3f6',
                            color: isActive && badge ? badge.color : isActive ? 'var(--primary)' : 'var(--text-muted)',
                            border: `1.5px solid ${isActive ? (badge?.color || 'var(--primary)') + '44' : 'transparent'}`,
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
                        <button key={t} onClick={() => setTipo(t)} className="text-xs px-3 py-1.5 rounded-full font-bold transition-all"
                          style={{
                            background: isActive ? 'var(--primary-muted)' : '#f1f3f6',
                            color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                            border: `1.5px solid ${isActive ? 'rgba(102,16,242,0.2)' : 'transparent'}`,
                          }}>
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
              <div className="col-span-full flex items-center justify-center h-48 rounded-2xl" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-3 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Buscando feedbacks...</p>
                </div>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="col-span-full py-16 flex flex-col items-center gap-3 rounded-2xl" style={{ background: 'white', border: '1px solid var(--border-color)' }}>
                <div className="icon-box icon-box-primary mx-auto" style={{ width: 52, height: 52, borderRadius: 16 }}>
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-heading)' }}>Nenhum feedback encontrado</p>
              </div>
            ) : (
              feedbacks.map((item, i) => {
                const statusBadge = STATUS_BADGE[item.status] || { bg: '#f1f3f6', color: '#6b7280' }
                const prioridadeBadge = PRIORIDADE_BADGE[item.prioridade] || { bg: '#f1f3f6', color: '#6b7280' }

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl p-5 group animate-fade-in flex flex-col justify-between hover:shadow-lg transition-all"
                    style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)', animationDelay: `${i * 15}ms` }}
                  >
                    <div>
                      {/* Header badges */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              background: item.tipo_cliente === 'ATIVO' ? '#d1fae5' : '#fee2e2',
                              color: item.tipo_cliente === 'ATIVO' ? '#059669' : '#dc2626',
                            }}>
                            {item.tipo_cliente === 'ATIVO' ? 'Ativo' : 'Cancelado'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: prioridadeBadge.bg, color: prioridadeBadge.color }}>
                            {PRIORIDADE_LABELS[item.prioridade]}
                          </span>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditId(item.id); setFormOpen(true) }} className="p-1.5 rounded-lg transition-colors hover:bg-gray-100" style={{ color: 'var(--text-muted)' }}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg transition-all hover:bg-red-50 hover:text-red-500" style={{ color: 'var(--text-muted)' }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold mb-1 truncate" style={{ color: 'var(--text-heading)', fontFamily: "'Poppins', sans-serif" }} title={item.funcionalidade}>
                        {item.funcionalidade}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{item.cliente}</p>
                        {item.unico_id && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>{item.unico_id}</span>}
                      </div>

                      {/* Description */}
                      <div
                        className={`text-xs leading-relaxed cursor-pointer p-3 rounded-xl mb-3 ${expandedId === item.id ? '' : 'line-clamp-3'}`}
                        style={{ background: '#f8fafc', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                        onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      >
                        {item.descricao}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: statusBadge.bg, color: statusBadge.color }}>
                        {FEEDBACK_STATUS_LABELS[item.status]}
                      </span>
                      <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
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
