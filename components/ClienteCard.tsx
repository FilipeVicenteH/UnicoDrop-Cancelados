'use client'

import { Cliente } from '@/lib/types'
import { STATUS_LABELS, STATUS_COLORS, PRIORIDADE_LABELS } from '@/lib/constants'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Edit2, Trash2, Globe, CheckCircle, XCircle, AlertCircle,
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
    if (cliente.site_online === 'ONLINE') return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
    if (cliente.site_online === 'OFFLINE') return <XCircle className="w-3.5 h-3.5 text-red-400" />
    return <AlertCircle className="w-3.5 h-3.5 text-gray-500" />
  }

  const statusColor = STATUS_COLORS[cliente.status] || '#6B7280'
  const prioridadeLabel = PRIORIDADE_LABELS[cliente.prioridade]

  const prioridadeClass = {
    ALTA: 'text-red-400 bg-red-400/10',
    MEDIA: 'text-yellow-400 bg-yellow-400/10',
    BAIXA: 'text-blue-400 bg-blue-400/10',
  }[cliente.prioridade] || 'text-gray-400 bg-gray-400/10'

  return (
    <div className={`group bg-white/3 border rounded-xl transition-all duration-200 overflow-hidden ${
      expanded ? 'border-purple-500/30' : 'border-white/8 hover:border-white/15'
    }`}>
      {/* Main Row */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Status Indicator */}
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
        />

        {/* ID Unico */}
        <div className="w-24 flex-shrink-0">
          <span className="text-xs font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded">
            {cliente.unico_id || '—'}
          </span>
        </div>

        {/* Nome e Empresa */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{cliente.nome}</p>
          {cliente.empresa && (
            <p className="text-xs text-gray-500 truncate">{cliente.empresa}</p>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          <span
            className="text-xs font-medium px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
            }}
          >
            {STATUS_LABELS[cliente.status]}
          </span>
        </div>

        {/* Prioridade */}
        <div className="flex-shrink-0 hidden md:block">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${prioridadeClass}`}>
            {prioridadeLabel}
          </span>
        </div>

        {/* Site Status */}
        <div className="flex items-center gap-1.5 flex-shrink-0 hidden lg:flex">
          {siteIcon()}
          <span className="text-xs text-gray-500">
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
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isNovo
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-violet-500/15 text-violet-400 border-violet-500/30'
                  }`}
                >
                  <Radio className="w-2.5 h-2.5" />
                  {isNovo ? 'UD Novo' : 'UD Antigo'}
                </span>
              )
            }
            return <span className="text-[10px] text-gray-700">Sem plugin</span>
          })()}
        </div>

        {/* UD Tools */}
        <div className="flex gap-1.5 flex-shrink-0 hidden lg:flex">
          <span title="Dashboard" className={`p-1 rounded ${cliente.usava_dashboard ? 'text-purple-400' : 'text-gray-700'}`}>
            <LayoutDashboard className="w-3.5 h-3.5" />
          </span>
          <span title="Plugin" className={`p-1 rounded ${cliente.usava_plugin ? 'text-purple-400' : 'text-gray-700'}`}>
            <Puzzle className="w-3.5 h-3.5" />
          </span>
          <span title="WhatsApp" className={`p-1 rounded ${cliente.usava_whatsapp ? 'text-purple-400' : 'text-gray-700'}`}>
            <MessageCircle className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Date */}
        <div className="text-xs text-gray-600 flex-shrink-0 hidden xl:block">
          {cliente.data_contato
            ? format(new Date(cliente.data_contato), 'dd/MM/yy', { locale: ptBR })
            : '—'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(cliente.id)}
            title="Editar cliente"
            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(cliente.id)}
            title="Excluir cliente"
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Recolher detalhes' : 'Ver detalhes'}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            {cliente.contato && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Contato</p>
                <p className="text-sm text-gray-300">{cliente.contato}</p>
              </div>
            )}

            {cliente.site_url && (
              <div>
                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Site
                </p>
                <a
                  href={cliente.site_url.startsWith('http') ? cliente.site_url : `https://${cliente.site_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                >
                  {cliente.site_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {cliente.plugins_rastreio?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Plugins de Rastreio</p>
                <div className="flex flex-wrap gap-1.5">
                  {cliente.plugins_rastreio.map(p => {
                    const isUnico = UNICO_PLUGINS.includes(p)
                    const isNovo = p === 'UnicoDrop Novo'
                    return (
                      <span
                        key={p}
                        className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isUnico
                            ? isNovo
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-semibold'
                              : 'bg-violet-500/15 text-violet-300 border-violet-500/30 font-semibold'
                            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                        }`}
                      >
                        {isUnico && <Radio className="w-2.5 h-2.5" />}
                        {p}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {(cliente.checkout || cliente.checkout_outro) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Checkout</p>
                <span className="text-sm bg-violet-500/10 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/20">
                  {cliente.checkout === 'Outro' ? cliente.checkout_outro : cliente.checkout}
                </span>
              </div>
            )}

            {(cliente.plataforma_loja || cliente.plataforma_loja_outro) && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Plataforma de Loja</p>
                <span className="text-sm bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {cliente.plataforma_loja === 'Outro' ? cliente.plataforma_loja_outro : cliente.plataforma_loja}
                </span>
              </div>
            )}

            <div className="space-y-3">
              {/* Recursos UD */}
              {cliente.recursos_ud && cliente.recursos_ud.length > 0 ? (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Recursos Utilizados na UD</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cliente.recursos_ud.map(r => (
                      <span key={r} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                        {r}
                      </span>
                    ))}
                    {cliente.recursos_ud_outro && (
                      <span className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                        {cliente.recursos_ud_outro}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <span className={`flex items-center gap-1 text-xs ${cliente.usava_dashboard ? 'text-purple-400' : 'text-gray-700'}`}>
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${cliente.usava_plugin ? 'text-purple-400' : 'text-gray-700'}`}>
                    <Puzzle className="w-3.5 h-3.5" /> Plugin
                  </span>
                  <span className={`flex items-center gap-1 text-xs ${cliente.usava_whatsapp ? 'text-purple-400' : 'text-gray-700'}`}>
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {cliente.motivo_cancelamento && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Motivo do Cancelamento</p>
                <p className="text-sm text-gray-300">{cliente.motivo_cancelamento}</p>
              </div>
            )}

            {cliente.feedback_completo && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Feedback Completo</p>
                <p className="text-sm text-gray-400 leading-relaxed">{cliente.feedback_completo}</p>
              </div>
            )}

            {cliente.nota_interna && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Nota Interna</p>
                <p className="text-sm text-amber-300/80 italic">{cliente.nota_interna}</p>
              </div>
            )}

            {cliente.responsavel && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Responsável</p>
                <p className="text-sm text-gray-300">{cliente.responsavel}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-gray-600">
                Atualizado {format(new Date(cliente.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
