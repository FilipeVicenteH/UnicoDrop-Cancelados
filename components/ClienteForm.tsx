'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { X, Loader2, Globe, CheckCircle2, XCircle, AlertCircle, Phone, ExternalLink, Users } from 'lucide-react'
import { CHECKOUTS, PLATAFORMAS_LOJA, PLUGINS_RASTREIO, RECURSOS_UD } from '@/lib/constants'
import { ClienteFormData, SiteStatus, StatusCliente, Prioridade } from '@/lib/types'
import toast from 'react-hot-toast'

function parseBrazilianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 13 && digits.startsWith('55')) return digits
  if (digits.length === 12 && digits.startsWith('55')) return digits
  if (digits.length === 11) return `55${digits}`
  if (digits.length === 10) return `55${digits}`
  return null
}

type PhoneStatus = 'empty' | 'valid' | 'invalid'

function getPhoneStatus(contato: string): PhoneStatus {
  if (!contato || contato.trim() === '') return 'empty'
  const hasDigits = /\d/.test(contato)
  if (!hasDigits) return 'invalid'
  const parsed = parseBrazilianPhone(contato)
  return parsed ? 'valid' : 'invalid'
}

interface ClienteFormProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  clienteId?: number | null
  initialData?: Partial<ClienteFormData>
}

const defaultForm: ClienteFormData = {
  unico_id: '',
  nome: '',
  contato: '',
  empresa: '',
  data_cancelamento: '',
  data_contato: new Date().toISOString().split('T')[0],
  responsavel: '',
  telefone_atualizado: false,
  site_url: '',
  site_online: 'NAO_VERIFICADO',
  plugins_rastreio: [],
  plugins_rastreio_outro: '',
  checkout: '',
  checkout_outro: '',
  plataforma_loja: '',
  plataforma_loja_outro: '',
  recursos_ud: [],
  recursos_ud_outro: '',
  usava_dashboard: false,
  usava_plugin: false,
  usava_whatsapp: false,
  motivo_cancelamento: '',
  feedback_completo: '',
  nota_interna: '',
  status: 'PENDENTE',
  prioridade: 'MEDIA',
}

