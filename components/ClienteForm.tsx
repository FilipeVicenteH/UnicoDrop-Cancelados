'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, Globe, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { CHECKOUTS, PLATAFORMAS_LOJA, PLUGINS_RASTREIO, RECURSOS_UD } from '@/lib/constants'
import { ClienteFormData, SiteStatus, StatusCliente, Prioridade } from '@/lib/types'
import toast from 'react-hot-toast'

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
      const method = clienteId ? 'PUT' : 'POST'
      const url = clienteId ? `/api/clientes/${clienteId}` : '/api/clientes'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
    if (form.site_online === 'ONLINE') return <CheckCircle className="w-5 h-5 text-emerald-400" />
    if (form.site_online === 'OFFLINE') return <XCircle className="w-5 h-5 text-red-400" />
    return <AlertCircle className="w-5 h-5 text-gray-500" />
  }

  const tabs = ['Identificação', 'Site & Ferramentas', 'Uso na UD', 'Feedback & Status']

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#0f0f1a] border border-purple-500/20 rounded-2xl shadow-2xl shadow-purple-500/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-purple-900/30 to-violet-900/20">
          <div>
            <h2 className="text-lg font-bold text-white">
              {clienteId ? '✏️ Editar Cliente' : '➕ Novo Cliente Cancelado'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Preencha as informações do contato</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-[#0f0f1a]">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-3 text-xs font-medium transition-all relative ${
                activeTab === i
                  ? 'text-purple-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
              {activeTab === i && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

            {/* ── Tab 0: Identificação ── */}
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">ID Unico *</label>
                    <input
                      className="form-input"
                      placeholder="Ex: UC-12345"
                      value={form.unico_id || ''}
                      onChange={e => setForm(p => ({ ...p, unico_id: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Nome do Cliente *</label>
                    <input
                      className="form-input"
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
                      className="form-input"
                      placeholder="Nome da empresa"
                      value={form.empresa || ''}
                      onChange={e => setForm(p => ({ ...p, empresa: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Contato (Tel / E-mail)</label>
                    <input
                      className="form-input"
                      placeholder="+55 (11) 99999-9999"
                      value={form.contato || ''}
                      onChange={e => setForm(p => ({ ...p, contato: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Data do Cancelamento</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.data_cancelamento || ''}
                      onChange={e => setForm(p => ({ ...p, data_cancelamento: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Data do Contato</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.data_contato || ''}
                      onChange={e => setForm(p => ({ ...p, data_contato: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Responsável</label>
                    <input
                      className="form-input"
                      placeholder="Quem fez o contato"
                      value={form.responsavel || ''}
                      onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 1: Site & Ferramentas ── */}
            {activeTab === 1 && (
              <div className="space-y-6">

                {/* Site URL */}
                <div>
                  <label className="form-label">URL do Site</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        className="form-input pl-10"
                        placeholder="https://meusite.com.br"
                        value={form.site_url || ''}
                        onChange={e => setForm(p => ({ ...p, site_url: e.target.value }))}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCheckSite}
                      disabled={checkingSite}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
                    >
                      {checkingSite ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        siteStatusIcon()
                      )}
                      Verificar
                    </button>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-500">Status:</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      form.site_online === 'ONLINE'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : form.site_online === 'OFFLINE'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {form.site_online === 'ONLINE' ? '● Online' : form.site_online === 'OFFLINE' ? '● Offline' : '○ Não verificado'}
                    </span>
                    <span className="text-xs text-gray-600">ou selecione:</span>
                    <select
                      className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-gray-300"
                      value={form.site_online}
                      onChange={e => setForm(p => ({ ...p, site_online: e.target.value as SiteStatus }))}
                    >
                      <option value="NAO_VERIFICADO">Não Verificado</option>
                      <option value="ONLINE">Online</option>
                      <option value="OFFLINE">Offline</option>
                    </select>
                  </div>
                </div>

                {/* Plugins de Rastreio */}
                <div>
                  <label className="form-label">
                    Plugin de Rastreio <span className="text-gray-500 font-normal">(selecione todos que usa)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {PLUGINS_RASTREIO.map(plugin => (
                      <button
                        key={plugin}
                        type="button"
                        onClick={() => togglePlugin(plugin)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all text-left ${
                          form.plugins_rastreio.includes(plugin)
                            ? 'border-purple-500/60 bg-purple-500/15 text-purple-300'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-300'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                          form.plugins_rastreio.includes(plugin)
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-gray-600'
                        }`}>
                          {form.plugins_rastreio.includes(plugin) && (
                            <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
                              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        {plugin}
                      </button>
                    ))}
                  </div>
                  {/* Input "Outro" para plugin */}
                  {form.plugins_rastreio.includes('Outro') && (
                    <input
                      className="form-input mt-2"
                      placeholder="Qual plugin de rastreio?"
                      value={form.plugins_rastreio_outro || ''}
                      onChange={e => setForm(p => ({ ...p, plugins_rastreio_outro: e.target.value }))}
                    />
                  )}
                </div>

                {/* Checkout e Plataforma — lado a lado */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Checkout Utilizado */}
                  <div>
                    <label className="form-label">Checkout Utilizado</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {CHECKOUTS.map(co => (
                        <button
                          key={co}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, checkout: co }))}
                          className={`px-2 py-1.5 rounded-lg text-xs border transition-all text-center ${
                            form.checkout === co
                              ? 'border-violet-500/60 bg-violet-500/15 text-violet-300'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-300'
                          }`}
                        >
                          {co}
                        </button>
                      ))}
                    </div>
                    {form.checkout === 'Outro' && (
                      <input
                        className="form-input mt-2"
                        placeholder="Qual checkout?"
                        value={form.checkout_outro || ''}
                        onChange={e => setForm(p => ({ ...p, checkout_outro: e.target.value }))}
                      />
                    )}
                  </div>

                  {/* Plataforma de Loja */}
                  <div>
                    <label className="form-label">Plataforma de Loja</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {PLATAFORMAS_LOJA.map(pl => (
                        <button
                          key={pl}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, plataforma_loja: pl }))}
                          className={`px-2 py-1.5 rounded-lg text-xs border transition-all text-center ${
                            form.plataforma_loja === pl
                              ? 'border-cyan-500/60 bg-cyan-500/15 text-cyan-300'
                              : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:text-gray-300'
                          }`}
                        >
                          {pl}
                        </button>
                      ))}
                    </div>
                    {form.plataforma_loja === 'Outro' && (
                      <input
                        className="form-input mt-2"
                        placeholder="Qual plataforma?"
                        value={form.plataforma_loja_outro || ''}
                        onChange={e => setForm(p => ({ ...p, plataforma_loja_outro: e.target.value }))}
                      />
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* ── Tab 2: Uso na UD ── */}
            {activeTab === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Quais recursos da UnicoDrop esse cliente utilizava?</p>

                <div className="grid grid-cols-1 gap-3">
                  {RECURSOS_UD.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleRecurso(item.key)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                        form.recursos_ud.includes(item.key)
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-white/10 bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className="text-2xl flex-shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${form.recursos_ud.includes(item.key) ? 'text-purple-300' : 'text-gray-300'}`}>
                          {item.key}
                        </p>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-all flex items-center px-1 flex-shrink-0 ${
                        form.recursos_ud.includes(item.key)
                          ? 'bg-purple-500 justify-end'
                          : 'bg-gray-700 justify-start'
                      }`}>
                        <div className="w-4 h-4 bg-white rounded-full shadow" />
                      </div>
                    </button>
                  ))}

                  {/* Outros — com input */}
                  <div className={`rounded-xl border transition-all ${
                    form.recursos_ud.includes('Outros')
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-white/10 bg-white/5'
                  }`}>
                    <button
                      type="button"
                      onClick={() => toggleRecurso('Outros')}
                      className="flex items-center gap-4 p-4 w-full text-left"
                    >
                      <span className="text-2xl flex-shrink-0">✏️</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm ${form.recursos_ud.includes('Outros') ? 'text-purple-300' : 'text-gray-300'}`}>
                          Outros
                        </p>
                      </div>
                      <div className={`w-12 h-6 rounded-full transition-all flex items-center px-1 flex-shrink-0 ${
                        form.recursos_ud.includes('Outros')
                          ? 'bg-purple-500 justify-end'
                          : 'bg-gray-700 justify-start'
                      }`}>
                        <div className="w-4 h-4 bg-white rounded-full shadow" />
                      </div>
                    </button>
                    {form.recursos_ud.includes('Outros') && (
                      <div className="px-4 pb-4">
                        <input
                          className="form-input"
                          placeholder="Descreva os outros recursos utilizados..."
                          value={form.recursos_ud_outro || ''}
                          onChange={e => setForm(p => ({ ...p, recursos_ud_outro: e.target.value }))}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Tab 3: Feedback & Status ── */}
            {activeTab === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Status do Cliente</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { value: 'PENDENTE', label: 'Pendente', color: 'gray' },
                        { value: 'EM_NEGOCIACAO', label: 'Em Negociação', color: 'amber' },
                        { value: 'CONVERTIDO', label: 'Convertido', color: 'emerald' },
                        { value: 'NAO_CONVERTIDO', label: 'Não Convertido', color: 'red' },
                      ].map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setForm(p => ({ ...p, status: s.value as StatusCliente }))}
                          className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                            form.status === s.value
                              ? s.color === 'emerald' ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400'
                              : s.color === 'red' ? 'border-red-500/50 bg-red-500/15 text-red-400'
                              : s.color === 'amber' ? 'border-amber-500/50 bg-amber-500/15 text-amber-400'
                              : 'border-gray-500/50 bg-gray-500/15 text-gray-400'
                              : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/20'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Prioridade</label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {[
                        { value: 'BAIXA', label: 'Baixa', color: 'blue' },
                        { value: 'MEDIA', label: 'Média', color: 'yellow' },
                        { value: 'ALTA', label: 'Alta', color: 'red' },
                      ].map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, prioridade: p.value as Prioridade }))}
                          className={`py-2 px-3 rounded-lg text-xs font-medium border transition-all ${
                            form.prioridade === p.value
                              ? p.color === 'blue' ? 'border-blue-500/50 bg-blue-500/15 text-blue-400'
                              : p.color === 'yellow' ? 'border-yellow-500/50 bg-yellow-500/15 text-yellow-400'
                              : 'border-red-500/50 bg-red-500/15 text-red-400'
                              : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/20'
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
                    className="form-input"
                    placeholder="Resumo do motivo"
                    value={form.motivo_cancelamento || ''}
                    onChange={e => setForm(p => ({ ...p, motivo_cancelamento: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Feedback Completo</label>
                  <textarea
                    className="form-input min-h-[100px] resize-none"
                    placeholder="Transcreva ou resuma o feedback do cliente..."
                    value={form.feedback_completo || ''}
                    onChange={e => setForm(p => ({ ...p, feedback_completo: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label">Nota Interna <span className="text-gray-500 font-normal">(não visível para o cliente)</span></label>
                  <textarea
                    className="form-input min-h-[70px] resize-none"
                    placeholder="Anotações internas sobre esse contato..."
                    value={form.nota_interna || ''}
                    onChange={e => setForm(p => ({ ...p, nota_interna: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-[#0f0f1a]">
            <div className="flex gap-2">
              {tabs.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveTab(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    activeTab === i ? 'bg-purple-400 w-4' : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              {activeTab > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(prev => prev - 1)}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/10 rounded-lg transition-colors"
                >
                  Anterior
                </button>
              )}
              {activeTab < tabs.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveTab(prev => prev + 1)}
                  className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                >
                  Próximo →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
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
