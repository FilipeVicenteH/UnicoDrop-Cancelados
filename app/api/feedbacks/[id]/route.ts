import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await request.json()

    const feedback = await prisma.feedbackMelhoria.update({
      where: { id },
      data: {
        cliente: body.cliente,
        tipo_cliente: body.tipo_cliente,
        funcionalidade: body.funcionalidade,
        descricao: body.descricao,
        status: body.status,
        prioridade: body.prioridade,
      },
    })

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('PUT /api/feedbacks/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar feedback' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    await prisma.feedbackMelhoria.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/feedbacks/[id] error:', error)
    return NextResponse.json({ error: 'Erro ao remover feedback' }, { status: 500 })
  }
}
