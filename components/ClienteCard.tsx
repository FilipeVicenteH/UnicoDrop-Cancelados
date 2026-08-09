'use client'

import { Cliente } from '@/lib/types'
import { STATUS_LABELS } from '@/lib/constants'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Edit2, Trash2, Globe, CheckCircle2, XCircle, AlertCircle,
  ChevronDown, ChevronUp, ExternalLink, LayoutDashboard, Puzzle, MessageCircle, Radio
} from 'lucide-react'
import { useState } from 'react'

const UNICO_PLUGINS = ['UnicoDrop Novo', 'UnicoDrop Antigo']

interface ClienteCardProps {
  cliente: Cliente
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}

export default function ClienteCard({ cliente, onEdit, onDelete }: ClienteCardProps) {
  const [expanded, setExpanded] = useState(false)

  const STATUS_BADGE: Record<string, { bg: string; color: string; border: string }> = {
    CONVERTIDO: { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    EM_NEGOCIACAO: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    PENDENTE: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
    NAO_CONVERTIDO: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  }
  const PRIORIDADE_BADGE: Record<string, { bg: string; color: string; border: string }> = {
    ALTA: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    MEDIA: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    BAIXA: { bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' },
  }
  const statusBadge = STATUS_BADGE[cliente.status] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
  const prioridadeBadge = PRIORIDADE_BADGE[cliente.prioridade] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }

  const siteIcon = () => {
    if (cliente.site_online === 'ONLINE') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
    if (cliente.site_online === 'OFFLINE') return <XCircle className="w-3.5 h-3.5 text-rose-600" />
    return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
  }

  return (
    <div
      className="group transition-all duration-150 overflow-hidden bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300"
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 px-4 py-3 text-xs">
        {/* ID Unico */}
        <div className="w-24 flex-shrink-0">
          <span className="font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
            {cliente.unico_id || '—'}
          </span>
        </div>

        {/* Nome e Empresa */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900 truncate">{cliente.nome}</p>
            {cliente.telefone_atualizado && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                Tel. ✓
              </span>
            )}
          </div>
          {cliente.empresa && (
            <p className="text-[11px] text-slate-500 truncate mt-0.5">{cliente.empresa}</p>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          <span
            className="font-semibold px-2.5 py-0.5 rounded border text-[11px]"
            style={{ background: statusBadge.bg, color: statusBadge.color, borderColor: statusBadge.border }}
          >
            {STATUS_LABELS[cliente.status]}
          </span>
        </div>

        {/* Prioridade */}
        <div className="flex-shrink-0 hidden md:block">
          <span
            className="font-semibold px-2 py-0.5 rounded border text-[11px]"
            style={{ background: prioridadeBadge.bg, color: prioridadeBadge.color, borderColor: prioridadeBadge.border }}
          >
            {cliente.prioridade}
          </span>
        </div>

        {/* Site Status */}
        <div className="flex items-center gap-1.5 flex-shrink-0 hidden lg:flex">
          {siteIcon()}
          <span className="text-slate-500 font-mono">
            {cliente.site_online === 'ONLINE' ? 'Online' : cliente.site_online === 'OFFLINE' ? 'Offline' : '—'}
          </span>
        </div>

        {/* UnicoDrop Plugin Badge */}
        <div className="flex-shrink-0 hidden lg:block">
          {(() => {
            const plugins = cliente.plugins_rastreio || []
            const unicoPlugin = plugins.find(p => UNICO_PLUGINS.includes(p))
            if (unicoPlugin) {
              const isNovo = unicoPlugin === 'UnicoDrop Novo'
              return (
                <span
                  title={unicoPlugin}
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    isNovo
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Radio className="w-2.5 h-2.5" />
                  {isNovo ? 'UD Novo' : 'UD Antigo'}
                </span>
              )
            }
            return <span className="text-[10px] text-slate-400">Sem plugin</span>
          })()}
        </div>

        {/* UD Tools */}
        <div className="flex gap-1 flex-shrink-0 hidden lg:flex">
          <span title="Dashboard" className={`p-1 rounded ${cliente.usava_dashboard ? 'text-slate-900 bg-slate-100' : 'text-slate-300'}`}>
            <LayoutDashboard className="w-3.5 h-3.5" />
          </span>
          <span title="Plugin" className={`p-1 rounded ${cliente.usava_plugin ? 'text-slate-900 bg-slate-100' : 'text-slate-300'}`}>
            <Puzzle className="w-3.5 h-3.5" />
          </span>
          <span title="WhatsApp" className={`p-1 rounded ${cliente.usava_whatsapp ? 'text-emerald-700 bg-emerald-50' : 'text-slate-300'}`}>
            <MessageCircle className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Date */}
        <div className="text-slate-400 flex-shrink-0 hidden xl:block">
          {cliente.data_contato ? format(new Date(cliente.data_contato), 'dd/MM/yy', { locale: ptBR }) : '—'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(cliente.id)}
            title="Editar"
            className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(cliente.id)}
            title="Excluir"
            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Recolher' : 'Ver detalhes'}
          className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-200 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50">
          {/* Left Column */}
          <div className="space-y-3">
            {cliente.contato && (
              <div>
                <p className="form-label mb-0.5">Contato</p>
                <p className="text-xs text-slate-800 font-mono font-medium">{cliente.contato}</p>
              </div>
            )}

            {cliente.site_url && (
              <div>
                <p className="form-label mb-0.5 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Site URL
                </p>
                <a
                  href={cliente.site_url.startsWith('http') ? cliente.site_url : `https://${cliente.site_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-blue-600 hover:underline flex items-center gap-1"
                >
                  {cliente.site_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {cliente.plugins_rastreio?.length > 0 && (
              <div>
                <p className="form-label mb-1">Plugins de Rastreio</p>
                <div className="flex flex-wrap gap-1">
                  {cliente.plugins_rastreio.map(p => (
                    <span
                      key={p}
                      className="text-xs font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(cliente.checkout || cliente.checkout_outro) && (
              <div>
                <p className="form-label mb-1">Checkout</p>
                <span className="text-xs font-semibold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {cliente.checkout === 'Outro' ? cliente.checkout_outro : cliente.checkout}
                </span>
              </div>
            )}

            {(cliente.plataforma_loja || cliente.plataforma_loja_outro) && (
              <div>
                <p className="form-label mb-1">Plataforma de Loja</p>
                <span className="text-xs font-semibold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {cliente.plataforma_loja === 'Outro' ? cliente.plataforma_loja_outro : cliente.plataforma_loja}
                </span>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {cliente.motivo_cancelamento && (
              <div>
                <p className="form-label mb-1">Motivo do Cancelamento</p>
                <p className="text-xs text-slate-700 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">{cliente.motivo_cancelamento}</p>
              </div>
            )}

            {cliente.feedback_completo && (
              <div>
                <p className="form-label mb-1">Feedback Completo</p>
                <p className="text-xs text-slate-600 bg-white p-2.5 rounded border border-slate-200 leading-relaxed">{cliente.feedback_completo}</p>
              </div>
            )}

            {cliente.nota_interna && (
              <div>
                <p className="form-label mb-1">Nota Interna</p>
                <p className="text-xs text-amber-800 italic bg-amber-50 p-2.5 rounded border border-amber-200 leading-relaxed">{cliente.nota_interna}</p>
              </div>
            )}

            {cliente.responsavel && (
              <div>
                <p className="form-label mb-0.5">Responsável</p>
                <p className="text-xs text-slate-800 font-medium">{cliente.responsavel}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
