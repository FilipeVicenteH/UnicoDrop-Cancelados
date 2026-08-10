'use client'

import { useState } from 'react'
import { AlertOctagon, X, Send, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface BugReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BugReportModal({ isOpen, onClose }: BugReportModalProps) {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [modulo, setModulo] = useState('Dashboard')
  const [severidade, setSeveridade] = useState<'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA'>('MEDIA')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim() || !descricao.trim()) {
      toast.error('Preencha o título e a descrição do bug')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/bugs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          descricao,
          modulo,
          severidade,
          url_pagina: typeof window !== 'undefined' ? window.location.href : '',
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      })

      if (!res.ok) throw new Error('Erro ao enviar relato')

      toast.success('Bug reportado com sucesso! Obrigado pela contribuição.')
      setTitulo('')
      setDescricao('')
      onClose()
    } catch (error) {
      console.error(error)
      toast.error('Erro ao registrar o bug. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Reportar um Bug ou Falha
              </h3>
              <p className="text-xs text-slate-500">Ajude-nos a manter o UnicoCRM livre de erros</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Título do Erro / Problema *</label>
            <input
              type="text"
              placeholder="Ex: Gráfico de checkouts não carrega ao filtrar por data"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Módulo Afetado</label>
              <select
                value={modulo}
                onChange={(e) => setModulo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 transition-colors bg-white"
              >
                <option value="Dashboard">Dashboard Principal</option>
                <option value="Clientes">Lista de Clientes</option>
                <option value="Relatorios">Relatórios & Gráficos</option>
                <option value="Feedbacks">Feedbacks</option>
                <option value="Geral">Geral / Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Severidade</label>
              <select
                value={severidade}
                onChange={(e) => setSeveridade(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 transition-colors bg-white font-semibold"
              >
                <option value="BAIXA">🟢 Baixa (Cosmético)</option>
                <option value="MEDIA">🟡 Média (Inconveniência)</option>
                <option value="ALTA">🟠 Alta (Função quebrada)</option>
                <option value="CRITICA">🔴 Crítica (Sistema fora)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descrição Detalhada & Passos para Reproduzir *</label>
            <textarea
              rows={4}
              placeholder="Descreva o que aconteceu, o que era esperado e como reproduzir o erro..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600 transition-colors resize-none"
              required
            />
          </div>

          {/* Form Action Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Enviando...' : 'Enviar Relato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
