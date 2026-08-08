'use client'

import { Cliente } from '@/lib/types'
import { STATUS_LABELS, PRIORIDADE_LABELS } from '@/lib/constants'
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

  const siteIcon = () => {
    if (cliente.site_online === 'ONLINE') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
    if (cliente.site_online === 'OFFLINE') return <XCircle className="w-3.5 h-3.5 text-rose-400" />
    return <AlertCircle className="w-3.5 h-3.5 text-zinc-500" />
  }

  const statusBadgeClass = {
    CONVERTIDO: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    EM_NEGOCIACAO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PENDENTE: 'bg-zinc-800 text-zinc-300 border-zinc-700',
    NAO_CONVERTIDO: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }[cliente.status] || 'bg-zinc-800 text-zinc-400 border-zinc-700'

  const prioridadeClass = {
    ALTA: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    MEDIA: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    BAIXA: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  }[cliente.prioridade] || 'text-zinc-400 bg-zinc-800 border-zinc-700'

  return (
    <div className={`group bg-[#121316] border rounded-xl transition-all duration-200 overflow-hidden ${
      expanded ? 'border-zinc-700' : 'border-zinc-800/80 hover:border-zinc-700/80'
    }`}>
      {/* Main Row */}
      <div className="flex items-center gap-3 px-4 py-3">

        {/* ID Unico */}
        <div className="w-24 flex-shrink-0">
          <span className="text-xs font-mono text-zinc-300 bg-zinc-800/70 px-2 py-0.5 rounded border border-zinc-700/50">
            {cliente.unico_id || '—'}
          </span>
        </div>

        {/* Nome e Empresa */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-zinc-100 truncate">{cliente.nome}</p>
            {cliente.telefone_atualizado && (
              <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex-shrink-0">
                Tel. Atualizado
              </span>
            )}
          </div>
          {cliente.empresa && (
            <p className="text-[11px] text-zinc-500 truncate mt-0.5">{cliente.empresa}</p>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          <span className={`text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border ${statusBadgeClass}`}>
            {STATUS_LABELS[cliente.status]}
          </span>
        </div>

        {/* Prioridade */}
        <div className="flex-shrink-0 hidden md:block">
          <span className={`text-xs font-mono font-medium px-2 py-0.5 rounded border ${prioridadeClass}`}>
            {PRIORIDADE_LABELS[cliente.prioridade]}
          </span>
        </div>

        {/* Site Status */}
        <div className="flex items-center gap-1.5 flex-shrink-0 hidden lg:flex">
          {siteIcon()}
          <span className="text-xs text-zinc-400 font-mono">
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
                  className={`inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${
                    isNovo
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                  }`}
                >
                  <Radio className="w-2.5 h-2.5" />
                  {isNovo ? 'UD Novo' : 'UD Antigo'}
                </span>
              )
            }
            return <span className="text-[10px] font-mono text-zinc-600">Sem plugin</span>
          })()}
        </div>

        {/* UD Tools */}
        <div className="flex gap-1 flex-shrink-0 hidden lg:flex">
          <span title="Dashboard" className={`p-1 rounded ${cliente.usava_dashboard ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-700'}`}>
            <LayoutDashboard className="w-3.5 h-3.5" />
          </span>
          <span title="Plugin" className={`p-1 rounded ${cliente.usava_plugin ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-700'}`}>
            <Puzzle className="w-3.5 h-3.5" />
          </span>
          <span title="WhatsApp" className={`p-1 rounded ${cliente.usava_whatsapp ? 'text-zinc-200 bg-zinc-800' : 'text-zinc-700'}`}>
            <MessageCircle className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Date */}
        <div className="text-xs font-mono text-zinc-500 flex-shrink-0 hidden xl:block">
          {cliente.data_contato
            ? format(new Date(cliente.data_contato), 'dd/MM/yy', { locale: ptBR })
            : '—'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(cliente.id)}
            title="Editar cliente"
            className="p-1 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(cliente.id)}
            title="Excluir cliente"
            className="p-1 rounded-md hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Recolher detalhes' : 'Ver detalhes'}
          className="p-1 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800/80 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950/40">
          {/* Left Column */}
          <div className="space-y-3">
            {cliente.contato && (
              <div>
                <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-0.5">Contato</p>
                <p className="text-xs font-mono text-zinc-300">{cliente.contato}</p>
              </div>
            )}

            {cliente.site_url && (
              <div>
                <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Site URL
                </p>
                <a
                  href={cliente.site_url.startsWith('http') ? cliente.site_url : `https://${cliente.site_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  {cliente.site_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {cliente.plugins_rastreio?.length > 0 && (
              <div>
                <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1">Plugins de Rastreio</p>
                <div className="flex flex-wrap gap-1.5">
                  {cliente.plugins_rastreio.map(p => (
                    <span
                      key={p}
                      className="text-xs font-mono px-2 py-0.5 rounded border bg-zinc-800/80 text-zinc-300 border-zinc-700/60"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(cliente.checkout || cliente.checkout_outro) && (
              <div>
                <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1">Checkout</p>
                <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700/60">
                  {cliente.checkout === 'Outro' ? cliente.checkout_outro : cliente.checkout}
                </span>
              </div>
            )}

            {(cliente.plataforma_loja || cliente.plataforma_loja_outro) && (
              <div>
                <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1">Plataforma de Loja</p>
                <span className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700/60">
                  {cliente.plataforma_loja === 'Outro' ? cliente.plataforma_loja_outro : cliente.plataforma_loja}
                </span>
              </div>
            )}

            {cliente.recursos_ud && cliente.recursos_ud.length > 0 && (
              <div>
                <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1">Recursos Utilizados na UD</p>
                <div className="flex flex-wrap gap-1.5">
                  {cliente.recursos_ud.map(r => (
                    <span key={r} className="text-xs font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700/60">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {cliente.motivo_cancelamento && (
              <div>
                <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1">Motivo do Cancelamento</p>
                <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded border border-zinc-800">{cliente.motivo_cancelamento}</p>
              </div>
            )}

            {cliente.feedback_completo && (
              <div>
                <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1">Feedback Completo</p>
                <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-900/60 p-2.5 rounded border border-zinc-800">{cliente.feedback_completo}</p>
              </div>
            )}

            {cliente.nota_interna && (
              <div>
                <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-1">Nota Interna</p>
                <p className="text-xs text-amber-300/90 leading-relaxed italic bg-amber-500/5 p-2.5 rounded border border-amber-500/20">{cliente.nota_interna}</p>
              </div>
            )}

            {cliente.responsavel && (
              <div>
                <p className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider mb-0.5">Responsável</p>
                <p className="text-xs text-zinc-300">{cliente.responsavel}</p>
              </div>
            )}

            <div>
              <p className="text-[11px] font-mono text-zinc-600">
                Atualizado {format(new Date(cliente.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
