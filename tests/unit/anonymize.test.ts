import { describe, it, expect } from 'vitest'
import { anonymizeCliente } from '@/lib/anonymize'
import { Cliente } from '@/lib/types'

describe('Security & Anonymization Audit Tests', () => {
  const sampleCliente: Cliente = {
    id: 101,
    unico_id: 'UD-999',
    nome: 'João Silva',
    contato: '11999998888',
    empresa: 'Loja Real Secreta E-Commerce',
    data_cancelamento: '2026-01-15T10:00:00.000Z',
    data_contato: '2026-01-16T10:00:00.000Z',
    responsavel: 'Filipe',
    telefone_atualizado: true,
    faturamento_anterior: 50000,
    site_url: 'https://loja-real.com.br',
    site_online: 'ONLINE',
    plugins_rastreio: ['UnicoDrop Rastreio'],
    plugins_rastreio_outro: null,
    checkout: 'Yampi',
    checkout_outro: null,
    plataforma_loja: 'Shopify',
    plataforma_loja_outro: null,
    recursos_ud: ['Relatórios'],
    recursos_ud_outro: null,
    usava_dashboard: true,
    usava_plugin: true,
    usava_whatsapp: false,
    motivo_cancelamento: 'Preço elevado',
    feedback_completo: 'Gostava do sistema mas ficou caro',
    nota_interna: null,
    status: 'CONVERTIDO',
    prioridade: 'MEDIA',
    created_at: '2026-01-01T10:00:00.000Z',
    updated_at: '2026-01-15T10:00:00.000Z',
  }

  it('deve anonimizar o nome da empresa e não vazar o nome real', () => {
    const anonymized = anonymizeCliente(sampleCliente)

    expect(anonymized.empresa).not.toBe('Loja Real Secreta E-Commerce')
    expect(anonymized.empresa).toMatch(/(Empresa Demo|Loja Demo|E-Commerce|Loja Virtual) #\d+/)
  })

  it('deve mascarar o telefone de contato mantendo o formato seguro', () => {
    const anonymized = anonymizeCliente(sampleCliente)

    expect(anonymized.contato).not.toBe('11999998888')
    expect(anonymized.contato).toBe('(11) 99999-****')
  })

  it('deve anonimizar o unico_id mantendo o ID do banco intacto', () => {
    const anonymized = anonymizeCliente(sampleCliente)

    expect(anonymized.id).toBe(101)
    expect(anonymized.unico_id).toBe('UD-DEMO-0101')
  })

  it('deve preservar as métricas e recursos de uso intactos', () => {
    const anonymized = anonymizeCliente(sampleCliente)

    expect(anonymized.faturamento_anterior).toBe(50000)
    expect(anonymized.usava_dashboard).toBe(true)
    expect(anonymized.usava_plugin).toBe(true)
  })
})
