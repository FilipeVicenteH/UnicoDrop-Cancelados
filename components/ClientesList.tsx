'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Plus, RefreshCw, X } from 'lucide-react'
import ClienteCard from './ClienteCard'
import { Cliente } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

interface ClientesListProps {
  onAdd: () => void
  onEdit: (id: number) => void
  refreshKey: number
}

const STATUS_OPTIONS = ['TODOS', 'PENDENTE', 'EM_NEGOCIACAO', 'CONVERTIDO', 'NAO_CONVERTIDO']
const PRIORIDADE_OPTIONS = ['TODOS', 'ALTA', 'MEDIA', 'BAIXA']
const USAVA_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'plugin', label: 'Plugin' },
  { value: 'whatsapp', label: 'WhatsApp' },
]

export default function ClientesList({ onAdd, onEdit, refreshKey }: ClientesListProps) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('TODOS')
  const [prioridade, setPrioridade] = useState('TODOS')
  const [usava, setUsava] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (status !== 'TODOS') params.set('status', status)
      if (prioridade !== 'TODOS') params.set('prioridade', prioridade)
      if (usava) params.set('usava', usava)
      params.set('page', String(page))
      params.set('limit', '20')

      const res = await fetch(`/api/clientes?${params}`)
      const data = await res.json()
      setClientes(data.clientes || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch {
      toast.error('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [search, status, prioridade, usava, page])

  useEffect(() => {
    setPage(1)
  }, [search, status, prioridade, usava])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes, refreshKey])

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este cliente?')) return
    try {
      await fetch(`/api/clientes/${id}`, { method: 'DELETE' })
      toast.success('Cliente removido')
      fetchClientes()
    } catch {
      toast.error('Erro ao remover cliente')
    }
  }

  const hasActiveFilters = status !== 'TODOS' || prioridade !== 'TODOS' || usava !== ''

  const clearFilters = () => {
    setStatus('TODOS')
    setPrioridade('TODOS')
    setUsava('')
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all"
            placeholder="Buscar por nome, ID Unico, empresa..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300" />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            hasActiveFilters
              ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
              : 'border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filtros
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-purple-400" />
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={fetchClientes}
          className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-400 hover:text-gray-200 hover:border-white/20 transition-all"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Add Button */}
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white/3 border border-white/8 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filtros Ativos</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Status</label>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      status === s
                        ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                        : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {s === 'TODOS' ? 'Todos' : STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Prioridade Filter */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Prioridade</label>
              <div className="flex flex-wrap gap-1.5">
                {PRIORIDADE_OPTIONS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPrioridade(p)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      prioridade === p
                        ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                        : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {p === 'TODOS' ? 'Todas' : p.charAt(0) + p.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Usava na UD Filter */}
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Usava na UD</label>
              <div className="flex flex-wrap gap-1.5">
                {USAVA_OPTIONS.map(u => (
                  <button
                    key={u.value}
                    onClick={() => setUsava(u.value)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                      usava === u.value
                        ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                        : 'border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="w-1 flex-shrink-0" />
        <div className="w-24 flex-shrink-0 text-xs text-gray-600 font-medium uppercase tracking-wider">ID Unico</div>
        <div className="flex-1 text-xs text-gray-600 font-medium uppercase tracking-wider">Cliente</div>
        <div className="w-28 text-xs text-gray-600 font-medium uppercase tracking-wider flex-shrink-0">Status</div>
        <div className="w-16 text-xs text-gray-600 font-medium uppercase tracking-wider flex-shrink-0 hidden md:block">Prior.</div>
        <div className="w-20 text-xs text-gray-600 font-medium uppercase tracking-wider flex-shrink-0 hidden lg:block">Site</div>
        <div className="w-24 text-xs text-gray-600 font-medium uppercase tracking-wider flex-shrink-0 hidden lg:block">Usava</div>
        <div className="w-14 text-xs text-gray-600 font-medium uppercase tracking-wider flex-shrink-0 hidden xl:block">Contato</div>
        <div className="w-20 flex-shrink-0" />
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/3 border border-white/5 rounded-xl animate-pulse" />
          ))
        ) : clientes.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-400 font-medium">Nenhum cliente encontrado</p>
            <p className="text-gray-600 text-sm mt-1">Tente ajustar os filtros ou adicione um novo cliente</p>
            <button
              onClick={onAdd}
              className="mt-4 px-4 py-2 bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm rounded-lg hover:bg-purple-600/30 transition-all"
            >
              + Adicionar primeiro cliente
            </button>
          </div>
        ) : (
          clientes.map(cliente => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onEdit={onEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Footer: total + pagination */}
      {!loading && clientes.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-gray-600">
            Mostrando <span className="text-gray-400">{clientes.length}</span> de <span className="text-gray-400">{total}</span> clientes
          </p>
          {totalPages > 1 && (
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-xs border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-all"
              >
                ← Anterior
              </button>
              <span className="px-3 py-1 text-xs text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-xs border border-white/10 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 transition-all"
              >
                Próximo →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
