'use client'

import { useState, useEffect, useCallback } from 'react'
import ClienteCard from '@/components/ClienteCard'
import ClienteForm from '@/components/ClienteForm'
import { Cliente } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/constants'
import {
  Plus, Search, Filter, Users, RefreshCw, ChevronDown,
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

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  CONVERTIDO: { bg: '#d1fae5', color: '#059669', label: 'Convertido' },
  EM_NEGOCIACAO: { bg: '#fef3c7', color: '#d97706', label: 'Em Negociação' },
  PENDENTE: { bg: '#f1f3f6', color: '#6b7280', label: 'Pendente' },
  NAO_CONVERTIDO: { bg: '#fee2e2', color: '#dc2626', label: 'Não Convertido' },
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
        {/* ── Topbar ── */}
        <div className="px-6 md:px-8 py-4 flex items-center justify-between flex-wrap gap-3"
          style={{ background: 'white', borderBottom: '1px solid var(--border-color)', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <div>
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Poppins', sans-serif", color: 'var(--text-heading)' }}>Clientes Cancelados</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {loading ? 'Carregando...' : `${total} clientes no banco de dados`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchClientes(); if (activeTab === 'sem_contato') fetchSemContato() }}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-semibold transition-all"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'white' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white btn-primary"
            >
              <Plus className="w-4 h-4" />
              Novo Cliente
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 max-w-[1500px] mx-auto space-y-5">
          {/* ── Tabs ── */}
          <div className="flex items-center gap-1" style={{ borderBottom: '2px solid var(--border-color)' }}>
            {tabs.map(tab => {
              const Icon = tab.icon
              const active = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all -mb-[2px]"
                  style={{
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
                    background: 'transparent',
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge !== null && (
                    <span className="text-xs font-black px-1.5 py-0.5 rounded-full" style={{ background: '#fef3c7', color: '#d97706' }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* ── Tab: TODOS ── */}
          {activeTab === 'todos' && (
            <div className="space-y-4">
              {/* Search + Filters */}
              <div className="flex gap-2.5 flex-wrap">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    className="form-input pl-9"
                    style={{ height: '38px', fontSize: '13px' }}
                    placeholder="Buscar por nome, ID Unico, empresa..."
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
                    color: activeFiltersCount > 0 ? 'var(--primary)' : 'var(--text-secondary)',
                    background: activeFiltersCount > 0 ? 'var(--primary-muted)' : 'white',
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
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-all"
                    style={{ color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5' }}
                  >
                    <X className="w-3.5 h-3.5" /> Limpar
                  </button>
                )}
              </div>

              {/* Filter Panel */}
              {filtersOpen && (
                <div className="rounded-2xl p-5 animate-fade-in space-y-5" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                  {/* Date range */}
                  <div>
                    <p className="form-label">Período</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {DATE_FIELD_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setDateField(opt.value)}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
                          style={{
                            border: '1.5px solid',
                            borderColor: dateField === opt.value ? 'var(--primary)' : 'var(--border-color)',
                            background: dateField === opt.value ? 'var(--primary-muted)' : '#f8fafc',
                            color: dateField === opt.value ? 'var(--primary)' : 'var(--text-secondary)',
                          }}
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
                          className="text-xs px-3 py-1 rounded-lg font-semibold transition-all"
                          style={{
                            border: '1.5px solid',
                            borderColor: activePreset === p.key ? 'var(--primary)' : 'var(--border-color)',
                            background: activePreset === p.key ? 'var(--primary-muted)' : '#f8fafc',
                            color: activePreset === p.key ? 'var(--primary)' : 'var(--text-secondary)',
                          }}
                        >
                          {p.label}
                        </button>
                      ))}
                      {(dateFrom || dateTo) && (
                        <button onClick={clearDates} className="text-xs px-3 py-1 rounded-lg font-semibold" style={{ color: '#dc2626', background: '#fee2e2', border: '1px solid #fca5a5' }}>
                          <X className="w-3 h-3 inline" /> Limpar datas
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <div>
                        <label className="form-label">De</label>
                        <input type="date" className="form-input" style={{ fontSize: '13px' }} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset('') }} />
                      </div>
                      <div>
                        <label className="form-label">Até</label>
                        <input type="date" className="form-input" style={{ fontSize: '13px' }} value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset('') }} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t" style={{ borderColor: 'var(--border-color)' }} />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <p className="form-label">Status</p>
                      <div className="flex flex-wrap gap-2">
                        {STATUS_OPTIONS.map(s => {
                          const badge = STATUS_BADGE[s]
                          const isActive = status === s
                          return (
                            <button
                              key={s}
                              onClick={() => setStatus(s)}
                              className="text-xs px-3 py-1.5 rounded-full font-bold transition-all"
                              style={{
                                background: isActive && badge ? badge.bg : isActive ? 'var(--primary-muted)' : '#f1f3f6',
                                color: isActive && badge ? badge.color : isActive ? 'var(--primary)' : 'var(--text-muted)',
                                border: `1.5px solid ${isActive && badge ? badge.color + '44' : isActive ? 'var(--primary)' : 'transparent'}`,
                              }}
                            >
                              {s === 'TODOS' ? 'Todos' : STATUS_LABELS[s]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div>
                      <p className="form-label">Prioridade</p>
                      <div className="flex flex-wrap gap-2">
                        {PRIORIDADE_OPTIONS.map(p => {
                          const isActive = prioridade === p
                          const colors: Record<string, { bg: string; color: string }> = {
                            ALTA: { bg: '#fee2e2', color: '#dc2626' },
                            MEDIA: { bg: '#fef3c7', color: '#d97706' },
                            BAIXA: { bg: '#cffafe', color: '#0891b2' },
                          }
                          const style = isActive && colors[p] ? colors[p] : { bg: isActive ? 'var(--primary-muted)' : '#f1f3f6', color: isActive ? 'var(--primary)' : 'var(--text-muted)' }
                          return (
                            <button
                              key={p}
                              onClick={() => setPrioridade(p)}
                              className="text-xs px-3 py-1.5 rounded-full font-bold transition-all"
                              style={{
                                background: style.bg,
                                color: style.color,
                                border: `1.5px solid ${isActive ? style.color + '44' : 'transparent'}`,
                              }}
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
              <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                {/* Header */}
                <div className="hidden lg:grid grid-cols-[100px_1fr_130px_100px_130px_90px_60px] gap-3 crm-table-header">
                  {['ID Unico', 'Cliente / Empresa', 'Status', 'Prioridade', 'Site', 'Contato', ''].map((h, i) => (
                    <span key={i}>{h}</span>
                  ))}
                </div>

                {/* Rows */}
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {loading && clientes.length === 0 ? (
                    <div className="flex items-center justify-center h-48">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-8 h-8 rounded-full border-3 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary)' }} />
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Buscando lojistas...</p>
                      </div>
                    </div>
                  ) : clientes.length === 0 ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                      <div className="icon-box icon-box-primary mx-auto" style={{ width: 52, height: 52, borderRadius: 16 }}>
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-heading)' }}>Nenhum cliente encontrado</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ajuste os filtros ou cadastre o primeiro cliente</p>
                    </div>
                  ) : (
                    clientes.map((cliente, i) => (
                      <div
                        key={cliente.id}
                        className="animate-fade-in px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors group cursor-default"
                        style={{ animationDelay: `${i * 12}ms` }}
                      >
                        {/* ID */}
                        <div className="w-[100px] flex-shrink-0">
                          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded" style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                            {cliente.unico_id || '—'}
                          </span>
                        </div>

                        {/* Nome */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-heading)' }}>{cliente.nome}</p>
                          {cliente.empresa && <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{cliente.empresa}</p>}
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0">
                          {(() => {
                            const badge = STATUS_BADGE[cliente.status] || { bg: '#f1f3f6', color: '#6b7280', label: cliente.status }
                            return (
                              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                                {STATUS_LABELS[cliente.status]}
                              </span>
                            )
                          })()}
                        </div>

                        {/* Prioridade */}
                        <div className="flex-shrink-0 hidden md:block">
                          {(() => {
                            const colors: Record<string, { bg: string; color: string }> = {
                              ALTA: { bg: '#fee2e2', color: '#dc2626' },
                              MEDIA: { bg: '#fef3c7', color: '#d97706' },
                              BAIXA: { bg: '#cffafe', color: '#0891b2' },
                            }
                            const c = colors[cliente.prioridade] || { bg: '#f1f3f6', color: '#6b7280' }
                            return (
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>
                                {cliente.prioridade}
                              </span>
                            )
                          })()}
                        </div>

                        {/* Site */}
                        <div className="flex-shrink-0 hidden lg:block">
                          {(() => {
                            if (cliente.site_online === 'ONLINE') return <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#d1fae5', color: '#059669' }}>Online</span>
                            if (cliente.site_online === 'OFFLINE') return <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#fee2e2', color: '#dc2626' }}>Offline</span>
                            return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>
                          })()}
                        </div>

                        {/* Contato */}
                        <div className="text-xs hidden xl:block flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                          {cliente.contato ? cliente.contato.slice(0, 14) + (cliente.contato.length > 14 ? '…' : '') : '—'}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(cliente.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => { (e.target as HTMLElement).closest('button')!.style.background = 'var(--primary-muted)' }}
                            onMouseLeave={e => { (e.target as HTMLElement).closest('button')!.style.background = 'transparent' }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            className="p-1.5 rounded-lg transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                            onMouseEnter={e => { const btn = (e.target as HTMLElement).closest('button')!; btn.style.background = '#fee2e2'; btn.style.color = '#dc2626' }}
                            onMouseLeave={e => { const btn = (e.target as HTMLElement).closest('button')!; btn.style.background = 'transparent'; btn.style.color = 'var(--text-muted)' }}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab: SEM CONTATO ── */}
          {activeTab === 'sem_contato' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: '#fef3c7', border: '1px solid #fde68a' }}>
                <PhoneOff className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: '#92400e' }}>Lojistas sem contato telefônico válido</p>
                  <p className="text-xs mt-1" style={{ color: '#b45309' }}>Estes lojistas não possuem telefone informado ou o número foi marcado como incorreto.</p>
                </div>
              </div>

              {loadingSemContato ? (
                <div className="flex items-center justify-center h-48 rounded-2xl" style={{ background: 'white', border: '1px solid var(--border-color)' }}>
                  <div className="w-8 h-8 rounded-full border-3 animate-spin" style={{ borderColor: 'var(--border-color)', borderTopColor: 'var(--primary)' }} />
                </div>
              ) : semContato.length === 0 ? (
                <div className="py-12 rounded-2xl flex flex-col items-center gap-2" style={{ background: 'white', border: '1px solid var(--border-color)' }}>
                  <p className="font-bold text-sm" style={{ color: '#059669' }}>Nenhum problema de contato detectado! ✓</p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-card)' }}>
                  <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                    {semContato.map((cliente) => (
                      <div key={cliente.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: '#f59e0b' }}>
                          {cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate" style={{ color: 'var(--text-heading)' }}>{cliente.nome}</p>
                          <p className="text-xs truncate mt-0.5" style={{ color: '#d97706' }}>{getContactReason(cliente)}</p>
                        </div>
                        <button
                          onClick={() => handleEdit(cliente.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          style={{ background: 'var(--primary-muted)', color: 'var(--primary)', border: '1px solid rgba(102,16,242,0.2)' }}
                        >
                          <Edit2 className="w-3 h-3" /> Editar
                        </button>
                      </div>
                    ))}
                  </div>
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
