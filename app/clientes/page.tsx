'use client'

import { useState, useEffect, useCallback } from 'react'
import ClienteForm from '@/components/ClienteForm'
import { Cliente } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/constants'
import {
  Plus, Search, Users, RefreshCw, ChevronDown,
  X, PhoneOff, Edit2, SlidersHorizontal
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['TODOS', 'PENDENTE', 'EM_NEGOCIACAO', 'CONVERTIDO', 'NAO_CONVERTIDO']
const PRIORIDADE_OPTIONS = ['TODOS', 'ALTA', 'MEDIA', 'BAIXA']
const DATE_FIELD_OPTIONS = [
  { value: 'cancelamento', label: 'Data de Cancelamento' },
  { value: 'contato', label: 'Data de Contato' },
]

function PRESETS() {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return [
    { key: 'hoje', label: 'Hoje', from: fmt(today), to: fmt(today) },
    { key: '7d', label: '7 dias', from: fmt(new Date(today.getTime() - 6 * 86400000)), to: fmt(today) },
    { key: '30d', label: '30 dias', from: fmt(new Date(today.getTime() - 29 * 86400000)), to: fmt(today) },
    { key: 'mes', label: 'Este mês', from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(today) },
  ]
}

const INVALID_PHONE_KEYWORDS = ['número incorreto','numero incorreto','número inválido','numero invalido','número não existe','telefone incorreto','telefone inválido','sem telefone','sem número','numero errado','número desligado','fora de área']

function isMissingPhone(contato?: string | null): boolean {
  return !contato || contato.trim() === '' || !/\d/.test(contato)
}
function hasInvalidPhoneNote(nota?: string | null): boolean {
  if (!nota) return false
  const l = nota.toLowerCase()
  return INVALID_PHONE_KEYWORDS.some(kw => l.includes(kw))
}
function isInvalidContact(c: Cliente): boolean {
  return isMissingPhone(c.contato) || hasInvalidPhoneNote(c.nota_interna)
}
function getContactReason(c: Cliente): string {
  if (!c.contato || c.contato.trim() === '') return 'Contato não informado'
  if (isMissingPhone(c.contato)) return `"${c.contato}" — sem número`
  if (hasInvalidPhoneNote(c.nota_interna)) return 'Número marcado como inválido'
  return ''
}

const STATUS_BADGE: Record<string, { bg: string; color: string; border: string }> = {
  CONVERTIDO: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  EM_NEGOCIACAO: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  PENDENTE: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  NAO_CONVERTIDO: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
}

export default function ClientesPage() {
  const [activeTab, setActiveTab] = useState<'todos' | 'sem_contato'>('todos')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('TODOS')
  const [prioridade, setPrioridade] = useState('TODOS')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [dateField, setDateField] = useState('cancelamento')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activePreset, setActivePreset] = useState('')
  const [semContato, setSemContato] = useState<Cliente[]>([])
  const [loadingSemContato, setLoadingSemContato] = useState(false)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status !== 'TODOS') params.set('status', status)
      if (prioridade !== 'TODOS') params.set('prioridade', prioridade)
      if (dateFrom || dateTo) {
        params.set('date_field', dateField)
        if (dateFrom) params.set('date_from', dateFrom)
        if (dateTo) params.set('date_to', dateTo)
      }
      params.set('limit', '200')
      const res = await fetch(`/api/clientes?${params.toString()}`)
      const data = await res.json()
      setClientes(data.clientes || [])
      setTotal(data.total || 0)
    } catch { toast.error('Erro ao carregar clientes') }
    finally { setLoading(false) }
  }, [search, status, prioridade, dateFrom, dateTo, dateField])

  const fetchSemContato = useCallback(async () => {
    setLoadingSemContato(true)
    try {
      const res = await fetch('/api/clientes?limit=1000')
      const data = await res.json()
      setSemContato((data.clientes || []).filter((c: Cliente) => isInvalidContact(c)))
    } catch { toast.error('Erro ao carregar lista') }
    finally { setLoadingSemContato(false) }
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchClientes, 300)
    return () => clearTimeout(t)
  }, [fetchClientes])

  useEffect(() => {
    if (activeTab === 'sem_contato') fetchSemContato()
  }, [activeTab, fetchSemContato])

  const handleEdit = (id: number) => { setEditId(id); setFormOpen(true) }
  const handleDelete = async (id: number) => {
    if (!confirm('Deseja remover este cliente?')) return
    try {
      await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      toast.success('Cliente removido')
      fetchClientes()
      if (activeTab === 'sem_contato') fetchSemContato()
    } catch { toast.error('Erro ao remover') }
  }

  const applyPreset = (p: { key: string; from: string; to: string }) => {
    setDateFrom(p.from); setDateTo(p.to); setActivePreset(p.key)
  }
  const clearDates = () => { setDateFrom(''); setDateTo(''); setActivePreset('') }
  const activeFiltersCount = [status !== 'TODOS', prioridade !== 'TODOS', !!(dateFrom || dateTo)].filter(Boolean).length
  const clearAll = () => { setStatus('TODOS'); setPrioridade('TODOS'); setSearch(''); clearDates() }

  const presets = PRESETS()

  const tabs = [
    { key: 'todos' as const, label: 'Todos os Clientes', icon: Users },
    { key: 'sem_contato' as const, label: 'Sem Telefone Válido', icon: PhoneOff, badge: semContato.length > 0 ? semContato.length : null },
  ]

  return (
    <>
      <div className="animate-fade-in">
        {/* Topbar */}
        <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3 bg-white border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Clientes Cancelados</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? 'Carregando...' : `${total} registros no banco de dados`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchClientes(); if (activeTab === 'sem_contato') fetchSemContato() }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
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

        <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-5">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-200">
            {tabs.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold transition-all -mb-[1px] ${
                    active
                      ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                      : 'text-slate-500 hover:text-slate-800 border-b-2 border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                  {tab.badge !== null && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab: TODOS */}
          {activeTab === 'todos' && (
            <div className="space-y-4">
              {/* Search + Filters Bar */}
              <div className="flex gap-2.5 flex-wrap">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    className="form-input pl-9"
                    style={{ height: '36px', fontSize: '12.5px' }}
                    placeholder="Buscar por nome, ID Unico, empresa..."
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
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-all"
                  >
                    <X className="w-3.5 h-3.5" /> Limpar
                  </button>
                )}
              </div>

              {/* Filter Panel */}
              {filtersOpen && (
                <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <p className="form-label">Período de Análise</p>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {DATE_FIELD_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setDateField(opt.value)}
                          className={`text-xs px-2.5 py-1 rounded font-semibold transition-all border ${
                            dateField === opt.value
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {presets.map(p => (
                        <button
                          key={p.key}
                          onClick={() => applyPreset(p)}
                          className={`text-xs px-2.5 py-1 rounded font-semibold transition-all border ${
                            activePreset === p.key
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                      {(dateFrom || dateTo) && (
                        <button onClick={clearDates} className="text-xs px-2.5 py-1 rounded font-semibold text-red-600 bg-red-50 border border-red-200">
                          Limpar datas
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-w-xs">
                      <div>
                        <label className="form-label">De</label>
                        <input type="date" className="form-input" style={{ fontSize: '12px' }} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset('') }} />
                      </div>
                      <div>
                        <label className="form-label">Até</label>
                        <input type="date" className="form-input" style={{ fontSize: '12px' }} value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset('') }} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="form-label">Filtrar por Status</p>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUS_OPTIONS.map(s => {
                          const badge = STATUS_BADGE[s]
                          const isActive = status === s
                          return (
                            <button
                              key={s}
                              onClick={() => setStatus(s)}
                              className="text-xs px-2.5 py-1 rounded font-semibold transition-all border"
                              style={{
                                background: isActive && badge ? badge.bg : isActive ? '#0f172a' : '#ffffff',
                                color: isActive && badge ? badge.color : isActive ? '#ffffff' : '#64748b',
                                borderColor: isActive && badge ? badge.border : isActive ? '#0f172a' : '#e2e8f0',
                              }}
                            >
                              {s === 'TODOS' ? 'Todos' : STATUS_LABELS[s]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="form-label">Filtrar por Prioridade</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRIORIDADE_OPTIONS.map(p => {
                          const isActive = prioridade === p
                          return (
                            <button
                              key={p}
                              onClick={() => setPrioridade(p)}
                              className={`text-xs px-2.5 py-1 rounded font-semibold transition-all border ${
                                isActive
                                  ? 'border-slate-900 bg-slate-900 text-white'
                                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {p === 'TODOS' ? 'Todas' : p}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                {/* Header */}
                <div className="hidden lg:grid grid-cols-[100px_1fr_130px_100px_130px_110px_60px] gap-3 crm-table-header">
                  {['ID Unico', 'Cliente / Empresa', 'Status', 'Prioridade', 'Site', 'Contato', ''].map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-200">
                  {loading && clientes.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
                      <p className="text-xs text-slate-500">Buscando lojistas...</p>
                    </div>
                  ) : clientes.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-xs text-slate-700">Nenhum cliente encontrado</p>
                      <p className="text-xs text-slate-400">Ajuste os filtros de busca</p>
                    </div>
                  ) : (
                    clientes.map((cliente) => (
                      <div
                        key={cliente.id}
                        className="px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors group cursor-default text-xs"
                      >
                        {/* ID */}
                        <div className="w-[100px] flex-shrink-0">
                          <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {cliente.unico_id || '—'}
                          </span>
                        </div>

                        {/* Nome */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{cliente.nome}</p>
                          {cliente.empresa && <p className="text-[11px] text-slate-500 truncate mt-0.5">{cliente.empresa}</p>}
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0">
                          {(() => {
                            const badge = STATUS_BADGE[cliente.status] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
                            return (
                              <span className="font-semibold px-2.5 py-0.5 rounded border text-[11px]" style={{ background: badge.bg, color: badge.color, borderColor: badge.border }}>
                                {STATUS_LABELS[cliente.status]}
                              </span>
                            )
                          })()}
                        </div>

                        {/* Prioridade */}
                        <div className="flex-shrink-0 hidden md:block">
                          <span className="font-semibold px-2 py-0.5 rounded border text-[11px] bg-slate-100 text-slate-700 border-slate-200">
                            {cliente.prioridade}
                          </span>
                        </div>

                        {/* Site */}
                        <div className="flex-shrink-0 hidden lg:block text-slate-500 font-mono">
                          {cliente.site_online === 'ONLINE' ? 'Online' : cliente.site_online === 'OFFLINE' ? 'Offline' : '—'}
                        </div>

                        {/* Contato */}
                        <div className="hidden xl:block flex-shrink-0 text-slate-500 font-mono">
                          {cliente.contato ? cliente.contato.slice(0, 14) + (cliente.contato.length > 14 ? '…' : '') : '—'}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(cliente.id)}
                            className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: SEM CONTATO */}
          {activeTab === 'sem_contato' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs flex items-start gap-2.5">
                <PhoneOff className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">Lojistas com problema de contato telefônico</p>
                  <p className="text-amber-700 mt-0.5">Lojistas sem número informado ou marcados como incorretos no relatório de apoio.</p>
                </div>
              </div>

              {loadingSemContato ? (
                <div className="py-12 flex justify-center bg-white rounded-lg border border-slate-200">
                  <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : semContato.length === 0 ? (
                <div className="py-12 bg-white rounded-lg border border-slate-200 text-center text-xs text-emerald-700 font-semibold">
                  Nenhum problema de contato detectado ✓
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-slate-200 shadow-xs divide-y divide-slate-200">
                  {semContato.map((cliente) => (
                    <div key={cliente.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-xs">
                      <div className="w-7 h-7 rounded bg-amber-100 text-amber-800 flex items-center justify-center font-bold flex-shrink-0">
                        {cliente.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{cliente.nome}</p>
                        <p className="text-[11px] text-amber-700 truncate mt-0.5">{getContactReason(cliente)}</p>
                      </div>
                      <button
                        onClick={() => handleEdit(cliente.id)}
                        className="flex items-center gap-1 px-3 py-1 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold"
                      >
                        <Edit2 className="w-3 h-3" /> Editar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <ClienteForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditId(null) }} onSaved={() => { fetchClientes(); if (activeTab === 'sem_contato') fetchSemContato() }} clienteId={editId} />
    </>
  )
}
