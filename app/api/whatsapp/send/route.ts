import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function formatPhoneForWhatsApp(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  // Already has country code 55
  if (digits.length === 13 && digits.startsWith('55')) return digits
  if (digits.length === 12 && digits.startsWith('55')) return digits
  // Just DDD + number
  if (digits.length === 11) return `55${digits}`
  if (digits.length === 10) return `55${digits}`
  return null
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cliente_id, template_id } = body

    if (!cliente_id) {
      return NextResponse.json({ error: 'ID do cliente é obrigatório' }, { status: 400 })
    }

    // Fetch REAL client data (no anonymization)
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(cliente_id) }
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    if (!cliente.contato) {
      return NextResponse.json({ error: 'Cliente não possui contato/telefone cadastrado' }, { status: 400 })
    }

    const formattedPhone = formatPhoneForWhatsApp(cliente.contato)
    if (!formattedPhone) {
      return NextResponse.json({ error: `Número "${cliente.contato}" não é um telefone válido` }, { status: 400 })
    }

    // Find message template
    let template: { conteudo: string } | null = null

    if (template_id) {
      template = await prisma.whatsappTemplate.findUnique({
        where: { id: parseInt(template_id) },
        select: { conteudo: true },
      })
    }

    if (!template) {
      template = await prisma.whatsappTemplate.findFirst({
        where: { is_default: true },
        select: { conteudo: true },
      })
    }

    if (!template) {
      template = await prisma.whatsappTemplate.findFirst({
        select: { conteudo: true },
      })
    }

    const rawContent = template?.conteudo || 'Olá {nome}, gostaríamos de conversar sobre sua conta.'

    // Replace variables with REAL client data
    const finalMessage = rawContent
      .replace(/\{nome\}/g, cliente.nome || 'Cliente')
      .replace(/\{empresa\}/g, cliente.empresa || 'Sua Empresa')
      .replace(/\{unico_id\}/g, cliente.unico_id || '')
      .replace(/\{responsavel\}/g, cliente.responsavel || 'Equipe UnicoDrop')
      .replace(/\{motivo\}/g, cliente.motivo_cancelamento || 'não informado')

    // Generate functional wa.me link
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMessage)}`

    // Log the dispatch
    const log = await prisma.whatsappLog.create({
      data: {
        cliente_id: cliente.id,
        contato: cliente.contato,
        mensagem: finalMessage,
        status: 'ENVIADO',
      }
    })

    return NextResponse.json({
      success: true,
      log,
      finalMessage,
      waUrl,
      phone: formattedPhone,
    })
  } catch (error) {
    console.error('POST /api/whatsapp/send error:', error)
    return NextResponse.json({ error: 'Erro ao processar disparo de WhatsApp' }, { status: 500 })
  }
}
