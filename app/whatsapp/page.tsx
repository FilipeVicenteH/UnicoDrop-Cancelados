'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  MessageSquare, Send, CheckCircle2,
  Plus, Trash2, Zap, ExternalLink, Loader2, Sparkles, PhoneCall, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Template {
  id: number
  titulo: string
  conteudo: string
  is_default: boolean
}

interface Contato {
  id: number
  unico_id: string | null
  nome: string
  contato: string | null
  empresa: string | null
  responsavel: string | null
  motivo_cancelamento: string | null
  status: string
  prioridade: string
}

interface Log {
  id: number
  cliente_id: number | null
  contato: string
  mensagem: string
  status: string
  enviado_em: string
}

const VARIABLES = ['{nome}', '{empresa}', '{unico_id}', '{responsavel}', '{motivo}']

export default function WhatsappPage() {
  const [activeTab, setActiveTab] = useState<'qr' | 'templates' | 'disparo' | 'historico'>('qr')
  const [dispatchMode, setDispatchMode] = useState<'manual' | 'api'>('manual')
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [logs, setLogs] = useState<Log[]>([])

  const [loading, setLoading] = useState(true)
  const [sendingId, setSendingId] = useState<number | null>(null)

  const [apiStatus, setApiStatus] = useState<'INITIALIZING' | 'WAITING_QR' | 'CONNECTED' | 'DISCONNECTED'>('DISCONNECTED')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [apiUrl, setApiUrl] = useState(process.env.NEXT_PUBLIC_MICROSERVICE_URL || 'http://localhost:3001')

  // New Template
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newIsDefault, setNewIsDefault] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (dispatchMode === 'api') {
      const checkStatus = async () => {
        try {
          const res = await fetch(`${apiUrl}/api/status`, {
            headers: { 'Bypass-Tunnel-Reminder': 'true' }
          })
          if (res.ok) {
            const data = await res.json()
            setApiStatus(data.status)
            setQrCode(data.qrCode)
          } else {
            setApiStatus('DISCONNECTED')
          }
        } catch {
          setApiStatus('DISCONNECTED')
        }
      }
      checkStatus()
      interval = setInterval(checkStatus, 3000)
    }
    return () => clearInterval(interval)
  }, [dispatchMode, apiUrl])

  const loadTemplates = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/templates')
      const data = await res.json()
      setTemplates(Array.isArray(data) ? data : [])
    } catch { /* silently fail */ }
  }, [])

  const loadContatos = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/contatos')
      const data = await res.json()
      setContatos(Array.isArray(data) ? data : [])
    } catch { /* silently fail */ }
  }, [])

  const loadLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/logs')
      const data = await res.json()
      setLogs(Array.isArray(data) ? data : [])
    } catch { /* silently fail */ }
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([loadTemplates(), loadContatos(), loadLogs()]).finally(() => setLoading(false))
  }, [loadTemplates, loadContatos, loadLogs])

  // ── Template CRUD ──
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Preencha título e conteúdo'); return
    }
    setSavingTemplate(true)
    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: newTitle, conteudo: newContent, is_default: newIsDefault }),
      })
      if (!res.ok) throw new Error()
      toast.success('Template salvo!')
      setNewTitle(''); setNewContent(''); setNewIsDefault(false)
      loadTemplates()
    } catch { toast.error('Erro ao salvar template') }
    finally { setSavingTemplate(false) }
  }

  const handleDeleteTemplate = async (id: number) => {
    try {
      await fetch(`/api/whatsapp/templates?id=${id}`, { method: 'DELETE' })
      toast.success('Template excluído')
      loadTemplates()
    } catch { toast.error('Erro ao excluir') }
  }

  // ── SEND (functional) ──
  const handleSend = async (clienteId: number) => {
    setSendingId(clienteId)
    try {
      const defaultTpl = templates.find(t => t.is_default) || templates[0]
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_id: clienteId, template_id: defaultTpl?.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro interno')

      if (dispatchMode === 'api') {
        if (apiStatus !== 'CONNECTED') throw new Error('Servidor Node.js não conectado (QR Code pendente).')
        
        const localRes = await fetch(`${apiUrl}/api/send`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Bypass-Tunnel-Reminder': 'true'
          },
          body: JSON.stringify({ phone: data.phone, message: data.finalMessage })
        })
        const localData = await localRes.json()
        if (!localRes.ok) throw new Error(localData.error || 'Erro no Microsserviço')
        
        toast.success('Mensagem enviada automaticamente (Background)!')
      } else {
        if (data.waUrl) {
          window.open(data.waUrl, '_blank')
          toast.success('WhatsApp aberto!')
        }
      }
      loadLogs()
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar')
    } finally { setSendingId(null) }
  }

  // ── Preview message for a contact ──
  const previewMessage = (contato: Contato): string => {
    const tpl = templates.find(t => t.is_default) || templates[0]
    if (!tpl) return ''
    return tpl.conteudo
      .replace(/\{nome\}/g, contato.nome || 'Cliente')
      .replace(/\{empresa\}/g, contato.empresa || 'Sua Empresa')
      .replace(/\{unico_id\}/g, contato.unico_id || '')
      .replace(/\{responsavel\}/g, contato.responsavel || 'Equipe')
      .replace(/\{motivo\}/g, contato.motivo_cancelamento || 'não informado')
  }

  const handleLogout = async () => {
    try {
      await fetch(`${apiUrl}/api/logout`, { method: 'POST' })
      toast.success('Desconectado com sucesso')
    } catch {
      toast.error('Erro ao desconectar')
    }
  }

  const defaultTemplate = templates.find(t => t.is_default) || templates[0]
  const lastLogByClient = new Map<number, Log>()
  logs.forEach(l => { if (l.cliente_id && !lastLogByClient.has(l.cliente_id)) lastLogByClient.set(l.cliente_id, l) })

  const statusColor = (s: string) => {
    if (s === 'PENDENTE') return 'bg-purple-100 text-purple-800'
    if (s === 'EM_NEGOCIACAO') return 'bg-amber-100 text-amber-800'
    if (s === 'CONVERTIDO') return 'bg-emerald-100 text-emerald-800'
    return 'bg-rose-100 text-rose-800'
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Disparos WhatsApp
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Gerencie templates de reconversão e dispare mensagens para seus contatos de forma manual ou automatizada.
          </p>
        </div>

        <div className="flex flex-col items-end gap-4">
          {/* MODE SELECTOR */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => {
                setDispatchMode('manual')
                if(activeTab === 'qr') setActiveTab('disparo')
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${dispatchMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Manual (wa.me)
            </button>
            <button 
              onClick={() => {
                setDispatchMode('api')
                setActiveTab('qr')
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${dispatchMode === 'api' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Automático (API)
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-slate-600">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Contatos</p>
              <p className="text-lg font-extrabold text-slate-900">{contatos.length}</p>
            </div>
            <div className="w-px h-8 bg-slate-200"></div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enviados</p>
              <p className="text-lg font-extrabold text-slate-900">{logs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex bg-white rounded-xl p-1.5 shadow-sm space-x-1 border border-slate-200">
        {[
          ...(dispatchMode === 'api' ? [{ id: 'qr', label: 'Conexão do Aparelho', icon: PhoneCall }] : []),
          { id: 'disparo', label: 'Disparo de Mensagens', icon: Send },
          { id: 'templates', label: 'Mensagens Padrão', icon: MessageSquare },
          { id: 'historico', label: 'Histórico', icon: Clock },
        ].map(t => {
          const Icon = t.icon
          const isActive = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex-1 py-3 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl p-8 shadow-sm">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          <p className="text-sm text-slate-500 font-semibold mt-3">Carregando dados...</p>
        </div>
      ) : (
        <>
          {/* ── TAB: Conexão QR Code (Only in API mode) ── */}
          {activeTab === 'qr' && dispatchMode === 'api' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 flex flex-col items-center justify-center shadow-sm text-center max-w-3xl mx-auto">
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                <Zap className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Conecte seu WhatsApp</h3>
              <p className="text-sm text-slate-500 mb-8 max-w-md">
                Para habilitar os disparos automáticos em segundo plano, escaneie o QR Code usando o aplicativo do WhatsApp no seu celular (Configurações ➔ Aparelhos Conectados).
              </p>

              {apiStatus === 'DISCONNECTED' && (
                <div className="p-4 bg-slate-50 text-slate-600 rounded-xl w-full max-w-md border border-slate-200">
                  <p className="font-bold mb-1">Servidor de Automação Offline</p>
                  <p className="text-xs">Não foi possível estabelecer conexão. Verifique se o serviço de integração está ativo.</p>
                </div>
              )}

              {apiStatus === 'INITIALIZING' && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
                  <p className="font-bold text-slate-600">Gerando QR Code...</p>
                </div>
              )}

              {apiStatus === 'WAITING_QR' && qrCode && (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Aguardando leitura...</p>
                </div>
              )}

              {apiStatus === 'CONNECTED' && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="w-20 h-20 bg-green-50 border border-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900">Aparelho Conectado</p>
                    <p className="text-xs text-slate-500 mt-1">O sistema está pronto para realizar disparos automáticos.</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="mt-2 px-6 py-2.5 bg-white text-rose-600 font-bold text-xs rounded-xl hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors"
                  >
                    Desconectar Aparelho
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Disparo de Mensagens ── */}
          {activeTab === 'disparo' && (
            <div className="space-y-4">
              {/* Template ativo banner */}
              {defaultTemplate && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-emerald-900">Mensagem Padrão Ativa:</span>
                    <span className="font-semibold text-emerald-700">{defaultTemplate.titulo}</span>
                  </div>
                  <p className="font-mono text-emerald-800 bg-white/70 p-2.5 rounded-lg border border-emerald-200 whitespace-pre-wrap">
                    {defaultTemplate.conteudo}
                  </p>
                </div>
              )}

              {contatos.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                  <PhoneCall className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-700">Nenhum contato com telefone cadastrado</h3>
                  <p className="text-xs text-slate-500 mt-1">Adicione clientes com número de telefone na aba <strong>Clientes</strong> para poder disparar mensagens.</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="p-3 pl-5">Cliente</th>
                          <th className="p-3">ID</th>
                          <th className="p-3">Empresa</th>
                          <th className="p-3">Telefone</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Último Envio</th>
                          <th className="p-3 text-right pr-5">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {contatos.map(c => {
                          const lastLog = lastLogByClient.get(c.id)
                          return (
                            <tr key={c.id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="p-3 pl-5 font-bold text-slate-900">{c.nome}</td>
                              <td className="p-3 font-mono text-purple-600 text-[11px]">{c.unico_id || '-'}</td>
                              <td className="p-3 text-slate-600">{c.empresa || '-'}</td>
                              <td className="p-3 font-mono font-semibold text-slate-800">{c.contato}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColor(c.status)}`}>
                                  {c.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-3 text-[11px] text-slate-500">
                                {lastLog
                                  ? new Date(lastLog.enviado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                                  : <span className="text-slate-400 italic">Nunca enviado</span>
                                }
                              </td>
                              <td className="p-3 text-right pr-5">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleSend(c.id)}
                                    disabled={sendingId === c.id}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                                    title={previewMessage(c)}
                                  >
                                    {sendingId === c.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Zap className="w-3.5 h-3.5 text-amber-300" />
                                    )}
                                    Disparar
                                  </button>
                                  <a
                                    href={`https://wa.me/${(c.contato || '').replace(/\D/g, '').length === 11 ? '55' : ''}${(c.contato || '').replace(/\D/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                                    title="Abrir chat direto no WhatsApp"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: Templates ── */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" /> Novo Modelo de Mensagem
                </h3>
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                  <div>
                    <label className="form-label">Título *</label>
                    <input className="form-input text-xs" placeholder="Ex: Abordagem de Reconversão" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">Conteúdo da Mensagem *</label>
                    <textarea
                      className="form-input text-xs font-mono min-h-[140px] resize-none"
                      placeholder="Olá {nome}! Vi que sua conta {empresa} (ID: {unico_id}) foi cancelada por {motivo}. Podemos conversar?"
                      value={newContent}
                      onChange={e => setNewContent(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {VARIABLES.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNewContent(prev => prev + (prev.endsWith(' ') ? '' : ' ') + tag)}
                          className="px-2 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[10px] font-mono font-bold rounded transition-colors"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={newIsDefault} onChange={e => setNewIsDefault(e.target.checked)} className="w-4 h-4 rounded" />
                    <span className="text-xs font-semibold text-slate-700">Definir como Mensagem Padrão</span>
                  </label>
                  <button
                    type="submit"
                    disabled={savingTemplate}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Salvar Template
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-base font-bold text-slate-900">Templates Cadastrados ({templates.length})</h3>
                {templates.length === 0 ? (
                  <p className="text-xs text-slate-400 py-8 text-center">Nenhum template cadastrado ainda.</p>
                ) : (
                  <div className="space-y-3">
                    {templates.map(tpl => (
                      <div key={tpl.id} className={`p-5 rounded-2xl border bg-white shadow-sm space-y-2 ${tpl.is_default ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{tpl.titulo}</h4>
                            {tpl.is_default && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">Padrão</span>
                            )}
                          </div>
                          <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs font-mono text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-200">
                          {tpl.conteudo}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Histórico ── */}
          {activeTab === 'historico' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">Histórico de Disparos ({logs.length})</h3>
                <button onClick={loadLogs} className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors">
                  Atualizar
                </button>
              </div>
              {logs.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">Nenhum disparo registrado ainda.</p>
              ) : (
                <div className="space-y-3">
                  {logs.map(log => (
                    <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          {log.contato}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(log.enviado_em).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-700 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
                        {log.mensagem}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
