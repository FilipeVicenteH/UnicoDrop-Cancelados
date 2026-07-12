import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const amanha = new Date(hoje)
    amanha.setDate(amanha.getDate() + 1)

    const [
      total,
      convertidos,
      nao_convertidos,
      em_negociacao,
      pendentes,
      contatados_hoje,
      cancelados_hoje,
      por_status,
      por_checkout,
      por_prioridade,
    ] = await Promise.all([
      prisma.cliente.count(),
      prisma.cliente.count({ where: { status: 'CONVERTIDO' } }),
      prisma.cliente.count({ where: { status: 'NAO_CONVERTIDO' } }),
      prisma.cliente.count({ where: { status: 'EM_NEGOCIACAO' } }),
      prisma.cliente.count({ where: { status: 'PENDENTE' } }),
      prisma.cliente.count({
        where: {
          data_contato: { gte: hoje, lt: amanha },
        },
      }),
      prisma.cliente.count({
        where: {
          data_cancelamento: { gte: hoje, lt: amanha },
        },
      }),
      prisma.cliente.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.cliente.groupBy({
        by: ['checkout'],
        _count: { checkout: true },
        where: { checkout: { not: null } },
        orderBy: { _count: { checkout: 'desc' } },
        take: 8,
      }),
      prisma.cliente.groupBy({
        by: ['prioridade'],
        _count: { prioridade: true },
      }),
    ])

    const taxa_conversao = total > 0 ? Math.round((convertidos / total) * 100) : 0

    return NextResponse.json({
      total,
      convertidos,
      nao_convertidos,
      em_negociacao,
      pendentes,
      taxa_conversao,
      contatados_hoje,
      cancelados_hoje,
      por_status: por_status.map((s) => ({
        status: s.status,
        count: s._count.status,
      })),
      por_checkout: por_checkout.map((c) => ({
        checkout: c.checkout || 'Não informado',
        count: c._count.checkout,
      })),
      por_prioridade: por_prioridade.map((p) => ({
        prioridade: p.prioridade,
        count: p._count.prioridade,
      })),
    })
  } catch (error) {
    console.error('GET /api/dashboard error:', error)
    return NextResponse.json({ error: 'Erro ao buscar métricas' }, { status: 500 })
  }
}
