'use client'

import { useState, useEffect, useCallback } from 'react'
import ClienteCard from '@/components/ClienteCard'
import ClienteForm from '@/components/ClienteForm'
import { Cliente } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/constants'
import {
  Plus, Search, Filter, Users, RefreshCw, ChevronDown,
  LayoutDashboard, Puzzle, MessageCircle, X
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

export default function ClientesPage() {
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

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status !== 'TODOS') params.set('status', status)
      if (prioridade !== 'TODOS') params.set('prioridade', prioridade)
      if (usava) params.set('usava', usava)
      params.set('limit', '100')

      const res = await fetch(`/api/clientes?${params.toString()}`)
      const data = await res.json()
      setClientes(data.clientes || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [search, status, prioridade, usava])

  useEffect(() => {
    const timer = setTimeout(fetchClientes, 300)
    return () => clearTimeout(timer)
  }, [fetchClientes])

  const handleEdit = (id: number) => {
    setEditId(id)
    setFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja remover este cliente? Esta ação não pode ser desfeita.')) return
    try {
      await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      toast.success('Cliente removido')
      fetchClientes()
    } catch {
      toast.error('Erro ao remover cliente')
    }
  }

  const handleCloseForm = () => {
    setFormOpen(false)
    setEditId(null)
  }

  const activeFiltersCount = [
    status !== 'TODOS',
    prioridade !== 'TODOS',
    usava !== '',
  ].filter(Boolean).length

  const clearFilters = () => {
    setStatus('TODOS')
    setPrioridade('TODOS')
    setUsava('')
    setSearch('')
  }

  return (
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
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchClientes}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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

      {/* Search + Filters Bar */}
      <div className="flex gap-3 mb-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
          <input
            className="form-input pl-10 h-10"
            placeholder="Buscar por nome, ID Unico, empresa..."
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

        {/* Filter Toggle */}
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
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg bg-red-500/5 hover:bg-red-500/10 transition-all"
          >
            <X className="w-3.5 h-3.5" />
            Limpar
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {filtersOpen && (
        <div className="glass-card p-4 mb-4 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    {s === 'TODOS' ? 'Todos' : STATUS_LABELS[s]}
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

            {/* Usava na UD */}
            <div>
              <label className="form-label">Usava na UnicoDrop</label>
              <div className="flex flex-wrap gap-1.5">
                {USAVA_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setUsava(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                      usava === opt.value
                        ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                        : 'border-white/10 bg-white/5 text-gray-500 hover:text-gray-300 hover:border-white/20'
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

      {/* Table Header */}
      <div className="hidden lg:grid grid-cols-[80px_1fr_140px_100px_120px_100px_80px_40px] gap-3 px-4 py-2 mb-1">
        {['ID Unico', 'Cliente', 'Status', 'Prioridade', 'Site', 'UD', 'Contato', ''].map(h => (
          <p key={h} className="text-[11px] font-medium text-gray-600 uppercase tracking-wider">{h}</p>
        ))}
      </div>

      {/* Clients List */}
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
            <p className="text-gray-600 text-sm">
              {activeFiltersCount > 0 || search ? 'Tente ajustar os filtros' : 'Adicione o primeiro cliente cancelado'}
            </p>
            {!activeFiltersCount && !search && (
              <button
                onClick={() => setFormOpen(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" /> Adicionar Cliente
              </button>
            )}
          </div>
        ) : (
          clientes.map((cliente, i) => (
            <div
              key={cliente.id}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 20}ms` }}
            >
              <ClienteCard
                cliente={cliente}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <ClienteForm
        isOpen={formOpen}
        onClose={handleCloseForm}
        onSaved={fetchClientes}
        clienteId={editId}
      />
    </div>
  )
}
