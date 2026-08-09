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

  const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
    CONVERTIDO: { bg: '#d1fae5', color: '#059669' },
    EM_NEGOCIACAO: { bg: '#fef3c7', color: '#d97706' },
    PENDENTE: { bg: '#f1f3f6', color: '#6b7280' },
    NAO_CONVERTIDO: { bg: '#fee2e2', color: '#dc2626' },
  }
  const PRIORIDADE_BADGE: Record<string, { bg: string; color: string }> = {
    ALTA: { bg: '#fee2e2', color: '#dc2626' },
    MEDIA: { bg: '#fef3c7', color: '#d97706' },
    BAIXA: { bg: '#cffafe', color: '#0891b2' },
  }
  const statusBadge = STATUS_BADGE[cliente.status] || { bg: '#f1f3f6', color: '#6b7280' }
  const prioridadeBadge = PRIORIDADE_BADGE[cliente.prioridade] || { bg: '#f1f3f6', color: '#6b7280' }

  const siteIcon = () => {
    if (cliente.site_online === 'ONLINE') return <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#1eab5a' }} />
    if (cliente.site_online === 'OFFLINE') return <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
    return <AlertCircle className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
  }

  return (
    <div
      className="group transition-all duration-200 overflow-hidden"
      style={{
        background: 'white',
        border: `1px solid ${expanded ? 'var(--primary)' : 'var(--border-color)'}`,
        borderRadius: '12px',
        boxShadow: expanded ? 'var(--shadow-hover)' : 'var(--shadow-card)',
      }}
    >
      {/* Main Row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* ID Unico */}
        <div className="w-24 flex-shrink-0">
          <span className="text-xs font-bold font-mono px-2 py-0.5 rounded" style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
            {cliente.unico_id || '—'}
          </span>
        </div>

        {/* Nome e Empresa */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-heading)' }}>{cliente.nome}</p>
            {cliente.telefone_atualizado && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: '#d1fae5', color: '#059669' }}>
                Tel. ✓
              </span>
            )}
          </div>
          {cliente.empresa && (
            <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{cliente.empresa}</p>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0">
          <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: statusBadge.bg, color: statusBadge.color }}>
            {STATUS_LABELS[cliente.status]}
          </span>
        </div>

        {/* Prioridade */}
        <div className="flex-shrink-0 hidden md:block">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: prioridadeBadge.bg, color: prioridadeBadge.color }}>
            {cliente.prioridade}
          </span>
        </div>

        {/* Site Status */}
        <div className="flex items-center gap-1.5 flex-shrink-0 hidden lg:flex">
          {siteIcon()}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
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
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: isNovo ? '#d1fae5' : '#f1f3f6',
                    color: isNovo ? '#059669' : '#6b7280',
                  }}
                >
                  <Radio className="w-2.5 h-2.5" />
                  {isNovo ? 'UD Novo' : 'UD Antigo'}
                </span>
              )
            }
            return <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Sem plugin</span>
          })()}
        </div>

        {/* UD Tools */}
        <div className="flex gap-1 flex-shrink-0 hidden lg:flex">
          <span title="Dashboard" className="p-1 rounded" style={{ color: cliente.usava_dashboard ? 'var(--primary)' : 'var(--text-muted)', background: cliente.usava_dashboard ? 'var(--primary-muted)' : 'transparent' }}>
            <LayoutDashboard className="w-3.5 h-3.5" />
          </span>
          <span title="Plugin" className="p-1 rounded" style={{ color: cliente.usava_plugin ? '#1eab5a' : 'var(--text-muted)', background: cliente.usava_plugin ? '#d1fae5' : 'transparent' }}>
            <Puzzle className="w-3.5 h-3.5" />
          </span>
          <span title="WhatsApp" className="p-1 rounded" style={{ color: cliente.usava_whatsapp ? '#25d366' : 'var(--text-muted)', background: cliente.usava_whatsapp ? '#dcfce7' : 'transparent' }}>
            <MessageCircle className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Date */}
        <div className="text-xs flex-shrink-0 hidden xl:block" style={{ color: 'var(--text-muted)' }}>
          {cliente.data_contato ? format(new Date(cliente.data_contato), 'dd/MM/yy', { locale: ptBR }) : '—'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(cliente.id)} title="Editar" className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--primary-muted)'; (e.currentTarget as HTMLElement).style.color = 'var(--primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(cliente.id)} title="Excluir" className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; (e.currentTarget as HTMLElement).style.color = '#dc2626' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          title={expanded ? 'Recolher' : 'Ver detalhes'}
          className="p-1.5 rounded-lg transition-all flex-shrink-0"
          style={{ color: expanded ? 'var(--primary)' : 'var(--text-muted)', background: expanded ? 'var(--primary-muted)' : 'transparent' }}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-5 pb-5 pt-4 grid grid-cols-1 md:grid-cols-2 gap-5" style={{ borderTop: '1px solid var(--border-color)', background: '#f8fafc' }}>
          {/* Left Column */}
          <div className="space-y-4">
            {cliente.contato && (
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Contato</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{cliente.contato}</p>
              </div>
            )}

            {cliente.site_url && (
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}><Globe className="w-3 h-3 inline mr-1" /> Site URL</p>
                <a
                  href={cliente.site_url.startsWith('http') ? cliente.site_url : `https://${cliente.site_url}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-sm font-semibold flex items-center gap-1 hover:underline"
                  style={{ color: 'var(--primary)' }}
                >
                  {cliente.site_url}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {cliente.plugins_rastreio?.length > 0 && (
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Plugins de Rastreio</p>
                <div className="flex flex-wrap gap-1.5">
                  {cliente.plugins_rastreio.map(p => (
                    <span key={p} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: UNICO_PLUGINS.includes(p) ? '#d1fae5' : '#f1f3f6', color: UNICO_PLUGINS.includes(p) ? '#059669' : '#6b7280' }}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            {(cliente.checkout || cliente.checkout_outro) && (
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Checkout</p>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                  {cliente.checkout === 'Outro' ? cliente.checkout_outro : cliente.checkout}
                </span>
              </div>
            )}

            {(cliente.plataforma_loja || cliente.plataforma_loja_outro) && (
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Plataforma de Loja</p>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#cffafe', color: '#0891b2' }}>
                  {cliente.plataforma_loja === 'Outro' ? cliente.plataforma_loja_outro : cliente.plataforma_loja}
                </span>
              </div>
            )}

            {cliente.recursos_ud && cliente.recursos_ud.length > 0 && (
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Recursos Utilizados na UD</p>
                <div className="flex flex-wrap gap-1.5">
                  {cliente.recursos_ud.map(r => (
                    <span key={r} className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: '#ede9fe', color: '#6610f2' }}>{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {cliente.motivo_cancelamento && (
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Motivo do Cancelamento</p>
                <p className="text-sm leading-relaxed p-3 rounded-xl" style={{ background: '#fee2e2', color: '#7f1d1d', border: '1px solid #fca5a5' }}>{cliente.motivo_cancelamento}</p>
              </div>
            )}

            {cliente.feedback_completo && (
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Feedback Completo</p>
                <p className="text-sm leading-relaxed p-3 rounded-xl" style={{ background: '#f8fafc', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{cliente.feedback_completo}</p>
              </div>
            )}

            {cliente.nota_interna && (
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Nota Interna</p>
                <p className="text-sm leading-relaxed italic p-3 rounded-xl" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>{cliente.nota_interna}</p>
              </div>
            )}

            {cliente.responsavel && (
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Responsável</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-heading)' }}>{cliente.responsavel}</p>
              </div>
            )}

            <div>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Atualizado {format(new Date(cliente.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
