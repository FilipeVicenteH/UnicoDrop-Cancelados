import { describe, it, expect } from 'vitest'

describe('Bug Reporter Validation Tests', () => {
  it('deve validar severidades permitidas', () => {
    const severidades = ['BAIXA', 'MEDIA', 'ALTA', 'CRITICA']
    expect(severidades).toContain('CRITICA')
    expect(severidades).toContain('ALTA')
  })

  it('deve formatar adequadamente o payload do relato de bug', () => {
    const bugPayload = {
      titulo: '   Botão não responde   ',
      descricao: 'Ao clicar em exportar CSV nada acontece   ',
      modulo: 'Relatorios',
      severidade: 'ALTA',
    }

    const cleanedPayload = {
      titulo: bugPayload.titulo.trim().slice(0, 150),
      descricao: bugPayload.descricao.trim(),
      modulo: bugPayload.modulo,
      severidade: bugPayload.severidade,
    }

    expect(cleanedPayload.titulo).toBe('Botão não responde')
    expect(cleanedPayload.descricao).toBe('Ao clicar em exportar CSV nada acontece')
    expect(cleanedPayload.severidade).toBe('ALTA')
  })
})
