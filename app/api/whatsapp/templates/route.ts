import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const connectionString = process.env.DATABASE_URL || ''
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  try {
    let templates = await prisma.whatsappTemplate.findMany({
      orderBy: { created_at: 'desc' }
    })

    if (templates.length === 0) {
      // Create default template if none exists
      const defaultTpl = await prisma.whatsappTemplate.create({
        data: {
          titulo: 'Abordagem Padrão de Reconversão',
          conteudo: 'Olá {nome}! Tudo bem? Notamos que a assinatura da sua empresa {empresa} (ID: {unico_id}) foi suspensa recentemente por {motivo}. Sou o {responsavel} da equipe UnicoDrop e gostaria de te oferecer uma proposta especial para reativar seu acesso. Podemos conversar?',
          is_default: true,
        }
      })
      templates = [defaultTpl]
    }

    return NextResponse.json(templates)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao carregar templates' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { titulo, conteudo, is_default } = body

    if (!titulo || !conteudo) {
      return NextResponse.json({ error: 'Título e conteúdo são obrigatórios' }, { status: 400 })
    }

    if (is_default) {
      await prisma.whatsappTemplate.updateMany({
        data: { is_default: false }
      })
    }

    const template = await prisma.whatsappTemplate.create({
      data: {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        is_default: Boolean(is_default),
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao criar template' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID do template é obrigatório' }, { status: 400 })

    await prisma.whatsappTemplate.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao excluir template' }, { status: 500 })
  }
}
