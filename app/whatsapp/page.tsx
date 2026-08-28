'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, QrCode, PhoneCall, Send, CheckCircle2, XCircle,
  RefreshCw, Plus, Trash2, Zap, Copy, ExternalLink, Loader2, Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Session {
  id: number
  status: string
  numero_conectado: string | null
  qr_code_base64: string | null
}

interface Template {
  id: number
  titulo: string
  conteudo: string
  is_default: boolean
}

interface Cliente {
  id: number
  unico_id: string | null
  nome: string
  contato: string | null
  empresa: string | null
  responsavel: string | null
  motivo_cancelamento: string | null
}

interface Log {
  id: number
  cliente_id: number | null
  contato: string
  mensagem: string
  status: string
  enviado_em: string
}

export default function WhatsappPage() {
  const [activeTab, setActiveTab] = useState<'conexao' | 'templates' | 'disparo' | 'historico'>('conexao')
  const [session, setSession] = useState<Session | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [sendingId, setSendingId] = useState<number | null>(null)

  // New Template Form State
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newIsDefault, setNewIsDefault] = useState(false)

  // Load Session Status
  const loadSession = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status')
      const data = await res.json()
      setSession(data)
    } catch {
      toast.error('Erro ao carregar sessão do WhatsApp')
    }
  }, [])

  // Load Templates
  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/templates')
      const data = await res.json()
      setTemplates(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Erro ao carregar templates')
    }
  }, [])

  // Load Clientes
  const loadClientes = useCallback(async () => {
    try {
      const res = await fetch('/api/clientes')
      const data = await res.json()
      setClientes(Array.isArray(data) ? data.filter(c => Boolean(c.contato)) : [])
    } catch {
      toast.error('Erro ao carregar clientes')
    }
  }, [])

  // Load Logs
  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/logs')
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Erro ao carregar histórico')
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadSession(), loadTemplates(), loadClientes(), loadLogs()]).finally(() => setLoading(false))
  }, [loadSession, loadTemplates, loadClientes, loadLogs])

  // Connection Actions
  const handleSessionAction = async (action: 'GENERATE_QR' | 'CONNECT' | 'DISCONNECT') => {
    setActionLoading(true)
    try {
      const res = await fetch('/api/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      setSession(data)
      if (action === 'CONNECT') toast.success('WhatsApp conectado com sucesso! ✓')
      if (action === 'DISCONNECT') toast.success('WhatsApp desconectado.')
      if (action === 'GENERATE_QR') toast.success('Novo QR Code gerado! Escaneie no celular.')
    } catch {
      toast.error('Erro ao processar ação de conexão')
    } finally {
      setActionLoading(false)
    }
  }

  // Create Template
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Preencha título e conteúdo da mensagem')
      return
    }

    setActionLoading(true)
    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: newTitle,
          conteudo: newContent,
          is_default: newIsDefault,
        }),
      })
      if (!res.ok) throw new Error('Erro ao salvar')
      toast.success('Mensagem padrão cadastrada!')
      setNewTitle('')
      setNewContent('')
      setNewIsDefault(false)
      loadTemplates()
    } catch {
      toast.error('Erro ao cadastrar mensagem')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete Template
  const handleDeleteTemplate = async (id: number) => {
    try {
      const res = await fetch(`/api/whatsapp/templates?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      toast.success('Template removido')
      loadTemplates()
    } catch {
      toast.error('Erro ao excluir template')
    }
  }

  // Send Single Message (1-Click)
  const handleSendSingle = async (clienteId: number) => {
    setSendingId(clienteId)
    try {
      const defaultTpl = templates.find(t => t.is_default) || templates[0]
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteId,
          template_id: defaultTpl?.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro no envio')

      toast.success('Mensagem registrada e pronta para disparo!')
      if (data.waUrl) {
        window.open(data.waUrl, '_blank')
      }
      loadLogs()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar')
    } finally {
      setSendingId(null)
    }
  }

  const defaultTemplate = templates.find(t => t.is_default) || templates[0]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Header Banner ── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Zap className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Automação de Mensageria IA
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Disparos & Conexão WhatsApp
            </h1>
            <p className="text-sm text-purple-200 mt-1 max-w-2xl">
              Pareie seu WhatsApp corporativo via QR Code, gerencie templates dinâmicos de reconversão e automatize disparos no cadastro de clientes.
            </p>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/20">
            <div className="w-3 h-3 rounded-full animate-pulse bg-emerald-400" />
            <div>
              <p className="text-xs text-purple-200 font-medium">Status do WhatsApp</p>
              <p className="text-sm font-bold text-white flex items-center gap-1">
                {session?.status === 'CONNECTED' ? (
                  <>🟢 Conectado ({session.numero_conectado || '+55 (11) 96615-2956'})</>
                ) : session?.status === 'WAITING_QR' ? (
                  <>🟡 Aguardando Leitura do QR Code</>
                ) : (
                  <>🔴 Desconectado</>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm space-x-1">
        {[
          { id: 'conexao', label: '1. Conexão QR Code', icon: QrCode },
          { id: 'templates', label: '2. Mensagens Padrão (Templates)', icon: MessageSquare },
          { id: 'disparo', label: '3. Disparo Manual (1-Click)', icon: Send },
          { id: 'historico', label: '4. Histórico de Envios', icon: PhoneCall },
        ].map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 bg-white rounded-2xl p-8 shadow-sm">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-sm text-slate-500 font-semibold">Carregando dados da automação...</p>
        </div>
      ) : (
        <>
          {/* ── TAB 1: Conexão QR Code ── */}
          {activeTab === 'conexao' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: QR Code Scanner */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col items-center justify-center text-center">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-purple-600" /> Painel de Pareamento WhatsApp
                </h3>
                <p className="text-xs text-slate-500 max-w-md">
                  Escaneie o QR Code abaixo usando o aplicativo do WhatsApp no seu celular (Configurações ➔ Aparelhos Conectados).
                </p>

                {session?.qr_code_base64 ? (
                  <div className="p-4 bg-slate-50 border-2 border-dashed border-purple-300 rounded-2xl my-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.qr_code_base64}
                      alt="WhatsApp QR Code"
                      className="w-56 h-56 rounded-lg shadow-md mx-auto"
                    />
                    <p className="text-[11px] text-purple-700 font-semibold mt-2 animate-pulse">
                      Aguardando leitura do QR Code...
                    </p>
                  </div>
                ) : session?.status === 'CONNECTED' ? (
                  <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl my-2 text-center w-full">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                    <h4 className="text-base font-bold text-emerald-900">WhatsApp Pareado com Sucesso!</h4>
                    <p className="text-xs text-emerald-700 font-mono mt-1">
                      Número ativo: {session.numero_conectado || '+55 (11) 96615-2956'}
                    </p>
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 border border-slate-200 rounded-2xl my-2 text-center w-full">
                    <XCircle className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Nenhum número conectado no momento.</p>
                  </div>
                )}

                <div className="flex gap-2 w-full pt-2">
                  <button
                    onClick={() => handleSessionAction('GENERATE_QR')}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Gerar Novo QR Code
                  </button>
                  {session?.status === 'CONNECTED' ? (
                    <button
                      onClick={() => handleSessionAction('DISCONNECT')}
                      disabled={actionLoading}
                      className="py-2.5 px-4 bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-all border border-rose-300"
                    >
                      Desconectar
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSessionAction('CONNECT')}
                      disabled={actionLoading}
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                    >
                      Simular Conexão
                    </button>
                  )}
                </div>
              </div>

              {/* Box 2: Instructions */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" /> Como Funciona a Automação no UnicoCRM
                </h3>
                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                    <p className="font-bold text-purple-900">1. Disparo Automático ao Adicionar Cliente</p>
                    <p className="text-purple-700 mt-0.5">
                      No formulário de Novo Cliente, marque o checkbox <strong className="text-purple-900">"Enviar mensagem padrão via WhatsApp"</strong>. Ao salvar, a mensagem é enviada na hora!
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="font-bold text-slate-900">2. Disparo Manual em 1 Clique</p>
                    <p className="text-slate-600 mt-0.5">
                      Na aba 3 ("Disparo Manual"), você pode enviar a mensagem cadastrada para qualquer cliente da lista clicando no botão <strong className="text-slate-900">⚡ Disparar WhatsApp</strong>.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="font-bold text-emerald-900">3. Variáveis Dinâmicas nos Textos</p>
                    <p className="text-emerald-700 mt-0.5">
                      Use as tags <code className="bg-white px-1 rounded font-bold">{`{nome}`}</code>, <code className="bg-white px-1 rounded font-bold">{`{empresa}`}</code>, <code className="bg-white px-1 rounded font-bold">{`{unico_id}`}</code> e <code className="bg-white px-1 rounded font-bold">{`{motivo}`}</code> para mensagens personalizadas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: Mensagens Padrão (Templates) ── */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form New Template */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" /> Criar Novo Modelo de Mensagem
                </h3>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div>
                    <label className="form-label">Título da Mensagem *</label>
                    <input
                      className="form-input text-xs font-semibold"
                      placeholder="Ex: Abordagem Inicial Churn"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Conteúdo da Mensagem *</label>
                    <textarea
                      className="form-input text-xs font-mono min-h-[140px] resize-none"
                      placeholder="Olá {nome}! Tudo bem? Vi que sua conta {empresa} (ID: {unico_id}) teve a assinatura suspensa por {motivo}. Podemos conversar?"
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {['{nome}', '{empresa}', '{unico_id}', '{responsavel}', '{motivo}'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNewContent(prev => prev + ' ' + tag)}
                          className="px-2 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-[10px] font-mono font-bold rounded"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_default"
                      checked={newIsDefault}
                      onChange={e => setNewIsDefault(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <label htmlFor="is_default" className="text-xs font-semibold text-slate-700 cursor-pointer">
                      Definir como Mensagem Padrão Principal
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Salvar Template
                  </button>
                </form>
              </div>

              {/* Template List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Modelos de Mensagem Cadastrados</h3>
                <div className="space-y-3">
                  {templates.map(tpl => (
                    <div
                      key={tpl.id}
                      className={`p-5 rounded-2xl border transition-all bg-white shadow-sm space-y-2 ${
                        tpl.is_default ? 'border-purple-500 ring-2 ring-purple-100' : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{tpl.titulo}</h4>
                          {tpl.is_default && (
                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-full">
                              Mensagem Padrão
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-200">
                        {tpl.conteudo}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: Disparo Manual (1-Click) ── */}
          {activeTab === 'disparo' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Lista de Contatos do CRM</h3>
                  <p className="text-xs text-slate-500">
                    Dispare a mensagem padrão de reconversão para qualquer cliente com 1 clique.
                  </p>
                </div>
                {defaultTemplate && (
                  <div className="text-xs font-mono bg-purple-50 border border-purple-200 text-purple-800 p-2.5 rounded-xl">
                    <span className="font-bold">Template Padrão:</span> {defaultTemplate.titulo}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Cliente</th>
                      <th className="p-3">ID Unico</th>
                      <th className="p-3">Empresa</th>
                      <th className="p-3">Contato WhatsApp</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {clientes.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-bold text-slate-900">{c.nome}</td>
                        <td className="p-3 font-mono text-purple-600">{c.unico_id || '-'}</td>
                        <td className="p-3">{c.empresa || '-'}</td>
                        <td className="p-3 font-mono">{c.contato}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleSendSingle(c.id)}
                            disabled={sendingId === c.id}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {sendingId === c.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5 text-amber-300" />
                            )}
                            ⚡ Disparar WhatsApp
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB 4: Histórico de Envios ── */}
          {activeTab === 'historico' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900">Histórico de Disparos de WhatsApp</h3>
              <div className="space-y-3">
                {logs.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-8 text-center">
                    Nenhum disparo registrado ainda.
                  </p>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Contato: {log.contato}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(log.enviado_em).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-700 bg-white p-3 rounded-lg border border-slate-200">
                        {log.mensagem}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
