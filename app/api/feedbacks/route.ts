import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const prioridade = searchParams.get('prioridade')
    const tipo = searchParams.get('tipo_cliente')
    const search = searchParams.get('search')
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (status && status !== 'TODOS') where.status = status
    if (prioridade && prioridade !== 'TODOS') where.prioridade = prioridade
    if (tipo && tipo !== 'TODOS') where.tipo_cliente = tipo
    
    if (search) {
      where.OR = [
        { cliente: { contains: search, mode: 'insensitive' } },
        { funcionalidade: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ]
    }

    const feedbacks = await prisma.feedbackMelhoria.findMany({
      where,
      orderBy: [{ prioridade: 'desc' }, { created_at: 'desc' }],
    })

    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error('GET /api/feedbacks error:', error)
    return NextResponse.json({ error: 'Erro ao buscar feedbacks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const feedback = await prisma.feedbackMelhoria.create({
      data: {
        unico_id: body.unico_id,
        cliente: body.cliente,
        tipo_cliente: body.tipo_cliente || 'ATIVO',
        funcionalidade: body.funcionalidade,
        descricao: body.descricao,
        status: body.status || 'PENDENTE',
        prioridade: body.prioridade || 'MEDIA',
      },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error('POST /api/feedbacks error:', error)
    return NextResponse.json({ error: 'Erro ao criar feedback' }, { status: 500 })
  }
}
