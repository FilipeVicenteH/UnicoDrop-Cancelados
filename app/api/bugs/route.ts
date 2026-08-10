import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const bugs = await prisma.bugReport.findMany({
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json(bugs)
  } catch (error) {
    console.error('GET /api/bugs error:', error)
    return NextResponse.json({ error: 'Erro ao buscar relatos de bug' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.titulo || !body.descricao) {
      return NextResponse.json({ error: 'Título e descrição são obrigatórios' }, { status: 400 })
    }

    const bug = await prisma.bugReport.create({
      data: {
        titulo: String(body.titulo).trim().slice(0, 150),
        descricao: String(body.descricao).trim(),
        modulo: body.modulo || 'Geral',
        severidade: body.severidade || 'MEDIA',
        url_pagina: body.url_pagina || null,
        user_agent: body.user_agent || null,
        status: 'ABERTO',
      },
    })

    return NextResponse.json(bug, { status: 201 })
  } catch (error) {
    console.error('POST /api/bugs error:', error)
    return NextResponse.json({ error: 'Erro ao registrar relato de bug' }, { status: 500 })
  }
}
