// Helper functions to anonymize sensitive client PII (Personally Identifiable Information)
// Protects confidential business data, client phone numbers, personal names, and store URLs.

import { Cliente, FeedbackMelhoria } from '@prisma/client'

// List of realistic mock names for anonymization
const MOCK_NAMES = [
  'Lucas Mendes (Demo)',
  'Camila Oliveira (Demo)',
  'Rodrigo Silva (Demo)',
  'Fernanda Souza (Demo)',
  'Gabriel Rocha (Demo)',
  'Juliana Costa (Demo)',
  'Thiago Ferreira (Demo)',
  'Beatriz Lima (Demo)',
  'Rafael Alves (Demo)',
  'Mariana Santos (Demo)',
  'Bruno Carvalho (Demo)',
  'Amanda Ribeiro (Demo)',
  'Felipe Martins (Demo)',
  'Larissa Ramos (Demo)',
  'Diego Pereira (Demo)',
]

const MOCK_STORES = [
  'Moda & Estilo E-Commerce',
  'Boutique Exemplo Brasil',
  'DropStore Eletrônicos',
  'Nexus Accessories Demo',
  'Urban Wear E-Commerce',
  'Bella Vita Cosméticos',
  'TechGadgets Brasil',
  'Casa & Conforto Store',
  'MegaVariedades Demo',
  'Prime Outfitters E-Commerce',
]

function getHashIndex(str: string, max: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % max
}

export function maskPhoneNumber(phone?: string | null): string | null {
  if (!phone || phone.trim() === '') return null
  // Keep area code or standard format, but mask last 4 digits
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length >= 8) {
    const ddd = cleaned.substring(0, 2)
    const prefix = cleaned.substring(2, cleaned.length - 4)
    return `(${ddd}) ${prefix}-****`
  }
  return '(11) 9****-****'
}

export function sanitizeText(text?: string | null): string | null {
  if (!text) return null
  // Mask any embedded phone numbers (e.g. 11987654321, 11 98765-4321)
  let sanitized = text.replace(/(\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})/g, '(11) 9****-****')
  // Mask any embedded email addresses
  sanitized = sanitized.replace(/[\w.-]+@[\w.-]+\.\w+/g, 'contato@loja-demo.com.br')
  return sanitized
}

export function anonymizeCliente<T extends Partial<Cliente>>(cliente: T): T {
  const idStr = String(cliente.id || cliente.unico_id || '1')
  const nameIndex = getHashIndex(idStr, MOCK_NAMES.length)
  const storeIndex = getHashIndex(idStr, MOCK_STORES.length)

  return {
    ...cliente,
    // Anonymize personal name
    nome: cliente.nome ? MOCK_NAMES[nameIndex] : `Lojista Demo #${cliente.id || '1'}`,
    // Mask contact phone
    contato: cliente.contato ? maskPhoneNumber(cliente.contato) : null,
    // Anonymize company / store name
    empresa: cliente.empresa ? MOCK_STORES[storeIndex] : `Loja Demo #${cliente.id || '1'}`,
    // Anonymize site URL
    site_url: cliente.site_url ? `https://loja-demo-${cliente.id || 1}.com.br` : null,
    // Anonymize unico_id
    unico_id: cliente.unico_id ? `UD-DEMO-${String(cliente.id || 1).padStart(4, '0')}` : null,
    // Sanitize notes and feedback
    nota_interna: sanitizeText(cliente.nota_interna),
    feedback_completo: sanitizeText(cliente.feedback_completo),
  }
}

export function anonymizeFeedback<T extends Partial<FeedbackMelhoria>>(feedback: T): T {
  return {
    ...feedback,
    cliente: `Lojista Demo #${feedback.id || '1'}`,
    unico_id: feedback.unico_id ? `UD-DEMO-${String(feedback.id || 1).padStart(4, '0')}` : null,
    descricao: sanitizeText(feedback.descricao) || '',
  }
}
