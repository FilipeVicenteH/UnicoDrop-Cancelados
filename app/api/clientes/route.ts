import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const prioridade = searchParams.get('prioridade')
    const search = searchParams.get('search')
    const usava = searchParams.get('usava')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {}

    if (status && status !== 'TODOS') {
      where.status = status
    }
    if (prioridade && prioridade !== 'TODOS') {
      where.prioridade = prioridade
    }
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { unico_id: { contains: search, mode: 'insensitive' } },
        { empresa: { contains: search, mode: 'insensitive' } },
        { contato: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (usava === 'dashboard') where.usava_dashboard = true
    if (usava === 'plugin') where.usava_plugin = true
    if (usava === 'whatsapp') where.usava_whatsapp = true

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: [{ prioridade: 'desc' }, { updated_at: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.cliente.count({ where }),
    ])

    return NextResponse.json({
      clientes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('GET /api/clientes error:', error)
    return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const cliente = await prisma.cliente.create({
      data: {
        unico_id: body.unico_id || null,
        nome: body.nome,
        contato: body.contato || null,
        empresa: body.empresa || null,
        data_cancelamento: body.data_cancelamento ? new Date(body.data_cancelamento) : null,
        data_contato: body.data_contato ? new Date(body.data_contato) : null,
        responsavel: body.responsavel || null,
        site_url: body.site_url || null,
        site_online: body.site_online || 'NAO_VERIFICADO',
        plugins_rastreio: body.plugins_rastreio || [],
        plugins_rastreio_outro: body.plugins_rastreio_outro || null,
        checkout: body.checkout || null,
        checkout_outro: body.checkout_outro || null,
        plataforma_loja: body.plataforma_loja || null,
        plataforma_loja_outro: body.plataforma_loja_outro || null,
        recursos_ud: body.recursos_ud || [],
        recursos_ud_outro: body.recursos_ud_outro || null,
        usava_dashboard: body.usava_dashboard || false,
        usava_plugin: body.usava_plugin || false,
        usava_whatsapp: body.usava_whatsapp || false,
        motivo_cancelamento: body.motivo_cancelamento || null,
        feedback_completo: body.feedback_completo || null,
        nota_interna: body.nota_interna || null,
        status: body.status || 'PENDENTE',
        prioridade: body.prioridade || 'MEDIA',
      },
    })

    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    console.error('POST /api/clientes error:', error)
    return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
  }
}
