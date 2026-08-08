'use client'

import { useState, useEffect, useCallback } from 'react'
import ClienteCard from '@/components/ClienteCard'
import ClienteForm from '@/components/ClienteForm'
import { Cliente } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/constants'
import {
  Plus, Search, Filter, Users, RefreshCw, ChevronDown,
  X, Calendar, CalendarRange, PhoneOff, Edit2
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['TODOS', 'PENDENTE', 'EM_NEGOCIACAO', 'CONVERTIDO', 'NAO_CONVERTIDO']
const PRIORIDADE_OPTIONS = ['TODOS', 'ALTA', 'MEDIA', 'BAIXA']
const USAVA_OPTIONS = [
  { value: '', label: 'Todos os recursos' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'plugin', label: 'Plugin' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

const DATE_FIELD_OPTIONS = [
  { value: 'cancelamento', label: 'Data de Cancelamento' },
  { value: 'contato', label: 'Data de Contato' },
]

function getPresetRange(preset: string): { from: string; to: string } {
  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  if (preset === 'hoje') return { from: fmt(today), to: fmt(today) }
  if (preset === '7d') {
    const from = new Date(today); from.setDate(from.getDate() - 6)
    return { from: fmt(from), to: fmt(today) }
  }
  if (preset === '30d') {
    const from = new Date(today); from.setDate(from.getDate() - 29)
    return { from: fmt(from), to: fmt(today) }
  }
  if (preset === 'mes') {
    return { from: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), to: fmt(today) }
  }
  if (preset === 'mes_ant') {
    return {
      from: fmt(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      to: fmt(new Date(today.getFullYear(), today.getMonth(), 0)),
    }
  }
  return { from: '', to: '' }
}

const INVALID_PHONE_KEYWORDS = [
  'número incorreto', 'numero incorreto',
  'número inválido', 'numero invalido',
  'número não existe', 'numero nao existe',
  'número inexistente', 'numero inexistente',
  'telefone incorreto', 'telefone inválido', 'telefone invalido',
  'telefone não existe', 'telefone nao existe',
  'fone errado', 'número errado', 'numero errado',
  'contato errado', 'sem telefone', 'sem número', 'sem numero',
  'número desligado', 'numero desligado',
  'fora de área', 'fora de area',
]

function isMissingPhone(contato?: string | null): boolean {
  if (!contato || contato.trim() === '') return true
  return !/\d/.test(contato)
}

function hasInvalidPhoneNote(nota?: string | null): boolean {
  if (!nota) return false
  const lower = nota.toLowerCase()
  return INVALID_PHONE_KEYWORDS.some(kw => lower.includes(kw))
}

function isInvalidContact(cliente: Cliente): boolean {
  return isMissingPhone(cliente.contato) || hasInvalidPhoneNote(cliente.nota_interna)
}

function getContactReason(cliente: Cliente): string {
  if (!cliente.contato || cliente.contato.trim() === '') return 'Contato não informado'
  if (isMissingPhone(cliente.contato)) return `"${cliente.contato}" — sem número`
  if (hasInvalidPhoneNote(cliente.nota_interna)) return 'Número marcado como inválido na nota interna'
  return ''
}

export default function ClientesPage() {
  const [activeTab, setActiveTab] = useState<'todos' | 'sem_contato'>('todos')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('TODOS')
  const [prioridade, setPrioridade] = useState('TODOS')
  const [usava, setUsava] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Date filters
  const [dateField, setDateField] = useState('cancelamento')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [activePreset, setActivePreset] = useState('')

  // Sem contato
  const [semContato, setSemContato] = useState<Cliente[]>([])
  const [loadingSemContato, setLoadingSemContato] = useState(false)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status !== 'TODOS') params.set('status', status)
      if (prioridade !== 'TODOS') params.set('prioridade', prioridade)
      if (usava) params.set('usava', usava)
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
    } catch {
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [search, status, prioridade, usava, dateFrom, dateTo, dateField])

  const fetchSemContato = useCallback(async () => {
    setLoadingSemContato(true)
    try {
      const res = await fetch('/api/clientes?limit=1000')
      const data = await res.json()
      const all: Cliente[] = data.clientes || []
      setSemContato(all.filter(c => isInvalidContact(c)))
    } catch {
      toast.error('Erro ao carregar lista')
    } finally {
      setLoadingSemContato(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(fetchClientes, 300)
    return () => clearTimeout(timer)
  }, [fetchClientes])

  useEffect(() => {
    if (activeTab === 'sem_contato') fetchSemContato()
  }, [activeTab, fetchSemContato])

  const handleEdit = (id: number) => { setEditId(id); setFormOpen(true) }

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja remover este cliente? Esta ação não pode ser desfeita.')) return
    try {
      await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      toast.success('Cliente removido')
      fetchClientes()
      if (activeTab === 'sem_contato') fetchSemContato()
    } catch {
      toast.error('Erro ao remover cliente')
    }
  }

  const handleCloseForm = () => { setFormOpen(false); setEditId(null) }

  const handleSaved = () => {
    fetchClientes()
    if (activeTab === 'sem_contato') fetchSemContato()
  }

  const applyPreset = (preset: string) => {
    const range = getPresetRange(preset)
    setDateFrom(range.from); setDateTo(range.to); setActivePreset(preset)
  }

  const clearDates = () => { setDateFrom(''); setDateTo(''); setActivePreset('') }
  const hasDateFilter = dateFrom || dateTo
  const activeFiltersCount = [status !== 'TODOS', prioridade !== 'TODOS', usava !== '', !!hasDateFilter].filter(Boolean).length
  const clearAllFilters = () => { setStatus('TODOS'); setPrioridade('TODOS'); setUsava(''); setSearch(''); clearDates() }

  const PRESETS = [
    { key: 'hoje', label: 'Hoje' }, { key: '7d', label: 'Últimos 7 dias' },
    { key: '30d', label: 'Últimos 30 dias' }, { key: 'mes', label: 'Este mês' },
    { key: 'mes_ant', label: 'Mês anterior' },
  ]

  return (
    <>
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono font-medium text-emerald-400 uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Database
              </span>
              <span className="text-[11px] text-zinc-500 font-mono">Gestão de Lojistas</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Clientes Cancelados</h1>
            <p className="text-xs text-zinc-400 font-mono mt-1">
              {loading ? 'Buscando...' : `${total} ${total === 1 ? 'cliente' : 'clientes'} no banco de dados`}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { fetchClientes(); if (activeTab === 'sem_contato') fetchSemContato() }}
              disabled={loading} title="Atualizar"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Cliente
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          {([
            { key: 'todos' as const, label: 'Todos os Clientes', icon: Users, badge: null },
            { key: 'sem_contato' as const, label: 'Sem Telefone Válido', icon: PhoneOff, badge: semContato.length > 0 ? semContato.length : null },
          ]).map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  active
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.badge !== null && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {tab.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ══ TAB: TODOS ══ */}
        {activeTab === 'todos' && (
          <div className="space-y-4">
            <div className="flex gap-2.5 flex-wrap">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  className="form-input pl-9 text-xs h-9 bg-[#121316] border-zinc-800 focus:border-zinc-700"
                  placeholder="Buscar por nome, ID Unico, empresa..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200">
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
                  <X className="w-3 h-3" /> Limpar tudo
                </button>
              )}
            </div>

            {/* Filter Drawer */}
            {filtersOpen && (
              <div className="bg-[#121316] border border-zinc-800 rounded-xl p-5 animate-fade-in space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarRange className="w-4 h-4 text-zinc-400" />
                    <label className="text-[11px] font-mono font-semibold text-zinc-400 uppercase tracking-wider">Período de Análise</label>
                    {hasDateFilter && (
                      <button onClick={clearDates} className="ml-auto text-[11px] font-mono text-rose-400 hover:text-rose-300 flex items-center gap-1">
                        <X className="w-3 h-3" /> Limpar datas
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {DATE_FIELD_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setDateField(opt.value)}
                        className={`text-xs font-mono px-3 py-1 rounded-md border transition-all ${
                          dateField === opt.value
                            ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-medium'
                            : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {PRESETS.map(p => (
                      <button
                        key={p.key}
                        onClick={() => applyPreset(p.key)}
                        className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all ${
                          activePreset === p.key
                            ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-medium'
                            : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 max-w-md">
                    <div><label className="form-label">De</label><input type="date" className="form-input text-xs" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset('') }} /></div>
                    <div><label className="form-label">Até</label><input type="date" className="form-input text-xs" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset('') }} /></div>
                  </div>
                </div>
                <div className="border-t border-zinc-800/80" />
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
                          {s === 'TODOS' ? 'Todos' : STATUS_LABELS[s]}
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
                    <label className="form-label">Recursos UnicoDrop</label>
                    <div className="flex flex-wrap gap-1.5">
                      {USAVA_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setUsava(opt.value)}
                          className={`text-xs font-mono px-2.5 py-1 rounded-md border transition-all ${
                            usava === opt.value
                              ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-medium'
                              : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Table Headers */}
            <div className="hidden lg:grid grid-cols-[96px_1fr_130px_90px_110px_90px_80px_40px] gap-3 px-4 py-2 border-b border-zinc-800/60 font-mono text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
              {['ID Unico', 'Cliente / Empresa', 'Status', 'Prioridade', 'Site', 'Plataforma', 'Contato', ''].map((h, i) => (
                <span key={i}>{h}</span>
              ))}
            </div>

            {/* Customer List */}
            <div className="space-y-2">
              {loading && clientes.length === 0 ? (
                <div className="flex items-center justify-center h-48 border border-zinc-800 rounded-xl bg-zinc-900/30">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
                    <p className="text-xs font-mono text-zinc-500">Buscando lojistas...</p>
                  </div>
                </div>
              ) : clientes.length === 0 ? (
                <div className="bg-[#121316] border border-zinc-800 rounded-xl py-16 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center">
                    <Users className="w-6 h-6 text-zinc-500" />
                  </div>
                  <p className="text-zinc-300 font-medium text-sm">Nenhum cliente encontrado</p>
                  <p className="text-zinc-500 text-xs font-mono">{activeFiltersCount > 0 || search ? 'Ajuste os filtros de busca' : 'Cadastre o primeiro cliente cancelado'}</p>
                </div>
              ) : (
                clientes.map((cliente, i) => (
                  <div key={cliente.id} className="animate-fade-in" style={{ animationDelay: `${i * 15}ms` }}>
                    <ClienteCard cliente={cliente} onEdit={handleEdit} onDelete={handleDelete} />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ══ TAB: SEM CONTATO ══ */}
        {activeTab === 'sem_contato' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
              <PhoneOff className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-300 font-mono uppercase tracking-wider">Inconsistência de Contato</p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Lista de lojistas sem telefone informado ou marcados com erro de contato na nota interna.
                </p>
              </div>
            </div>

            {loadingSemContato ? (
              <div className="flex items-center justify-center h-48 border border-zinc-800 rounded-xl bg-zinc-900/30">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
              </div>
            ) : semContato.length === 0 ? (
              <div className="bg-[#121316] border border-zinc-800 rounded-xl py-16 flex flex-col items-center justify-center gap-2">
                <p className="text-emerald-400 font-mono text-xs font-semibold">Sem problemas de contato detectados</p>
              </div>
            ) : (
              <div className="space-y-2">
                {semContato.map((cliente, i) => (
                  <div
                    key={cliente.id}
                    className="flex items-center gap-3 px-4 py-3 bg-[#121316] border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all"
                  >
                    <div className="w-7 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-mono font-bold text-amber-400">{cliente.nome.charAt(0).toUpperCase()}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-zinc-100 truncate">{cliente.nome}</p>
                      <p className="text-[11px] font-mono text-amber-400/80 truncate mt-0.5">{getContactReason(cliente)}</p>
                    </div>

                    <div className="w-28 flex-shrink-0 hidden sm:block">
                      <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700/50">{cliente.unico_id || '—'}</span>
                    </div>

                    <div className="w-20 flex-shrink-0 flex justify-end">
                      <button
                        onClick={() => handleEdit(cliente.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded transition-all"
                      >
                        <Edit2 className="w-3 h-3" /> Editar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <ClienteForm isOpen={formOpen} onClose={handleCloseForm} onSaved={handleSaved} clienteId={editId} />
    </>
  )
}
