'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, MessageSquarePlus } from 'lucide-react'
import { FeedbackFormData, StatusFeedback, Prioridade } from '@/lib/types'
import { FEEDBACK_STATUS_LABELS } from '@/lib/constants'
import toast from 'react-hot-toast'

interface FeedbackFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  feedbackId?: number | null
  initialData?: Partial<FeedbackFormData>
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

export default function FeedbackForm({ isOpen, onClose, onSaved, feedbackId, initialData }: FeedbackFormProps) {
  const [form, setForm] = useState<FeedbackFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadFeedback = useCallback(async () => {
    if (!feedbackId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/feedbacks?id=${feedbackId}`)
      const feedbacks = await res.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const feedback = Array.isArray(feedbacks) ? feedbacks.find((f: any) => f.id === feedbackId) : null
      if (feedback) {
        setForm({
          unico_id: feedback.unico_id || '',
          cliente: feedback.cliente || '',
          tipo_cliente: feedback.tipo_cliente || 'ATIVO',
          funcionalidade: feedback.funcionalidade || '',
          descricao: feedback.descricao || '',
          status: feedback.status || 'PENDENTE',
          prioridade: feedback.prioridade || 'MEDIA',
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
      } else if (initialData) {
        setForm({ ...defaultForm, ...initialData })
      } else {
        setForm(defaultForm)
      }
    }
  }, [isOpen, feedbackId, initialData, loadFeedback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const clienteVal = form.cliente.trim()
    const funcVal = form.funcionalidade.trim()
    const descVal = form.descricao.trim()

    if (!clienteVal) { toast.error('Informe o nome do cliente'); return }
    if (!funcVal) { toast.error('Informe a funcionalidade / assunto'); return }
    if (!descVal) { toast.error('Informe a descrição do feedback'); return }

    setSaving(true)
    try {
      const method = feedbackId ? 'PUT' : 'POST'
      const url = feedbackId ? `/api/feedbacks/${feedbackId}` : '/api/feedbacks'

      const payload = {
        unico_id: form.unico_id || null,
        cliente: clienteVal,
        tipo_cliente: form.tipo_cliente,
        funcionalidade: funcVal,
        descricao: descVal,
        status: form.status,
        prioridade: form.prioridade,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Erro na requisição')
      }

      toast.success(feedbackId ? 'Feedback atualizado!' : 'Feedback adicionado com sucesso!')
      onSaved()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#0c0c0e] border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ animation: 'fadeIn 0.2s ease-out' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-800 rounded-md border border-zinc-700/60 text-zinc-300">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-semibold text-zinc-100">
              {feedbackId ? 'Editar Feedback' : 'Novo Feedback de Melhoria'}
            </h2>
          </div>
          <button
            onClick={onClose}
            title="Fechar"
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-40 gap-3">
              <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
              <p className="text-xs font-mono text-zinc-500">Carregando...</p>
            </div>
          ) : (
            <form id="feedback-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Cliente */}
                <div>
                  <label className="form-label">Nome do Cliente <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="Ex: Loja do João"
                    value={form.cliente}
                    onChange={e => setForm(prev => ({ ...prev, cliente: e.target.value }))}
                  />
                </div>

                {/* ID Unico */}
                <div>
                  <label className="form-label">ID na UnicoDrop</label>
                  <input
                    type="text"
                    className="form-input text-xs font-mono"
                    placeholder="Ex: UD-12345"
                    value={form.unico_id || ''}
                    onChange={e => setForm(prev => ({ ...prev, unico_id: e.target.value }))}
                  />
                </div>

                {/* Tipo Cliente */}
                <div>
                  <label className="form-label">Tipo de Cliente</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, tipo_cliente: 'ATIVO' }))}
                      className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md border transition-all ${
                        form.tipo_cliente === 'ATIVO'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Ativo
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, tipo_cliente: 'CANCELADO' }))}
                      className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md border transition-all ${
                        form.tipo_cliente === 'CANCELADO'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
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
                    className="form-input text-xs font-mono"
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value as StatusFeedback }))}
                  >
                    {Object.entries(FEEDBACK_STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val} className="bg-[#121316]">{label}</option>
                    ))}
                  </select>
                </div>

                {/* Prioridade */}
                <div className="md:col-span-2">
                  <label className="form-label">Prioridade</label>
                  <div className="flex gap-2">
                    {([['ALTA', 'Alta', 'bg-rose-500/10 border-rose-500/30 text-rose-400'],
                       ['MEDIA', 'Média', 'bg-amber-500/10 border-amber-500/30 text-amber-400'],
                       ['BAIXA', 'Baixa', 'bg-sky-500/10 border-sky-500/30 text-sky-400']] as const).map(([val, label, activeClass]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, prioridade: val as Prioridade }))}
                        className={`flex-1 py-1.5 text-xs font-mono font-medium rounded-md border transition-all ${
                          form.prioridade === val
                            ? activeClass
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Funcionalidade */}
                <div className="md:col-span-2">
                  <label className="form-label">Funcionalidade / Assunto <span className="text-rose-400">*</span></label>
                  <input
                    type="text"
                    className="form-input text-xs"
                    placeholder="Ex: Integração com Yampi, Dashboard mais rápida..."
                    value={form.funcionalidade}
                    onChange={e => setForm(prev => ({ ...prev, funcionalidade: e.target.value }))}
                  />
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="form-label">Descrição do Feedback <span className="text-rose-400">*</span></label>
                  <textarea
                    className="form-input text-xs min-h-[100px] resize-y"
                    placeholder="Descreva o que o cliente sentiu falta ou o que não funcionou corretamente..."
                    value={form.descricao}
                    onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
                  />
                </div>

              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="feedback-form"
            disabled={saving || loading}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-white rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {feedbackId ? 'Salvar Alterações' : 'Adicionar Feedback'}
          </button>
        </div>

      </div>
    </div>
  )
}