export default function ClienteForm({ isOpen, onClose, onSaved, clienteId, initialData }: ClienteFormProps) {
  const [form, setForm] = useState<ClienteFormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [checkingSite, setCheckingSite] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const phoneStatus = useMemo(() => getPhoneStatus(form.contato || ''), [form.contato])

  const waLink = useMemo(() => {
    const parsed = parseBrazilianPhone(form.contato || '')
    return parsed ? `https://wa.me/${parsed}` : null
  }, [form.contato])

  const loadCliente = useCallback(async () => {
    if (!clienteId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/clientes/${clienteId}`)
      const data = await res.json()
      setForm({
        ...defaultForm,
        ...data,
        data_cancelamento: data.data_cancelamento ? data.data_cancelamento.split('T')[0] : '',
        data_contato: data.data_contato ? data.data_contato.split('T')[0] : '',
        plugins_rastreio: data.plugins_rastreio || [],
        recursos_ud: data.recursos_ud || [],
      })
    } catch {
      toast.error('Erro ao carregar dados do cliente')
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  useEffect(() => {
    if (isOpen) {
      if (clienteId) {
        loadCliente()
      } else if (initialData) {
        setForm({ ...defaultForm, ...initialData })
      } else {
        setForm(defaultForm)
      }
      setActiveTab(0)
    }
  }, [isOpen, clienteId, initialData, loadCliente])

  const handleCheckSite = async () => {
    if (!form.site_url) {
      toast.error('Informe a URL do site primeiro')
      return
    }
    setCheckingSite(true)
    try {
      const res = await fetch(`/api/check-site?url=${encodeURIComponent(form.site_url)}`)
      const data = await res.json()
      const status: SiteStatus = data.online ? 'ONLINE' : 'OFFLINE'
      setForm(prev => ({ ...prev, site_online: status }))
      if (data.online) {
        toast.success('Site está ONLINE! ✓')
      } else {
        toast.error('Site está OFFLINE ou inacessível')
      }
    } catch {
      toast.error('Erro ao verificar o site')
    } finally {
      setCheckingSite(false)
    }
  }

  const togglePlugin = (plugin: string) => {
    setForm(prev => ({
      ...prev,
      plugins_rastreio: prev.plugins_rastreio.includes(plugin)
        ? prev.plugins_rastreio.filter(p => p !== plugin)
        : [...prev.plugins_rastreio, plugin],
    }))
  }

  const toggleRecurso = (recurso: string) => {
    setForm(prev => ({
      ...prev,
      recursos_ud: prev.recursos_ud.includes(recurso)
        ? prev.recursos_ud.filter(r => r !== recurso)
        : [...prev.recursos_ud, recurso],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      toast.error('Nome do cliente é obrigatório')
      return
    }

    setLoading(true)
    try {
      const payload = { ...form }
      if (typeof payload.faturamento_anterior === 'string') {
        const strVal = payload.faturamento_anterior.trim()
        if (strVal === '') {
          payload.faturamento_anterior = undefined
        } else {
          const parsed = parseFloat(strVal.replace(/\./g, '').replace(',', '.'))
          payload.faturamento_anterior = isNaN(parsed) ? undefined : parsed
        }
      }

      const method = clienteId ? 'PUT' : 'POST'
      const url = clienteId ? `/api/clientes/${clienteId}` : '/api/clientes'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Erro na requisição')

      toast.success(clienteId ? 'Cliente atualizado!' : 'Cliente adicionado!')
      onSaved()
      onClose()
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const siteStatusIcon = () => {
    if (form.site_online === 'ONLINE') return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    if (form.site_online === 'OFFLINE') return <XCircle className="w-4 h-4 text-rose-400" />
    return <AlertCircle className="w-4 h-4 text-zinc-500" />
  }

  const tabs = ['Identificação', 'Site & Ferramentas', 'Uso na UD', 'Feedback & Status']

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 modal-overlay">

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in modal-container">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="icon-box icon-box-primary" style={{ width: 36, height: 36, borderRadius: 10 }}>
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ fontFamily: "'Poppins', sans-serif", color: 'var(--text-heading)' }}>
                {clienteId ? 'Editar Cliente' : 'Novo Cliente Cancelado'}
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Preencha os dados operacionais do contato</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex" style={{ borderBottom: '2px solid var(--border-color)', background: '#f8fafc' }}>
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className="flex-1 py-2.5 text-xs font-semibold transition-all"
              style={{
                color: activeTab === i ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: `2px solid ${activeTab === i ? 'var(--primary)' : 'transparent'}`,
                background: 'transparent',
                marginBottom: '-2px',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden" style={{ background: 'white' }}>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">

            {/* ── Tab 0: Identificação ── */}
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">ID Unico *</label>
                    <input
                      className="form-input text-xs font-mono"
                      placeholder="Ex: UC-12345"
                      value={form.unico_id || ''}
                      onChange={e => setForm(p => ({ ...p, unico_id: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Nome do Cliente *</label>
                    <input
                      className="form-input text-xs"
                      placeholder="Nome completo"
                      required
                      value={form.nome}
                      onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Empresa / Loja</label>
                    <input
                      className="form-input text-xs"
                      placeholder="Nome da empresa"
                      value={form.empresa || ''}
                      onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="form-label mb-0">Contato (Tel / E-mail)</label>
                      {phoneStatus === 'valid' && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Válido
                        </span>
                      )}
                      {phoneStatus === 'invalid' && form.contato && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400">
                          <XCircle className="w-3 h-3" /> Formato inválido
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                      <input
                        className={`form-input pl-9 text-xs font-mono ${
                          phoneStatus === 'valid'
                            ? 'border-emerald-500/40'
                            : phoneStatus === 'invalid' && form.contato
                            ? 'border-rose-500/40'
                            : ''
                        }`}
                        placeholder="+55 (11) 99999-9999"
                        value={form.contato || ''}
                        onChange={e => setForm(p => ({ ...p, contato: e.target.value }))}
                      />
                    </div>
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Verificar WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="form-label">Cancelamento</label>
                    <input
                      type="date"
                      className="form-input text-xs font-mono"
                      value={form.data_cancelamento || ''}
                      onChange={e => setForm(p => ({ ...p, data_cancelamento: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Contato</label>
                    <input
                      type="date"
                      className="form-input text-xs font-mono"
                      value={form.data_contato || ''}
                      onChange={e => setForm(p => ({ ...p, data_contato: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Responsável</label>
                    <input
                      className="form-input text-xs"
                      placeholder="Agente de CS"
                      value={form.responsavel || ''}
                      onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Faturamento (R$)</label>
                    <input
                      type="text"
                      className="form-input text-xs font-mono"
                      placeholder="35.820,00"
                      value={form.faturamento_anterior || ''}
                      onChange={e => setForm(p => ({ ...p, faturamento_anterior: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 1: Site & Ferramentas ── */}
            {activeTab === 1 && (
              <div className="space-y-5">
                <div>
                  <label className="form-label">URL do Site</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        className="form-input pl-9 text-xs font-mono"
                        placeholder="https://meusite.com.br"
                        value={form.site_url || ''}
                        onChange={e => setForm(p => ({ ...p, site_url: e.target.value }))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckSite}
                      disabled={checkingSite}
                      className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 text-xs font-mono rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {checkingSite ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : siteStatusIcon()}
                      Verificar
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Plugins de Rastreio Utilizados</label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {PLUGINS_RASTREIO.map(plugin => (
                      <button
                        key={plugin}
                        type="button"
                        onClick={() => togglePlugin(plugin)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all text-left ${
                          form.plugins_rastreio.includes(plugin)
                            ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-semibold'
                            : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {plugin}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Checkout</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      {CHECKOUTS.map(co => (
                        <button
                          key={co}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, checkout: co }))}
                          className={`px-2 py-1 rounded-md text-xs font-mono border transition-all ${
                            form.checkout === co
                              ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-semibold'
                              : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {co}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Plataforma de Loja</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      {PLATAFORMAS_LOJA.map(pl => (
                        <button
                          key={pl}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, plataforma_loja: pl }))}
                          className={`px-2 py-1 rounded-md text-xs font-mono border transition-all ${
                            form.plataforma_loja === pl
                              ? 'border-zinc-600 bg-zinc-800 text-zinc-100 font-semibold'
                              : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {pl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 2: Uso na UD ── */}
            {activeTab === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-zinc-400 font-mono">Mapeie os recursos da UnicoDrop que o lojista utilizava:</p>
                <div className="grid grid-cols-1 gap-2">
                  {RECURSOS_UD.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleRecurso(item.key)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                        form.recursos_ud.includes(item.key)
                          ? 'border-zinc-700 bg-zinc-800/80 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-mono">{item.key}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${form.recursos_ud.includes(item.key) ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-600'}`}>
                        {form.recursos_ud.includes(item.key) ? 'Sim' : 'Não'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Tab 3: Feedback & Status ── */}
            {activeTab === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Status do Cliente</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                      {[
                        { value: 'PENDENTE', label: 'Pendente', class: 'bg-zinc-800 text-zinc-300 border-zinc-700' },
                        { value: 'EM_NEGOCIACAO', label: 'Em Negociação', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                        { value: 'CONVERTIDO', label: 'Convertido', class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
                        { value: 'NAO_CONVERTIDO', label: 'Não Convertido', class: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                      ].map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, status: s.value as StatusCliente }))}
                          className={`py-1.5 px-2 rounded-md text-xs font-mono border transition-all ${
                            form.status === s.value
                              ? s.class
                              : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Prioridade</label>
                    <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                      {[
                        { value: 'BAIXA', label: 'Baixa', class: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
                        { value: 'MEDIA', label: 'Média', class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
                        { value: 'ALTA', label: 'Alta', class: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
                      ].map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, prioridade: p.value as Prioridade }))}
                          className={`py-1.5 px-2 rounded-md text-xs font-mono border transition-all ${
                            form.prioridade === p.value
                              ? p.class
                              : 'border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="form-label">Motivo do Cancelamento</label>
                  <input
                    className="form-input text-xs"
                    placeholder="Resumo do motivo de churn"
                    value={form.motivo_cancelamento || ''}
                    onChange={e => setForm(p => ({ ...p, motivo_cancelamento: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Feedback Completo</label>
                  <textarea
                    className="form-input text-xs min-h-[80px] resize-none"
                    placeholder="Transcreva o feedback do lojista..."
                    value={form.feedback_completo || ''}
                    onChange={e => setForm(p => ({ ...p, feedback_completo: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Nota Interna</label>
                  <textarea
                    className="form-input text-xs min-h-[60px] resize-none"
                    placeholder="Anotações da equipe de CS/Suporte..."
                    value={form.nota_interna || ''}
                    onChange={e => setForm(p => ({ ...p, nota_interna: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid var(--border-color)', background: '#f8fafc' }}>
            <div className="flex gap-1.5">
              {tabs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: activeTab === i ? '20px' : '6px',
                    background: activeTab === i ? 'var(--primary)' : 'var(--border-color)',
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {activeTab > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(prev => prev - 1)}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border transition-all"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'white' }}
                >
                  ← Anterior
                </button>
              )}
              {activeTab < tabs.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(prev => prev + 1)}
                  className="px-4 py-2 text-sm font-bold text-white rounded-xl btn-primary"
                >
                  Próximo →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold text-white rounded-xl btn-primary disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {clienteId ? 'Salvar Alterações' : 'Adicionar Cliente'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
