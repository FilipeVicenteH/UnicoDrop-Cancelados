import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id) },
    })

    if (!cliente) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('GET /api/clientes/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const cliente = await prisma.cliente.update({
      where: { id: parseInt(id) },
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

    return NextResponse.json(cliente)
  } catch (error) {
    console.error('PUT /api/clientes/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.cliente.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/clientes/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao deletar cliente' }, { status: 500 })
  }
}
