export type SiteStatus = 'ONLINE' | 'OFFLINE' | 'NAO_VERIFICADO'
export type StatusCliente = 'PENDENTE' | 'EM_NEGOCIACAO' | 'CONVERTIDO' | 'NAO_CONVERTIDO'
export type Prioridade = 'BAIXA' | 'MEDIA' | 'ALTA'

export interface Cliente {
  id: number
  unico_id?: string | null
  nome: string
  contato?: string | null
  empresa?: string | null
  data_cancelamento?: string | null
  data_contato?: string | null
  responsavel?: string | null

  site_url?: string | null
  site_online: SiteStatus

  plugins_rastreio: string[]
  plugins_rastreio_outro?: string | null
  checkout?: string | null
  checkout_outro?: string | null
  plataforma_loja?: string | null
  plataforma_loja_outro?: string | null

  recursos_ud: string[]
  recursos_ud_outro?: string | null

  usava_dashboard: boolean
  usava_plugin: boolean
  usava_whatsapp: boolean

  motivo_cancelamento?: string | null
  feedback_completo?: string | null
  nota_interna?: string | null

  status: StatusCliente
  prioridade: Prioridade

  created_at: string
  updated_at: string
}

export interface DashboardMetrics {
  total: number
  convertidos: number
  nao_convertidos: number
  em_negociacao: number
  pendentes: number
  taxa_conversao: number
  contatados_hoje: number
  cancelados_hoje: number
  por_status: { status: string; count: number }[]
  por_checkout: { checkout: string; count: number }[]
  por_prioridade: { prioridade: string; count: number }[]
  por_plataforma: { plataforma: string; count: number }[]
  top_motivos: { motivo: string; count: number }[]
}

export interface ClienteFormData {
  unico_id?: string
  nome: string
  contato?: string
  empresa?: string
  data_cancelamento?: string
  data_contato?: string
  responsavel?: string
  site_url?: string
  site_online: SiteStatus
  plugins_rastreio: string[]
  plugins_rastreio_outro?: string
  checkout?: string
  checkout_outro?: string
  plataforma_loja?: string
  plataforma_loja_outro?: string
  recursos_ud: string[]
  recursos_ud_outro?: string
  usava_dashboard: boolean
  usava_plugin: boolean
  usava_whatsapp: boolean
  motivo_cancelamento?: string
  feedback_completo?: string
  nota_interna?: string
  status: StatusCliente
  prioridade: Prioridade
}
