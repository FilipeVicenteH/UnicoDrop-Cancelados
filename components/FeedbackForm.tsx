'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2 } from 'lucide-react'
import { FeedbackFormData, StatusFeedback, Prioridade, TipoClienteFeedback } from '@/lib/types'
import { FEEDBACK_STATUS_LABELS, PRIORIDADE_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

interface FeedbackFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  feedbackId?: number | null
}

const defaultForm: FeedbackFormData = {
  unico_id: '',
  cliente: '',
  tipo_cliente: 'ATIVO',
  funcionalidade: '',
  descricao: '',
  status: 'PENDENTE',
  prioridade: 'MEDIA',
}

export default function FeedbackForm({ isOpen, onClose, onSaved, feedbackId }: FeedbackFormProps) {
  const [form, setForm] = useState<FeedbackFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadFeedback = useCallback(async () => {
    if (!feedbackId) return
    setLoading(true)
    try {
      // Reusing GET all and finding the right one, or we can fetch directly if we had a single GET.
      // Since we don't have a GET /api/feedbacks/[id] specific route yet, we can pass it from parent,
      // or implement the fetch from a list. Let's do a fetch all and filter for now to keep it simple,
      // or assume we pass the data. Since we have a PUT /api/feedbacks/[id], let's do a GET from the list API.
      const res = await fetch(`/api/feedbacks`)
      const feedbacks = await res.json()
      const feedback = feedbacks.find((f: any) => f.id === feedbackId)
      if (feedback) {
        setForm({
          unico_id: feedback.unico_id || '',
          cliente: feedback.cliente,
          tipo_cliente: feedback.tipo_cliente,
          funcionalidade: feedback.funcionalidade,
          descricao: feedback.descricao,
          status: feedback.status,
          prioridade: feedback.prioridade,
        })
      }
    } catch {
      toast.error('Erro ao carregar feedback')
    } finally {
      setLoading(false)
    }
  }, [feedbackId])

  useEffect(() => {
    if (isOpen) {
      if (feedbackId) {
        loadFeedback()
      } else {
        setForm(defaultForm)
      }
    }
  }, [isOpen, feedbackId, loadFeedback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cliente.trim() || !form.funcionalidade.trim() || !form.descricao.trim()) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const method = feedbackId ? 'PUT' : 'POST'
      const url = feedbackId ? `/api/feedbacks/${feedbackId}` : '/api/feedbacks'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Erro na requisição')

      toast.success(feedbackId ? 'Feedback atualizado!' : 'Feedback adicionado!')
      onSaved()
      onClose()
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#0f0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-semibold text-white">
            {feedbackId ? 'Editar Feedback' : 'Novo Feedback de Melhoria'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            </div>
          ) : (
            <form id="feedback-form" onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Cliente */}
                <div className="md:col-span-1">
                  <label className="form-label">Nome do Cliente *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Loja do João"
                    value={form.cliente}
                    onChange={e => setForm({ ...form, cliente: e.target.value })}
                    required
                  />
                </div>

                {/* ID Unico */}
                <div className="md:col-span-1">
                  <label className="form-label">ID na UnicoDrop</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: UD-12345 (Opcional)"
                    value={form.unico_id || ''}
                    onChange={e => setForm({ ...form, unico_id: e.target.value })}
                  />
                </div>

                {/* Tipo Cliente */}
                <div>
                  <label className="form-label">Tipo de Cliente</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, tipo_cliente: 'ATIVO' })}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                        form.tipo_cliente === 'ATIVO'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      Ativo
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, tipo_cliente: 'CANCELADO' })}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${
                        form.tipo_cliente === 'CANCELADO'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      Cancelado
                    </button>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-input"
                    value={form.status}
                    onChange={e => setForm({ ...form, status: e.target.value as StatusFeedback })}
                  >
                    {Object.entries(FEEDBACK_STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val} className="bg-[#0f0f17]">{label}</option>
                    ))}
                  </select>
                </div>

                {/* Prioridade */}
                <div className="md:col-span-2">
                  <label className="form-label">Prioridade</label>
                  <div className="flex gap-2">
                    {Object.entries(PRIORIDADE_LABELS).map(([val, label]) => {
                      const isSelected = form.prioridade === val
                      let colorClass = 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      
                      if (isSelected) {
                        if (val === 'ALTA') colorClass = 'bg-red-500/20 border-red-500/50 text-red-400'
                        if (val === 'MEDIA') colorClass = 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                        if (val === 'BAIXA') colorClass = 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                      }

                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setForm({ ...form, prioridade: val as Prioridade })}
                          className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-all ${colorClass}`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Funcionalidade */}
                <div className="md:col-span-2">
                  <label className="form-label">Funcionalidade / Assunto *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Integração com Yampi, Dashboard mais rápida..."
                    value={form.funcionalidade}
                    onChange={e => setForm({ ...form, funcionalidade: e.target.value })}
                    required
                  />
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="form-label">Descrição do Feedback *</label>
                  <textarea
                    className="form-input min-h-[120px] resize-y"
                    placeholder="Descreva o que o cliente sentiu falta ou o que não funcionou corretamente..."
                    value={form.descricao}
                    onChange={e => setForm({ ...form, descricao: e.target.value })}
                    required
                  />
                </div>

              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="feedback-form"
            disabled={saving || loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-lg transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {feedbackId ? 'Salvar Alterações' : 'Adicionar Feedback'}
          </button>
        </div>

      </div>
    </div>
  )
}
