'use client'

import { useState, useEffect, useCallback } from 'react'
import ClienteCard from '@/components/ClienteCard'
import ClienteForm from '@/components/ClienteForm'
import { Cliente } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/constants'
import {
  Plus, Search, Filter, Users, RefreshCw, ChevronDown,
  LayoutDashboard, Puzzle, MessageCircle, X, Calendar, CalendarRange,
  PhoneOff, Edit2
} from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = ['TODOS', 'PENDENTE', 'EM_NEGOCIACAO', 'CONVERTIDO', 'NAO_CONVERTIDO']
const PRIORIDADE_OPTIONS = ['TODOS', 'ALTA', 'MEDIA', 'BAIXA']
const USAVA_OPTIONS = [
  { value: '', label: 'Todos os recursos' },
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { value: 'plugin', label: 'Plugin', icon: Puzzle },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
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

// Keywords in nota_interna that indicate invalid phone
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
      <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">Clientes</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Clientes Cancelados</h1>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? 'Carregando...' : `${total} ${total === 1 ? 'cliente' : 'clientes'} encontrado${total === 1 ? '' : 's'}`}
              {hasDateFilter && <span className="ml-2 text-purple-400 text-xs">• filtrado por data</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { fetchClientes(); if (activeTab === 'sem_contato') fetchSemContato() }}
              disabled={loading} title="Atualizar"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Novo Cliente
            </button>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex items-center gap-1 mb-5 border-b border-white/5">
          {([
            { key: 'todos' as const, label: 'Todos os Clientes', icon: Users, badge: null },
            { key: 'sem_contato' as const, label: 'Sem Telefone', icon: PhoneOff, badge: semContato.length > 0 ? semContato.length : null },
          ]).map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium relative transition-all ${
                  active ? 'text-purple-300' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.badge !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-orange-500/20 text-orange-400' : 'bg-white/10 text-gray-500'
                  }`}>{tab.badge}</span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>

        {/* ══ TAB: TODOS ══ */}
        {activeTab === 'todos' && (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input className="form-input pl-10 h-10" placeholder="Buscar por nome, ID Unico, empresa..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300"><X className="w-4 h-4" /></button>}
              </div>
              <button onClick={() => setFiltersOpen(!filtersOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${filtersOpen || activeFiltersCount > 0 ? 'border-purple-500/40 bg-purple-500/10 text-purple-300' : 'border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20'}`}>
                <Filter className="w-4 h-4" />
                Filtros
                {activeFiltersCount > 0 && <span className="bg-purple-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{activeFiltersCount}</span>}
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>
              {activeFiltersCount > 0 && (
                <button onClick={clearAllFilters} className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-all">
                  <X className="w-3.5 h-3.5" /> Limpar tudo
                </button>
              )}
            </div>

            {filtersOpen && (
              <div className="glass-card p-5 mb-4 animate-fade-in space-y-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarRange className="w-4 h-4 text-purple-400" />
                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Filtro por Data</label>
                    {hasDateFilter && <button onClick={clearDates} className="ml-auto text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1"><X className="w-3 h-3" /> Limpar datas</button>}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {DATE_FIELD_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setDateField(opt.value)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${dateField === opt.value ? 'border-purple-500/50 bg-purple-500/15 text-purple-300' : 'border-white/10 bg-white/5 text-gray-500 hover:text-gray-300 hover:border-white/20'}`}>
                        <Calendar className="w-3 h-3" /> {opt.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {PRESETS.map(p => (
                      <button key={p.key} onClick={() => applyPreset(p.key)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all font-medium ${activePreset === p.key ? 'border-violet-500/50 bg-violet-500/15 text-violet-300' : 'border-white/8 bg-white/4 text-gray-500 hover:text-gray-300 hover:border-white/20'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="form-label">De</label><input type="date" className="form-input" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset('') }} /></div>
                    <div><label className="form-label">Até</label><input type="date" className="form-input" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset('') }} /></div>
                  </div>
                </div>
                <div className="border-t border-white/5" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="form-label">Status</label>
                    <div className="flex flex-wrap gap-1.5">
                      {STATUS_OPTIONS.map(s => <button key={s} onClick={() => setStatus(s)} className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${status === s ? 'border-purple-500/50 bg-purple-500/15 text-purple-300' : 'border-white/10 bg-white/5 text-gray-500 hover:text-gray-300 hover:border-white/20'}`}>{s === 'TODOS' ? 'Todos' : STATUS_LABELS[s]}</button>)}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Prioridade</label>
                    <div className="flex flex-wrap gap-1.5">
                      {PRIORIDADE_OPTIONS.map(p => <button key={p} onClick={() => setPrioridade(p)} className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${prioridade === p ? 'border-purple-500/50 bg-purple-500/15 text-purple-300' : 'border-white/10 bg-white/5 text-gray-500 hover:text-gray-300 hover:border-white/20'}`}>{p === 'TODOS' ? 'Todas' : p === 'ALTA' ? '🔴 Alta' : p === 'MEDIA' ? '🟡 Média' : '🔵 Baixa'}</button>)}
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Usava na UnicoDrop</label>
                    <div className="flex flex-wrap gap-1.5">
                      {USAVA_OPTIONS.map(opt => <button key={opt.value} onClick={() => setUsava(opt.value)} className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${usava === opt.value ? 'border-purple-500/50 bg-purple-500/15 text-purple-300' : 'border-white/10 bg-white/5 text-gray-500 hover:text-gray-300 hover:border-white/20'}`}>{opt.label}</button>)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {hasDateFilter && !filtersOpen && (
              <div className="flex items-center gap-2 mb-4 px-1">
                <div className="flex items-center gap-2 text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3 h-3" />
                  <span>{dateField === 'cancelamento' ? 'Cancelamento' : 'Contato'}{dateFrom && ` de ${dateFrom.split('-').reverse().join('/')}`}{dateTo && ` até ${dateTo.split('-').reverse().join('/')}`}</span>
                  <button onClick={clearDates} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                </div>
              </div>
            )}

            <div className="hidden lg:grid grid-cols-[80px_1fr_140px_100px_120px_100px_80px_40px] gap-3 px-4 py-2 mb-1">
              {['ID Unico', 'Cliente', 'Status', 'Prioridade', 'Site', 'UD', 'Contato', ''].map(h => (
                <p key={h} className="text-[11px] font-medium text-gray-600 uppercase tracking-wider">{h}</p>
              ))}
            </div>

            <div className="space-y-2">
              {loading && clientes.length === 0 ? (
                <div className="flex items-center justify-center h-48">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-7 h-7 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-sm text-gray-600">Buscando clientes...</p>
                  </div>
                </div>
              ) : clientes.length === 0 ? (
                <div className="glass-card py-16 flex flex-col items-center justify-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                    <Users className="w-7 h-7 text-purple-500/50" />
                  </div>
                  <p className="text-gray-500 font-medium">Nenhum cliente encontrado</p>
                  <p className="text-gray-600 text-sm">{activeFiltersCount > 0 || search ? 'Tente ajustar os filtros ou o período de data' : 'Adicione o primeiro cliente cancelado'}</p>
                  {!activeFiltersCount && !search && (
                    <button onClick={() => setFormOpen(true)} className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors">
                      <Plus className="w-4 h-4" /> Adicionar Cliente
                    </button>
                  )}
                </div>
              ) : (
                clientes.map((cliente, i) => (
                  <div key={cliente.id} className="animate-fade-in" style={{ animationDelay: `${i * 20}ms` }}>
                    <ClienteCard cliente={cliente} onEdit={handleEdit} onDelete={handleDelete} />
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* ══ TAB: SEM CONTATO ══ */}
        {activeTab === 'sem_contato' && (
          <div>
            <div className="flex items-start gap-3 p-4 mb-5 rounded-xl border border-orange-500/20 bg-orange-500/5">
              <PhoneOff className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-300">Clientes sem telefone válido</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Inclui clientes com contato vazio, sem número, e clientes cuja <strong className="text-gray-400">nota interna</strong> indica número incorreto, inválido ou inexistente. Clique em <strong className="text-gray-400">Editar</strong> para corrigir.
                </p>
              </div>
            </div>

            {loadingSemContato ? (
              <div className="flex items-center justify-center h-48">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-7 h-7 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                  <p className="text-sm text-gray-600">Verificando contatos...</p>
                </div>
              </div>
            ) : semContato.length === 0 ? (
              <div className="glass-card py-16 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <PhoneOff className="w-7 h-7 text-emerald-500/50" />
                </div>
                <p className="text-emerald-400 font-medium">Nenhum cliente com problema no contato!</p>
                <p className="text-gray-600 text-sm">Todos os clientes têm telefone válido e nenhum tem nota interna indicando número inválido.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-2 mb-1">
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wider flex-1">Cliente</p>
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wider w-32 hidden sm:block">ID Unico</p>
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wider w-36 hidden md:block">Empresa</p>
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wider w-28 hidden lg:block">Status</p>
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wider w-28 hidden lg:block">Cancelamento</p>
                  <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wider w-20">Ação</p>
                </div>

                {semContato.map((cliente, i) => (
                  <div
                    key={cliente.id}
                    className="flex items-center gap-3 px-4 py-3.5 bg-white/3 border border-orange-500/10 hover:border-orange-500/25 rounded-xl transition-all animate-fade-in"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-orange-400">{cliente.nome.charAt(0).toUpperCase()}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{cliente.nome}</p>
                      <p className="text-xs text-orange-400/70 flex items-center gap-1 mt-0.5">
                        <PhoneOff className="w-3 h-3" />
                        {getContactReason(cliente)}
                      </p>
                      {/* Tag se foi identificado pela nota interna */}
                      {!isMissingPhone(cliente.contato) && hasInvalidPhoneNote(cliente.nota_interna) && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                          ⚠️ Nota interna
                        </span>
                      )}
                    </div>

                    <div className="w-32 flex-shrink-0 hidden sm:block">
                      {cliente.unico_id
                        ? <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">{cliente.unico_id}</span>
                        : <span className="text-xs text-gray-700">—</span>}
                    </div>

                    <div className="w-36 flex-shrink-0 hidden md:block">
                      <p className="text-xs text-gray-400 truncate">{cliente.empresa || '—'}</p>
                    </div>

                    <div className="w-28 flex-shrink-0 hidden lg:block">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                        backgroundColor: `${cliente.status === 'CONVERTIDO' ? '#10B98120' : cliente.status === 'EM_NEGOCIACAO' ? '#F59E0B20' : cliente.status === 'NAO_CONVERTIDO' ? '#EF444420' : '#6B728020'}`,
                        color: cliente.status === 'CONVERTIDO' ? '#10B981' : cliente.status === 'EM_NEGOCIACAO' ? '#F59E0B' : cliente.status === 'NAO_CONVERTIDO' ? '#EF4444' : '#9CA3AF',
                      }}>
                        {STATUS_LABELS[cliente.status]}
                      </span>
                    </div>

                    <div className="w-28 flex-shrink-0 hidden lg:block">
                      <p className="text-xs text-gray-600">
                        {cliente.data_cancelamento ? new Date(cliente.data_cancelamento).toLocaleDateString('pt-BR') : '—'}
                      </p>
                    </div>

                    <div className="w-20 flex-shrink-0 flex justify-end">
                      <button
                        onClick={() => handleEdit(cliente.id)}
                        title="Editar e adicionar telefone"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg transition-all"
                      >
                        <Edit2 className="w-3 h-3" /> Editar
                      </button>
                    </div>
                  </div>
                ))}

                <p className="text-xs text-gray-700 text-center pt-3 pb-1">
                  {semContato.length} cliente{semContato.length !== 1 ? 's' : ''} com problema no contato
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <ClienteForm isOpen={formOpen} onClose={handleCloseForm} onSaved={handleSaved} clienteId={editId} />
    </>
  )
}
