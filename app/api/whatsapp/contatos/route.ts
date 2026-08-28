import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint returns clients with REAL phone numbers (unmasked)
// for internal WhatsApp automation use only.
export async function GET() {
  try {
    const clientes = await prisma.cliente.findMany({
      where: {
        contato: { not: null },
      },
      select: {
        id: true,
        unico_id: true,
        nome: true,
        contato: true,
        empresa: true,
        responsavel: true,
        motivo_cancelamento: true,
        status: true,
        prioridade: true,
      },
      orderBy: { updated_at: 'desc' },
    })

    // Filter only clients that have a phone-like contact (digits)
    const withPhone = clientes.filter(c => {
      if (!c.contato) return false
      const digits = c.contato.replace(/\D/g, '')
      return digits.length >= 10
    })

    return NextResponse.json(withPhone)
  } catch (error) {
    console.error('GET /api/whatsapp/contatos error:', error)
    return NextResponse.json({ error: 'Erro ao buscar contatos' }, { status: 500 })
  }
}
