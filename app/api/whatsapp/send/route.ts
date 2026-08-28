import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const connectionString = process.env.DATABASE_URL || ''
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { cliente_id, template_id, mensagem_customizada } = body

    if (!cliente_id) {
      return NextResponse.json({ error: 'ID do cliente é obrigatório' }, { status: 400 })
    }

    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(cliente_id) }
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    if (!cliente.contato) {
      return NextResponse.json({ error: 'Cliente não possui contato/telefone cadastrado' }, { status: 400 })
    }

    let rawTemplate = mensagem_customizada

    if (!rawTemplate) {
      if (template_id) {
        const tpl = await prisma.whatsappTemplate.findUnique({
          where: { id: parseInt(template_id) }
        })
        rawTemplate = tpl?.conteudo
      } else {
        const defaultTpl = await prisma.whatsappTemplate.findFirst({
          where: { is_default: true }
        }) || await prisma.whatsappTemplate.findFirst()

        rawTemplate = defaultTpl?.conteudo || 'Olá {nome}, recebemos sua solicitação de suporte.'
      }
    }

    // Replace variables in template
    const finalMessage = rawTemplate
      .replace(/\{nome\}/g, cliente.nome || 'Cliente')
      .replace(/\{empresa\}/g, cliente.empresa || 'Sua Loja')
      .replace(/\{unico_id\}/g, cliente.unico_id || 'UC-00000')
      .replace(/\{responsavel\}/g, cliente.responsavel || 'Equipe UnicoDrop')
      .replace(/\{motivo\}/g, cliente.motivo_cancelamento || 'reajuste operacional')

    // Clean phone number for WhatsApp link
    const digits = cliente.contato.replace(/\D/g, '')
    const formattedPhone = digits.length === 11 ? `55${digits}` : digits
    const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(finalMessage)}`

    // Log the automated/manual dispatch
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
    })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar disparo de WhatsApp' }, { status: 500 })
  }
}
