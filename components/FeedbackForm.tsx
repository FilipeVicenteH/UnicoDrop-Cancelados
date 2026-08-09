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
  unico_id: '', cliente: '', tipo_cliente: 'ATIVO',
  funcionalidade: '', descricao: '', status: 'PENDENTE', prioridade: 'MEDIA',
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
      if (feedback) setForm({ unico_id: feedback.unico_id || '', cliente: feedback.cliente || '', tipo_cliente: feedback.tipo_cliente || 'ATIVO', funcionalidade: feedback.funcionalidade || '', descricao: feedback.descricao || '', status: feedback.status || 'PENDENTE', prioridade: feedback.prioridade || 'MEDIA' })
    } catch { toast.error('Erro ao carregar feedback') }
    finally { setLoading(false) }
  }, [feedbackId])

  useEffect(() => {
    if (isOpen) {
      if (feedbackId) loadFeedback()
      else if (initialData) setForm({ ...defaultForm, ...initialData })
      else setForm(defaultForm)
    }
  }, [isOpen, feedbackId, initialData, loadFeedback])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.cliente.trim()) { toast.error('Informe o nome do cliente'); return }
    if (!form.funcionalidade.trim()) { toast.error('Informe a funcionalidade'); return }
    if (!form.descricao.trim()) { toast.error('Informe a descrição'); return }

    setSaving(true)
    try {
      const method = feedbackId ? 'PUT' : 'POST'
      const url = feedbackId ? `/api/feedbacks/${feedbackId}` : '/api/feedbacks'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ unico_id: form.unico_id || null, cliente: form.cliente.trim(), tipo_cliente: form.tipo_cliente, funcionalidade: form.funcionalidade.trim(), descricao: form.descricao.trim(), status: form.status, prioridade: form.prioridade }) })
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err?.error || 'Erro na requisição') }
      toast.success(feedbackId ? 'Feedback atualizado!' : 'Feedback adicionado!')
      onSaved(); onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
    } finally { setSaving(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 modal-overlay">
      <div className="relative w-full max-w-2xl flex flex-col max-h-[90vh] modal-container overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-2.5">
            <div className="icon-box icon-box-primary" style={{ width: 36, height: 36, borderRadius: 10 }}>
              <MessageSquarePlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ fontFamily: "'Poppins', sans-serif", color: 'var(--text-heading)' }}>
                {feedbackId ? 'Editar Feedback' : 'Novo Feedback de Melhoria'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Registre sugestões e feedbacks de clientes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Loader2 className="w-7 h-7 animate-spin" style={{ color: 'var(--primary)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Carregando...</p>
            </div>
          ) : (
            <form id="feedback-form" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nome do Cliente <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="form-input" placeholder="Ex: Loja do João" value={form.cliente} onChange={e => setForm(p => ({ ...p, cliente: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">ID UnicoDrop</label>
                  <input className="form-input" placeholder="Ex: UC-12345" value={form.unico_id || ''} onChange={e => setForm(p => ({ ...p, unico_id: e.target.value }))} />
                </div>

                <div>
                  <label className="form-label">Tipo de Cliente</label>
                  <div className="flex gap-2">
                    {(['ATIVO', 'CANCELADO'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, tipo_cliente: t }))}
                        className="flex-1 py-2 text-sm font-semibold rounded-xl border-2 transition-all"
                        style={{
                          borderColor: form.tipo_cliente === t ? (t === 'ATIVO' ? '#1eab5a' : '#ef4444') : 'var(--border-color)',
                          background: form.tipo_cliente === t ? (t === 'ATIVO' ? '#d1fae5' : '#fee2e2') : '#f8fafc',
                          color: form.tipo_cliente === t ? (t === 'ATIVO' ? '#059669' : '#dc2626') : 'var(--text-muted)',
                        }}
                      >
                        {t === 'ATIVO' ? 'Cliente Ativo' : 'Cancelado'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">Status</label>
                  <select className="form-input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as StatusFeedback }))}>
                    {Object.entries(FEEDBACK_STATUS_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Prioridade</label>
                  <div className="flex gap-2">
                    {([['ALTA', 'Alta', '#dc2626', '#fee2e2'], ['MEDIA', 'Média', '#d97706', '#fef3c7'], ['BAIXA', 'Baixa', '#0891b2', '#cffafe']] as const).map(([val, label, color, bg]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, prioridade: val as Prioridade }))}
                        className="flex-1 py-2 text-sm font-bold rounded-xl border-2 transition-all"
                        style={{
                          borderColor: form.prioridade === val ? color : 'var(--border-color)',
                          background: form.prioridade === val ? bg : '#f8fafc',
                          color: form.prioridade === val ? color : 'var(--text-muted)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Funcionalidade / Assunto <span style={{ color: '#ef4444' }}>*</span></label>
                  <input className="form-input" placeholder="Ex: Integração com Yampi, Dashboard mais rápida..." value={form.funcionalidade} onChange={e => setForm(p => ({ ...p, funcionalidade: e.target.value }))} />
                </div>

                <div className="md:col-span-2">
                  <label className="form-label">Descrição do Feedback <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea className="form-input" style={{ minHeight: '110px', resize: 'vertical' }} placeholder="Descreva o que o cliente sentiu falta ou o que não funcionou..." value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4" style={{ borderTop: '1px solid var(--border-color)', background: '#f8fafc' }}>
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl border transition-all"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'white' }}>
            Cancelar
          </button>
          <button type="submit" form="feedback-form" disabled={saving || loading} className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-xl btn-primary disabled:opacity-50">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {feedbackId ? 'Salvar Alterações' : 'Adicionar Feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
